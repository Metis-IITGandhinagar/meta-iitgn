"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bookmark as BookmarkIcon,
  Trash2,
  Search,
  X,
  Compass,
} from "lucide-react";
import { db } from "@/lib/db";

interface BookmarkItem {
  id: string;
  title: string;
  category: string;
  description: string;
  slug?: string;
}

interface BookmarksTabProps {
  bookmarks: BookmarkItem[];
  setBookmarks: (bookmarks: BookmarkItem[]) => void;
  removeBookmark: (id: string) => void;
  setActiveTab?: (tab: "home" | "search" | "bookmarks") => void;
  mousePos?: { x: number; y: number };
}

// Formatter for display names of categories
const getCategoryDisplayName = (cat: string) => {
  const lower = cat.toLowerCase();
  if (lower === "departments") return "Departments";
  if (lower === "courses") return "Courses";
  if (lower === "clubs") return "Clubs";
  if (lower === "fests") return "Fests";
  if (lower === "research") return "Research";
  if (lower === "policies") return "Policies";
  if (lower === "campus") return "Campus";
  if (lower === "academics") return "Academics";
  return cat.charAt(0).toUpperCase() + cat.slice(1);
};

// Build the wiki URL from the bookmark slug and category
const getPagePath = (item: BookmarkItem) => {
  const slug = item.slug || item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `/wiki/page/${slug}`;
};

export default function BookmarksTab({
  bookmarks,
  removeBookmark,
  setActiveTab,
}: BookmarksTabProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [localBookmarks, setLocalBookmarks] = useState<BookmarkItem[]>([]);
  const [limit, setLimit] = useState(5);
  const [totalCount, setTotalCount] = useState(0);
  // Compact layout preference (re-read on settings change).
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const syncCompact = () =>
      setCompact(localStorage.getItem("wiki_compact_layout") === "true");
    syncCompact();
    window.addEventListener("wiki_settings_changed", syncCompact);
    return () => window.removeEventListener("wiki_settings_changed", syncCompact);
  }, []);

  const fetchLocalBookmarks = async (currentLimit: number) => {
    try {
      let allItems = await db.bookmarks.toArray();
      
      if (selectedCategory !== "All") {
        allItems = allItems.filter(item => item.category === selectedCategory);
      }
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        allItems = allItems.filter(item => 
          item.title.toLowerCase().includes(q) || 
          item.description.toLowerCase().includes(q)
        );
      }
      
      setTotalCount(allItems.length);
      setLocalBookmarks(allItems.slice(0, currentLimit));
    } catch (e) {
      console.error("Failed to fetch bookmarks from Dexie:", e);
    }
  };

  useEffect(() => {
    fetchLocalBookmarks(limit);
  }, [searchQuery, selectedCategory, limit, bookmarks]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(bookmarks.map((b) => b.category));
    return Array.from(set);
  }, [bookmarks]);

  const handleDelete = async (e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    await removeBookmark(itemId);
  };

  const handleCardClick = (pagePath: string) => {
    router.push(pagePath);
  };

  return (
    <div className="relative w-full min-h-screen lg:min-h-dvh flex flex-col bg-base-200/30 overflow-hidden pb-24 pt-16 lg:pt-22">
      <div className="relative z-10 max-w-6xl mx-auto w-full flex flex-col h-full overflow-hidden px-8 md:px-12 pb-28 md:pb-0 animate-in fade-in duration-300">
        
        {bookmarks.length > 0 ? (
          <>
            {/* Top Toolbar (Theme-based Search bar) */}
            <div className="flex items-center gap-3 mb-4 mt-2 shrink-0 w-full">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/50" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search bookmarks..."
                  className="w-full bg-base-100 border border-base-300 rounded-xl py-2 pl-10 pr-9 text-xs md:text-sm text-base-content placeholder-base-content/40 focus:outline-none focus:border-primary/50 transition-all shadow-xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/60 hover:text-base-content cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Horizontal Pills */}
            <div className="flex gap-2 overflow-x-auto pb-3 mb-4 shrink-0 scrollbar-none select-none w-full">
              <button
                onClick={() => setSelectedCategory("All")}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                  selectedCategory === "All"
                    ? "bg-primary text-primary-content border-primary shadow-xs"
                    : "bg-base-100 text-base-content border-base-300 hover:bg-base-200/60"
                }`}
              >
                All ({bookmarks.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-secondary text-secondary-content border-secondary shadow-xs"
                      : "bg-base-100 text-base-content border-base-300 hover:bg-base-200/60"
                  }`}
                >
                  {getCategoryDisplayName(cat)}
                </button>
              ))}
            </div>

            {/* Bookmark Grid Layout - Slim Row Cards */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-10 w-full">
              {localBookmarks.length > 0 ? (
                <>
                  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${
                    compact ? "gap-1.5" : "gap-3"
                  }`}>
                    {localBookmarks.map((item) => {
                      const pagePath = getPagePath(item);

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleCardClick(pagePath)}
                          className="card card-compact bg-base-100 border border-base-300 hover:border-primary/50 p-4 flex flex-row items-center justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group cursor-pointer"
                        >
                          <div className="min-w-0 flex-1 pr-3">
                            {/* Card Content (Title & Category display) */}
                            <h4 className="text-xs md:text-sm font-semibold text-base-content truncate leading-snug group-hover:text-primary transition-colors">
                              {item.title}
                            </h4>
                            <span className="text-[8px] font-bold uppercase tracking-wider block mt-1 text-secondary">
                              {getCategoryDisplayName(item.category)}
                            </span>
                          </div>

                          {/* Actions aligned on the right, compact */}
                          <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              onClick={(e) => handleDelete(e, item.id)}
                              className="btn btn-square btn-xs btn-ghost bg-base-250 hover:bg-rose-50 border-base-300 hover:border-rose-100 text-base-content/50 hover:text-rose-500 rounded-lg cursor-pointer transition-colors"
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {localBookmarks.length < totalCount && (
                    <div className="flex justify-center mt-6">
                      <button
                        onClick={() => setLimit(prev => prev + 5)}
                        className="btn btn-primary btn-sm px-6 font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all duration-150 active:scale-97 uppercase tracking-wider text-primary-content"
                      >
                        Load More
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16 bg-base-100 border border-base-200 rounded-2xl max-w-md mx-auto">
                  <Search className="h-8 w-8 text-base-content/40 mx-auto mb-2" />
                  <p className="text-sm text-base-content/85 font-bold">No bookmarks match search</p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("All");
                    }}
                    className="mt-3 text-xs font-bold text-primary hover:underline cursor-pointer"
                  >
                    Reset filters
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Empty reading list state */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 select-none my-auto w-full">
            <div className="w-14 h-14 bg-base-100 border border-base-200 rounded-2xl flex items-center justify-center text-primary shadow-sm mb-4 animate-pulse">
              <BookmarkIcon className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-base-content font-serif">
              Empty reading list
            </h3>
            <p className="text-xs text-base-content/60 mt-2 max-w-xs leading-relaxed">
              Saved pages in the wiki will appear here for quick offline reading.
            </p>

            {setActiveTab && (
              <button
                onClick={() => setActiveTab("home")}
                className="btn btn-primary btn-sm mt-6 px-6 font-bold rounded-full text-xs uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:shadow-primary/20 active:scale-95 text-primary-content"
              >
                <Compass className="w-4 h-4" />
                Explore Wiki
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
