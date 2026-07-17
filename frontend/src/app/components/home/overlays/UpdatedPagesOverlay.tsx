"use client";

import React from "react";
import Link from "next/link";
import GenericOverlayModal from "@/components/GenericOverlayModal";

interface UpdatedPagesOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  updatedPages: any[];
  getRelativeTime: (dateString: string) => string;
  hasMore: boolean;
  onLoadMore: () => void;
}

export default function UpdatedPagesOverlay({
  isOpen,
  onClose,
  updatedPages,
  getRelativeTime,
  hasMore,
  onLoadMore,
}: UpdatedPagesOverlayProps) {
  if (!isOpen) return null;

  return (
    <GenericOverlayModal
      isOpen={isOpen}
      onClose={onClose}
      title="Recently Updated Pages"
      headerColorClass="text-secondary bg-base-200"
    >
      <div className="max-w-3xl mx-auto space-y-4 w-full">
        {updatedPages.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-base-300 bg-base-100 rounded-2xl">
            <p className="text-base-content/60 font-medium">No pages updated yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {updatedPages.map((page) => (
              <Link
                key={page.page_id}
                href={`/wiki/${(page.metadata as any)?.category || "campus"}/${page.slug}`}
                onClick={onClose}
                className="block p-5 border border-base-300 bg-base-100 rounded-2xl shadow-xs hover:shadow-md hover:border-primary transition-all duration-150 cursor-pointer text-left"
              >
                <h4 className="text-base font-bold text-primary">{page.title}</h4>
                <p className="text-[10px] text-base-content/50 font-semibold mt-1">
                  Updated: {getRelativeTime(page.updated_at)} ({new Date(page.updated_at).toLocaleString()})
                </p>
              </Link>
            ))}

            {hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={onLoadMore}
                  className="inline-flex items-center gap-2 px-6 py-2 border border-base-300 hover:border-primary text-base-content/80 bg-base-100 hover:bg-base-200 rounded-xl text-xs font-bold shadow-xs transition-all duration-200 cursor-pointer active:scale-95 animate-in fade-in"
                >
                  Load More Pages
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </GenericOverlayModal>
  );
}
