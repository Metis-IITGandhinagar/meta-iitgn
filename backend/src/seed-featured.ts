import { prisma } from './lib/prisma.js';

async function seed() {
  console.log('Seeding featured pages, mess menu, campus transport, events...');

  // Get or create admin user
  let user = await prisma.users.findFirst({ where: { role: 'admin' } });
  if (!user) {
    user = await prisma.users.create({
      data: { name: 'Admin User', email: 'admin@meta-iitgn.edu', role: 'admin' },
    });
  }
  const authorId = user.user_id;

  // ─── 1. Mess Menu Page (Monday–Sunday) ──────────────────────────────────────
  const messMenuContent = `---
image: https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?q=80&w=1200
imageAlt: IITGN Mess Hall
rows:
  - label: Category
    value: mess-menu
    type: text
  - label: Updated
    value: July 2025
    type: text
  - label: Mess
    value: Student Mess, Palaj Campus
    type: text
---

# Weekly Mess Menu

> This page is updated weekly by the mess committee. Last updated for the week of **14 July – 20 July 2025**.

## Monday

**Breakfast** (7:30 AM – 9:00 AM)
- Idli, Sambar, Coconut Chutney
- Bread, Butter, Jam
- Boiled Egg (optional)
- Tea / Coffee / Milk

**Lunch** (12:00 PM – 2:00 PM)
- Rice, Dal Fry, Aloo Gobi
- Chapati (2), Mixed Vegetable Sabzi
- Salad, Papad, Pickle

**Snacks** (5:00 PM – 6:00 PM)
- Samosa, Green Chutney
- Tea / Coffee

**Dinner** (7:30 PM – 9:30 PM)
- Rice, Dal Tadka, Paneer Butter Masala
- Chapati (3), Jeera Aloo
- Sweet: Gulab Jamun

---

## Tuesday

**Breakfast** (7:30 AM – 9:00 AM)
- Poha with Sev
- Bread Omelette / Plain Toast
- Tea / Coffee / Milk

**Lunch** (12:00 PM – 2:00 PM)
- Jeera Rice, Rajma Masala
- Chapati (2), Bhindi Fry
- Salad, Papad, Curd

**Snacks** (5:00 PM – 6:00 PM)
- Bread Pakora, Ketchup
- Tea / Coffee

**Dinner** (7:30 PM – 9:30 PM)
- Rice, Chana Dal, Kadai Paneer
- Chapati (3), Seasonal Vegetable
- Sweet: Kheer

---

## Wednesday

**Breakfast** (7:30 AM – 9:00 AM)
- Upma, Coconut Chutney
- Boiled Egg (optional)
- Tea / Coffee / Milk

**Lunch** (12:00 PM – 2:00 PM)
- Rice, Moong Dal, Dum Aloo
- Chapati (2), Lauki Sabzi
- Salad, Papad

**Snacks** (5:00 PM – 6:00 PM)
- Maggi / Noodles
- Tea / Coffee

**Dinner** (7:30 PM – 9:30 PM)
- Rice, Arhar Dal, Palak Paneer
- Chapati (3), Aloo Matar
- Sweet: Halwa

---

## Thursday

**Breakfast** (7:30 AM – 9:00 AM)
- Dosa, Sambar, Chutney
- Boiled Egg (optional)
- Tea / Coffee / Milk

**Lunch** (12:00 PM – 2:00 PM)
- Veg Biryani, Raita
- Chapati (2), Mixed Dal
- Salad, Papad, Pickle

**Snacks** (5:00 PM – 6:00 PM)
- Pav Bhaji
- Tea / Coffee

**Dinner** (7:30 PM – 9:30 PM)
- Rice, Dal Makhani, Matar Mushroom
- Chapati (3), Seasonal Sabzi
- Sweet: Ice Cream (Friday special)

---

## Friday

**Breakfast** (7:30 AM – 9:00 AM)
- Puri Bhaji
- Bread, Butter
- Tea / Coffee / Milk

**Lunch** (12:00 PM – 2:00 PM)
- Rice, Kadhi, Aloo Fry
- Chapati (2), Chana Masala
- Salad, Papad, Pickle

**Snacks** (5:00 PM – 6:00 PM)
- Vada Pav, Green Chutney
- Tea / Coffee

**Dinner** (7:30 PM – 9:30 PM)
- Rice, Chole Masala, Paneer Do Pyaza
- Chapati (3), Baingan Bharta
- Sweet: Rasmalai (special Friday dessert)

---

## Saturday

**Breakfast** (7:30 AM – 9:30 AM)
- Aloo Paratha, Curd, Pickle
- Boiled Egg (optional)
- Tea / Coffee / Milk

**Lunch** (12:00 PM – 2:00 PM)
- Pulao, Mixed Veg Curry
- Chapati (2), Paneer Bhurji
- Salad, Raita, Papad

**Snacks** (5:00 PM – 6:00 PM)
- Dhokla, Green Chutney
- Tea / Coffee

**Dinner** (7:30 PM – 9:30 PM)
- Rice, Dal Fry, Shahi Paneer
- Chapati (3), Jeera Aloo
- Sweet: Jalebi

---

## Sunday

**Breakfast** (8:00 AM – 10:00 AM)
- Chole Bhature / Poori
- Boiled Egg (optional)
- Tea / Coffee / Milk / Juice

**Lunch** (12:00 PM – 2:30 PM)
- Special Sunday Lunch: Veg Biryani / Pulao
- Kadai Paneer / Chole, Dal Makhani
- Raita, Salad, Papad, Pickle, Pickle
- Sweet: Gajar Halwa / Seviyan

**Snacks** (5:00 PM – 6:00 PM)
- Chaat / Bhel Puri
- Tea / Coffee

**Dinner** (7:30 PM – 9:30 PM)
- Rice, Dal Tadka, Palak Aloo
- Chapati (3), Seasonal Sabzi
- Sweet: Fruit Custard
`;

  const messMenuPage = await prisma.live_pages.upsert({
    where: { slug: 'mess-menu' },
    update: { title: 'Weekly Mess Menu', content: messMenuContent, metadata: { category: 'mess-menu', description: 'Weekly student mess schedule for IIT Gandhinagar' } },
    create: { title: 'Weekly Mess Menu', slug: 'mess-menu', content: messMenuContent, metadata: { category: 'mess-menu', description: 'Weekly student mess schedule for IIT Gandhinagar' }, original_author_id: authorId, version: 1 },
  });
  console.log(`Upserted mess menu page: ${messMenuPage.slug}`);

  // ─── 2. Campus Transport Page ───────────────────────────────────────────────
  const transportContent = `---
image: https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1200
imageAlt: Campus Transport
rows:
  - label: Category
    value: campus-transport
    type: text
  - label: Operated by
    value: IITGN Welfare Council
    type: text
  - label: Contact
    value: transport@iitgn.ac.in
    type: text
---

# Campus Transport

> All schedules are indicative. Check notice boards and the official portal for real-time updates.

## 29-Seater Non-AC Bus
> JEET Royal Hostel Accommodation · Highway Turning near JEET Gate-1

**Morning** (7:45 am – 11:15 am)
- 7:45 am · JEET Royal Hotel Apt. → U-Corridor Circle
- 9:15 am · JEET Royal Hotel Apt. → U-Corridor Circle
- 9:45 am · JEET Royal Hotel Apt. → U-Corridor Circle
- 10:15 am · JEET Royal Hotel Apt. → U-Corridor Circle
- 10:45 am · JEET Royal Hotel Apt. → U-Corridor Circle
- 11:15 am · JEET Royal Hotel Apt. → U-Corridor Circle

**Afternoon & Evening** (1:00 pm – 7:15 pm)
- 1:00 pm · U-Corridor Circle → JEET Royal Hotel Apt.
- 1:30 pm · U-Corridor Circle → JEET Royal Hotel Apt.
- 2:00 pm · U-Corridor Circle → JEET Royal Hotel Apt.
- 5:00 pm · U-Corridor Circle → JEET Royal Hotel Apt.
- 5:30 pm · U-Corridor Circle → JEET Royal Hotel Apt.
- 6:00 pm · U-Corridor Circle → JEET Royal Hotel Apt.
- 6:30 pm · U-Corridor Circle → JEET Royal Hotel Apt.
- 7:00 pm · U-Corridor Circle → JEET Royal Hotel Apt.

**Late Evening** (8:45 pm – 1:15 am)
- 9:00 pm · U-Corridor Circle → JEET Royal Hotel Apt.
- 9:30 pm · U-Corridor Circle → JEET Royal Hotel Apt.
- 10:00 pm · U-Corridor Circle → JEET Royal Hotel Apt.
- 10:30 pm · U-Corridor Circle → JEET Royal Hotel Apt.
- 11:00 pm · U-Corridor Circle → JEET Royal Hotel Apt.
- 11:30 pm · U-Corridor Circle → JEET Royal Hotel Apt.
- 12:00 am · U-Corridor Circle → JEET Royal Hotel Apt.
- 12:30 am · U-Corridor Circle → JEET Royal Hotel Apt.
- 1:00 am · U-Corridor Circle → JEET Royal Hotel Apt.

## 56-Seater Bus
> Institute Bus Schedule

**Schedule**
- 7:00 AM · Palaj → Kudasan · Via: IITGN Mess Parking - Rakshashakti Circle - Kudasan
- 7:30 AM · Kudasan → Palaj · Via: Kudasan - Rakshashakti Circle - IITGN Mess Parking
- 8:30 AM · Palaj → Kudasan · Via: IITGN Mess Parking - Rakshashakti Circle - Kudasan
- 9:00 AM · Kudasan → Palaj · Via: Kudasan - Rakshashakti Circle - IITGN Mess Parking
- 9:30 AM · Palaj → Kudasan · Via: IITGN Mess Parking - Rakshashakti Circle - Kudasan
- 10:00 AM · Kudasan → Palaj · Via: Kudasan - Rakshashakti Circle - IITGN Mess Parking
- 4:30 PM · Palaj → Kudasan · Via: IITGN Mess Parking - Rakshashakti Circle - Kudasan
- 5:00 PM · Kudasan → Palaj · Via: Kudasan - Rakshashakti Circle - IITGN Mess Parking
- 5:45 PM · Palaj → Kudasan · Via: IITGN Mess Parking - Rakshashakti Circle - Kudasan
- 6:15 PM · Kudasan → Palaj · Via: Kudasan - Rakshashakti Circle - IITGN Mess Parking
- 6:45 PM · Palaj → Kudasan · Via: IITGN Mess Parking - Rakshashakti Circle - Kudasan
- 7:15 PM · Kudasan → Palaj · Via: Kudasan - Rakshashakti Circle - IITGN Mess Parking
- 7:45 PM · Palaj → Kudasan · Via: IITGN Mess Parking - Rakshashakti Circle - Kudasan
- 8:15 PM · Kudasan → Palaj · Via: Kudasan - Rakshashakti Circle - IITGN Mess Parking
- 9:30 PM · Palaj → Kudasan · Via: IITGN Mess Parking - Rakshashakti Circle - Kudasan
- 10:30 PM · Kudasan → Palaj · Via: Kudasan - Rakshashakti Circle - IITGN Mess Parking

## 29-Seater Bus
> Institute Bus Schedule

**Schedule**
- 6:30 PM · Palaj → Kudasan · Via: IITGN Mess Parking - Rakshashakti Circle - Kudasan
- 7:00 PM · Kudasan → Palaj · Via: Kudasan - Rakshashakti Circle - IITGN Mess Parking
- 7:30 PM · Palaj → Kudasan · Via: IITGN Mess Parking - Rakshashakti Circle - Kudasan
- 8:00 PM · Kudasan → Palaj · Via: Kudasan - Rakshashakti Circle - IITGN Mess Parking
- 8:30 PM · Palaj → Kudasan · Via: IITGN Mess Parking - Rakshashakti Circle - Kudasan
- 10:30 PM · Kudasan → Palaj · Via: Kudasan - Rakshashakti Circle - IITGN Mess Parking
`;

  const transportPage = await prisma.live_pages.upsert({
    where: { slug: 'campus-transport' },
    update: { title: 'Campus Transport', content: transportContent, metadata: { category: 'campus-transport', description: 'Bus routes, shuttle timings, and transport info for IIT Gandhinagar' } },
    create: { title: 'Campus Transport', slug: 'campus-transport', content: transportContent, metadata: { category: 'campus-transport', description: 'Bus routes, shuttle timings, and transport info for IIT Gandhinagar' }, original_author_id: authorId, version: 1 },
  });
  console.log(`Upserted campus transport page: ${transportPage.slug}`);

  // ─── 3. Upcoming Events Page ────────────────────────────────────────────────
  const eventsContent = `---
image: https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200
imageAlt: Campus Events
rows:
  - label: Category
    value: events
    type: text
  - label: Maintained by
    value: Student Affairs Office
    type: text
---

# Upcoming Events

> This page is maintained by the Student Affairs Office. Submit your event to studentaffairs@iitgn.ac.in to get it listed.

## Weekly Tech Talk

**Date:** Every Thursday
**Time:** 6:30 PM – 8:00 PM
**Location:** Lecture Hall Complex (LH-1)
**Tags:** \`Academic\` \`Tech\` \`Open to all\`

A student-led talk series where speakers from academia and industry discuss cutting-edge research and engineering topics. Open to all students, faculty, and staff.

---

## Freshers' Cultural Night

**Date:** July 20, 2025
**Time:** 7:00 PM onwards
**Location:** Open Amphitheater
**Tags:** \`Cultural\` \`Social\` \`Music\`

Welcome the new batch with live performances, cultural acts, and campus food stalls. Organized by the Student Cultural Council.

---

## Hackathon: Code & Build

**Date:** July 26–27, 2025
**Time:** Starts 10:00 AM July 26
**Location:** Computer Science Building (Lab 301 & 302)
**Tags:** \`Hackathon\` \`Tech\` \`Prizes\`

A 24-hour hackathon organized by the Coding Club. Build projects on any theme — AI, sustainability, campus tech. Prizes worth ₹30,000. Register via the Coding Club portal.

---

## Library Extended Hours (Exam Prep)

**Date:** July 28 – August 10, 2025
**Time:** Open till Midnight (normal close is 10 PM)
**Location:** Central Library
**Tags:** \`Academic\` \`Exams\`

The library will remain open until midnight during end-semester prep period. Group study rooms are bookable via the library portal.

---

## Amalthea 2025 Registration Opens

**Date:** August 1, 2025
**Time:** 12:00 PM
**Location:** amalthea.iitgn.ac.in
**Tags:** \`Fest\` \`Technical\` \`National\`

Online registrations for Amalthea 2025 — IITGN's annual technical fest — open on August 1. Competitions include robotics, paper presentations, coding contests, and a startup pitch.

---

## Convocation 2025

**Date:** September 15, 2025
**Time:** 9:00 AM
**Location:** Convocation Hall, Palaj Campus
**Tags:** \`Convocation\` \`Graduation\` \`Formal\`

The annual convocation ceremony for graduating students. Attendance is mandatory for graduating students. Guests must register in advance through the official convocation portal.
`;

  const eventsPage = await prisma.live_pages.upsert({
    where: { slug: 'upcoming-events' },
    update: { title: 'Upcoming Events', content: eventsContent, metadata: { category: 'events', description: 'Upcoming campus events, talks, fests, and academic activities at IIT Gandhinagar' } },
    create: { title: 'Upcoming Events', slug: 'upcoming-events', content: eventsContent, metadata: { category: 'events', description: 'Upcoming campus events, talks, fests, and academic activities at IIT Gandhinagar' }, original_author_id: authorId, version: 1 },
  });
  console.log(`Upserted upcoming events page: ${eventsPage.slug}`);

  // ─── 4. Seed Events table ───────────────────────────────────────────────────
  const eventsData = [
    {
      title: 'Weekly Tech Talk',
      slug: 'event-weekly-tech-talk',
      description: 'Student-led talk series covering cutting-edge research and engineering topics. Open to all.',
      location: 'Lecture Hall Complex (LH-1)',
      event_date: new Date('2025-07-17T13:00:00Z'), // Thursday 6:30 PM IST
      is_recurring: true,
      recur_day: 'Thursday',
      recur_time: '6:30 PM',
    },
    {
      title: "Freshers' Cultural Night",
      slug: 'event-freshers-cultural-night',
      description: 'Welcome the new batch with live performances, cultural acts, and campus food stalls.',
      location: 'Open Amphitheater',
      event_date: new Date('2025-07-20T13:30:00Z'), // 7 PM IST
      is_recurring: false,
    },
    {
      title: 'Hackathon: Code & Build',
      slug: 'event-hackathon-code-build',
      description: '24-hour hackathon organized by the Coding Club. Build projects on any theme. Prizes worth ₹30,000.',
      location: 'CS Building, Lab 301 & 302',
      event_date: new Date('2025-07-26T04:30:00Z'), // 10 AM IST
      is_recurring: false,
    },
    {
      title: 'Library Extended Hours',
      slug: 'event-library-extended',
      description: 'Library open till midnight during end-semester exam prep period (July 28 – August 10).',
      location: 'Central Library',
      event_date: new Date('2025-07-28T00:00:00Z'),
      is_recurring: false,
    },
    {
      title: 'Amalthea 2025 Registration Opens',
      slug: 'event-amalthea-2025',
      description: "Online registrations for Amalthea 2025 — IITGN's annual technical fest — open Aug 1.",
      location: 'amalthea.iitgn.ac.in',
      event_date: new Date('2025-08-01T06:30:00Z'), // 12 PM IST
      is_recurring: false,
    },
    {
      title: 'Convocation 2025',
      slug: 'event-convocation-2025',
      description: 'Annual convocation ceremony for graduating students. Guests must register in advance.',
      location: 'Convocation Hall, Palaj Campus',
      event_date: new Date('2025-09-15T03:30:00Z'), // 9 AM IST
      is_recurring: false,
    },
  ];

  for (const ev of eventsData) {
    await prisma.events.upsert({
      where: { slug: ev.slug },
      update: ev,
      create: ev,
    });
    console.log(`Upserted event: ${ev.title}`);
  }

  // ─── 5. Seed Featured Pages ─────────────────────────────────────────────────
  // Find pages to feature (use existing pages or the ones we just created)
  const campusPage = await prisma.live_pages.findFirst({ where: { slug: 'campuses-and-surroundings' } });
  const hostelsPage = await prisma.live_pages.findFirst({ where: { slug: { contains: 'hostel' } } });
  const facilitiesPage = await prisma.live_pages.findFirst({ where: { slug: { contains: 'facilit' } } });

  const featuredItems = [
    campusPage && {
      page_id: campusPage.page_id,
      order: 0,
      tag: 'Featured Story',
      location: 'Palaj Campus',
      description: 'Explore the climate-responsive architecture, green corridors, and thoughtfully designed spaces that define IITGN.',
    },
    hostelsPage && {
      page_id: hostelsPage.page_id,
      order: 1,
      tag: 'Campus Life',
      location: 'Student Experience',
      description: 'From clubs and fests to everyday routines, discover the community stories that make the campus feel alive.',
    },
    facilitiesPage && {
      page_id: facilitiesPage.page_id,
      order: 2,
      tag: 'Quick Guide',
      location: 'Facilities',
      description: 'A concise guide to transport, mess, labs, and the places students use most often on campus.',
    },
    // Fall back to first available pages if specifics not found
  ].filter(Boolean) as { page_id: number; order: number; tag: string; location: string; description: string }[];

  // If we didn't find enough featured pages, grab the first few live pages
  if (featuredItems.length < 3) {
    const anyPages = await prisma.live_pages.findMany({ where: { deleted_at: null }, take: 3, orderBy: { view_count: 'desc' } });
    for (const pg of anyPages) {
      if (!featuredItems.find(f => f.page_id === pg.page_id)) {
        featuredItems.push({
          page_id: pg.page_id,
          order: featuredItems.length,
          tag: 'Featured',
          location: 'Campus',
          description: (pg.metadata as any)?.description || 'An interesting article from the META IITGN wiki.',
        });
        if (featuredItems.length >= 3) break;
      }
    }
  }

  for (const feat of featuredItems) {
    const existing = await prisma.featured_pages.findFirst({
      where: { page_id: feat.page_id }
    });
    if (existing) {
      await prisma.featured_pages.update({
        where: { featured_id: existing.featured_id },
        data: feat,
      });
    } else {
      await prisma.featured_pages.create({
        data: feat,
      });
    }
    console.log(`Upserted featured page: ${feat.page_id}`);
  }

  // ─── 6. Seed view counts for popular pages demo ─────────────────────────────
  const pagesToBump = await prisma.live_pages.findMany({ where: { deleted_at: null }, take: 10, orderBy: { created_at: 'asc' } });
  const viewCounts = [320, 280, 215, 190, 165, 145, 120, 98, 75, 60];
  for (let i = 0; i < pagesToBump.length; i++) {
    await prisma.live_pages.update({
      where: { page_id: pagesToBump[i].page_id },
      data: { view_count: viewCounts[i] || 50 },
    });
  }
  console.log('Bumped view counts for popular pages.');

  console.log('All seeding completed successfully!');
}

seed()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
