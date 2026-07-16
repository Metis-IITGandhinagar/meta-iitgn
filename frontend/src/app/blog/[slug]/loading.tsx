import React from "react";
import BlogDetailSkeleton from "@/components/skeletons/BlogDetailSkeleton";

export default function BlogDetailLoading() {
  return (
    <div className="min-h-screen bg-base-100 pt-20">
      <BlogDetailSkeleton />
    </div>
  );
}
