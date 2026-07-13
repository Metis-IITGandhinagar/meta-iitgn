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
    const { name, description, icon, color } = req.body;
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
        icon: icon || "BookOpen",
        color: color || "blue",
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
    const { name, description, is_pinned, icon, color } = req.body;

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

    if (is_pinned !== undefined) {
      data.is_pinned = is_pinned;
    }

    if (icon !== undefined) {
      data.icon = icon;
    }

    if (color !== undefined) {
      data.color = color;
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

function parsePageContent(content: string | null) {
  if (!content) return { category: "", description: "" };
  let category = "";
  let description = "";

  if (content.startsWith("---")) {
    const parts = content.split("---");
    if (parts.length >= 3) {
      const frontmatter = parts[1];
      const lines = frontmatter.split("\n");
      for (let line of lines) {
        line = line.trim();
        if (line.startsWith("description:")) {
          description = line.replace("description:", "").trim();
        } else if (line.startsWith("category:")) {
          category = line.replace("category:", "").trim();
        }
      }
    }
  }
  return { category, description };
}

const normalizeCategoryToSlug = (value: string): string => {
  const normalized = value.toLowerCase().trim();
  if (normalized === "campus facilities" || normalized === "facilities") return "facilities";
  if (normalized === "faculty profiles" || normalized === "faculty") return "faculty";
  if (normalized === "courses info" || normalized === "courses") return "courses";
  if (normalized === "research labs" || normalized === "research") return "research";
  if (normalized === "hostels guide" || normalized === "hostels") return "hostels";
  if (normalized === "student clubs" || normalized === "clubs") return "clubs";
  if (normalized === "institute fests" || normalized === "fests") return "fests";
  if (normalized === "placement stats" || normalized === "placements") return "placements";
  if (normalized === "institute policies" || normalized === "policies") return "policies";
  if (normalized === "academic calendar" || normalized === "calendar") return "calendar";
  return normalized;
};

export const getCategoryArticles = async (req: Request, res: Response) => {
  try {
    const categorySlug = (req.params.slug as string).toLowerCase().trim();
    const pageNum = parseInt(req.query.page as string, 10) || 1;
    const limitNum = parseInt(req.query.limit as string, 10) || 6;
    const skip = (pageNum - 1) * limitNum;

    // Fetch pages containing potential category tags
    const pages = await prisma.live_pages.findMany({
      where: { deleted_at: null },
      select: {
        page_id: true,
        title: true,
        slug: true,
        metadata: true,
        content: true,
        created_at: true,
        updated_at: true
      }
    });

    const matchedPages = pages.filter((page: any) => {
      const meta = (page.metadata as any) || {};
      let pageCategory = meta.category ? normalizeCategoryToSlug(meta.category) : "";

      if (!pageCategory) {
        const parsed = parsePageContent(page.content);
        if (parsed.category) {
          pageCategory = normalizeCategoryToSlug(parsed.category);
        }
      }

      if (pageCategory === categorySlug) return true;

      const title = (page.title || "").toLowerCase();
      const slug = (page.slug || "").toLowerCase();

      if (pageCategory === "academics") {
        if (categorySlug === "faculty") {
          return title.startsWith("prof.") || slug.includes("prof") || slug.includes("faculty");
        }
        if (categorySlug === "courses") {
          return (
            /^[a-z]{2,3}\s*\d{3}/i.test(title) ||
            /^[a-z]{2,3}-\d{3}/i.test(slug) ||
            title.includes(":")
          );
        }
        if (categorySlug === "departments") {
          return (
            !title.startsWith("prof.") &&
            !slug.includes("prof") &&
            !slug.includes("faculty") &&
            !/^[a-z]{2,3}\s*\d{3}/i.test(title) &&
            !/^[a-z]{2,3}-\d{3}/i.test(slug) &&
            !title.includes(":")
          );
        }
      }

      if (pageCategory === "campus") {
        if (categorySlug === "hostels") {
          return title.includes("hostel") || slug.includes("hostel");
        }
        if (categorySlug === "facilities") {
          return !title.includes("hostel") && !slug.includes("hostel");
        }
      }

      if (pageCategory === "policies") {
        if (categorySlug === "calendar") {
          return title.includes("calendar") || title.includes("date") || slug.includes("calendar") || slug.includes("date");
        }
        if (categorySlug === "placements") {
          return title.includes("placement") || slug.includes("placement");
        }
        if (categorySlug === "policies") {
          return (
            !title.includes("calendar") && !title.includes("date") && !slug.includes("calendar") && !slug.includes("date") &&
            !title.includes("placement") && !slug.includes("placement")
          );
        }
      }

      if (!pageCategory) {
        if (categorySlug === "faculty") {
          return title.startsWith("prof.") || slug.includes("prof") || slug.includes("faculty");
        }
        if (categorySlug === "courses") {
          return (
            /^[a-z]{2,3}\s*\d{3}/i.test(title) ||
            /^[a-z]{2,3}-\d{3}/i.test(slug) ||
            title.includes(":")
          );
        }
        if (categorySlug === "hostels") {
          return title.includes("hostel") || slug.includes("hostel");
        }
        if (categorySlug === "facilities") {
          return slug.includes("sports") || slug.includes("complex") || slug.includes("shop") || slug.includes("canteen") || slug.includes("center") || slug.includes("facility");
        }
        if (categorySlug === "clubs") {
          return slug.includes("club") || title.includes("club");
        }
        if (categorySlug === "fests") {
          return slug.includes("fest") || title.includes("fest") || slug.includes("amalthea") || slug.includes("blith");
        }
        if (categorySlug === "research") {
          return slug.includes("research") || slug.includes("lab") || title.includes("laboratory");
        }
        if (categorySlug === "calendar") {
          return title.includes("calendar") || title.includes("date") || slug.includes("calendar") || slug.includes("date");
        }
        if (categorySlug === "placements") {
          return title.includes("placement") || slug.includes("placement");
        }
        if (categorySlug === "departments") {
          return (
            !title.startsWith("prof.") &&
            !slug.includes("prof") &&
            !slug.includes("faculty") &&
            !/^[a-z]{2,3}\s*\d{3}/i.test(title) &&
            !/^[a-z]{2,3}-\d{3}/i.test(slug) &&
            !title.includes(":") &&
            (slug.includes("department") || slug.includes("engineering") || title.includes("engineering"))
          );
        }
      }

      return false;
    });

    matchedPages.sort((a, b) => (a.title || "").localeCompare(b.title || ""));

    const totalMatched = matchedPages.length;
    const paginatedPages = matchedPages.slice(skip, skip + limitNum);

    const results = paginatedPages.map((page: any) => {
      const meta = (page.metadata as any) || {};
      let description = meta.description || "";
      if (!description) {
        const parsed = parsePageContent(page.content);
        description = parsed.description;
      }
      if (!description && page.content) {
        const clean = page.content.replace(/^---[\s\S]*?---/, "").trim();
        description = clean.length > 150 ? clean.substring(0, 150) + "..." : clean;
      }

      return {
        page_id: page.page_id,
        slug: page.slug,
        title: page.title || "Untitled",
        description: description || ""
      };
    });

    return res.json({
      articles: results,
      total: totalMatched,
      page: pageNum,
      limit: limitNum,
      hasMore: skip + limitNum < totalMatched
    });
  } catch (error: any) {
    console.error("Error in getCategoryArticles:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
};
