import { prisma } from './lib/prisma.js';

async function seed() {
  console.log("Seeding news pages...");

  // 1. Get or create a user to act as author
  let user = await prisma.users.findFirst();
  if (!user) {
    user = await prisma.users.create({
      data: {
        name: "Admin User",
        email: "admin@meta-iitgn.edu",
        role: "admin",
      }
    });
    console.log("Created admin user for seeding:", user.user_id);
  } else {
    console.log("Found existing user:", user.user_id);
  }

  const authorId = user.user_id;

  // 2. Define the news articles to seed
  const newsItems = [
    {
      title: "Amalthea 2026 Sets Attendance Record",
      slug: "news-amalthea-attendance-2026",
      content: `---
image: https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=600
imageAlt: News Article
rows:
  - label: Category
    value: News
    type: text
---

# Amalthea 2026 Sets Attendance Record

Annual Technical Fest Amalthea sets record attendance with winter theme. Over 5,000 students visited the tech showcases and design competitions.`,
      metadata: { category: "news" },
    },
    {
      title: "Sustainable Energy Research Hub Inaugurated",
      slug: "news-sustainable-energy-hub",
      content: `---
image: https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=600
imageAlt: News Article
rows:
  - label: Category
    value: News
    type: text
---

# Sustainable Energy Research Hub Inaugurated

A new Sustainable Energy & Carbon Neutrality Research Hub was inaugurated at the Palaj campus today, focusing on solar materials and next-generation battery architectures.`,
      metadata: { category: "news" },
    },
    {
      title: "Winter Campus Hackathon Announced",
      slug: "news-winter-hackathon-announced",
      content: `---
image: https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=600
imageAlt: News Article
rows:
  - label: Category
    value: News
    type: text
---

# Winter Campus Hackathon Announced

The Technical Council has officially announced the upcoming Winter Campus Hackathon starting next week. The prize pool is set at 1,0,000 INR.`,
      metadata: { category: "news" },
    }
  ];

  // 3. Upsert pages so we don't duplicate if run multiple times
  for (const item of newsItems) {
    const page = await prisma.live_pages.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        content: item.content,
        metadata: item.metadata,
      },
      create: {
        title: item.title,
        slug: item.slug,
        content: item.content,
        metadata: item.metadata,
        original_author_id: authorId,
        version: 1,
      }
    });
    console.log(`Upserted page: ${page.slug}`);
  }

  console.log("Seeding finished successfully.");
}

seed()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
