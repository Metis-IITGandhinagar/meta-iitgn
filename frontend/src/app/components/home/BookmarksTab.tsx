"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bookmark as BookmarkIcon,
  Trash2,
  Search,
  X,
  Copy,
  Check,
  Compass,
} from "lucide-react";
import ParallaxBackground from "@/components/ParallaxBackground";
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

// Map old bookmark titles or generated paths to actual live slugs in CATEGORIES_DATA
const getPagePath = (item: BookmarkItem) => {
  const title = item.title.toLowerCase();
  
  if (title.includes("campus & architecture")) {
    return "/wiki/page/sports-complex";
  }
  if (title.includes("amalthea technical summit") || title === "amalthea") {
    return "/wiki/page/amalthea";
  }
  if (title.includes("academic courses") || title.includes("introduction to computing")) {
    return "/wiki/page/cs-101";
  }
  if (title.includes("senate") || title.includes("coding club")) {
    return "/wiki/page/coding-club";
  }
  if (title.includes("research labs") || title.includes("cognitive science")) {
    return "/wiki/page/cognitive-science-lab";
  }
  if (title.includes("hostel policies") || title.includes("grading policy")) {
    return "/wiki/page/grading-policy";
  }

  const slugPart = item.slug ? item.slug.toLowerCase() : item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `/wiki/page/${slugPart}`;
};

export default function BookmarksTab({
  bookmarks,
  setBookmarks,
  removeBookmark,
  setActiveTab,
  mousePos,
}: BookmarksTabProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [localBookmarks, setLocalBookmarks] = useState<BookmarkItem[]>([]);
  const [limit, setLimit] = useState(5);
  const [totalCount, setTotalCount] = useState(0);

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

  const handleCopyLink = (e: React.MouseEvent, item: BookmarkItem) => {
    e.preventDefault();
    e.stopPropagation();
    const fullUrl = `${window.location.origin}${getPagePath(item)}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleDelete = async (e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    await removeBookmark(itemId);
  };

  const handleCardClick = (pagePath: string) => {
    router.push(pagePath);
  };

  return (
    <div className="relative w-full min-h-screen lg:min-h-dvh flex flex-col bg-slate-900 overflow-hidden pb-24 pt-16 lg:pt-22">
      {/* Reusable Parallax Background Component matching Home & Search */}
      <ParallaxBackground
        mousePos={mousePos}
        imageSrc="/homepage_bg.png"
        overlayClass="bg-linear-to-b via-slate-900/45 to-slate-950/65"
      />

      <style>{`
        @keyframes slide-up-fade {
          0% { opacity: 0; transform: translateY(120px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-hero-content {
          animation: slide-up-fade 3.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      <div className="relative z-10 max-w-6xl mx-auto w-full flex flex-col h-full overflow-hidden px-8 md:px-12 animate-hero-content pb-28 md:pb-0">
        
        {bookmarks.length > 0 ? (
          <>
            {/* Top Toolbar (Glassmorphic Search bar) */}
            <div className="flex items-center gap-3 mb-4 mt-2 shrink-0 w-full">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search bookmarks..."
                  className="w-full bg-white/10 backdrop-blur-md border border-white/15 rounded-xl py-2 pl-10 pr-9 text-xs md:text-sm text-white placeholder-white/50 focus:outline-none focus:border-blue-400/80 focus:bg-white/15 transition-all shadow-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Horizontal Pills - Glass Style */}
            <div className="flex gap-2 overflow-x-auto pb-3 mb-4 shrink-0 scrollbar-none select-none w-full">
              <button
                onClick={() => setSelectedCategory("All")}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                  selectedCategory === "All"
                    ? "bg-white text-slate-900 border-white shadow-md"
                    : "bg-white/10 text-white/90 border-white/15 hover:bg-white/15"
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
                      ? "bg-blue-600 text-white border-blue-600 shadow-md"
                      : "bg-white/10 text-white/90 border-white/15 hover:bg-white/15"
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
                  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {localBookmarks.map((item) => {
                      const pagePath = getPagePath(item);
                      const isCopied = copiedId === item.id;

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleCardClick(pagePath)}
                          className="bg-white/90 border border-slate-200/60 hover:border-blue-400/80 rounded-xl p-4 flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(0,0,0,0.1)] group cursor-pointer"
                        >
                          <div className="min-w-0 flex-1 pr-3">
                            {/* Card Content (Title & Category display) */}
                            <h4 className="text-xs md:text-sm font-semibold text-slate-800 truncate leading-snug group-hover:text-blue-650 transition-colors">
                              {item.title}
                            </h4>
                            <span className="text-[8px] font-bold uppercase tracking-wider block mt-1 text-blue-600">
                              {getCategoryDisplayName(item.category)}
                            </span>
                          </div>

                          {/* Actions aligned on the right, compact */}
                          <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              onClick={(e) => handleCopyLink(e, item)}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                isCopied
                                  ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                                  : "bg-slate-100 hover:bg-slate-200 border-slate-150 text-slate-500"
                              }`}
                              title="Copy link"
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={(e) => handleDelete(e, item.id)}
                              className="p-1.5 bg-slate-100 hover:bg-rose-50 border border-slate-150 hover:border-rose-100 text-slate-500 hover:text-rose-500 rounded-lg cursor-pointer transition-colors"
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
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all duration-150 active:scale-97 uppercase tracking-wider"
                      >
                        Load More
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl max-w-md mx-auto">
                  <Search className="h-8 w-8 text-white/50 mx-auto mb-2" />
                  <p className="text-sm text-white/90 font-bold">No bookmarks match search</p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("All");
                    }}
                    className="mt-3 text-xs font-bold text-blue-300 hover:underline cursor-pointer"
                  >
                    Reset filters
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Empty reading list state - Glassmorphic */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 select-none my-auto w-full">
            <div className="w-14 h-14 bg-white/10 border border-white/15 rounded-2xl flex items-center justify-center text-blue-400 shadow-sm mb-4 animate-pulse">
              <BookmarkIcon className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white font-serif">
              Empty reading list
            </h3>
            <p className="text-xs text-white/70 mt-2 max-w-xs leading-relaxed">
              Saved pages in the wiki will appear here for quick offline reading.
            </p>

            {setActiveTab && (
              <button
                onClick={() => setActiveTab("home")}
                className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full text-xs uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:shadow-blue-500/20 active:scale-95"
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
