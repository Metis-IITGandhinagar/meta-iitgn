import { prisma } from './lib/prisma.js';

async function seed() {
  console.log("Seeding highlights trivia and history pages...");

  let user = await prisma.users.findFirst();
  if (!user) {
    user = await prisma.users.create({
      data: {
        name: "Admin User",
        email: "admin@meta-iitgn.edu",
        role: "admin",
      }
    });
  }

  const authorId = user.user_id;

  const items = [
    {
      title: "IITGN Hostel Naming Origin",
      slug: "trivia-hostel-naming",
      content: `---
image: https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600
imageAlt: Hostel Trivia
rows:
  - label: Category
    value: Trivia
    type: text
---

# IITGN Hostel Naming Origin

Hostels at IIT Gandhinagar are named after famous rivers in India, such as Sabarmati, Narmada, Shipra, and others, fostering a strong residential community bond.`,
      metadata: { category: "trivia" },
    },
    {
      title: "Solar Powered Campus & Water Self-Sufficiency",
      slug: "trivia-solar-power",
      content: `---
image: https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600
imageAlt: Solar Power
rows:
  - label: Category
    value: Trivia
    type: text
---

# Solar Powered Campus & Water Self-Sufficiency

IIT Gandhinagar is one of the few campuses in India with a 5-star GRIHA LD rating, generating significant solar power and harvesting 100% of rainwater.`,
      metadata: { category: "trivia" },
    },
    {
      title: "Palaj Transition Completed",
      slug: "history-palaj-transition",
      content: `---
image: https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600
imageAlt: Transition History
rows:
  - label: Category
    value: History
    type: text
---

# Palaj Transition Completed

In 2015, IIT Gandhinagar officially completed the transition and began classes at its permanent campus in Palaj on the banks of the Sabarmati River.`,
      metadata: { category: "history" },
    },
    {
      title: "First Convocation of IITGN",
      slug: "history-first-convocation",
      content: `---
image: https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600
imageAlt: Convocation History
rows:
  - label: Category
    value: History
    type: text
---

# First Convocation of IITGN

In 2012, IIT Gandhinagar hosted its historic first convocation, graduating its pioneer batch of B.Tech students in a grand ceremony.`,
      metadata: { category: "history" },
    }
  ];

  for (const item of items) {
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
    console.log(`Upserted highlight page: ${page.slug}`);
  }

  console.log("Highlights seeding finished successfully.");
}

seed()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
