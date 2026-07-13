import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

/**
 * POST /drafts
 * Propose a new draft.
 * Omit `page_id` to propose a completely new page.
 * Include `page_id` and `base_version` to edit an existing page.
 */
export const submitDraft = async (req: Request, res: Response) => {
  try {
    console.log('Received submitDraft request body:', req.body);
    const { page_id, title, content, metadata, editor_id, base_version, video_url } = req.body;

    if (!title || editor_id === undefined || editor_id === null) {
      return res.status(400).json({ error: 'Title and editor_id are required' });
    }

    // Insert into pending_pages
    const draft = await prisma.pending_pages.create({
      data: {
        page_id: page_id !== undefined ? page_id : null,
        title,
        content: content || null,
        metadata: metadata || {},
        video_url: video_url || null,
        status: 'in_review',
        editor_id,
        version: base_version !== undefined ? base_version : null,
      },
    });

    return res.status(201).json(draft);
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
      const updatedDraft = await prisma.pending_pages.update({
        where: { pending_id },
        data: {
          status: 'rejected',
          reviewer_id,
        },
      });
      return res.json({ message: 'Draft rejected', data: updatedDraft });
    }

    // --- APPROVE FLOW (Run in Transaction) ---
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch pending draft
      const draft = await tx.pending_pages.findUnique({
        where: { pending_id },
      });

      if (!draft) {
        throw new Error('Pending draft not found');
      }

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
            contributors: [draft.editor_id],
            version: 1,
            created_at: now,
            updated_at: now,
          },
        });

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
        let contributors: number[] = [];
        if (Array.isArray(livePage.contributors)) {
          contributors = [...livePage.contributors] as number[];
        } else if (livePage.contributors && typeof livePage.contributors === 'object') {
          contributors = Object.values(livePage.contributors) as number[];
        }

        if (!contributors.includes(draft.editor_id)) {
          contributors.push(draft.editor_id);
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

        return { message: 'Draft approved and published.', data: updatedLivePage };
      }
    });

    return res.json(result);
  } catch (error: any) {
    console.error('Error in reviewDraft:', error);
    return res.status(500).json({ error: `Database transaction failed: ${error.message}` });
  }
};
