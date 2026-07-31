import type { Metadata } from "next";
import { cache } from "react";
import WikiClient from "../../../wiki-client";
import Link from "next/link";
import { apiService } from "@/api";
import { getSeoMetadata, getBreadcrumbSchema } from "@/lib/seo";

// Wiki modals reflect state in the URL (useSearchParams); keep this dynamic.
export const dynamic = "force-dynamic";

interface WikiArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    title?: string;
    edit?: string;
    category?: string;
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

export async function generateMetadata({ params, searchParams }: WikiArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const { title } = await searchParams;

  if (slug === "new") {
    return getSeoMetadata({
      title: "New Article",
      description: "Create a new article on META IITGN wiki.",
      path: "/wiki/page/new",
      noIndex: true,
    });
  }

  const dbArticle = await getCachedWikiPage(slug);
  const dbCategory = dbArticle?.metadata?.category || "page";
  const name = dbArticle?.title || title?.trim() || slugToTitle(slug);
  const description = dbArticle?.description || `${name} on the IIT Gandhinagar campus wiki.`;

  return getSeoMetadata({
    title: name,
    description,
    path: `/wiki/${dbCategory}/${slug}`, // Canonicalize to correct category if present
    keywords: [name, "IITGN wiki", "IIT Gandhinagar", "student documentation"],
  });
}

export default async function WikiArticlePage({ params, searchParams }: WikiArticlePageProps) {
  const { slug } = await params;
  const { title, edit, category } = await searchParams;

  if (slug === "new") {
    const displayTitle = title ? title : "Untitled Article";
    
    let templateRows = `  - label: Type
    value: 
    type: text
  - label: Status
    value: Draft
    type: text`;

    if (category === "Featured") {
      templateRows = `  - label: Category
    value: Featured
    type: text
  - label: Tag
    value: Featured Story
    type: text
  - label: Location
    value: 
    type: text
  - label: Status
    value: Draft
    type: text`;
    }

    const template = `---
image:
imageAlt:
rows:
${templateRows}
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
            href={`/wiki/page/new?title=${encodeURIComponent(slug.replace(/-/g, ' '))}`}
            className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-content rounded-lg text-sm font-semibold transition-colors"
          >
            Create this article
          </Link>
        </div>
      </main>
    );
  }

  const name = dbArticle.title || slugToTitle(slug);
  const dbCategory = dbArticle.metadata?.category || "page";
  const displayCategory = dbCategory.charAt(0).toUpperCase() + dbCategory.slice(1);

  // JSON-LD Structured Data
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": name,
    "description": dbArticle.description || `${name} on the META IITGN wiki.`,
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
    { name: displayCategory, item: `/wiki/${dbCategory}` },
    { name: name, item: `/wiki/${dbCategory}/${slug}` }
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