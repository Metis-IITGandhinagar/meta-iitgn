"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bookmark as BookmarkIcon,
  Trash2,
  Search,
  X,
  Compass,
} from "lucide-react";
import { db } from "@/lib/db";
import { useViewMode } from "@/hooks/useViewMode";
import ViewSwitcher from "@/components/helpers/ViewSwitcher";
import { getGridClass, getIconSize } from "@/lib/viewModes";
import UnifiedViewItem from "@/components/helpers/UnifiedViewItem";
import { CategoryIcon } from "@/lib/categoryIcon";
import { useCommonStore } from "@/store/useCommonStore";

interface BookmarkItem {
  id: string;
  title: string;
  category: string;
  description: string;
  slug?: string;
  icon?: string | null;
  color?: string | null;
}

interface BookmarksTabProps {
  bookmarks: BookmarkItem[];
  setBookmarks: (bookmarks: BookmarkItem[]) => void;
  removeBookmark: (id: string) => void;
  setActiveTab?: (tab: "home" | "search" | "bookmarks") => void;
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
  const compact = useCommonStore((state) => state.compactLayout);
  const [view, setView] = useViewMode("meta_iitgn_bookmarks_view");

  const fetchLocalBookmarks = useCallback(async (currentLimit: number) => {
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
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    fetchLocalBookmarks(limit);
  }, [searchQuery, selectedCategory, limit, bookmarks, fetchLocalBookmarks]);

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

  // Shared delete button. Note: uses `bg-base-200` (a valid daisyUI token) —
  // the previous `bg-base-250` was not a real token and rendered with no background.
  const renderDeleteBtn = (itemId: string) => (
    <button
      onClick={(e) => handleDelete(e, itemId)}
      className="btn btn-square btn-xs btn-ghost bg-base-200 hover:bg-rose-50 border-base-300 hover:border-rose-100 text-base-content/50 hover:text-rose-500 rounded-lg cursor-pointer transition-colors"
      title="Remove"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );

  const renderBookmark = (item: BookmarkItem) => {
    const pagePath = getPagePath(item);

    // Each page carries its own icon+color (emoji or Lucide key); fall back to
    // a neutral brand colour when a page hasn't set one, mirroring CategoryPage.
    const pageColor = item.color || "#4f46e5";
    const iconBoxStyle = {
      backgroundColor: `${pageColor}1a`,
      borderColor: `${pageColor}33`,
      color: pageColor,
    };
    const pageIcon = (
      <CategoryIcon icon={item.icon ?? undefined} size={getIconSize(view)} />
    );

    return (
      <UnifiedViewItem
        key={item.id}
        view={view}
        onClick={() => handleCardClick(pagePath)}
        title={item.title}
        icon={pageIcon}
        iconBoxStyle={iconBoxStyle}
        topRightAction={view === "tiles" || view.startsWith("icon-") ? renderDeleteBtn(item.id) : undefined}
        action={view === "details" || view === "default" ? renderDeleteBtn(item.id) : undefined}
      />
    );
  };

  return (
    <div className="relative w-full min-h-screen lg:min-h-dvh flex flex-col bg-base-200/30 overflow-hidden pb-24 pt-16 lg:pt-22">
      <div className="relative z-10 max-w-6xl mx-auto w-full flex flex-col h-full overflow-hidden px-8 md:px-12 pb-28 md:pb-0 animate-in fade-in duration-300">
        
        {bookmarks.length > 0 ? (
          <>
            {/* Top Toolbar (Theme-based Search bar + View switcher) */}
            <div className="flex items-center gap-3 mb-4 mt-2 shrink-0 w-full">
              <div className="relative flex-1 min-w-0 max-w-md">
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
              <ViewSwitcher view={view} onChange={setView} className="ml-auto" />
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
            <div className="flex-1 overflow-y-auto no-scrollbar pt-2 pb-10 w-full">
              {localBookmarks.length > 0 ? (
                <>
                  <div className={
                    view === "default"
                      ? `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${compact ? "gap-1.5" : "gap-3"}`
                      : getGridClass(view)
                  }>
                    {localBookmarks.map(renderBookmark)}
                  </div>
                  {localBookmarks.length < totalCount && (
                    <div className="col-span-full flex justify-center mt-6">
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
