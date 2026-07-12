import { prisma } from './lib/prisma.js';

async function seed() {
  console.log("Seeding more and longer news pages...");

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

  const newsItems = [
    {
      title: "IIT Gandhinagar Concludes Global Summit on Sustainable Infrastructure",
      slug: "news-global-summit-sustainable-infrastructure",
      content: `---
image: https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=600
imageAlt: Sustainable Infrastructure Summit
rows:
  - label: Category
    value: News
    type: text
---

# IIT Gandhinagar Concludes Global Summit on Sustainable Infrastructure

IIT Gandhinagar successfully concluded its three-day Global Summit on Sustainable Infrastructure. The summit brought together over 300 academicians, industry executives, policymakers, and green energy advocates from 15 countries to discuss the future of eco-friendly construction, net-zero urban development, and next-generation smart grids.

During the keynote address, the Director of IITGN highlighted the institute's commitment to sustainability, drawing attention to the campus's native passive cooling systems, water harvesting channels, and waste management practices. Multiple panel sessions explored topics including:
- Low-carbon building materials like geopolymers and calcined clays.
- Integration of distributed energy storage systems with smart microgrids.
- Policy frameworks to incentivize ecological architecture in high-density urban areas.

The summit concluded with a joint declaration outlining a collaborative research framework between leading global universities and industrial sponsors to accelerate the deployment of clean technologies in developing economies.`,
      metadata: { category: "news" },
    },
    {
      title: "New Advanced Robotics Lab Inaugurated by Tech Council",
      slug: "news-advanced-robotics-lab-inauguration",
      content: `---
image: https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=600
imageAlt: Robotics Lab
rows:
  - label: Category
    value: News
    type: text
---

# New Advanced Robotics Lab Inaugurated by Tech Council

The Technical Council of IIT Gandhinagar, in collaboration with national industrial research partners, has officially inaugurated the Advanced Robotics and Autonomous Systems Laboratory. Designed to support undergraduate and postgraduate research, the new facility is equipped with state-of-the-art quadrotors, autonomous ground vehicles, and robotic manipulators.

The lab aims to serve as a hub for multi-disciplinary projects across mechanical, electrical, and computer science engineering. Initial research themes planned for the upcoming academic semester include:
1. Decentralized swarm algorithms for disaster search-and-rescue operations.
2. Machine vision systems for precision agricultural drones.
3. Adaptive control structures for heavy robotic arms operating in dynamic environments.

Students will have round-the-clock access to the workspace, enabling them to work on competitive national robotics competitions and publish high-impact journal papers.`,
      metadata: { category: "news" },
    },
    {
      title: "Inter-IIT Sports Camp Kicks Off with High Enthusiasm",
      slug: "news-inter-iit-sports-camp-kicks-off",
      content: `---
image: https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=600
imageAlt: Sports Camp
rows:
  - label: Category
    value: News
    type: text
---

# Inter-IIT Sports Camp Kicks Off with High Enthusiasm

The winter training camp for the IIT Gandhinagar sports contingent has officially begun at the campus sports complex. Running for the next three weeks, the intensive preparation camp focuses on athletic conditioning, strategy planning, and mental toughness ahead of the upcoming Inter-IIT Sports Meet.

Over 150 student-athletes across 12 disciplines—including athletics, basketball, football, tennis, and swimming—are participating in double-session daily practices. Head coaches highlighted the importance of this camp:
- High-intensity morning drills focused on stamina and physical conditioning.
- Tactical evening sessions analyzing gameplay footage and opponent formations.
- Integration of recovery protocols including ice baths, physiotherapist consultations, and yoga.

The campus community is encouraged to attend the practice matches scheduled for the weekends to support our athletes.`,
      metadata: { category: "news" },
    }
  ];

  for (const item of newsItems) {
    await prisma.live_pages.upsert({
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
    console.log(`Upserted long page: ${item.slug}`);
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
