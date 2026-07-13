"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface NewPagesOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  newPages: any[];
  getRelativeTime: (dateString: string) => string;
  hasMore: boolean;
  onLoadMore: () => void;
}

export default function NewPagesOverlay({
  isOpen,
  onClose,
  newPages,
  getRelativeTime,
  hasMore,
  onLoadMore,
}: NewPagesOverlayProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-[99999] flex flex-col h-dvh w-screen overflow-hidden select-none animate-in fade-in duration-200">
      <header className="h-16 border-b border-gray-200 flex items-center gap-4 px-6 shrink-0 bg-white shadow-sm select-none">
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-center"
        >
          <ArrowLeft className="h-6 w-6 text-gray-900" />
        </button>
        <span className="text-sm font-bold text-blue-400 uppercase tracking-wider">Recently Created Pages</span>
      </header>
      <div className="flex-1 overflow-y-auto overscroll-contain bg-gray-55 p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {newPages.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-gray-300 bg-white rounded-2xl">
              <p className="text-gray-500 font-medium">No new pages created yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {newPages.map((page) => (
                <div
                  key={page.page_id}
                  onClick={() => {
                    onClose();
                    router.push(`/wiki/campus/${page.slug}`);
                  }}
                  className="p-5 border border-gray-250/60 bg-white rounded-2xl shadow-xs hover:shadow-md hover:border-blue-400 transition-all duration-150 cursor-pointer text-left"
                >
                  <h4 className="text-base font-bold text-blue-500">{page.title}</h4>
                  <p className="text-[10px] text-gray-400 font-semibold mt-1">
                    Created: {getRelativeTime(page.created_at)} ({new Date(page.created_at).toLocaleString()})
                  </p>
                </div>
              ))}

              {hasMore && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={onLoadMore}
                    className="inline-flex items-center gap-2 px-6 py-2 border border-gray-200 hover:border-gray-300 text-gray-700 bg-white hover:bg-gray-55 rounded-xl text-xs font-bold shadow-sm transition-all duration-200 cursor-pointer active:scale-95"
                  >
                    Load More Pages
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
