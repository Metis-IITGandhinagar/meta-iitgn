import WikiClient from "../../../wiki-client";
import Link from "next/link";

interface WikiArticlePageProps {
  params: Promise<{
    category: string;
    slug: string;
  }>;
}

export default async function WikiArticlePage({ params }: WikiArticlePageProps) {
  const { slug } = await params;

  if (slug === "new") {
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

# Untitled Article

Write your content here...`;

    return <WikiClient initialMarkdown={template} defaultEditing={true} />;
  }

  let pageContent = "Failed to load content.";
  let found = false;

  try {
    // Runs on the server automatically inside a Server Component —
    // no "use server" directive needed for a plain data fetch.
    const response = await fetch(
      `https://meta-iitgn-vercel.onrender.com/page/${slug}`,
      { cache: "no-store" }
    );

    if (response.ok) {
      const data = await response.json();
      pageContent = data.content;
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
            href="/"
            className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Back to Wiki
          </Link>
        </div>
      </main>
    );
  }

  return <WikiClient initialMarkdown={pageContent} />;
}