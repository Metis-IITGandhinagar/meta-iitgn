import WikiClient from "../../../wiki-client";
import Link from "next/link";
interface WikiArticlePageProps {
  params: Promise<{
    category: string;
    slug: string;
  }>;
  searchParams: Promise<{
    title?: string;
  }>;
}

export default async function WikiArticlePage({ params, searchParams }: WikiArticlePageProps) {
  const { slug } = await params;
  const { title } = await searchParams;

  if (slug === "new") {
    const displayTitle = title ? title : "Untitled Article";
    const template = `---
image: https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600
imageAlt: New Article
rows:
  - label: Type
    value: 
    type: text
  - label: Status
    value: Draft
    type: text
---

# ${displayTitle}

Write your content here...`;

    return <WikiClient initialMarkdown={template} defaultEditing={true} />;
  }

  let pageContent = "Failed to load content.";
  let dbPageId: number | undefined = undefined;
  let version: number | undefined = undefined;
  let found = false;
  let initialMetadata: any = undefined;

  try {
    // Runs on the server automatically inside a Server Component —
    // no "use server" directive needed for a plain data fetch.
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://meta-iitgn-vercel.onrender.com";
    const response = await fetch(
      `${apiBase}/api/pages/${slug}`,
      { cache: "no-store" }
    );

    if (response.ok) {
      const data = await response.json();
      pageContent = data.content;
      dbPageId = data.page_id;
      version = data.version;
      initialMetadata = data.metadata || {};
      found = true;
    }
  } catch (error) {
    console.error(
      "Failed to fetch initial page content during build/render:",
      error
    );
  }

  if (!found) {
    return (
      <main className="flex-1 p-6 md:p-8 lg:p-12 bg-[#FCFCFD]">
        <div className="max-w-4xl mx-auto text-center py-20">
          <h1 className="text-3xl font-bold text-gray-800">
            Article Not Found
          </h1>
          <p className="text-gray-500 mt-2">
            The requested article could not be found.
          </p>
          <Link
            href={`/wiki/campus/new?title=${encodeURIComponent(slug.replace(/-/g, ' '))}`}
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
      initialMarkdown={pageContent}
      dbPageId={dbPageId}
      version={version}
      initialMetadata={initialMetadata}
    />
  );
}