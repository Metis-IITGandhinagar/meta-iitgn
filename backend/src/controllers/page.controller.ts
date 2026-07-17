import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { invalidateCategoriesCache } from './category.controller.js';
import { processAndMarkMediaUsed } from '../utils/cleanup.js';
import { updateSyncMetadata } from '../utils/syncMetadata.js';

let statsCache: { totalPages: number } | null = null;

export const invalidateStatsCache = () => {
  statsCache = null;
};

const searchCache = new Map<string, { data: any; expiry: number }>();
const SEARCH_CACHE_TTL = 30000; // 30 seconds

export const invalidateSearchCache = () => {
  searchCache.clear();
};

let syncCheckCache: {
  news: { last_updated: number; count: number } | null;
  pendingpages: { last_updated: number; count: number } | null;
  updatedpages: { last_updated: number; count: number } | null;
  featured: { last_updated: number; count: number } | null;
  events: { last_updated: number; count: number } | null;
  messmenu: { last_updated: number; count: number } | null;
  transport: { last_updated: number; count: number } | null;
  popular: { last_updated: number; count: number } | null;
} = {
  news: null,
  pendingpages: null,
  updatedpages: null,
  featured: null,
  events: null,
  messmenu: null,
  transport: null,
  popular: null
};

export const invalidateSyncCache = (key?: 'news' | 'pendingpages' | 'updatedpages' | 'featured' | 'events' | 'messmenu' | 'transport' | 'popular') => {
  if (key) {
    syncCheckCache[key] = null;
  } else {
    syncCheckCache.news = null;
    syncCheckCache.pendingpages = null;
    syncCheckCache.updatedpages = null;
    syncCheckCache.featured = null;
    syncCheckCache.events = null;
    syncCheckCache.messmenu = null;
    syncCheckCache.transport = null;
    syncCheckCache.popular = null;
  }
};

const bookmarkStatsCache = new Map<number, { last_updated: number; count: number; expiry: number }>();
export const invalidateBookmarkCache = (userId: number) => {
  bookmarkStatsCache.delete(userId);
};

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
 * Search pages, categories, users, news, everything.
 */
export const searchPages = async (req: Request, res: Response) => {
  try {
    const query = ((req.query.query as string) || '').trim();
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 6;
    const category = ((req.query.category as string) || 'All').trim();

    if (!query) {
      return res.json({ results: [], total: 0, hasMore: false });
    }

    let resultsToPaginate: any[];

    const cached = searchCache.get(query);
    if (cached && cached.expiry > Date.now()) {
      resultsToPaginate = cached.data;
    } else {
      const isLoggedIn = !!(req.user && req.user.user_id);

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

    // 3. Fetch categories
    const allCategories = await prisma.categories.findMany({
      select: {
        name: true,
        description: true,
        slug: true,
      }
    });

    // 4. Fetch news
    const allNews = await prisma.news.findMany({
      where: { deleted_at: null },
      select: {
        title: true,
        content: true,
        slug: true,
      }
    });

    // 5. Fetch users
    const allUsers = await prisma.users.findMany({
      where: { deleted_at: null },
      select: {
        user_id: true,
        name: true,
        email: true,
      }
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

    // Fuzzy matching scoring function
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

          if (tWord === qWord) {
            bestWordScore = Math.max(bestWordScore, 20);
            continue;
          }
          if (tWord.startsWith(qWord)) {
            bestWordScore = Math.max(bestWordScore, 15 * (qWord.length / tWord.length));
            continue;
          }

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

    const profileMap = new Map<number, any>();

    // Seed profile results with user name/email match
    for (const u of allUsers) {
      const nameScore = scoreText(u.name, query);
      const emailScore = isLoggedIn ? scoreText(u.email, query) : 0;
      const totalScore = nameScore * 3 + emailScore;

      if (totalScore > 15) {
        profileMap.set(u.user_id, {
          title: u.name,
          slug: `profile-${u.user_id}`,
          path: `/user/profile?userId=${u.user_id}`,
          category: 'Profile',
          type: 'profile',
          description: `View profile details`,
          is_pending: false,
          score: totalScore,
        });
      }
    }

    for (const p of livePages) {
      const meta = p.metadata as any;
      const category = meta?.category || 'Campus';
      const isProfile = category.toLowerCase() === 'profile' || p.slug.startsWith('profile-');

      if (isProfile) {
        const userIdStr = p.slug.replace('profile-', '');
        const userIdVal = parseInt(userIdStr, 10);
        if (!isNaN(userIdVal)) {
          const titleScore = scoreText(p.title || '', query);
          const contentScore = scoreText(p.content || '', query);
          const totalScore = titleScore * 3 + contentScore;
          if (totalScore > 15) {
            const matchedUser = allUsers.find(u => u.user_id === userIdVal);
            const nameText = matchedUser ? matchedUser.name : (p.title || 'Untitled Profile');
            const existing = profileMap.get(userIdVal);
            const finalScore = existing ? Math.max(existing.score, totalScore) : totalScore;
            profileMap.set(userIdVal, {
              title: nameText,
              slug: p.slug,
              path: `/user/profile?userId=${userIdVal}`,
              category: 'Profile',
              type: 'profile',
              description: cleanContent(p.content) || (existing ? existing.description : 'View profile details'),
              is_pending: false,
              score: finalScore,
            });
          }
        }
        continue;
      }

      const titleScore = scoreText(p.title || '', query);
      const contentScore = scoreText(p.content || '', query);
      const totalScore = titleScore * 3 + contentScore;
      
      if (totalScore > 15) {
        results.push({
          title: p.title || 'Untitled',
          slug: p.slug,
          page_id: p.page_id,
          path: `/wiki/page/${p.slug}`,
          category,
          type: 'page',
          description: cleanContent(p.content),
          is_pending: false,
          score: totalScore,
        });
      }
    }

    for (const p of pendingPages) {
      const meta = p.metadata as any;
      const category = meta?.category || 'Campus';
      const isProfile = category.toLowerCase() === 'profile' || (meta?.slug && String(meta.slug).startsWith('profile-')) || (p.title && p.title.toLowerCase().startsWith('profile-'));
      if (isProfile) {
        continue;
      }

      const titleScore = scoreText(p.title || '', query);
      const contentScore = scoreText(p.content || '', query);
      const totalScore = titleScore * 3 + contentScore;
      
      if (totalScore > 15) {
        let draftSlug = meta?.slug;
        if (!draftSlug && p.title) {
          const baseSlug = p.title
            .replace(/[^a-zA-Z0-9\s-]/g, '')
            .trim()
            .toLowerCase();
          draftSlug = baseSlug.replace(/[\s-]+/g, '-');
        }
        results.push({
          title: p.title || 'Untitled',
          slug: draftSlug || 'untitled',
          path: `/wiki/page/${draftSlug || 'untitled'}`,
          category,
          type: 'page',
          description: cleanContent(p.content),
          is_pending: true,
          score: totalScore,
        });
      }
    }

    for (const c of allCategories) {
      const nameScore = scoreText(c.name, query);
      const descScore = scoreText(c.description, query);
      const totalScore = nameScore * 3 + descScore;

      if (totalScore > 15) {
        results.push({
          title: c.name,
          slug: c.slug,
          path: `/wiki/${c.slug}`,
          category: 'Category',
          type: 'category',
          description: c.description,
          is_pending: false,
          score: totalScore,
        });
      }
    }

    for (const n of allNews) {
      const titleScore = scoreText(n.title, query);
      const contentScore = scoreText(n.content, query);
      const totalScore = titleScore * 3 + contentScore;

      if (totalScore > 15) {
        results.push({
          title: n.title,
          slug: n.slug,
          path: `/wiki/news/${n.slug}`,
          category: 'News',
          type: 'news',
          description: cleanContent(n.content),
          is_pending: false,
          score: totalScore,
        });
      }
    }

    // Add profileMap entries into results
    for (const prof of profileMap.values()) {
      results.push(prof);
    }

    results.sort((a, b) => b.score - a.score);
    resultsToPaginate = results.slice(0, 100);

    searchCache.set(query, { data: resultsToPaginate, expiry: Date.now() + SEARCH_CACHE_TTL });
  }

  const categoryFiltered = resultsToPaginate.filter((item: any) => {
    return category.toLowerCase() === 'all' || item.category.toLowerCase() === category.toLowerCase();
  });

  const offset = (page - 1) * limit;
  const paginatedResults = categoryFiltered.slice(offset, offset + limit).map(({ score, ...rest }: any) => rest);

  const availableCategories = Array.from(
    new Set([
      'All',
      ...resultsToPaginate.map((item: any) => {
        const cat = item.category || 'Campus';
        return cat.charAt(0).toUpperCase() + cat.slice(1);
      }),
    ])
  );

  return res.json({
    results: paginatedResults,
    total: categoryFiltered.length,
    hasMore: offset + limit < categoryFiltered.length,
    categories: availableCategories,
  });
  } catch (error: any) {
    console.error('Error in searchPages:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * GET /pages/:slug/edit
 * Retrieve a page for editing along with its active draft content or live content and version ID.
 */
export const getPageForEdit = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;
    const livePage = await prisma.live_pages.findUnique({
      where: { slug, deleted_at: null },
    });
    if (!livePage) {
      return res.status(404).json({ error: 'Page not found' });
    }

    const activeDraft = await prisma.pending_pages.findFirst({
      where: {
        page_id: livePage.page_id,
        status: { in: ['draft', 'in_review'] }
      }
    });

    if (activeDraft) {
      return res.json({
        content: activeDraft.content,
        versionId: activeDraft.version ?? livePage.version ?? 1,
        page_id: livePage.page_id,
        title: activeDraft.title
      });
    }

    return res.json({
      content: livePage.content,
      versionId: livePage.version ?? 1,
      page_id: livePage.page_id,
      title: livePage.title
    });
  } catch (error: any) {
    console.error('Error in getPageForEdit:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * GET /pages/id/:page_id
 * Retrieve a live page by its numeric page ID.
 */
export const getPageById = async (req: Request, res: Response) => {
  try {
    const pageId = parseInt(req.params.page_id as string, 10);
    const livePage = await prisma.live_pages.findUnique({
      where: { page_id: pageId, deleted_at: null },
    });
    if (!livePage) {
      return res.status(404).json({ error: 'Page not found' });
    }
    return res.json(livePage);
  } catch (error: any) {
    console.error('Error in getPageById:', error);
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
        updater: {
          select: { name: true },
        },
      },
    });

    if (livePage) {
      return res.json({
        ...livePage,
        users: { name: livePage.original_author?.name },
        updater: { name: livePage.updater?.name ?? null },
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
    if (statsCache) {
      return res.json(statsCache);
    }
    const totalPages = await prisma.live_pages.count({
      where: { deleted_at: null }
    });
    statsCache = { totalPages };
    return res.json(statsCache);
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
    if (statsCache) {
      return res.json({ count: statsCache.totalPages });
    }
    const count = await prisma.live_pages.count({
      where: { deleted_at: null }
    });
    statsCache = { totalPages: count };
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
    const { title, content, metadata, video_url, slug: customSlug } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const creatorId = Number(req.user.user_id);

    let baseSlug = customSlug || (title || 'untitled')
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '-');
    if (!baseSlug) baseSlug = 'untitled';

    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await prisma.live_pages.findUnique({
        where: { slug },
      });
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const userObj = await prisma.users.findUnique({
      where: { user_id: creatorId }
    });
    const creatorName = userObj?.name || 'Unknown';

    const newPage = await prisma.$transaction(async (tx) => {
      const page = await tx.live_pages.create({
        data: {
          title,
          slug,
          content: content || null,
          metadata: metadata || {},
          video_url: video_url || null,
          original_author_id: creatorId,
          contributors: [creatorName],
          version: 1,
        },
      });

      // Auto-feature if category is "Featured" or "featured"
      const meta = metadata as any;
      const metaCategory = String(meta?.category || '').toLowerCase();
      if (metaCategory === 'featured' || meta?.featured === true) {
        await tx.featured_pages.create({
          data: {
            page_id: page.page_id,
            tag: meta?.tag || 'Featured Story',
            location: meta?.location || '',
            description: meta?.description || title,
            order: 0
          }
        });
        await updateSyncMetadata('featured', 1, tx);
      }

      await updateSyncMetadata('updatedpages', 1, tx);
      await updateSyncMetadata('popular', 1, tx);
      if (slug === 'mess-menu') {
        await updateSyncMetadata('messmenu', 1, tx);
      } else if (slug === 'campus-transport') {
        await updateSyncMetadata('transport', 1, tx);
      }

      return page;
    });

    await processAndMarkMediaUsed(content, (metadata as any)?.image);

    invalidateCategoriesCache();
    invalidateStatsCache();
    invalidateSearchCache();
    invalidateSyncCache('updatedpages');
    invalidateSyncCache('news');
    invalidateSyncCache('popular');
    if (slug === 'mess-menu') invalidateSyncCache('messmenu');
    if (slug === 'campus-transport') invalidateSyncCache('transport');

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

    // Secure profile README pages: only owner or admin can edit
    if (slug.startsWith('profile-')) {
      const profileUserId = Number(slug.replace('profile-', ''));
      if (profileUserId !== editorId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'You are only allowed to edit your own profile README' });
      }
    }

    const livePage = await prisma.live_pages.findUnique({
      where: { slug },
    });

    if (!livePage || livePage.deleted_at !== null) {
      return res.status(404).json({ error: 'Page not found' });
    }

    // Block direct edits while a pending proposal is open for this page.
    const openPending = await prisma.pending_pages.findFirst({
      where: { page_id: livePage.page_id, status: { in: ['draft', 'in_review'] } },
    });
    if (openPending) {
      return res.status(409).json({
        error: 'A pending edit proposal is already open for this page. Review or reject it before making direct changes.',
      });
    }

    const userObj = await prisma.users.findUnique({
      where: { user_id: editorId }
    });
    const editorName = userObj?.name || 'Unknown';

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

    const updatedPage = await prisma.$transaction(async (tx) => {
      // Snapshot the current live state into revision history.
      await tx.revision_pages.create({
        data: {
          page_id: livePage.page_id,
          created_by_user_id:
            livePage.updated_by !== null ? livePage.updated_by : livePage.original_author_id,
          commit_message: 'Backup prior to direct edit',
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

      const page = await tx.live_pages.update({
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

      // Auto-feature / Update feature if category is "Featured" or "featured"
      const upMeta = page.metadata as any;
      const metaCategory = String(upMeta?.category || '').toLowerCase();
      if (metaCategory === 'featured' || upMeta?.featured === true) {
        const existingFeatured = await tx.featured_pages.findFirst({
          where: { page_id: livePage.page_id }
        });
        if (existingFeatured) {
          await tx.featured_pages.update({
            where: { featured_id: existingFeatured.featured_id },
            data: {
              tag: upMeta?.tag || 'Featured Story',
              location: upMeta?.location || '',
              description: upMeta?.description || page.title,
            }
          });
          await updateSyncMetadata('featured', 0, tx);
        } else {
          await tx.featured_pages.create({
            data: {
              page_id: livePage.page_id,
              tag: upMeta?.tag || 'Featured Story',
              location: upMeta?.location || '',
              description: upMeta?.description || page.title,
              order: 0
            }
          });
          await updateSyncMetadata('featured', 1, tx);
        }
      } else {
        const existingFeatured = await tx.featured_pages.findFirst({
          where: { page_id: livePage.page_id }
        });
        if (existingFeatured) {
          await tx.featured_pages.delete({
            where: { featured_id: existingFeatured.featured_id }
          });
          await updateSyncMetadata('featured', -1, tx);
        }
      }

      await updateSyncMetadata('updatedpages', 0, tx);
      await updateSyncMetadata('popular', 0, tx);
      if (slug === 'mess-menu') {
        await updateSyncMetadata('messmenu', 0, tx);
      } else if (slug === 'campus-transport') {
        await updateSyncMetadata('transport', 0, tx);
      }

      return page;
    });

    await processAndMarkMediaUsed(
      content !== undefined ? content : livePage.content,
      metadata !== undefined ? (metadata as any)?.image : (livePage.metadata as any)?.image
    );

    invalidateCategoriesCache();
    invalidateStatsCache();
    invalidateSearchCache();
    invalidateSyncCache('updatedpages');
    invalidateSyncCache('news');
    invalidateSyncCache('popular');
    if (slug === 'mess-menu') invalidateSyncCache('messmenu');
    if (slug === 'campus-transport') invalidateSyncCache('transport');

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

    const livePage = await prisma.live_pages.findUnique({
      where: { slug },
    });

    if (!livePage || livePage.deleted_at !== null) {
      return res.status(404).json({ error: 'Page not found' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.live_pages.update({
        where: { page_id: livePage.page_id },
        data: {
          deleted_at: new Date(),
        },
      });

      const existingFeatured = await tx.featured_pages.findFirst({
        where: { page_id: livePage.page_id }
      });
      if (existingFeatured) {
        await tx.featured_pages.delete({
          where: { featured_id: existingFeatured.featured_id }
        });
        await updateSyncMetadata('featured', -1, tx);
      }

      await updateSyncMetadata('updatedpages', -1, tx);
      await updateSyncMetadata('popular', -1, tx);
      if (slug === 'mess-menu') {
        await updateSyncMetadata('messmenu', -1, tx);
      } else if (slug === 'campus-transport') {
        await updateSyncMetadata('transport', -1, tx);
      }
    });

    invalidateCategoriesCache();
    invalidateStatsCache();
    invalidateSearchCache();
    invalidateSyncCache('updatedpages');
    invalidateSyncCache('news');
    invalidateSyncCache('popular');
    if (slug === 'mess-menu') invalidateSyncCache('messmenu');
    if (slug === 'campus-transport') invalidateSyncCache('transport');

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
    const metadataRows = await prisma.sync_metadata.findMany();
    const metadataMap = new Map<string, { last_updated: Date; count: number }>();
    for (const row of metadataRows) {
      metadataMap.set(row.key, { last_updated: row.last_updated, count: row.count });
    }

    const formatMeta = (key: string) => {
      const row = metadataMap.get(key);
      return {
        last_updated: row ? row.last_updated.getTime() : 0,
        count: row ? row.count : 0
      };
    };

    let bookmarks_last_updated = 0;
    let bookmarks_count = 0;

    if (req.user && req.user.user_id) {
      const userId = Number(req.user.user_id);
      const cachedBookmark = bookmarkStatsCache.get(userId);
      if (cachedBookmark && cachedBookmark.expiry > Date.now()) {
        bookmarks_last_updated = cachedBookmark.last_updated;
        bookmarks_count = cachedBookmark.count;
      } else {
        const bookmarkStats = await prisma.bookmarks.aggregate({
          _max: { created_at: true },
          _count: { bookmark_id: true },
          where: { user_id: userId }
        });
        bookmarks_last_updated = bookmarkStats._max.created_at ? bookmarkStats._max.created_at.getTime() : 0;
        bookmarks_count = bookmarkStats._count.bookmark_id;
        bookmarkStatsCache.set(userId, {
          last_updated: bookmarks_last_updated,
          count: bookmarks_count,
          expiry: Date.now() + 10000
        });
      }
    }

    return res.json({
      news: formatMeta('news'),
      pendingpages: formatMeta('pendingpages'),
      updatedpages: formatMeta('updatedpages'),
      featured: formatMeta('featured'),
      events: formatMeta('events'),
      messmenu: formatMeta('messmenu'),
      transport: formatMeta('transport'),
      popular: formatMeta('popular'),
      bookmarks: { last_updated: bookmarks_last_updated, count: bookmarks_count }
    });
  } catch (error: any) {
    console.error('Error in getSyncCheck:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * GET /pages/popular
 * Returns top pages by view_count
 */
export const getPopularPages = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const pages = await prisma.live_pages.findMany({
      where: { deleted_at: null, view_count: { gt: 0 } },
      orderBy: { view_count: 'desc' },
      take: limit,
      select: {
        page_id: true,
        title: true,
        slug: true,
        view_count: true,
        metadata: true,
      },
    });
    return res.json({ success: true, data: pages });
  } catch (error: any) {
    console.error('Error in getPopularPages:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Internal server error' } });
  }
};

/**
 * POST /pages/:slug/view
 * Increment view count for a page
 */
export const incrementViewCount = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;
    await prisma.$transaction(async (tx) => {
      await tx.live_pages.updateMany({
        where: { slug, deleted_at: null },
        data: { view_count: { increment: 1 } },
      });
      await updateSyncMetadata('popular', 0, tx);
    });
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Error in incrementViewCount:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
};

/**
 * GET /pages/:slug/revisions
 * Get revision history for a page
 */
export const getPageRevisions = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

    const livePage = await prisma.live_pages.findUnique({
      where: { slug: String(slug), deleted_at: null },
    });

    if (!livePage) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Page not found' } });
    }

    const [revisions, total] = await Promise.all([
      prisma.revision_pages.findMany({
        where: { page_id: livePage.page_id },
        orderBy: { version: 'desc' },
        skip,
        take: limit,
        include: {
          creator: {
            select: {
              user_id: true,
              name: true,
              avatar_url: true,
              role: true,
            },
          },
        },
      }),
      prisma.revision_pages.count({
        where: { page_id: livePage.page_id },
      }),
    ]);

    return res.json({
      success: true,
      revisions,
      total,
      page,
      limit,
      hasMore: skip + revisions.length < total,
    });
  } catch (error: any) {
    console.error('Error in getPageRevisions:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
};

/**
 * POST /pages/:slug/revisions/:revision_id/revert
 * Revert a live page to a previous revision
 */
export const revertPageToRevision = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const revision_id = parseInt(req.params.revision_id as string, 10);
    const userId = Number(req.user.user_id);

    const livePage = await prisma.live_pages.findUnique({
      where: { slug: String(slug), deleted_at: null },
    });

    if (!livePage) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Page not found' } });
    }

    const revision = await prisma.revision_pages.findUnique({
      where: { revision_id },
    });

    if (!revision || revision.page_id !== livePage.page_id) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Revision not found' } });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create a backup revision of the current live state
      await tx.revision_pages.create({
        data: {
          page_id: livePage.page_id,
          created_by_user_id: livePage.updated_by ?? livePage.original_author_id,
          commit_message: `Automatic backup before revert to revision #${revision_id}`,
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

      // 2. Fetch the user performing the revert to add them to contributors
      const user = await tx.users.findUnique({ where: { user_id: userId } });
      const userName = user?.name || 'Unknown';

      let contributors: string[] = [];
      if (Array.isArray(livePage.contributors)) {
        contributors = [...livePage.contributors] as string[];
      } else if (livePage.contributors && typeof livePage.contributors === 'object') {
        contributors = Object.values(livePage.contributors) as string[];
      }
      if (!contributors.includes(userName)) {
        contributors.push(userName);
      }

      const nextVersion = (livePage.version ?? 1) + 1;

      // 3. Update the live page with the revision data
      const updatedPage = await tx.live_pages.update({
        where: { page_id: livePage.page_id },
        data: {
          title: revision.title,
          content: revision.content,
          metadata: revision.metadata || {},
          contributors,
          version: nextVersion,
          updated_by: userId,
          updated_at: new Date(),
        },
      });

      // Log audit trail
      await tx.audit_logs.create({
        data: {
          actor_id: userId,
          action: 'REVERT_PAGE',
          table_name: 'live_pages',
          record_id: livePage.page_id,
          ip_address: '127.0.0.1',
        },
      });

      await updateSyncMetadata('updatedpages', 0, tx);
      await updateSyncMetadata('popular', 0, tx);
      const pageSlug = livePage.slug;
      if (pageSlug === 'mess-menu') {
        await updateSyncMetadata('messmenu', 0, tx);
      } else if (pageSlug === 'campus-transport') {
        await updateSyncMetadata('transport', 0, tx);
      }

      return updatedPage;
    });

    invalidateCategoriesCache();
    invalidateStatsCache();
    invalidateSearchCache();
    invalidateSyncCache('updatedpages');

    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error in revertPageToRevision:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
};
