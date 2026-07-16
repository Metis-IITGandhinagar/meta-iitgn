import React from "react";

export default function WikiArticleSkeleton() {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-pulse p-4 md:p-8">
      {/* Breadcrumb Skeleton */}
      <div className="h-4 bg-base-300 rounded w-1/4 mb-4"></div>

      {/* Title Skeleton */}
      <div className="h-10 bg-base-300 rounded-lg w-1/2"></div>
      
      {/* Divider */}
      <div className="h-0.5 bg-base-300 w-full rounded"></div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content Area Skeletons (Left) */}
        <div className="flex-1 space-y-6">
          <div className="space-y-3">
            <div className="h-4 bg-base-300 rounded w-full"></div>
            <div className="h-4 bg-base-300 rounded w-11/12"></div>
            <div className="h-4 bg-base-300 rounded w-5/6"></div>
            <div className="h-4 bg-base-300 rounded w-full"></div>
          </div>

          <div className="space-y-3 pt-4">
            <div className="h-6 bg-base-300 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-base-300 rounded w-full"></div>
            <div className="h-4 bg-base-300 rounded w-10/12"></div>
            <div className="h-4 bg-base-300 rounded w-full"></div>
          </div>

          <div className="space-y-3 pt-4">
            <div className="h-6 bg-base-300 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-base-300 rounded w-full"></div>
            <div className="h-4 bg-base-300 rounded w-11/12"></div>
          </div>
        </div>

        {/* InfoBox Skeleton (Right) */}
        <div className="w-full lg:w-80 shrink-0 border border-base-300 bg-base-200/40 rounded-2xl p-4 space-y-4">
          <div className="h-40 bg-base-300 rounded-xl w-full"></div>
          <div className="h-6 bg-base-300 rounded-lg w-3/4 mx-auto"></div>
          <div className="space-y-2 pt-2">
            <div className="flex justify-between">
              <div className="h-3 bg-base-300 rounded w-1/3"></div>
              <div className="h-3 bg-base-300 rounded w-1/2"></div>
            </div>
            <div className="flex justify-between">
              <div className="h-3 bg-base-300 rounded w-1/4"></div>
              <div className="h-3 bg-base-300 rounded w-1/2"></div>
            </div>
            <div className="flex justify-between">
              <div className="h-3 bg-base-300 rounded w-1/3"></div>
              <div className="h-3 bg-base-300 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
