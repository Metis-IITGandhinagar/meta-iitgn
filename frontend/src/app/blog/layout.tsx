import React from "react";
import BlogLayoutClient from "./blog-layout-client";
import { getSeoMetadata } from "@/lib/seo";

export const metadata = getSeoMetadata({
  title: "Campus Blogs | Student Stories & Articles",
  description: "Explore technical articles, internship experiences, placement preparation guides, and student life stories from the IIT Gandhinagar student community.",
  path: "/blog",
});

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <BlogLayoutClient>{children}</BlogLayoutClient>;
}
