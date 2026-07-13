import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

/**
 * GET /bookmarks
 * List all bookmarks of the authenticated user
 */
export const getBookmarks = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.user.user_id);
    const items = await prisma.bookmarks.findMany({
      where: { user_id: userId },
      include: {
        live_page: true
      }
    });

    return res.json(items.map(item => {
      let snippet = "";
      if (item.live_page.content) {
        const clean = item.live_page.content.replace(/^---[\s\S]*?---/, "").trim();
        snippet = clean.length > 150 ? clean.substring(0, 150) + "..." : clean;
      }
      return {
        bookmark_id: item.bookmark_id,
        id: String(item.live_page.page_id),
        title: item.live_page.title,
        category: (item.live_page.metadata as any)?.category || "General",
        slug: item.live_page.slug,
        description: snippet
      };
    }));
  } catch (error: any) {
    console.error('Error in getBookmarks:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * POST /bookmarks
 * Create a bookmark for the authenticated user
 */
export const createBookmark = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.user.user_id);
    const { page_id, slug } = req.body;
    let targetPageId = page_id ? Number(page_id) : null;

    if (!targetPageId && slug) {
      const pg = await prisma.live_pages.findUnique({
        where: { slug }
      });
      if (pg) {
        targetPageId = pg.page_id;
      }
    }

    if (!targetPageId) {
      return res.status(400).json({ error: 'Valid page_id or slug is required' });
    }

    // Check if page exists
    const pageExists = await prisma.live_pages.findUnique({
      where: { page_id: targetPageId }
    });
    if (!pageExists) {
      return res.status(404).json({ error: 'Page not found' });
    }

    // Check if already bookmarked
    const existing = await prisma.bookmarks.findFirst({
      where: { user_id: userId, page_id: targetPageId }
    });
    if (existing) {
      return res.status(400).json({ error: 'Page already bookmarked' });
    }

    const newBookmark = await prisma.bookmarks.create({
      data: {
        user_id: userId,
        page_id: targetPageId
      },
      include: {
        live_page: true
      }
    });

    let snippet = "";
    if (newBookmark.live_page.content) {
      const clean = newBookmark.live_page.content.replace(/^---[\s\S]*?---/, "").trim();
      snippet = clean.length > 150 ? clean.substring(0, 150) + "..." : clean;
    }

    return res.status(201).json({
      bookmark_id: newBookmark.bookmark_id,
      id: String(newBookmark.live_page.page_id),
      title: newBookmark.live_page.title,
      category: (newBookmark.live_page.metadata as any)?.category || "General",
      slug: newBookmark.live_page.slug,
      description: snippet
    });
  } catch (error: any) {
    console.error('Error in createBookmark:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * DELETE /bookmarks/:id
 * Remove a bookmark by bookmark_id or page_id
 */
export const deleteBookmark = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.user.user_id);
    const idParam = Number(req.params.id);

    const bookmark = await prisma.bookmarks.findFirst({
      where: {
        user_id: userId,
        OR: [
          { bookmark_id: idParam },
          { page_id: idParam }
        ]
      }
    });

    if (!bookmark) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    await prisma.bookmarks.delete({
      where: { bookmark_id: bookmark.bookmark_id }
    });

    return res.json({ success: true, message: 'Bookmark removed successfully' });
  } catch (error: any) {
    console.error('Error in deleteBookmark:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
