"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiService } from "@/api";
import {
  Search,
  Building2,
  BookOpen,
  Users2,
  Trophy,
  FlaskConical,
  Shield,
  Sparkles,
  LucideIcon
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { BeautifulSearchBox, BeautifulTabBar } from "@/components/SearchDesign";

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  Campus: Building2,
  Academics: BookOpen,
  Clubs: Users2,
  Fests: Trophy,
  Research: FlaskConical,
  Policies: Shield,
  All: Sparkles,
};

const CATEGORY_COLOR_MAP: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  Campus: { bg: "bg-emerald-50/70", text: "text-emerald-700", border: "border-emerald-100" },
  Academics: { bg: "bg-blue-50/70", text: "text-primary", border: "border-primary/20" },
  Clubs: { bg: "bg-purple-50/70", text: "text-purple-700", border: "border-purple-100" },
  Fests: { bg: "bg-amber-50/70", text: "text-amber-700", border: "border-amber-100" },
  Research: { bg: "bg-rose-50/70", text: "text-rose-700", border: "border-rose-100" },
  Policies: { bg: "bg-indigo-50/70", text: "text-indigo-700", border: "border-indigo-100" },
  All: { bg: "bg-primary text-white", text: "text-base-content", border: "border-slate-900" },
};

interface SearchResult {
  title: string;
  path: string;
  category: string;
  description: string;
}

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const queryParam = searchParams?.get("query") || "";
  const categoryParam = searchParams?.get("category") || "All";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [category, setCategory] = useState(categoryParam);

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const data = await apiService.searchPages(queryParam);
        setResults(data);
      } catch (err) {
        console.error("Failed to fetch search results:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [queryParam]);

  const filteredItems = results.filter((item) => {
    const matchesCategory =
      category === "All" || item.category.toLowerCase() === category.toLowerCase();
    return matchesCategory;
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      return;
    }
    router.push(
      `/search-results?query=${encodeURIComponent(q)}&category=${category}`
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
            <mark key={idx} className="bg-blue-100 text-blue-900 px-0.5 rounded font-semibold">
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
    <div className="flex flex-col min-h-screen lg:h-screen bg-base-200/20 overflow-y-auto lg:overflow-hidden font-sans">
      {/* Navbar */}
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} hideSearch={true} />

      {/* Main Container */}
      <div className="flex flex-1 relative overflow-visible lg:overflow-hidden w-full h-auto lg:h-full">
        {/* Collapsible Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentTier="gold"
        />

        {/* Content Layout */}
        <div className="flex-1 flex flex-col h-auto lg:h-full w-full bg-base-100 relative overflow-y-auto p-4 md:p-8 lg:p-10 no-scrollbar pb-24">
          <div className="max-w-4xl mx-auto w-full space-y-6 pt-2">

            {/* Glassmorphic Search Box & Category Tab Bar */}
            <div className="py-4">
              <BeautifulSearchBox
                value={searchQuery}
                onChange={setSearchQuery}
                onSubmit={handleSearchSubmit}
                placeholder="Find articles, guides, policies..."
              />
            </div>

            <div className="py-2">
              <BeautifulTabBar
                categories={[
                  "All",
                  "Campus",
                  "Academics",
                  "Clubs",
                  "Fests",
                  "Research",
                  "Policies",
                ]}
                activeCategory={category}
                onCategoryChange={selectCategory}
                categoryIconMap={CATEGORY_ICON_MAP}
              />
            </div>

            {/* Results Cards List */}
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between select-none">
                <h3 className="text-[10px] font-black text-base-content/50 uppercase tracking-widest text-left">
                  Matches Found ({filteredItems.length})
                </h3>
              </div>

              {loading ? (
                <div className="flex justify-center py-16">
                  <span className="loading loading-spinner loading-md text-primary"></span>
                </div>
              ) : filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredItems.map((item) => {
                    const colors = CATEGORY_COLOR_MAP[item.category] || {
                      bg: "bg-base-200",
                      text: "text-slate-650",
                    };
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        className="p-5 bg-base-100 border border-base-200 hover:border-blue-200 rounded-2xl flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.03)] group text-left cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3.5">
                            <span className={`text-[9px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-lg border ${colors.bg} ${colors.text} border-base-200`}>
                              {item.category}
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-base-content group-hover:text-primary transition-colors leading-snug">
                            {highlightText(item.title, queryParam)}
                          </h4>
                          <p className="text-xs text-base-content/50 leading-relaxed mt-2 line-clamp-3">
                            {highlightText(item.description, queryParam)}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="py-16 text-center select-none border border-dashed border-base-300 rounded-2xl bg-base-200/50 max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center mx-auto text-base-content/50">
                    <Search className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-base-content/85 mt-4">
                    No results found
                  </h4>
                  <p className="text-xs text-base-content/50 mt-1.5 px-6 leading-relaxed">
                    We couldn&apos;t find anything matching &quot;{searchQuery}&quot;. Double check your spelling or choose another category filter.
                  </p>
                </div>
              )}
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
      <div className="min-h-screen flex items-center justify-center bg-base-100 font-sans text-sm text-base-content/50 font-bold select-none">
        Loading Search Results...
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}
