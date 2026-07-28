import { prisma } from '../lib/prisma.js';
import { Prisma } from '@prisma/client';

export type SyncKey =
  | 'news'
  | 'pendingpages'
  | 'updatedpages'
  | 'featured'
  | 'events'
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
    const existing = await client.sync_metadata.findUnique({
      where: { key },
    });
    const currentCount = existing ? existing.count : 0;
    const nextCount = Math.max(0, currentCount + countChange);

    await client.sync_metadata.upsert({
      where: { key },
      create: {
        key,
        count: nextCount,
        last_updated: new Date(),
      },
      update: {
        count: nextCount,
        last_updated: new Date(),
      },
    });
  }
}
