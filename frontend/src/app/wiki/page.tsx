import WikiClient from "../wiki-client";

export const dynamic = "force-dynamic";

export default async function WikiPage() {
  // Fetch from the backend
  const response = await fetch("https://meta-iitgn-vercel.onrender.com/page/1");

  let pageContent = "Failed to load content.";
  if (response.ok) {
    const data = await response.json();
    pageContent = data.content;
  }

  // Pass the fetched markdown to the interactive client component
  return <WikiClient initialMarkdown={pageContent} />;
}
