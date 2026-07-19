import type { Metadata } from "next";
import WikiClient from "../../../wiki-client";
import MessMenuClient from "../../../mess-menu-client";
import TransportClient from "../../../transport-client";
import Link from "next/link";
import { apiService } from "@/api";
import { parseMarkdown } from "@/lib/utils";

// Wiki modals reflect state in the URL (useSearchParams); keep this dynamic.
export const dynamic = "force-dynamic";

interface ArticlePageProps {
  params: Promise<{
    category: string;
    slug: string;
  }>;
  searchParams: Promise<{
    title?: string;
    edit?: string;
  }>;
}

// Fallback: turn a slug into a readable name (e.g. "hostel-5" -> "Hostel 5").
function slugToTitle(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export async function generateMetadata({ params, searchParams }: ArticlePageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const { title } = await searchParams;
  const displayCategory = category.charAt(0).toUpperCase() + category.slice(1);

  if (slug === "new") {
    return { title: `New ${displayCategory} Article | META IITGN` };
  }

  let name = title?.trim() || slugToTitle(slug);
  try {
    const dbArticle = await apiService.getPage(slug);
    if (dbArticle?.content) {
      const parsedTitle = parseMarkdown(dbArticle.content).title?.trim();
      if (parsedTitle) name = parsedTitle;
    }
  } catch {
    // Fall back to the slug-derived name.
  }

  return {
    title: `${name} | META IITGN`,
    description: `${name} — ${displayCategory} on the IIT Gandhinagar campus wiki.`,
  };
}

export default async function ArticlePage({ params, searchParams }: ArticlePageProps) {
  const { category, slug } = await params;
  const { title, edit } = await searchParams;

  if (slug === "new") {
    const displayCategoryName = category.charAt(0).toUpperCase() + category.slice(1);
    const displayTitle = title ? title : "Untitled Article";
    const template = `---
image:
imageAlt:
rows:
  - label: Category
    value: ${displayCategoryName}
    type: text
  - label: Status
    value: Draft
    type: text
---

# ${displayTitle}

Write your content here...`;

    return <WikiClient initialMarkdown={template} defaultEditing={true} categorySlug={category} />;
  }

  let articleContent: string | undefined = undefined;
  let dbPageId: number | undefined = undefined;
  let version: number | undefined = undefined;
  let initialMetadata: any = undefined;
  let updatedAt: string | undefined = undefined;
  let updatedByName: string | null = null;
  let contributors: any = undefined;

  try {
    const dbArticle = await apiService.getPage(slug);
    if (dbArticle) {
      articleContent = dbArticle.content;
      dbPageId = dbArticle.page_id;
      version = dbArticle.version;
      initialMetadata = dbArticle.metadata;
      updatedAt = dbArticle.updated_at;
      updatedByName = dbArticle.updater?.name ?? null;
      contributors = dbArticle.contributors;

      // Count a view for genuine article reads (skip edit mode / non-DB pages).
      if (dbPageId && edit !== "true") {
        await apiService.incrementPageViewCount(slug);
      }
    }
  } catch (e) {
    console.warn("Could not find article in db:", slug, e);
  }

  if (!articleContent) {
    return (
      <main className="flex-1 p-6 md:p-8 lg:p-12 bg-base-100">
        <div className="max-w-4xl mx-auto text-center py-20">
          <h1 className="text-3xl font-bold text-gray-800">Article Not Found</h1>
          <p className="text-gray-500 mt-2">The requested article could not be found.</p>
          <Link
            href={`/wiki/${category}/new?title=${encodeURIComponent(slug.replace(/-/g, ' '))}`}
            className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-content rounded-lg text-sm font-semibold transition-colors"
          >
            Create this article
          </Link>
        </div>
      </main>
    );
  }

  if (slug === "mess-menu") {
    return <MessMenuClient defaultEditing={edit === "true"} />;
  }

  if (slug === "campus-transport") {
    return <TransportClient defaultEditing={edit === "true"} />;
  }

  return (
    <WikiClient
      initialMarkdown={articleContent}
      dbPageId={dbPageId}
      version={version}
      categorySlug={category}
      initialMetadata={initialMetadata}
      updatedAt={updatedAt}
      updatedByName={updatedByName}
      contributors={contributors}
      defaultEditing={edit === "true"}
    />
  );
}
