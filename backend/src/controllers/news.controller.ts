import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

/**
 * GET /news
 * List all news articles with pagination
 */
export const listNews = async (req: Request, res: Response) => {
  try {
    const pageNum = parseInt(req.query.page as string, 10) || 1;
    const limitNum = parseInt(req.query.limit as string, 10) || 5;
    const skip = (pageNum - 1) * limitNum;

    const pages = await prisma.live_pages.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: 'desc' },
      select: {
        page_id: true,
        title: true,
        slug: true,
        content: true,
        metadata: true,
        video_url: true,
        created_at: true,
        updated_at: true,
      }
    });

    const newsItems = pages.filter((page: any) => {
      const meta = (page.metadata as any) || {};
      return meta && meta.category?.toLowerCase() === 'news';
    });

    const totalNews = newsItems.length;
    const paginatedNews = newsItems.slice(skip, skip + limitNum);

    const formattedNews = paginatedNews.map((item) => {
      let snippet = "";
      if (item.content) {
        const clean = item.content.replace(/^---[\s\S]*?---/, "").trim();
        snippet = clean.length > 150 ? clean.substring(0, 150) + "..." : clean;
      }
      return {
        ...item,
        description: snippet,
      };
    });

    return res.json({
      news: formattedNews,
      total: totalNews,
      page: pageNum,
      limit: limitNum,
      hasMore: skip + limitNum < totalNews
    });
  } catch (error: any) {
    console.error('Error in listNews:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * POST /news
 * Direct creation of a news article
 */
export const createNews = async (req: Request, res: Response) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const creatorId = Number(req.user.user_id);
    const baseSlug = 'news-' + title
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '-');

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

    const { video_url } = req.body;

    const newsPage = await prisma.live_pages.create({
      data: {
        title,
        slug,
        content,
        metadata: { category: 'news' },
        video_url: video_url || null,
        original_author_id: creatorId,
        contributors: [creatorId],
        version: 1,
      },
    });

    return res.status(201).json(newsPage);
  } catch (error: any) {
    console.error('Error in createNews:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * PATCH /news/:slug
 * Direct edit of a news article
 */
export const updateNews = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;
    const { title, content } = req.body;
    const editorId = Number(req.user.user_id);

    const newsPage = await prisma.live_pages.findFirst({
      where: { slug, deleted_at: null },
    });

    if (!newsPage) {
      return res.status(404).json({ error: 'News article not found' });
    }

    const meta = (newsPage.metadata as any) || {};
    if (meta.category?.toLowerCase() !== 'news') {
      return res.status(400).json({ error: 'Selected page is not a news article' });
    }

    let contributors: number[] = [];
    if (Array.isArray(newsPage.contributors)) {
      contributors = [...newsPage.contributors] as number[];
    } else if (newsPage.contributors && typeof newsPage.contributors === 'object') {
      contributors = Object.values(newsPage.contributors) as number[];
    }

    if (!contributors.includes(editorId)) {
      contributors.push(editorId);
    }

    const currentVersion = newsPage.version !== null ? newsPage.version : 1;

    const { video_url } = req.body;

    const updatedNews = await prisma.live_pages.update({
      where: { page_id: newsPage.page_id },
      data: {
        title: title !== undefined ? title : newsPage.title,
        content: content !== undefined ? content : newsPage.content,
        video_url: video_url !== undefined ? video_url : newsPage.video_url,
        contributors,
        version: currentVersion + 1,
        updated_by: editorId,
        updated_at: new Date(),
      },
    });

    return res.json(updatedNews);
  } catch (error: any) {
    console.error('Error in updateNews:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * DELETE /news/:slug
 * Direct delete of a news article
 */
export const deleteNews = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;

    const newsPage = await prisma.live_pages.findFirst({
      where: { slug, deleted_at: null },
    });

    if (!newsPage) {
      return res.status(404).json({ error: 'News article not found' });
    }

    const meta = (newsPage.metadata as any) || {};
    if (meta.category?.toLowerCase() !== 'news') {
      return res.status(400).json({ error: 'Selected page is not a news article' });
    }

    await prisma.live_pages.update({
      where: { page_id: newsPage.page_id },
      data: {
        deleted_at: new Date(),
      },
    });

    return res.json({ success: true, message: 'News article soft-deleted successfully' });
  } catch (error: any) {
    console.error('Error in deleteNews:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
