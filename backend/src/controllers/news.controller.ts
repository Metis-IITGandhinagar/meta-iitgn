import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { invalidateSyncCache } from './page.controller.js';
import { updateSyncMetadata } from '../utils/syncMetadata.js';

/**
 * GET /news
 * List all news articles with pagination
 */
export const listNews = async (req: Request, res: Response) => {
  try {
    const pageNum = parseInt(req.query.page as string, 10) || 1;
    const limitNum = parseInt(req.query.limit as string, 10) || 5;
    const skip = (pageNum - 1) * limitNum;

    const newsItems = await prisma.news.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: 'desc' },
    });

    const totalNews = newsItems.length;
    const paginatedNews = newsItems.slice(skip, skip + limitNum);

    const formattedNews = paginatedNews.map((item) => {
      let snippet = "";
      if (item.content) {
        // Strip frontmatter if any (backward compatibility)
        const clean = item.content.replace(/^---[\s\S]*?---/, "").trim();
        snippet = clean.length > 150 ? clean.substring(0, 150) + "..." : clean;
      }
      return {
        page_id: item.news_id,
        title: item.title,
        slug: item.slug,
        content: item.content,
        video_url: item.video_url,
        created_at: item.created_at,
        updated_at: item.updated_at,
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
 * GET /news/:idOrSlug
 * Fetch a single news article by news_id or slug
 */
export const getNewsByIdOrSlug = async (req: Request, res: Response) => {
  try {
    const idOrSlug = req.params.idOrSlug as string;
    const isId = /^\d+$/.test(idOrSlug);
    
    const newsItem = await prisma.news.findFirst({
      where: isId 
        ? { news_id: parseInt(idOrSlug, 10), deleted_at: null }
        : { slug: idOrSlug, deleted_at: null }
    });

    if (!newsItem) {
      return res.status(404).json({ error: 'News article not found' });
    }

    return res.json({
      page_id: newsItem.news_id,
      title: newsItem.title,
      slug: newsItem.slug,
      content: newsItem.content,
      video_url: newsItem.video_url,
      created_at: newsItem.created_at,
      updated_at: newsItem.updated_at,
    });
  } catch (error: any) {
    console.error('Error in getNewsByIdOrSlug:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * POST /news
 * Direct creation of a news article
 */
export const createNews = async (req: Request, res: Response) => {
  try {
    const { title, content, video_url } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const baseSlug = 'news-' + title
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '-');

    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await prisma.news.findFirst({
        where: { slug, deleted_at: null },
      });
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const newsPage = await prisma.$transaction(async (tx) => {
      const page = await tx.news.create({
        data: {
          title,
          slug,
          content,
          video_url: video_url || null,
        },
      });
      await updateSyncMetadata('news', 1, tx);
      return page;
    });

    invalidateSyncCache('news');

    return res.status(201).json({
      page_id: newsPage.news_id,
      title: newsPage.title,
      slug: newsPage.slug,
      content: newsPage.content,
      video_url: newsPage.video_url,
      created_at: newsPage.created_at,
      updated_at: newsPage.updated_at,
    });
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
    const { title, content, video_url } = req.body;

    const newsPage = await prisma.news.findFirst({
      where: { slug, deleted_at: null },
    });

    if (!newsPage) {
      return res.status(404).json({ error: 'News article not found' });
    }

    const updatedNews = await prisma.$transaction(async (tx) => {
      const page = await tx.news.update({
        where: { news_id: newsPage.news_id },
        data: {
          title: title !== undefined ? title : newsPage.title,
          content: content !== undefined ? content : newsPage.content,
          video_url: video_url !== undefined ? video_url : newsPage.video_url,
          updated_at: new Date(),
        },
      });
      await updateSyncMetadata('news', 0, tx);
      return page;
    });

    invalidateSyncCache('news');

    return res.json({
      page_id: updatedNews.news_id,
      title: updatedNews.title,
      slug: updatedNews.slug,
      content: updatedNews.content,
      video_url: updatedNews.video_url,
      created_at: updatedNews.created_at,
      updated_at: updatedNews.updated_at,
    });
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

    const newsPage = await prisma.news.findFirst({
      where: { slug, deleted_at: null },
    });

    if (!newsPage) {
      return res.status(404).json({ error: 'News article not found' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.news.update({
        where: { news_id: newsPage.news_id },
        data: {
          deleted_at: new Date(),
        },
      });
      await updateSyncMetadata('news', -1, tx);
    });

    invalidateSyncCache('news');

    return res.json({ success: true, message: 'News article soft-deleted successfully' });
  } catch (error: any) {
    console.error('Error in deleteNews:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
