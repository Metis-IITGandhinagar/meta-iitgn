import { PageMessage, pagePrimaryAction } from "@/components/helpers/PageMessage";
import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { apiService } from "@/api";
import NewsDetailClient from "./NewsDetailClient";

export const dynamic = "force-dynamic";

interface NewsPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: NewsPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const newsItem = await apiService.getNewsBySlug(slug);
    if (newsItem) {
      return {
        title: `${newsItem.title} - Campus News | Meta IITGN`,
        description: newsItem.description || newsItem.content.substring(0, 160),
      };
    }
  } catch {
    // Ignore error
  }
  return {
    title: "News Article | Meta IITGN",
    description: "Read the latest news from IIT Gandhinagar.",
  };
}

export default async function NewsDetailPage({ params }: NewsPageProps) {
  const { slug } = await params;
  
  let newsItem = null;
  try {
    newsItem = await apiService.getNewsBySlug(slug);
  } catch (err) {
    console.error("Error fetching news item server-side:", err);
  }

  if (!newsItem) {
    return (
      <main className="flex-1 mt-16 overflow-y-auto bg-base-100">
        <PageMessage
          eyebrow="Campus news"
          title="This story isn't here."
          actions={
            <Link href="/" className={pagePrimaryAction}>
              <ChevronLeft className="h-4 w-4" aria-hidden /> Back to home
            </Link>
          }
        >
          It may have been moved or deleted.
        </PageMessage>
      </main>
    );
  }

  return <NewsDetailClient initialNewsItem={newsItem} />;
}
