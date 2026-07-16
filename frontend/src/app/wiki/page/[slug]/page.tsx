import WikiClient from "../../../wiki-client";
import Link from "next/link";
import { apiService } from "@/api";

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
image: https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600
imageAlt: New Article
rows:
${templateRows}
---

# ${displayTitle}

Write your content here...`;

    return <WikiClient initialMarkdown={template} defaultEditing={true} />;
  }

  let articleContent: string | undefined = undefined;
  let dbPageId: number | undefined = undefined;
  let version: number | undefined = undefined;
  let initialMetadata: any = undefined;

  try {
    const dbArticle = await apiService.getPage(slug);
    if (dbArticle) {
      articleContent = dbArticle.content;
      dbPageId = dbArticle.page_id;
      version = dbArticle.version;
      initialMetadata = dbArticle.metadata;

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
            href={`/wiki/page/new?title=${encodeURIComponent(slug.replace(/-/g, ' '))}`}
            className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-content rounded-lg text-sm font-semibold transition-colors"
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
      initialMetadata={initialMetadata}
      defaultEditing={edit === "true"}
    />
  );
}