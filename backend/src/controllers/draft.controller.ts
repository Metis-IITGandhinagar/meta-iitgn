import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { invalidateCategoriesCache } from './category.controller.js';
import { invalidateStatsCache, invalidateSearchCache, invalidateSyncCache } from './page.controller.js';
import { recomputeUserPoints } from '../utils/points.js';
import { processAndMarkMediaUsed } from '../utils/cleanup.js';
import { updateSyncMetadata } from '../utils/syncMetadata.js';

/**
 * POST /drafts
 * Propose a new draft.
 * Omit `page_id` to propose a completely new page.
 * Include `page_id` and `base_version` to edit an existing page.
 */
export const submitDraft = async (req: Request, res: Response) => {
  try {
     const { page_id, title, content, metadata, editor_id, base_version, video_url } = req.body;

    if (!title || editor_id === undefined || editor_id === null) {
      return res.status(400).json({ error: 'Title and editor_id are required' });
    }

    const versionVal = base_version !== undefined && base_version !== null ? Number(base_version) : 1;

    if (page_id) {
      // Edit Page Workflow
      const activeDraft = await prisma.pending_pages.findFirst({
        where: {
          page_id: Number(page_id),
          status: { in: ['draft', 'in_review'] }
        }
      });

      if (activeDraft) {
        const currentVersion = activeDraft.version ?? 1;
        if (versionVal < currentVersion) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'VERSION_CONFLICT',
              message: 'Another user has edited this draft. Please resolve the conflict.',
            },
            currentVersion,
            currentContent: activeDraft.content
          });
        }

        const updatedDraft = await prisma.$transaction(async (tx) => {
          const draft = await tx.pending_pages.update({
            where: { pending_id: activeDraft.pending_id },
            data: {
              title,
              content,
              metadata: metadata || activeDraft.metadata || {},
              video_url: video_url !== undefined ? video_url : activeDraft.video_url,
              editor_id,
              version: currentVersion + 1,
              status: 'in_review'
            }
          });
          await updateSyncMetadata('pendingpages', 0, tx);
          return draft;
        });
        await processAndMarkMediaUsed(content, (metadata as any)?.image);
        invalidateSyncCache('pendingpages');
        return res.status(200).json(updatedDraft);
      } else {
        // First draft for existing page, compare to live page version
        const livePage = await prisma.live_pages.findUnique({
          where: { page_id: Number(page_id) }
        });
        if (livePage) {
          const currentVersion = livePage.version ?? 1;
          if (versionVal < currentVersion) {
            return res.status(409).json({
              success: false,
              error: {
                code: 'VERSION_CONFLICT',
                message: 'Another user has edited this page. Please resolve the conflict.',
              },
              currentVersion,
              currentContent: livePage.content
            });
          }
        }

        const newDraft = await prisma.$transaction(async (tx) => {
          const draft = await tx.pending_pages.create({
            data: {
              page_id: Number(page_id),
              title,
              content,
              metadata: metadata || {},
              video_url,
              editor_id,
              version: versionVal + 1,
              status: 'in_review'
            }
          });
          await updateSyncMetadata('pendingpages', 1, tx);
          return draft;
        });
        await processAndMarkMediaUsed(content, (metadata as any)?.image);
        invalidateSyncCache('pendingpages');
        return res.status(201).json(newDraft);
      }
    } else {
      // New Page Workflow: Check if draft with same title exists
      const existingDraft = await prisma.pending_pages.findFirst({
        where: {
          title,
          page_id: null,
          status: { in: ['draft', 'in_review'] }
        }
      });

      if (existingDraft) {
        const currentVersion = existingDraft.version ?? 1;
        if (versionVal < currentVersion) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'VERSION_CONFLICT',
              message: 'Another user has edited this page draft. Please resolve the conflict.',
            },
            currentVersion,
            currentContent: existingDraft.content
          });
        }

        const updatedDraft = await prisma.$transaction(async (tx) => {
          const draft = await tx.pending_pages.update({
            where: { pending_id: existingDraft.pending_id },
            data: {
              content,
              metadata: metadata || existingDraft.metadata || {},
              video_url: video_url !== undefined ? video_url : existingDraft.video_url,
              editor_id,
              version: currentVersion + 1,
              status: 'in_review'
            }
          });
          await updateSyncMetadata('pendingpages', 0, tx);
          return draft;
        });
        await processAndMarkMediaUsed(content, (metadata as any)?.image);
        invalidateSyncCache('pendingpages');
        return res.status(200).json(updatedDraft);
      }

      const newDraft = await prisma.$transaction(async (tx) => {
        const draft = await tx.pending_pages.create({
          data: {
            page_id: null,
            title,
            content,
            metadata: metadata || {},
            video_url,
            editor_id,
            version: 1,
            status: 'in_review'
          }
        });
        await updateSyncMetadata('pendingpages', 1, tx);
        return draft;
      });
      await processAndMarkMediaUsed(content, (metadata as any)?.image);
      invalidateSyncCache('pendingpages');
      return res.status(201).json(newDraft);
    }
  } catch (error: any) {
    console.error('Error in submitDraft:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * GET /drafts/pending
 * Fetch all drafts currently awaiting review.
 * Optionally filter by a specific page_id to view competing edits.
 */
export const listPendingDrafts = async (req: Request, res: Response) => {
  try {
    const page_id = req.query.page_id ? parseInt(req.query.page_id as string, 10) : undefined;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 4;
    const skip = (page - 1) * limit;

    const drafts = await prisma.pending_pages.findMany({
      where: {
        page_id: page_id !== undefined ? page_id : undefined,
      },
      include: {
        editor: {
          select: { name: true },
        },
        reviewer: {
          select: { name: true },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      skip,
      take: limit,
    });

    const formattedDrafts = drafts.map((d) => ({
      ...d,
      users: { name: d.editor.name },
    }));

    return res.json(formattedDrafts);
  } catch (error: any) {
    console.error('Error in listPendingDrafts:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * POST /drafts/:pending_id/review
 * Approve or reject a draft.
 * Approving executes the backend merge transaction.
 */
export const reviewDraft = async (req: Request, res: Response) => {
  try {
    const pending_id = parseInt(req.params.pending_id as string, 10);
    const { reviewer_id, action } = req.body;

    if (reviewer_id === undefined || reviewer_id === null || !action) {
      return res.status(400).json({ error: 'reviewer_id and action are required' });
    }

    if (action !== 'approve' && action !== 'reject') {
      return res.status(400).json({ error: 'action must be approve or reject' });
    }

    if (action === 'reject') {
      const updatedDraft = await prisma.$transaction(async (tx) => {
        const draft = await tx.pending_pages.update({
          where: { pending_id },
          data: {
            status: 'rejected',
            reviewer_id,
          },
        });
        await updateSyncMetadata('pendingpages', 0, tx);
        return draft;
      });
      return res.json({ message: 'Draft rejected', data: updatedDraft });
    }

    // --- APPROVE FLOW (Run in Transaction) ---
    let editorId: number | undefined;
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch pending draft
      const draft = await tx.pending_pages.findUnique({
        where: { pending_id },
      });

      if (!draft) {
        throw new Error('Pending draft not found');
      }

      editorId = draft.editor_id;

      const editorUser = await tx.users.findUnique({
        where: { user_id: draft.editor_id }
      });
      const editorName = editorUser?.name || 'Unknown';

      if (draft.page_id === null) {
        // --- New Page Workflow ---
        let baseSlug = (draft.title || 'untitled')
          .replace(/[^a-zA-Z0-9\s-]/g, '')
          .trim()
          .toLowerCase()
          .replace(/[\s-]+/g, '-');

        if (!baseSlug) baseSlug = 'untitled';

        // Check if draft has metadata slug
        const meta = draft.metadata as any;
        let slug = meta?.slug;
        if (!slug) {
          slug = baseSlug;
          let counter = 1;
          while (true) {
            const existing = await tx.live_pages.findUnique({
              where: { slug },
            });
            if (!existing) break;
            slug = `${baseSlug}-${counter}`;
            counter++;
          }
        }

        const now = new Date();

        // Insert into live_pages
        const newLivePage = await tx.live_pages.create({
          data: {
            title: draft.title,
            slug,
            content: draft.content,
            metadata: draft.metadata || {},
            video_url: draft.video_url,
            original_author_id: draft.editor_id,
            contributors: [editorName],
            version: 1,
            created_at: now,
            updated_at: now,
          },
        });

        // Auto-feature if category is "Featured" or "featured"
        const metaCategory = String(meta?.category || '').toLowerCase();
        if (metaCategory === 'featured' || meta?.featured === true) {
          await tx.featured_pages.create({
            data: {
              page_id: newLivePage.page_id,
              tag: meta?.tag || 'Featured Story',
              location: meta?.location || '',
              description: meta?.description || draft.title,
              order: 0
            }
          });
        }

        // Update pending page to approved
        await tx.pending_pages.update({
          where: { pending_id },
          data: {
            status: 'approved',
            reviewer_id,
          },
        });

        // Log audit event
        await tx.audit_logs.create({
          data: {
            actor_id: reviewer_id,
            action: 'APPROVE_NEW_PAGE',
            table_name: 'pending_pages',
            record_id: pending_id,
            ip_address: '127.0.0.1',
          },
        });

        await updateSyncMetadata('updatedpages', 1, tx);
        await updateSyncMetadata('popular', 1, tx);
        await updateSyncMetadata('pendingpages', 0, tx);
        if (slug === 'mess-menu') {
          await updateSyncMetadata('messmenu', 1, tx);
        } else if (slug === 'campus-transport') {
          await updateSyncMetadata('transport', 1, tx);
        }
        if (metaCategory === 'featured' || meta?.featured === true) {
          await updateSyncMetadata('featured', 1, tx);
        }

        return { message: 'Draft approved and published.', data: newLivePage };
      } else {
        // --- Edit Page Workflow ---
        const livePage = await tx.live_pages.findUnique({
          where: { page_id: draft.page_id },
        });

        if (!livePage) {
          throw new Error('Original live page not found');
        }

        // Backup current live page state to revision_pages
        await tx.revision_pages.create({
          data: {
            page_id: livePage.page_id,
            created_by_user_id:
              livePage.updated_by !== null ? livePage.updated_by : livePage.original_author_id,
            commit_message: `Backup prior to draft ${pending_id} approval`,
            title: livePage.title,
            slug: livePage.slug,
            content: livePage.content,
            metadata: livePage.metadata || {},
            original_author_id: livePage.original_author_id,
            contributors: livePage.contributors || [],
            version: livePage.version,
            created_at: livePage.created_at,
            updated_at: livePage.updated_at,
            deleted_at: livePage.deleted_at,
          },
        });

        // Parse and update contributors list
        let contributors: string[] = [];
        if (Array.isArray(livePage.contributors)) {
          contributors = [...livePage.contributors] as string[];
        } else if (livePage.contributors && typeof livePage.contributors === 'object') {
          contributors = Object.values(livePage.contributors) as string[];
        }

        if (!contributors.includes(editorName)) {
          contributors.push(editorName);
        }

        const currentVersion = livePage.version !== null ? livePage.version : 1;

        // Update live page with draft edits
        const updatedLivePage = await tx.live_pages.update({
          where: { page_id: draft.page_id },
          data: {
            title: draft.title,
            content: draft.content,
            metadata: draft.metadata || {},
            video_url: draft.video_url,
            contributors,
            version: currentVersion + 1,
            updated_by: draft.editor_id,
            updated_at: new Date(),
          },
        });

        // Auto-feature / Update feature if category is "Featured" or "featured"
        const upMeta = updatedLivePage.metadata as any;
        const metaCategory = String(upMeta?.category || '').toLowerCase();
        if (metaCategory === 'featured' || upMeta?.featured === true) {
          const existingFeatured = await tx.featured_pages.findFirst({
            where: { page_id: updatedLivePage.page_id }
          });
          if (existingFeatured) {
            await tx.featured_pages.update({
              where: { featured_id: existingFeatured.featured_id },
              data: {
                tag: upMeta?.tag || 'Featured Story',
                location: upMeta?.location || '',
                description: upMeta?.description || updatedLivePage.title,
              }
            });
          } else {
            await tx.featured_pages.create({
              data: {
                page_id: updatedLivePage.page_id,
                tag: upMeta?.tag || 'Featured Story',
                location: upMeta?.location || '',
                description: upMeta?.description || updatedLivePage.title,
                order: 0
              }
            });
          }
        } else {
          const existingFeatured = await tx.featured_pages.findFirst({
            where: { page_id: updatedLivePage.page_id }
          });
          if (existingFeatured) {
            await tx.featured_pages.delete({
              where: { featured_id: existingFeatured.featured_id }
            });
          }
        }

        // Update pending page to approved
        await tx.pending_pages.update({
          where: { pending_id },
          data: {
            status: 'approved',
            reviewer_id,
          },
        });

        // Reject all other competing drafts for the same page
        await tx.pending_pages.updateMany({
          where: {
            page_id: draft.page_id,
            status: 'in_review',
            NOT: { pending_id },
          },
          data: {
            status: 'rejected',
            reviewer_id,
          },
        });

        // Log audit event
        await tx.audit_logs.create({
          data: {
            actor_id: reviewer_id,
            action: 'APPROVE_EDIT_PAGE',
            table_name: 'pending_pages',
            record_id: pending_id,
            ip_address: '127.0.0.1',
          },
        });

        await updateSyncMetadata('updatedpages', 0, tx);
        await updateSyncMetadata('popular', 0, tx);
        await updateSyncMetadata('pendingpages', 0, tx);
        const pageSlug = updatedLivePage.slug;
        if (pageSlug === 'mess-menu') {
          await updateSyncMetadata('messmenu', 0, tx);
        } else if (pageSlug === 'campus-transport') {
          await updateSyncMetadata('transport', 0, tx);
        }

        if (metaCategory === 'featured' || upMeta?.featured === true) {
          const existingFeatured = await tx.featured_pages.findFirst({
            where: { page_id: updatedLivePage.page_id }
          });
          if (existingFeatured) {
            await updateSyncMetadata('featured', 0, tx);
          } else {
            await updateSyncMetadata('featured', 1, tx);
          }
        } else {
          const existingFeatured = await tx.featured_pages.findFirst({
            where: { page_id: updatedLivePage.page_id }
          });
          if (existingFeatured) {
            await updateSyncMetadata('featured', -1, tx);
          }
        }

        return { message: 'Draft approved and published.', data: updatedLivePage };
      }
    });

    invalidateCategoriesCache();
    invalidateStatsCache();
    invalidateSearchCache();
    invalidateSyncCache('pendingpages');
    invalidateSyncCache('updatedpages');
    invalidateSyncCache('news');

    // Recompute the editor's contribution points (Fibonacci Scale) from their
    // edit count, keeping the stored `users.points` column in sync.
    if (editorId !== undefined) {
      try {
        await recomputeUserPoints(editorId);
      } catch (pointsErr) {
        console.error('Failed to recompute user points after approval:', pointsErr);
      }
    }

    return res.json(result);
  } catch (error: any) {
    console.error('Error in reviewDraft:', error);
    return res.status(500).json({ error: `Database transaction failed: ${error.message}` });
  }
};
