import type { Metadata } from "next";
import BlogGridClient from "./blog-grid-client";
import { getSeoMetadata, getBreadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = getSeoMetadata({
  title: "Campus Blogs | Stories, Guides & Community",
  description: "Browse the collaborative blogging space for IIT Gandhinagar. Read student-contributed articles, technical guides, internship experiences, and campus updates.",
  path: "/blog",
  keywords: ["IITGN student blogs", "campus articles", "internship guides", "IIT Gandhinagar community"],
});

export default function BlogGridPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", item: "/" },
    { name: "Blog", item: "/blog" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <BlogGridClient />
    </>
  );
}
