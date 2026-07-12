import { prisma } from "./lib/prisma.js";

const DEFAULT_CATEGORIES = [
  { slug: "departments", name: "Departments", description: "Explore the academic departments and engineering disciplines at IIT Gandhinagar." },
  { slug: "faculty", name: "Faculty", description: "Learn about the professors, researchers, and their specialized research labs." },
  { slug: "courses", name: "Courses", description: "Browse course syllabi, prerequisites, grading policies, and recommendations." },
  { slug: "research", name: "Research Labs", description: "Discover center facilities, instrumentation resources, and active projects." },
  { slug: "hostels", name: "Hostels", description: "Everything about hostel capacities, mascots, mess dining, and residential guidelines." },
  { slug: "facilities", name: "Campus Facilities", description: "Details on sports complex, medical center, transport schedules, and shops." },
  { slug: "clubs", name: "Student Clubs", description: "Get involved in technical, cultural, sports, and social clubs." },
  { slug: "fests", name: "Institute Fests", description: "Read about Amalthea, Blithchron, Hallabol, and other annual events." },
  { slug: "calendar", name: "Academic Calendar", description: "Keep track of semesters, mid-sem exams, end-sems, and institute holidays." },
  { slug: "policies", name: "Institute Policies", description: "Read about graduation criteria, leave policies, and code of conduct guidelines." },
  { slug: "placements", name: "Placement Stats", description: "Analyze trends, recruiter information, and sector-wise distribution profiles." }
];

async function main() {
  console.log("Seeding default categories...");
  const count = await prisma.categories.count();
  if (count === 0) {
    await prisma.categories.createMany({
      data: DEFAULT_CATEGORIES
    });
    console.log("Categories successfully seeded!");
  } else {
    console.log("Categories already exist, skipping seed.");
  }
}

main()
  .catch((e) => {
    console.error("Error seeding categories:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
