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
 * GET /collegeinfo/mess-menu
 * Returns the mess menu page content
 */
export const getMessMenu = async (req: Request, res: Response) => {
  try {
    const page = await prisma.live_pages.findFirst({
      where: { slug: 'mess-menu', deleted_at: null },
      select: { page_id: true, title: true, slug: true, content: true, updated_at: true },
    });
    if (!page) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Mess menu page not found' } });
    return res.json({ success: true, data: page });
  } catch (error: any) {
    console.error('Error in getMessMenu:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
};

/**
 * GET /collegeinfo/campus-transport
 * Returns the campus transport page content
 */
export const getCampusTransport = async (req: Request, res: Response) => {
  try {
    const page = await prisma.live_pages.findFirst({
      where: { slug: 'campus-transport', deleted_at: null },
      select: { page_id: true, title: true, slug: true, content: true, updated_at: true },
    });
    if (!page) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Campus transport page not found' } });
    return res.json({ success: true, data: page });
  } catch (error: any) {
    console.error('Error in getCampusTransport:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
};
