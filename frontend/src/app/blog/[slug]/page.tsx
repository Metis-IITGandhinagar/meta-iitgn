import { PageMessage, pagePrimaryAction } from "@/components/helpers/PageMessage";
import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { apiService } from "@/api";
import { getSeoMetadata, getBreadcrumbSchema } from "@/lib/seo";
import BlogDetailClient from "./blog-detail-client";

// Dynamic routing config
export const dynamic = "force-dynamic";

interface BlogDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// React cache to dedup database/API fetches across generateMetadata and rendering
const getCachedBlog = cache(async (slug: string) => {
  try {
    const data = await apiService.getBlog(slug);
    if (data && data.success) {
      return data.blog;
    }
  } catch (error) {
    console.error("Error loading blog in cached loader:", slug, error);
  }
  return null;
});

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getCachedBlog(slug);

  if (!blog) {
    return getSeoMetadata({
      title: "Blog Post Not Found",
      description: "The requested blog post could not be found on META IITGN.",
      path: `/blog/${slug}`,
      noIndex: true,
    });
  }

  return getSeoMetadata({
    title: blog.title,
    description: blog.description || `${blog.title} — a student blog post on META IITGN.`,
    path: `/blog/${blog.slug}`,
    keywords: [blog.title, "IIT Gandhinagar blogs", "IITGN student articles"],
  });
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const blog = await getCachedBlog(slug);

  if (!blog) {
    return (
      <main className="flex-1 mt-16 overflow-y-auto">
        <PageMessage
          eyebrow="Blogs"
          title="This post isn't here."
          actions={
            <Link href="/blog" className={pagePrimaryAction}>
              <ArrowLeft className="h-4 w-4" aria-hidden /> Back to blogs
            </Link>
          }
        >
          It may have been moved or deleted.
        </PageMessage>
      </main>
    );
  }

  // Schema.org Structured Data
  const blogPostingSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": blog.title,
    "description": blog.description || blog.title,
    "datePublished": blog.created_at,
    "dateModified": blog.updated_at || blog.created_at,
    "author": {
      "@type": "Person",
      "name": blog.original_author?.name || "IITGN Student"
    },
    "publisher": {
      "@type": "Organization",
      "name": "META IITGN",
      "logo": {
        "@type": "ImageObject",
        "url": "https://meta.metis-iitgn.tech/icon-512.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://meta.metis-iitgn.tech/blog/${blog.slug}`
    }
  };

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", item: "/" },
    { name: "Blog", item: "/blog" },
    { name: blog.title, item: `/blog/${blog.slug}` }
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <BlogDetailClient blog={blog} slug={slug} />
    </>
  );
}
