import React from "react";

export default function BlogListSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 animate-pulse space-y-8">
      {/* Header section skeleton */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-3">
          <div className="h-8 bg-base-300 rounded-lg w-48"></div>
          <div className="h-4 bg-base-300 rounded w-80"></div>
        </div>
        <div className="h-10 bg-base-300 rounded-xl w-32 shrink-0"></div>
      </div>

      {/* Grid of cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="border border-base-300 bg-base-200/30 rounded-2xl overflow-hidden flex flex-col h-full space-y-4 p-5">
            {/* Image Placeholder */}
            <div className="h-48 bg-base-300 rounded-xl w-full"></div>
            
            {/* Meta (Date/Read Time) */}
            <div className="flex gap-2">
              <div className="h-3.5 bg-base-300 rounded w-16"></div>
              <div className="h-3.5 bg-base-300 rounded w-20"></div>
            </div>

            {/* Title */}
            <div className="h-6 bg-base-300 rounded-lg w-5/6"></div>

            {/* Description */}
            <div className="space-y-2 flex-1">
              <div className="h-3.5 bg-base-300 rounded w-full"></div>
              <div className="h-3.5 bg-base-300 rounded w-11/12"></div>
            </div>

            {/* Divider */}
            <div className="h-px bg-base-300 w-full pt-2"></div>

            {/* Author */}
            <div className="flex items-center gap-3 pt-2">
              <div className="w-8 h-8 rounded-full bg-base-300 shrink-0"></div>
              <div className="space-y-1.5 flex-1">
                <div className="h-3 bg-base-300 rounded w-24"></div>
                <div className="h-2.5 bg-base-300 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
