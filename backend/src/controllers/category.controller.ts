import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

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

export const getCategories = async (req: Request, res: Response) => {
  try {
    // 1. Check if categories table is empty
    let count = await prisma.categories.count();
    if (count === 0) {
      console.log("Seeding default categories...");
      await prisma.categories.createMany({
        data: DEFAULT_CATEGORIES
      });
    }

    // 2. Fetch all categories
    const categories = await prisma.categories.findMany({
      orderBy: { name: "asc" }
    });

    // 3. Count live pages per category dynamically
    const livePages = await prisma.live_pages.findMany({
      where: { deleted_at: null },
      select: { metadata: true }
    });

    const counts: Record<string, number> = {};
    for (const page of livePages) {
      const meta = page.metadata as any;
      const cat = meta?.category;
      if (cat) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    }

    // 4. Map count to results
    const results = categories.map(cat => ({
      ...cat,
      total_articles: counts[cat.slug] || 0
    }));

    return res.json(results);
  } catch (error: any) {
    console.error("Error in getCategories:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name || !description) {
      return res.status(400).json({ error: "Name and description are required" });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!slug) {
      return res.status(400).json({ error: "Invalid category name" });
    }

    // Check conflict
    const existing = await prisma.categories.findUnique({
      where: { slug }
    });

    if (existing) {
      return res.status(400).json({ error: "Category already exists" });
    }

    const category = await prisma.categories.create({
      data: {
        slug,
        name,
        description,
        total_articles: 0
      }
    });

    return res.status(201).json({
      ...category,
      total_articles: 0
    });
  } catch (error: any) {
    console.error("Error in createCategory:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, description } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid category ID" });
    }

    const existing = await prisma.categories.findUnique({
      where: { category_id: id }
    });

    if (!existing) {
      return res.status(404).json({ error: "Category not found" });
    }

    const data: any = {};
    if (description !== undefined) {
      data.description = description;
    }

    if (name !== undefined) {
      data.name = name;
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      
      if (!slug) {
        return res.status(400).json({ error: "Invalid category name" });
      }

      // Check slug conflict with other categories
      const conflict = await prisma.categories.findFirst({
        where: {
          slug,
          NOT: { category_id: id }
        }
      });

      if (conflict) {
        return res.status(400).json({ error: "Category with this name already exists" });
      }

      data.slug = slug;
    }

    const updated = await prisma.categories.update({
      where: { category_id: id },
      data
    });

    // Count live pages for this slug
    const livePages = await prisma.live_pages.findMany({
      where: { deleted_at: null },
      select: { metadata: true }
    });
    let count = 0;
    for (const page of livePages) {
      const meta = page.metadata as any;
      if (meta?.category === updated.slug) {
        count++;
      }
    }

    return res.json({
      ...updated,
      total_articles: count
    });
  } catch (error: any) {
    console.error("Error in updateCategory:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
};
