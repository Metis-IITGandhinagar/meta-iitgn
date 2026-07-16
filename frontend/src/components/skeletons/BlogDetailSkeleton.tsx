import React from "react";

export default function BlogDetailSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-8 animate-pulse space-y-8">
      {/* Back Button Skeleton */}
      <div className="h-4 bg-base-300 rounded w-20"></div>

      {/* Header Info */}
      <div className="space-y-4 pt-4">
        {/* Title */}
        <div className="h-10 bg-base-300 rounded-lg w-3/4"></div>
        
        {/* Author / Date Meta */}
        <div className="flex items-center gap-3 pt-2">
          <div className="w-10 h-10 rounded-full bg-base-300 shrink-0"></div>
          <div className="space-y-2 flex-1">
            <div className="h-3 bg-base-300 rounded w-32"></div>
            <div className="h-2.5 bg-base-300 rounded w-24"></div>
          </div>
        </div>
      </div>

      {/* Banner Image Placeholder */}
      <div className="h-80 md:h-[400px] bg-base-300 rounded-2xl w-full"></div>

      {/* Article Content Lines */}
      <div className="space-y-6 pt-4">
        <div className="space-y-3">
          <div className="h-4 bg-base-300 rounded w-full"></div>
          <div className="h-4 bg-base-300 rounded w-full"></div>
          <div className="h-4 bg-base-300 rounded w-11/12"></div>
          <div className="h-4 bg-base-300 rounded w-5/6"></div>
        </div>

        <div className="space-y-3 pt-4">
          <div className="h-6 bg-base-300 rounded-lg w-1/4"></div>
          <div className="h-4 bg-base-300 rounded w-full"></div>
          <div className="h-4 bg-base-300 rounded w-full"></div>
          <div className="h-4 bg-base-300 rounded w-10/12"></div>
        </div>

        <div className="space-y-3 pt-4">
          <div className="h-4 bg-base-300 rounded w-full"></div>
          <div className="h-4 bg-base-300 rounded w-11/12"></div>
        </div>
      </div>
    </div>
  );
}
