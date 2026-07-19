import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const WEEK_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface MessMeal {
  name: string;
  time?: string;
  items: string[];
}

interface MessDay {
  day: string;
  meals: MessMeal[];
}

interface TransportTrip {
  time: string;
  from: string;
  to?: string;
  via?: string;
}

interface TransportBus {
  name: string;
  note?: string;
  trips: TransportTrip[];
}

function parseWeeklyMessMenu(markdown: string): MessDay[] {
  const lines = markdown.split("\n");
  const days: MessDay[] = [];
  let currentDay: MessDay | null = null;
  let currentMeal: MessMeal | null = null;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      const dayName = line.replace("##", "").trim();
      if (WEEK_DAYS.includes(dayName)) {
        currentDay = { day: dayName, meals: [] };
        days.push(currentDay);
        currentMeal = null;
      }
      continue;
    }
    if (!currentDay) continue;

    const mealMatch = line.match(/^\*\*(.+?)\*\*(?:\s*\((.+?)\))?/);
    if (mealMatch) {
      currentMeal = { name: mealMatch[1].trim(), time: mealMatch[2]?.trim(), items: [] };
      currentDay.meals.push(currentMeal);
      continue;
    }
    if (line.startsWith("-") && currentMeal) {
      currentMeal.items.push(line.replace(/^-\s*/, "").trim());
    }
  }
  return days;
}

function parseTripLine(line: string): TransportTrip | null {
  const text = line.replace(/^-\s*/, "").trim();
  if (!text) return null;

  const [timePart, ...rest] = text.split("·").map((s) => s.trim());
  if (!timePart) return null;

  const routePart = rest.join(" · ");
  let via: string | undefined;
  let arrowPart = routePart;

  const viaMatch = routePart.match(/Via:\s*(.+)$/i);
  if (viaMatch) {
    via = viaMatch[1].trim();
    arrowPart = routePart.replace(/Via:\s*.+$/i, "").replace(/\s*·\s*$/, "").trim();
  }

  const [from, to] = arrowPart.split("→").map((s) => s.trim());
  if (!from) return null;

  return { time: timePart, from, to: to || undefined, via };
}

function parseTransport(markdown: string): TransportBus[] {
  const lines = markdown.split("\n");
  const result: TransportBus[] = [];
  let current: TransportBus | null = null;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      const name = line.replace("##", "").trim();
      current = { name, trips: [] };
      result.push(current);
      continue;
    }
    if (!current) continue;

    if (line.startsWith(">")) {
      const note = line.replace(/^>\s*/, "").trim();
      if (note) current.note = note;
      continue;
    }

    if (/^\*\*[^*]+\*\*\s*(\([^)]*\))?\s*$/.test(line.trim())) continue;

    if (line.startsWith("-")) {
      const trip = parseTripLine(line);
      if (trip) current.trips.push(trip);
    }
  }
  return result;
}

async function main() {
  console.log("Migrating mess menu to new JSON schema...");
  const messPage = await prisma.live_pages.findFirst({
    where: { slug: 'mess-menu', deleted_at: null }
  });
  if (messPage && messPage.content) {
    const days = parseWeeklyMessMenu(messPage.content);
    for (const d of days) {
      await prisma.mess_menu.upsert({
        where: { day: d.day },
        update: { meals: d.meals as any },
        create: { day: d.day, meals: d.meals as any }
      });
    }
    console.log(`Successfully migrated ${days.length} days of weekly mess menu.`);
  } else {
    console.log("No existing mess-menu page found to migrate.");
  }

  console.log("Migrating campus travel schedule to new JSON schema...");
  const transportPage = await prisma.live_pages.findFirst({
    where: { slug: 'campus-transport', deleted_at: null }
  });
  if (transportPage && transportPage.content) {
    const buses = parseTransport(transportPage.content);
    await prisma.travel_schedule.deleteMany({});
    await prisma.travel_schedule.createMany({
      data: buses.map(b => ({
        type: 'bus',
        route: b.name,
        schedule: b.trips as any
      }))
    });
    console.log(`Successfully migrated ${buses.length} travel routes.`);
  } else {
    console.log("No existing campus-transport page found to migrate.");
  }
}

main()
  .catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
