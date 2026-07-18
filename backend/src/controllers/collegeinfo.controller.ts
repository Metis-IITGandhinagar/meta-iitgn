import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

/**
 * GET /collegeinfo/events
 * Returns upcoming events (future events first, then recurring)
 */
export const getEvents = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const now = new Date();

    const events = await prisma.events.findMany({
      where: {
        deleted_at: null,
        OR: [
          { event_date: { gte: now } },
          { is_recurring: true },
        ],
      },
      orderBy: { event_date: 'asc' },
      take: limit,
    });

    return res.json({ success: true, data: events });
  } catch (error: any) {
    console.error('Error in getEvents:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
};

/**
 * Ensure a college-info page exists in live_pages, creating an empty one if it
 * is missing. Used so /collegeinfo/mess-menu and /collegeinfo/campus-transport
 * never 404 — they return an empty (editable) page instead.
 */
const ensureCollegeInfoPage = async (slug: string, title: string, subcategory: string) => {
  const existing = await prisma.live_pages.findFirst({
    where: { slug, deleted_at: null },
  });
  if (existing) return existing;

  // Pick any existing user as the original author to satisfy the FK constraint.
  const author = await prisma.users.findFirst({ orderBy: { user_id: 'asc' } });
  const authorId = author?.user_id ?? 1;

  return prisma.live_pages.create({
    data: {
      title,
      slug,
      content: '',
      category: 'Campus',
      subcategory,
      description: '',
      metadata: {},
      video_url: null,
      original_author_id: authorId,
      contributors: author ? [author.name] : [],
      version: 1,
    },
  });
};

/**
 * GET /collegeinfo/mess-menu
 * Returns the mess menu page content. Creates an empty page if missing.
 */
export const getMessMenu = async (req: Request, res: Response) => {
  try {
    const page = await ensureCollegeInfoPage('mess-menu', 'Mess Menu', 'Mess');
    return res.json({ success: true, data: page });
  } catch (error: any) {
    console.error('Error in getMessMenu:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
};

/**
 * GET /collegeinfo/campus-transport
 * Returns the campus transport page content. Creates an empty page if missing.
 */
export const getCampusTransport = async (req: Request, res: Response) => {
  try {
    const page = await ensureCollegeInfoPage('campus-transport', 'Campus Transport', 'Transport');
    return res.json({ success: true, data: page });
  } catch (error: any) {
    console.error('Error in getCampusTransport:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
};
