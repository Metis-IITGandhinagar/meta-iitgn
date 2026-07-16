import { CATEGORIES_DATA } from "@/lib/placeholder-articles";
import WikiClient from "../../../wiki-client";
import Link from "next/link";
import { apiService } from "@/api";

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

export default async function ArticlePage({ params, searchParams }: ArticlePageProps) {
  const { category, slug } = await params;
  const { title, edit } = await searchParams;

  const categoryInfo = CATEGORIES_DATA[category];

  if (slug === "new") {
    const displayCategoryName = categoryInfo ? categoryInfo.name : (category.charAt(0).toUpperCase() + category.slice(1));
    const displayTitle = title ? title : "Untitled Article";
    const template = `---
image: https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600
imageAlt: New Article
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

  const article = categoryInfo?.articles.find((a) => a.slug === slug);
  let articleContent = article?.content;
  let dbPageId: number | undefined = undefined;
  let version: number | undefined = undefined;
  let initialMetadata: any = undefined;

  if (!articleContent) {
    try {
      const dbArticle = await apiService.getPage(slug);
      if (dbArticle) {
        articleContent = dbArticle.content;
        dbPageId = dbArticle.page_id;
        version = dbArticle.version;
        initialMetadata = dbArticle.metadata;
      }
    } catch (e) {
      console.warn("Could not find article in db:", slug, e);
    }
  }

  if (!articleContent) {
    return (
      <main className="flex-1 p-6 md:p-8 lg:p-12 bg-[#FCFCFD]">
        <div className="max-w-4xl mx-auto text-center py-20">
          <h1 className="text-3xl font-bold text-gray-800">Article Not Found</h1>
          <p className="text-gray-500 mt-2">The requested article could not be found.</p>
          <Link
            href={`/wiki/${category}/new?title=${encodeURIComponent(slug.replace(/-/g, ' '))}`}
            className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Create this article
          </Link>
        </div>
      </main>
    );
  }

  return (
    <WikiClient
      initialMarkdown={articleContent}
      dbPageId={dbPageId}
      version={version}
      categorySlug={category}
      initialMetadata={initialMetadata}
      defaultEditing={edit === "true"}
    />
  );
}
