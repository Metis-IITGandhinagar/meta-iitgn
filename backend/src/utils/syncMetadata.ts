import { prisma } from '../lib/prisma.js';
import { Prisma } from '@prisma/client';

export type SyncKey =
  | 'news'
  | 'pendingpages'
  | 'updatedpages'
  | 'featured'
  | 'events'
  | 'messmenu'
  | 'transport'
  | 'popular';

export async function updateSyncMetadata(
  key: SyncKey,
  countChange: number | 'recalculate',
  tx?: Prisma.TransactionClient
) {
  const client = tx || prisma;

  if (countChange === 'recalculate') {
    let count = 0;
    if (key === 'news') {
      count = await client.news.count({ where: { deleted_at: null } });
    } else if (key === 'pendingpages') {
      count = await client.pending_pages.count();
    } else if (key === 'updatedpages' || key === 'popular') {
      count = await client.live_pages.count({ where: { deleted_at: null } });
    } else if (key === 'featured') {
      count = await client.featured_pages.count();
    } else if (key === 'events') {
      count = await client.events.count({ where: { deleted_at: null } });
    } else if (key === 'messmenu') {
      count = await client.mess_menu.count();
    } else if (key === 'transport') {
      count = await client.travel_schedule.count();
    }

    await client.sync_metadata.upsert({
      where: { key },
      create: {
        key,
        count,
        last_updated: new Date(),
      },
      update: {
        count,
        last_updated: new Date(),
      },
    });
  } else {
    await client.sync_metadata.upsert({
      where: { key },
      create: {
        key,
        count: Math.max(0, countChange),
        last_updated: new Date(),
      },
      update: {
        count: { increment: countChange },
        last_updated: new Date(),
      },
    });
  }
}
