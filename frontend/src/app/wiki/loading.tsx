import React from "react";
import WikiArticleSkeleton from "@/components/skeletons/WikiArticleSkeleton";

export default function WikiLoading() {
  return (
    <div className="flex-grow h-full w-full overflow-y-auto pt-20 bg-base-100">
      <WikiArticleSkeleton />
    </div>
  );
}
