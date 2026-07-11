"use client";

import React from "react";
import Link from "next/link";
import {
  Bookmark as BookmarkIcon,
  Trash2,
  ArrowRight,
  HelpCircle,
  Building2,
  BookOpen,
  Users2,
  Trophy,
  FlaskConical,
  Shield,
  Sparkles,
  LucideIcon,
} from "lucide-react";

interface BookmarkItem {
  id: string;
  title: string;
  category: string;
  description: string;
}

interface BookmarksTabProps {
  bookmarks: BookmarkItem[];
  setBookmarks: (bookmarks: BookmarkItem[]) => void;
  removeBookmark: (id: string) => void;
}

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  Campus: Building2,
  Academics: BookOpen,
  Clubs: Users2,
  Fests: Trophy,
  Research: FlaskConical,
  Policies: Shield,
  All: Sparkles,
};

export default function BookmarksTab({
  bookmarks,
  setBookmarks,
  removeBookmark,
}: BookmarksTabProps) {
  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#FCFCFD] pb-24">
      <div className="max-w-2xl mx-auto w-full animate-hero-content">
        {/* Sticky App Header */}
        <div className="p-6 border-b border-slate-100 bg-white shrink-0 select-none flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BookmarkIcon className="h-6 w-6 text-blue-500 fill-blue-500" />
              Bookmarks
            </h1>
            <p className="text-xs text-slate-500 font-semibold">
              Your saved guides and pages.
            </p>
          </div>

          {bookmarks.length > 0 && (
            <button
              onClick={() => {
                if (
                  confirm("Are you sure you want to clear all bookmarks?")
                ) {
                  setBookmarks([]);
                  localStorage.removeItem("wiki-bookmarks");
                }
              }}
              className="text-[10px] font-extrabold text-rose-500 hover:text-rose-700 transition-colors uppercase tracking-wider cursor-pointer px-3 py-1.5 hover:bg-rose-55 rounded-lg border border-red-400"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Scrollable Viewport */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 pb-28 space-y-4 no-scrollbar">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest select-none">
            Saved Pages ({bookmarks.length})
          </h3>

          {bookmarks.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {bookmarks.map((item) => {
                const Icon = CATEGORY_ICON_MAP[item.category] || HelpCircle;
                const pagePath = `/wiki/${item.category.toLowerCase()}/${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-150 bg-white hover:border-blue-200 hover:shadow-md transition-all duration-200 flex flex-col gap-2.5 text-left shadow-depth shadow-depth-hover"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-black tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Icon className="w-2.5 h-2.5" />
                        {item.category}
                      </span>
                      <button
                        onClick={() => removeBookmark(item.id)}
                        className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-55 rounded-lg transition-colors cursor-pointer"
                        title="Remove Bookmark"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <Link href={pagePath} className="group">
                      <h4 className="text-sm font-black text-slate-800 group-hover:text-blue-600 transition-colors font-serif">
                        {item.title}
                      </h4>
                    </Link>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {item.description}
                    </p>
                    <Link
                      href={pagePath}
                      className="inline-flex items-center gap-1 text-[9px] font-extrabold text-blue-500 hover:text-blue-800 uppercase tracking-wider self-start pt-0.5"
                    >
                      Read Article <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200/80">
              <BookmarkIcon className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-bold">
                Your reading list is empty
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Bookmark wiki pages to save them here for offline access.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
