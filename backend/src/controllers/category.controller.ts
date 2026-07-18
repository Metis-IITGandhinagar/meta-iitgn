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
  { slug: "academic-info", name: "Academic Info", description: "Keep track of semesters, exams, academic guidelines, and institute holidays." },
  { slug: "policies", name: "Institute Policies", description: "Read about graduation criteria, leave policies, and code of conduct guidelines." },
  { slug: "placements", name: "Placement Stats", description: "Analyze trends, recruiter information, and sector-wise distribution profiles." }
];

let categoriesCache: any[] | null = null;

export const invalidateCategoriesCache = () => {
  categoriesCache = null;
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    if (categoriesCache) {
      return res.json(categoriesCache);
    }

    const count = await prisma.categories.count();
    if (count === 0) {
      console.log("Seeding default categories...");
      await prisma.categories.createMany({
        data: DEFAULT_CATEGORIES
      });
    }

    const categories = await prisma.categories.findMany({
      orderBy: { name: "asc" }
    });

    const rawCounts = await prisma.live_pages.groupBy({
      by: ['subcategory'],
      where: { deleted_at: null, subcategory: { not: null } },
      _count: { _all: true }
    });

    const counts: Record<string, number> = {};
    for (const row of rawCounts) {
      if (row.subcategory) {
        counts[row.subcategory] = row._count._all;
      }
    }

    const results = categories.map(cat => ({
      ...cat,
      total_articles: counts[cat.slug] || 0
    }));

    categoriesCache = results;
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

    invalidateCategoriesCache();

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

    invalidateCategoriesCache();

    const count = await prisma.live_pages.count({
      where: { deleted_at: null, subcategory: updated.slug }
    });

    return res.json({
      ...updated,
      total_articles: count
    });
  } catch (error: any) {
    console.error("Error in updateCategory:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
};

export const normalizeCategoryToSlug = (value: string): string => {
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
  if (normalized === "academic calendar" || normalized === "calendar" || normalized === "academic info" || normalized === "academic-info") return "academic-info";
  return normalized;
};

export const extractPageFields = (content: string | null, metadata: any) => {
  let category: string | null = null;
  let subcategory: string | null = null;
  let description: string | null = null;

  if (content && content.startsWith("---")) {
    const parts = content.split("---");
    if (parts.length >= 3) {
      const frontmatter = parts[1];
      const lines = frontmatter.split("\n");
      for (let line of lines) {
        line = line.trim();
        const lowerLine = line.toLowerCase();
        if (lowerLine.startsWith("category:")) {
          category = line.substring("category:".length).trim().toLowerCase() || null;
        } else if (lowerLine.startsWith("subcategory:")) {
          subcategory = line.substring("subcategory:".length).trim().toLowerCase() || null;
        } else if (lowerLine.startsWith("description:")) {
          description = line.substring("description:".length).trim() || null;
        }
      }
    }
  }

  if (!category && metadata?.category) {
    category = String(metadata.category).trim().toLowerCase();
  }
  if (!subcategory && metadata?.subcategory) {
    subcategory = String(metadata.subcategory).trim().toLowerCase();
  }
  if (!description && metadata?.description) {
    description = String(metadata.description);
  }

  if (!description && content) {
    const clean = content.replace(/^---[\s\S]*?---/, "").trim();
    description = clean.length > 150 ? clean.substring(0, 150) + "..." : clean;
  }

  if (category) {
    category = normalizeCategoryToSlug(category);
  }
  if (subcategory) {
    subcategory = normalizeCategoryToSlug(subcategory);
  }

  const SUBCATEGORY_TO_CATEGORY: Record<string, string> = {
    faculty: "academics",
    courses: "academics",
    departments: "academics",
    hostels: "campus",
    facilities: "campus",
    clubs: "student-life",
    fests: "student-life",
    research: "research",
    "academic-info": "policies",
    placements: "policies",
    policies: "policies"
  };

  if (!subcategory && category && SUBCATEGORY_TO_CATEGORY[category]) {
    subcategory = category;
    category = SUBCATEGORY_TO_CATEGORY[subcategory];
  } else if (subcategory && !category) {
    category = SUBCATEGORY_TO_CATEGORY[subcategory] || null;
  } else if (subcategory && category) {
    const alignedParent = SUBCATEGORY_TO_CATEGORY[subcategory];
    if (alignedParent) {
      category = alignedParent;
    }
  }

  return {
    category: category || null,
    subcategory: subcategory || null,
    description: description || null
  };
};

export const getCategoryArticles = async (req: Request, res: Response) => {
  try {
    let categorySlug = (req.params.slug as string).toLowerCase().trim();
    if (categorySlug === "calendar") {
      categorySlug = "academic-info";
    }

    const pageNum = parseInt(req.query.page as string, 10) || 1;
    const limitNum = parseInt(req.query.limit as string, 10) || 6;
    const skip = (pageNum - 1) * limitNum;

    const PARENT_CATEGORIES = ["academics", "campus", "student-life", "research", "policies"];
    const isParent = PARENT_CATEGORIES.includes(categorySlug);

    const filterCondition = isParent
      ? { category: categorySlug }
      : { subcategory: categorySlug };

    const totalMatched = await prisma.live_pages.count({
      where: {
        deleted_at: null,
        ...filterCondition
      }
    });

    const paginatedPages = await prisma.live_pages.findMany({
      where: {
        deleted_at: null,
        ...filterCondition
      },
      select: {
        page_id: true,
        slug: true,
        title: true,
        description: true
      },
      orderBy: {
        title: 'asc'
      },
      skip,
      take: limitNum
    });

    const results = paginatedPages.map((page) => ({
      page_id: page.page_id,
      slug: page.slug,
      title: page.title || "Untitled",
      description: page.description || ""
    }));

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
