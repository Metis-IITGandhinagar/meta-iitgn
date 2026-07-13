import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

/**
 * GET /pages/recent/new
 * Fetch most recently created pages (default limit: 4)
 */
export const getRecentNewPages = async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 4;
    const skip = (page - 1) * limit;

    const pages = await prisma.live_pages.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
      select: {
        page_id: true,
        title: true,
        slug: true,
        created_at: true,
        metadata: true,
        content: true,
      },
    });
    return res.json(pages);
  } catch (error: any) {
    console.error('Error in getRecentNewPages:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * GET /pages/recent/updated
 * Fetch most recently updated pages (default limit: 4)
 */
export const getRecentUpdatedPages = async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 4;
    const skip = (page - 1) * limit;

    const pages = await prisma.live_pages.findMany({
      where: { deleted_at: null },
      orderBy: { updated_at: 'desc' },
      skip,
      take: limit,
      select: {
        page_id: true,
        title: true,
        slug: true,
        updated_at: true,
        metadata: true,
        content: true,
      },
    });
    return res.json(pages);
  } catch (error: any) {
    console.error('Error in getRecentUpdatedPages:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * GET /pages/search
 * Search both live pages and pending drafts (status = in_review, page_id = null)
 */
export const searchPages = async (req: Request, res: Response) => {
  try {
    const query = ((req.query.query as string) || '').trim();

    if (!query) {
      return res.json([]);
    }

    // 1. Fetch all live pages
    const livePages = await prisma.live_pages.findMany({
      where: { deleted_at: null },
      select: {
        page_id: true,
        title: true,
        slug: true,
        content: true,
        metadata: true,
      },
    });

    // 2. Fetch pending drafts under review
    const pendingPages = await prisma.pending_pages.findMany({
      where: {
        status: 'in_review',
        page_id: null,
      },
      select: {
        pending_id: true,
        title: true,
        content: true,
        metadata: true,
        status: true,
      },
    });

    // Levenshtein edit distance
    const editDistance = (s1: string, s2: string): number => {
      const m = s1.length;
      const n = s2.length;
      const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
      for (let i = 0; i <= m; i++) dp[i][0] = i;
      for (let j = 0; j <= n; j++) dp[0][j] = j;
      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          if (s1[i - 1] === s2[j - 1]) {
            dp[i][j] = dp[i - 1][j - 1];
          } else {
            dp[i][j] = Math.min(
              dp[i - 1][j] + 1,
              dp[i][j - 1] + 1,
              dp[i - 1][j - 1] + 1
            );
          }
        }
      }
      return dp[m][n];
    };

    // Fuzzy matching scoring function (Word-level Levenshtein + Prefix matching)
    const scoreText = (text: string, q: string): number => {
      const txt = text.toLowerCase();
      const queryLower = q.toLowerCase();
      if (txt === queryLower) return 100;
      if (txt.includes(queryLower)) {
        return txt.indexOf(queryLower) === 0 ? 95 : 85;
      }

      const textWords = txt.split(/[^a-z0-9]+/);
      const queryWords = queryLower.split(/[^a-z0-9]+/);
      let totalScore = 0;

      for (const qWord of queryWords) {
        if (!qWord) continue;
        let bestWordScore = 0;

        for (const tWord of textWords) {
          if (!tWord) continue;

          // 1. Exact match
          if (tWord === qWord) {
            bestWordScore = Math.max(bestWordScore, 20);
            continue;
          }

          // 2. Prefix match
          if (tWord.startsWith(qWord)) {
            bestWordScore = Math.max(bestWordScore, 15 * (qWord.length / tWord.length));
            continue;
          }

          // 3. Typo fuzzy match (Levenshtein)
          const maxDist = qWord.length <= 4 ? 1 : 2;
          if (Math.abs(tWord.length - qWord.length) <= maxDist) {
            const dist = editDistance(tWord, qWord);
            if (dist <= maxDist) {
              const similarity = 1 - dist / Math.max(tWord.length, qWord.length);
              bestWordScore = Math.max(bestWordScore, 10 * similarity);
            }
          }
        }
        totalScore += bestWordScore;
      }

      return totalScore;
    };

    const results: any[] = [];
    const cleanContent = (content: string | null) => {
      if (!content) return '';
      const clean = content.replace(/^---[\s\S]*?---/, '').trim();
      return clean.length > 150 ? clean.substring(0, 150) + '...' : clean;
    };

    for (const p of livePages) {
      const titleScore = scoreText(p.title || '', query);
      const contentScore = scoreText(p.content || '', query);
      const totalScore = titleScore * 3 + contentScore;
      
      if (totalScore > 15) {
        const meta = p.metadata as any;
        const category = meta?.category || 'Campus';
        results.push({
          title: p.title || 'Untitled',
          slug: p.slug,
          path: `/wiki/page/${p.slug}`,
          category,
          description: cleanContent(p.content),
          is_pending: false,
          score: totalScore,
        });
      }
    }

    for (const p of pendingPages) {
      const titleScore = scoreText(p.title || '', query);
      const contentScore = scoreText(p.content || '', query);
      const totalScore = titleScore * 3 + contentScore;
      
      if (totalScore > 15) {
        const meta = p.metadata as any;
        let draftSlug = meta?.slug;
        if (!draftSlug && p.title) {
          const baseSlug = p.title
            .replace(/[^a-zA-Z0-9\s-]/g, '')
            .trim()
            .toLowerCase();
          draftSlug = baseSlug.replace(/[\s-]+/g, '-');
        }
        const category = meta?.category || 'Campus';
        results.push({
          title: p.title || 'Untitled',
          slug: draftSlug || 'untitled',
          path: `/wiki/page/${draftSlug || 'untitled'}`,
          category,
          description: cleanContent(p.content),
          is_pending: true,
          score: totalScore,
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    const limitedResults = results.slice(0, 25).map(({ score, ...rest }) => rest);

    return res.json(limitedResults);
  } catch (error: any) {
    console.error('Error in searchPages:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * GET /pages/:slug
 * Retrieve a live page by its slug. 
 * Fallback to searching unreviewed pending page drafts with a matching slugified title.
 */
export const getPage = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;

    // 1. Try to find the live page
    const livePage = await prisma.live_pages.findFirst({
      where: {
        slug,
        deleted_at: null,
      },
      include: {
        original_author: {
          select: { name: true },
        },
      },
    });

    if (livePage) {
      return res.json({
        ...livePage,
        users: { name: livePage.original_author?.name },
      });
    }

    // 2. Check pending_pages where status is 'in_review' and page_id is null (new page proposals)
    const pendingPages = await prisma.pending_pages.findMany({
      where: {
        status: 'in_review',
        page_id: null,
      },
      include: {
        editor: {
          select: { name: true },
        },
      },
    });

    for (const draft of pendingPages) {
      const meta = draft.metadata as any;
      let draftSlug = meta?.slug;
      if (!draftSlug && draft.title) {
        const baseSlug = draft.title
          .replace(/[^a-zA-Z0-9\s-]/g, '')
          .trim()
          .toLowerCase();
        draftSlug = baseSlug.replace(/[\s-]+/g, '-');
      }

      if (draftSlug === slug) {
        return res.json({
          page_id: null,
          pending_id: draft.pending_id,
          title: draft.title,
          slug: draftSlug,
          content: draft.content,
          metadata: draft.metadata || {},
          version: null,
          status: 'in_review',
          created_at: draft.created_at,
          updated_at: draft.created_at,
          users: { name: draft.editor.name },
        });
      }
    }

    return res.status(404).json({ detail: 'Page not found or deleted' });
  } catch (error: any) {
    console.error('Error in getPage:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * GET /pages/stats
 * Get page statistics (e.g. total live pages)
 */
export const getPageStats = async (req: Request, res: Response) => {
  try {
    const totalPages = await prisma.live_pages.count({
      where: { deleted_at: null }
    });
    return res.json({ totalPages });
  } catch (error: any) {
    console.error('Error in getPageStats:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * GET /pages/count
 * Retrieve total number of live pages
 */
export const getPageCount = async (req: Request, res: Response) => {
  try {
    const count = await prisma.live_pages.count({
      where: { deleted_at: null }
    });
    return res.json({ count });
  } catch (error: any) {
    console.error('Error in getPageCount:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * POST /pages
 * Direct creation of page/article (moderator and admin)
 */
export const createPage = async (req: Request, res: Response) => {
  try {
    const { title, content, metadata, video_url } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const creatorId = Number(req.user.user_id);

    let baseSlug = (title || 'untitled')
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '-');
    if (!baseSlug) baseSlug = 'untitled';

    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await prisma.live_pages.findFirst({
        where: { slug, deleted_at: null },
      });
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const newPage = await prisma.live_pages.create({
      data: {
        title,
        slug,
        content: content || null,
        metadata: metadata || {},
        video_url: video_url || null,
        original_author_id: creatorId,
        contributors: [creatorId],
        version: 1,
      },
    });

    return res.status(201).json(newPage);
  } catch (error: any) {
    console.error('Error in createPage:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * PATCH /pages/:slug
 * Direct edit of page/article (authenticated user)
 */
export const updatePage = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;
    const { title, content, metadata, video_url } = req.body;

    const editorId = Number(req.user.user_id);

    const livePage = await prisma.live_pages.findFirst({
      where: { slug, deleted_at: null },
    });

    if (!livePage) {
      return res.status(404).json({ error: 'Page not found' });
    }

    let contributors: number[] = [];
    if (Array.isArray(livePage.contributors)) {
      contributors = [...livePage.contributors] as number[];
    } else if (livePage.contributors && typeof livePage.contributors === 'object') {
      contributors = Object.values(livePage.contributors) as number[];
    }

    if (!contributors.includes(editorId)) {
      contributors.push(editorId);
    }

    const currentVersion = livePage.version !== null ? livePage.version : 1;

    const updatedPage = await prisma.live_pages.update({
      where: { page_id: livePage.page_id },
      data: {
        title: title !== undefined ? title : livePage.title,
        content: content !== undefined ? content : livePage.content,
        metadata: metadata !== undefined ? { ...(livePage.metadata as object), ...metadata } : livePage.metadata,
        video_url: video_url !== undefined ? video_url : livePage.video_url,
        contributors,
        version: currentVersion + 1,
        updated_by: editorId,
        updated_at: new Date(),
      },
    });

    return res.json(updatedPage);
  } catch (error: any) {
    console.error('Error in updatePage:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * DELETE /pages/:slug
 * Direct delete of page/article (admin only)
 */
export const deletePage = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;

    const livePage = await prisma.live_pages.findFirst({
      where: { slug, deleted_at: null },
    });

    if (!livePage) {
      return res.status(404).json({ error: 'Page not found' });
    }

    await prisma.live_pages.update({
      where: { page_id: livePage.page_id },
      data: {
        deleted_at: new Date(),
      },
    });

    return res.json({ success: true, message: 'Page soft-deleted successfully' });
  } catch (error: any) {
    console.error('Error in deletePage:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * GET /pages/sync-check
 * Lightweight check of last modification timestamps/counts
 */
export const getSyncCheck = async (req: Request, res: Response) => {
  try {
    // 1. news last updated (filter metadata category: news)
    const pages = await prisma.live_pages.findMany({
      where: { deleted_at: null },
      select: { updated_at: true, metadata: true }
    });
    
    const newsItems = pages.filter((p: any) => p.metadata?.category?.toLowerCase() === 'news');
    const news_last_updated = newsItems.length > 0 ? Math.max(...newsItems.map((p: any) => p.updated_at.getTime())) : 0;

    // 2. contributors
    const userStats = await prisma.users.aggregate({
      _max: { created_at: true },
      _count: { user_id: true },
      where: { deleted_at: null }
    });
    const contributors_last_updated = userStats._max.created_at ? userStats._max.created_at.getTime() : 0;
    const contributors_count = userStats._count.user_id;

    // 3. pendingpages
    const pendingStats = await prisma.pending_pages.aggregate({
      _max: { created_at: true },
      _count: { pending_id: true },
    });
    const pending_last_updated = pendingStats._max.created_at ? pendingStats._max.created_at.getTime() : 0;
    const pending_count = pendingStats._count.pending_id;

    // 4. updatedpages
    const liveStats = await prisma.live_pages.aggregate({
      _max: { updated_at: true },
      _count: { page_id: true },
      where: { deleted_at: null }
    });
    const updated_last_updated = liveStats._max.updated_at ? liveStats._max.updated_at.getTime() : 0;
    const updated_count = liveStats._count.page_id;

    // 5. bookmarks count & max created_at for this user (if logged in)
    let bookmarks_last_updated = 0;
    let bookmarks_count = 0;
    
    if (req.user && req.user.user_id) {
      const userId = Number(req.user.user_id);
      const bookmarkStats = await prisma.bookmarks.aggregate({
        _max: { created_at: true },
        _count: { bookmark_id: true },
        where: { user_id: userId }
      });
      bookmarks_last_updated = bookmarkStats._max.created_at ? bookmarkStats._max.created_at.getTime() : 0;
      bookmarks_count = bookmarkStats._count.bookmark_id;
    }

    return res.json({
      news: { last_updated: news_last_updated, count: newsItems.length },
      contributors: { last_updated: contributors_last_updated, count: contributors_count },
      pendingpages: { last_updated: pending_last_updated, count: pending_count },
      updatedpages: { last_updated: updated_last_updated, count: updated_count },
      bookmarks: { last_updated: bookmarks_last_updated, count: bookmarks_count }
    });
  } catch (error: any) {
    console.error('Error in getSyncCheck:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
