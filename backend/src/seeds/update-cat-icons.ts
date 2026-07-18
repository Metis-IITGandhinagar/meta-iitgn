import { prisma } from "../lib/prisma.js";

async function main() {
  const mapping: Record<string, string> = {
    departments: "Building2",
    faculty: "Users2",
    courses: "BookOpen",
    clubs: "Trophy",
    hostels: "Tent",
    facilities: "MapPin",
    research: "FlaskConical",
    fests: "Sparkles",
    "academic-info": "Calendar",
    policies: "Shield",
    placements: "TrendingUp",
  };

  for (const [slug, icon] of Object.entries(mapping)) {
    await prisma.categories.updateMany({
      where: { slug },
      data: { icon }
    });
  }
  console.log("Successfully updated default categories with real icons!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
