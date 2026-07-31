import type { Metadata } from "next";
import { cache } from "react";
import WikiClient from "../../../wiki-client";
import Link from "next/link";
import { apiService } from "@/api";
import { getSeoMetadata, getBreadcrumbSchema } from "@/lib/seo";

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

// Cached loader to prevent double queries between metadata and rendering
const getCachedWikiPage = cache(async (slug: string) => {
  try {
    const dbArticle = await apiService.getPage(slug);
    if (dbArticle) return dbArticle;
  } catch (e) {
    console.warn("Could not find article in db cached loader:", slug, e);
  }
  return null;
});

export async function generateMetadata({ params, searchParams }: ArticlePageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const { title } = await searchParams;
  const displayCategory = category.charAt(0).toUpperCase() + category.slice(1);

  if (slug === "new") {
    return getSeoMetadata({
      title: `New ${displayCategory} Article`,
      description: `Create a new ${displayCategory} article on META IITGN wiki.`,
      path: `/wiki/${category}/new`,
      noIndex: true,
    });
  }

  const dbArticle = await getCachedWikiPage(slug);
  const name = dbArticle?.title || title?.trim() || slugToTitle(slug);
  const description = dbArticle?.description || `${name} — ${displayCategory} information on the IIT Gandhinagar campus wiki.`;

  return getSeoMetadata({
    title: name,
    description,
    path: `/wiki/${category}/${slug}`,
    keywords: [name, displayCategory, "IIT Gandhinagar wiki", "IITGN campus documentation"],
  });
}

export default async function ArticlePage({ params, searchParams }: ArticlePageProps) {
  const { category, slug } = await params;
  const { title, edit } = await searchParams;
  const displayCategory = category.charAt(0).toUpperCase() + category.slice(1);

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

  const dbArticle = await getCachedWikiPage(slug);

  if (!dbArticle) {
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

  const name = dbArticle.title || slugToTitle(slug);
  
  // JSON-LD Structured Data
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": name,
    "description": dbArticle.description || `${name} — wiki page under ${displayCategory}.`,
    "datePublished": dbArticle.created_at || new Date().toISOString(),
    "dateModified": dbArticle.updated_at || dbArticle.created_at || new Date().toISOString(),
    "author": {
      "@type": "Organization",
      "name": "META IITGN Community"
    },
    "publisher": {
      "@type": "Organization",
      "name": "META IITGN",
      "logo": {
        "@type": "ImageObject",
        "url": "https://meta.metis-iitgn.tech/icon-512.png"
      }
    }
  };

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", item: "/" },
    { name: "Wiki", item: "/wiki" },
    { name: displayCategory, item: `/wiki/${category}` },
    { name: name, item: `/wiki/${category}/${slug}` }
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <WikiClient
        initialMarkdown={dbArticle.content}
        dbPageId={dbArticle.page_id}
        version={dbArticle.version}
        categorySlug={category}
        initialMetadata={dbArticle.metadata}
        updatedAt={dbArticle.updated_at}
        updatedByName={dbArticle.updater?.name ?? null}
        contributors={dbArticle.contributors}
        initialIcon={dbArticle.icon}
        initialColor={dbArticle.color}
        slug={slug}
        defaultEditing={edit === "true"}
      />
    </>
  );
}
