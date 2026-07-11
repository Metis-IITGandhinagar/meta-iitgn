"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  HelpCircle,
  Menu,
  ChevronDown,
  ArrowLeft
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import {
  allSearchableItems,
  CATEGORY_ICON_MAP
} from "@/lib/search-data";

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const queryParam = searchParams?.get("query") || "";
  const categoryParam = searchParams?.get("category") || "All";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [category, setCategory] = useState(categoryParam);

  const filteredItems = allSearchableItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      category === "All" || item.category === category;
    return matchesSearch && matchesCategory;
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(
      `/search-results?query=${encodeURIComponent(searchQuery.trim())}&category=${category}`
    );
  };

  const selectCategory = (newCat: string) => {
    setCategory(newCat);
    router.push(
      `/search-results?query=${encodeURIComponent(searchQuery.trim())}&category=${newCat}`
    );
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return <span>{text}</span>;
    const parts = text.split(
      new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")})`, "gi")
    );
    return (
      <span>
        {parts.map((part, idx) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={idx} className="bg-yellow-100 text-yellow-900 px-0.5 rounded font-semibold">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div className="flex flex-col min-h-screen lg:h-screen bg-gray-50/30 overflow-y-auto lg:overflow-hidden font-sans">
      {/* Navbar */}
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Container */}
      <div className="flex flex-1 relative overflow-visible lg:overflow-hidden w-full h-auto lg:h-full">
        {/* Collapsible Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentTier="gold"
        />

        {/* Content Layout */}
        <div className="flex-1 flex flex-col h-auto lg:h-full w-full bg-white relative overflow-y-auto p-6 md:p-8 lg:p-10">
          <div className="max-w-4xl mx-auto w-full space-y-6">
            
            {/* Header info */}
            <div className="flex flex-col gap-1 text-left select-none">
              <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
                Search Results
              </h1>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                Explore campus resources, guides, and departments
              </p>
            </div>

            {/* Sticky Search bar */}
            <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center h-12 bg-slate-50 border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 rounded-xl px-4 transition-all duration-200 shadow-sm">
              <Search className="h-5 w-5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search articles, guides, policies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm text-slate-800 placeholder:text-gray-400 bg-transparent focus:outline-none px-3 h-full"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold px-2 py-1 bg-slate-200/60 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </form>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-1.5 justify-start select-none">
              {[
                "All",
                "Campus",
                "Academics",
                "Clubs",
                "Fests",
                "Research",
                "Policies",
              ].map((cat) => {
                const Icon = CATEGORY_ICON_MAP[cat] || HelpCircle;
                return (
                  <button
                    key={cat}
                    onClick={() => selectCategory(cat)}
                    className={`px-3.5 py-1 rounded-lg text-[10px] font-extrabold border transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                      category === cat
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white text-slate-655 border-gray-250 hover:border-slate-350 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="h-3 w-3 shrink-0" />
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Results Cards List */}
            <div className="space-y-4 pt-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left select-none">
                Search Results ({filteredItems.length})
              </h3>

              {filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredItems.map((item) => {
                    const Icon = CATEGORY_ICON_MAP[item.category] || HelpCircle;
                    return (
                      <Link
                        key={item.title}
                        href={item.path}
                        className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col gap-3 group text-left cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] uppercase font-black tracking-wider text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Icon className="w-2.5 h-2.5" />
                            {item.category}
                          </span>
                          <span className="text-[9px] font-bold text-gray-400">
                            3 min read
                          </span>
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors duration-150 leading-snug">
                            {highlightText(item.title, searchQuery)}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                            {highlightText(item.description, searchQuery)}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="py-20 text-center select-none border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <Search className="w-6 h-6" />
                  </div>
                  <h4 className="text-md font-bold text-slate-700 mt-4">
                    No results found
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                    We couldn&apos;t find anything matching &quot;{searchQuery}&quot;. Double check your spelling or search another category.
                  </p>
                </div>
              )}
            </div>

            {/* Back Button */}
            <div className="pt-6 flex justify-start select-none">
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white font-sans text-sm text-slate-500 font-bold select-none">
        Loading Search Results...
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}
