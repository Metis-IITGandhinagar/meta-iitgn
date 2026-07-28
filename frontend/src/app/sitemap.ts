import { MetadataRoute } from "next";
import { apiService } from "@/api";

const BASE_URL = "https://meta.metis-iitgn.tech";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = [];

  try {
    const allPages = await apiService.getPagesList();

    pages.push(
      ...allPages.map((page) => ({
        url: `${BASE_URL}/wiki/page/${page.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }))
    );
  } catch (err) {
    console.error("Failed generating sitemap", err);
  }

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },

    {
      url: `${BASE_URL}/news`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },

    {
      url: `${BASE_URL}/wiki`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },

    {
      url: `${BASE_URL}/blogs`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },

    ...pages,
  ];
}