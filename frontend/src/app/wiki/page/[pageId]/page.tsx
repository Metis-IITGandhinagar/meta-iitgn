import WikiClient from "../../../wiki-client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ pageId: string }>;
}

export default async function WikiPage({ params }: PageProps) {
  const { pageId } = await params;
  let pageContent = "Failed to load content.";
  
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  try {
    const response = await fetch(`${apiBase}/page/${pageId}`);

    if (response.ok) {
      const data = await response.json();
      pageContent = data.content;
    }
  } catch (error) {
    console.error(`Failed to fetch page content for pageId ${pageId}:`, error);
  }

  // Pass the fetched markdown and pageId to the interactive client component
  return <WikiClient initialMarkdown={pageContent} pageId={pageId} />;
}
