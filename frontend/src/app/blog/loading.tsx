import React from "react";
import BlogListSkeleton from "@/components/skeletons/BlogListSkeleton";

export default function BlogListLoading() {
  return (
    <div className="min-h-screen bg-base-100 pt-20">
      <BlogListSkeleton />
    </div>
  );
}
