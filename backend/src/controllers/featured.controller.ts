import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { invalidateSyncCache } from './page.controller.js';
import { updateSyncMetadata } from '../utils/syncMetadata.js';

/**
 * Extract the infobox image from a page's markdown frontmatter — the same
 * `image:` field the article's right sidebar (WikiInfoBox) renders. This is
 * stored inside the page content, NOT in metadata, so the featured card must
 * read it here to match the sidebar photo.
 */
const extractInfoboxImage = (content: string | null | undefined): string | null => {
  if (!content || !content.startsWith('---')) return null;
  const parts = content.split('---');
  if (parts.length < 3) return null;
  const frontmatter = parts[1];
  for (const rawLine of frontmatter.split('\n')) {
    const line = rawLine.trim();
    if (line.startsWith('image:')) {
      const val = line.slice('image:'.length).trim();
      return val || null;
    }
  }
  return null;
};

/**
 * GET /pages/featured
 * Fetch all featured pages
 */
export const getFeaturedPages = async (req: Request, res: Response) => {
  try {
    const featured = await prisma.featured_pages.findMany({
      orderBy: { order: 'asc' },
      include: {
        live_page: {
          select: {
            page_id: true,
            title: true,
            slug: true,
            metadata: true,
            content: true,
          },
        },
      },
    });

    const result = featured.map((f) => ({
      featured_id: f.featured_id,
      page_id: f.page_id,
      order: f.order,
      tag: f.tag,
      location: f.location,
      description: f.description,
      title: f.live_page.title,
      slug: f.live_page.slug,
      href: `/wiki/page/${f.live_page.slug}`,
      image:
        extractInfoboxImage(f.live_page.content) ||
        (f.live_page.metadata as any)?.image ||
        '/homepage_bg.png',
    }));

    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error in getFeaturedPages:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
};

/**
 * POST /pages/featured (admin only)
 * Set a page as featured
 */
export const setFeaturedPage = async (req: Request, res: Response) => {
  try {
    const { page_id, order = 0, tag = 'Featured', location = '', description = '' } = req.body;
    if (!page_id) return res.status(400).json({ success: false, error: { code: 'MISSING_PAGE_ID', message: 'page_id is required' } });

    const pid = Number(page_id);
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.featured_pages.findFirst({ where: { page_id: pid } });
      let res;
      if (existing) {
        res = await tx.featured_pages.update({
          where: { featured_id: existing.featured_id },
          data: { order, tag, location, description },
        });
        await updateSyncMetadata('featured', 0, tx);
      } else {
        res = await tx.featured_pages.create({
          data: { page_id: pid, order, tag, location, description },
        });
        await updateSyncMetadata('featured', 1, tx);
      }
      return res;
    });
    invalidateSyncCache('featured');
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error in setFeaturedPage:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
};

/**
 * DELETE /pages/featured/:featured_id (admin only)
 * Remove a featured page
 */
export const removeFeaturedPage = async (req: Request, res: Response) => {
  try {
    const { featured_id } = req.params;
    await prisma.$transaction(async (tx) => {
      await tx.featured_pages.delete({ where: { featured_id: Number(featured_id) } });
      await updateSyncMetadata('featured', -1, tx);
    });
    invalidateSyncCache('featured');
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Error in removeFeaturedPage:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
};

/**
 * PUT /pages/featured/:featured_id (admin/moderator only)
 * Update a featured page's info
 */
export const updateFeaturedPage = async (req: Request, res: Response) => {
  try {
    const { featured_id } = req.params;
    const { order, tag, location, description } = req.body;
    const fid = Number(featured_id);

    const existing = await prisma.featured_pages.findUnique({ where: { featured_id: fid } });
    if (!existing) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Featured entry not found' } });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.featured_pages.update({
        where: { featured_id: fid },
        data: {
          order: order !== undefined ? order : existing.order,
          tag: tag !== undefined ? tag : existing.tag,
          location: location !== undefined ? location : existing.location,
          description: description !== undefined ? description : existing.description
        }
      });
      await updateSyncMetadata('featured', 0, tx);
      return res;
    });

    invalidateSyncCache('featured');
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error in updateFeaturedPage:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
};
