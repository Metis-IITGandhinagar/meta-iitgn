import { prisma } from "../lib/prisma.js";

async function main() {
  console.log("Clearing all data from database...");
  
  await prisma.featured_pages.deleteMany({});
  await prisma.bookmarks.deleteMany({});
  await prisma.page_links.deleteMany({});
  await prisma.pending_page_comments.deleteMany({});
  await prisma.pending_pages.deleteMany({});
  await prisma.revision_pages.deleteMany({});
  await prisma.live_pages.deleteMany({});
  await prisma.user_readmes.deleteMany({});
  await prisma.audit_logs.deleteMany({});
  await prisma.media_assets.deleteMany({});
  
  await prisma.pending_blogs.deleteMany({});
  await prisma.revision_blogs.deleteMany({});
  await prisma.blogs.deleteMany({});
  
  await prisma.events.deleteMany({});
  await prisma.news.deleteMany({});
  await prisma.categories.deleteMany({});
  await prisma.sync_metadata.deleteMany({});
  await prisma.users.deleteMany({});
  
  console.log("Database cleared successfully!");
}

main()
  .catch((e) => {
    console.error("Error clearing DB:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
