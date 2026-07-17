import { prisma } from './lib/prisma.js';
import { updateSyncMetadata, SyncKey } from './utils/syncMetadata.js';

async function main() {
  console.log('Starting sync metadata backfill/seeding...');
  
  // Truncate or clean existing sync_metadata if any (though upsert handles it, cleaning ensures fresh slate)
  await prisma.sync_metadata.deleteMany({});
  console.log('Cleared existing sync_metadata records.');

  const keys: SyncKey[] = [
    'news',
    'pendingpages',
    'updatedpages',
    'featured',
    'events',
    'messmenu',
    'transport',
    'popular',
  ];

  for (const key of keys) {
    console.log(`Recalculating and populating metadata for key: "${key}"`);
    await updateSyncMetadata(key, 'recalculate');
  }

  console.log('Sync metadata backfill completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during backfill:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
