import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { invalidateSyncCache } from './page.controller.js';
import { updateSyncMetadata } from '../utils/syncMetadata.js';

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
 * POST /collegeinfo/events
 * Create a new event directly in the events table
 */
export const createEvent = async (req: Request, res: Response) => {
  try {
    const { title, description, location, event_date, is_recurring, recur_day, recur_time } = req.body;
    if (!title || !description || !event_date) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'title, description and event_date are required' } });
    }

    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
    const newEvent = await prisma.events.create({
      data: {
        title,
        slug,
        description,
        location: location || "IIT Gandhinagar",
        event_date: new Date(event_date),
        is_recurring: !!is_recurring,
        recur_day: recur_day || null,
        recur_time: recur_time || null
      }
    });

    await prisma.$transaction(async (tx) => {
      await updateSyncMetadata('events', 1, tx);
    });
    invalidateSyncCache('events');

    return res.status(201).json({ success: true, data: newEvent });
  } catch (error: any) {
    console.error('Error in createEvent:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
};

/**
 * PUT /collegeinfo/events/:event_id
 * Update an existing event in the events table
 */
export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { event_id } = req.params;
    const { title, description, location, event_date, is_recurring, recur_day, recur_time } = req.body;

    const eventId = Number(event_id);
    const existing = await prisma.events.findUnique({ where: { event_id: eventId } });
    if (!existing) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } });
    }

    const updatedEvent = await prisma.events.update({
      where: { event_id: eventId },
      data: {
        title: title !== undefined ? title : existing.title,
        description: description !== undefined ? description : existing.description,
        location: location !== undefined ? location : existing.location,
        event_date: event_date !== undefined ? new Date(event_date) : existing.event_date,
        is_recurring: is_recurring !== undefined ? !!is_recurring : existing.is_recurring,
        recur_day: recur_day !== undefined ? recur_day : existing.recur_day,
        recur_time: recur_time !== undefined ? recur_time : existing.recur_time
      }
    });

    await prisma.$transaction(async (tx) => {
      await updateSyncMetadata('events', 0, tx);
    });
    invalidateSyncCache('events');

    return res.json({ success: true, data: updatedEvent });
  } catch (error: any) {
    console.error('Error in updateEvent:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
};

/**
 * DELETE /collegeinfo/events/:event_id
 * Soft-delete an event from the events table
 */
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { event_id } = req.params;
    const eventId = Number(event_id);

    const existing = await prisma.events.findUnique({ where: { event_id: eventId } });
    if (!existing) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } });
    }

    await prisma.events.update({
      where: { event_id: eventId },
      data: { deleted_at: new Date() }
    });

    await prisma.$transaction(async (tx) => {
      await updateSyncMetadata('events', -1, tx);
    });
    invalidateSyncCache('events');

    return res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error: any) {
    console.error('Error in deleteEvent:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
};

/**
 * GET /collegeinfo/mess-menu
 * Returns the mess menu structured JSON. Auto-seeds default weekdays if empty.
 */
export const getMessMenu = async (req: Request, res: Response) => {
  try {
    let menu = await prisma.mess_menu.findMany({
      orderBy: { mess_id: 'asc' }
    });

    if (menu.length === 0) {
      const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      await prisma.mess_menu.createMany({
        data: weekdays.map(day => ({
          day,
          meals: []
        }))
      });
      menu = await prisma.mess_menu.findMany({
        orderBy: { mess_id: 'asc' }
      });
    }

    return res.json({ success: true, data: menu });
  } catch (error: any) {
    console.error('Error in getMessMenu:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
};

/**
 * PUT /collegeinfo/mess-menu
 * Updates the mess menu structured JSON for weekdays
 */
export const updateMessMenu = async (req: Request, res: Response) => {
  try {
    const { days } = req.body;
    if (!Array.isArray(days)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'days must be an array' } });
    }

    await prisma.$transaction(async (tx) => {
      for (const d of days) {
        await tx.mess_menu.upsert({
          where: { day: d.day },
          update: { meals: d.meals || [] },
          create: { day: d.day, meals: d.meals || [] }
        });
      }
      await updateSyncMetadata('messmenu', 1, tx);
    });
    invalidateSyncCache('messmenu');

    return res.json({ success: true, message: 'Mess menu updated successfully' });
  } catch (error: any) {
    console.error('Error in updateMessMenu:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
};

/**
 * GET /collegeinfo/campus-transport
 * Returns the campus transport routes structured JSON.
 */
export const getCampusTransport = async (req: Request, res: Response) => {
  try {
    const transport = await prisma.travel_schedule.findMany({
      orderBy: { travel_id: 'asc' }
    });
    return res.json({ success: true, data: transport });
  } catch (error: any) {
    console.error('Error in getCampusTransport:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
};

/**
 * PUT /collegeinfo/campus-transport
 * Updates the campus transport routes structured JSON.
 */
export const updateCampusTransport = async (req: Request, res: Response) => {
  try {
    const { buses } = req.body;
    if (!Array.isArray(buses)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'buses must be an array' } });
    }

    await prisma.$transaction(async (tx) => {
      await tx.travel_schedule.deleteMany({});
      await tx.travel_schedule.createMany({
        data: buses.map(b => ({
          type: b.type || 'bus',
          route: b.route || b.name || '',
          schedule: b.schedule || b.trips || []
        }))
      });
      await updateSyncMetadata('transport', 1, tx);
    });
    invalidateSyncCache('transport');

    return res.json({ success: true, message: 'Campus transport updated successfully' });
  } catch (error: any) {
    console.error('Error in updateCampusTransport:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
};
