import { MetadataRoute } from "next";
import { apiService } from "@/api";

const BASE_URL = "https://meta.metis-iitgn.tech";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sitemapEntries: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/paper`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/calender`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/interviews`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  // 1. Fetch and add Wiki Pages
  try {
    const allPages = await apiService.getPagesList();
    if (allPages && Array.isArray(allPages)) {
      allPages.forEach((page) => {
        const category = page.category || "page";
        sitemapEntries.push({
          url: `${BASE_URL}/wiki/${category}/${page.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      });
    }
  } catch (err) {
    console.error("Failed fetching wiki pages for sitemap:", err);
  }

  // 2. Fetch and add Blog Posts
  try {
    const blogsResponse = await apiService.getBlogs({ limit: 100 });
    if (blogsResponse && blogsResponse.success && Array.isArray(blogsResponse.blogs)) {
      blogsResponse.blogs.forEach((blog: any) => {
        sitemapEntries.push({
          url: `${BASE_URL}/blog/${blog.slug}`,
          lastModified: new Date(blog.created_at),
          changeFrequency: "monthly",
          priority: 0.6,
        });
      });
    }
  } catch (err) {
    console.error("Failed fetching blogs for sitemap:", err);
  }

  return sitemapEntries;
}