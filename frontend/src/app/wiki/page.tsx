import WikiClient from "../wiki-client";

export const dynamic = "force-dynamic";

export default async function WikiPage() {
  let pageContent = "Failed to load content.";
  let pageId = "1";
  
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  try {
    // Fetch from the backend with a timeout/graceful error handling
    const response = await fetch(`${apiBase}/page/1`);

    if (response.ok) {
      const data = await response.json();
      pageContent = data.content;
      if (data.page_id) {
        pageId = data.page_id.toString();
      }
    }
  } catch (error) {
    console.error("Failed to fetch initial page content during build/render:", error);
  }

  // Pass the fetched markdown to the interactive client component
  return <WikiClient initialMarkdown={pageContent} pageId={pageId} />;
}
