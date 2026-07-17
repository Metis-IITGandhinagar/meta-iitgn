"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiService } from "@/api";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  Search,
  Building2,
  BookOpen,
  Users2,
  Trophy,
  FlaskConical,
  Shield,
  Sparkles,
  User,
  Newspaper,
  FolderOpen,
  ArrowLeft,
  LucideIcon
} from "lucide-react";
import { BeautifulSearchBox, BeautifulTabBar } from "@/components/SearchDesign";
import { getSearchHistory, addSearchHistory, clearSearchHistory } from "@/lib/searchHistory";

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  Campus: Building2,
  Academics: BookOpen,
  Clubs: Users2,
  Fests: Trophy,
  Research: FlaskConical,
  Policies: Shield,
  Profile: User,
  News: Newspaper,
  Category: FolderOpen,
  All: Sparkles,
};

const CATEGORY_COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  Campus: { bg: "bg-success/15", text: "text-success", border: "border-success/20" },
  Academics: { bg: "bg-primary/15", text: "text-primary", border: "border-primary/20" },
  Clubs: { bg: "bg-secondary/15", text: "text-secondary", border: "border-secondary/20" },
  Fests: { bg: "bg-warning/15", text: "text-warning", border: "border-warning/20" },
  Research: { bg: "bg-error/15", text: "text-error", border: "border-error/20" },
  Policies: { bg: "bg-info/15", text: "text-info", border: "border-info/20" },
  News: { bg: "bg-accent/15", text: "text-accent", border: "border-accent/20" },
  Profile: { bg: "bg-info/15", text: "text-info", border: "border-info/20" },
  Category: { bg: "bg-secondary/15", text: "text-secondary", border: "border-secondary/20" },
  All: { bg: "bg-primary text-primary-content", text: "text-primary-content", border: "border-primary" },
};

const SearchResultSkeleton = () => (
  <div className="p-5 bg-base-100 border border-base-200 rounded-2xl flex flex-col justify-between animate-pulse select-none">
    <div>
      <div className="mb-3.5">
        <div className="h-4 bg-base-200 rounded-md w-16"></div>
      </div>
      <div className="h-5 bg-base-300 rounded-md w-3/4 mb-3"></div>
      <div className="space-y-2">
        <div className="h-3 bg-base-200 rounded-md w-full"></div>
        <div className="h-3 bg-base-200 rounded-md w-5/6"></div>
      </div>
    </div>
  </div>
);

interface SearchResult {
  title: string;
  path: string;
  category: string;
  description: string;
  type?: string;
  is_pending?: boolean;
}

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const queryParam = searchParams?.get("query") || "";
  const categoryParam = searchParams?.get("category") || "All";

  useDocumentTitle(queryParam ? `Search: ${queryParam}` : "Search");

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [category, setCategory] = useState(categoryParam);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [dynamicCategories, setDynamicCategories] = useState<string[]>(["All"]);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    setHistory(getSearchHistory());
  }, []);

  const autoFocus = localStorage.getItem("wiki_autofocus_search") !== "false";
  // "Open links in new tab" applies to internal search-result links.
  const openInNewTab = localStorage.getItem("wiki_open_new_tab") === "true";

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const data = await apiService.searchPages(queryParam, 1, 6, category);
        setResults(data.results || []);
        setTotal(data.total || 0);
        setHasMore(data.hasMore || false);
        setDynamicCategories(data.categories || ["All"]);
        setPage(1);
      } catch (err) {
        console.error("Failed to fetch search results:", err);
      } finally {
        setLoading(false);
      }
    };
    if (queryParam) {
      fetchResults();
    } else {
      setResults([]);
      setTotal(0);
      setHasMore(false);
      setDynamicCategories(["All"]);
    }
  }, [queryParam, category]);

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const data = await apiService.searchPages(queryParam, nextPage, 6, category);
      setResults((prev) => [...prev, ...(data.results || [])]);
      setTotal(data.total || 0);
      setHasMore(data.hasMore || false);
      setPage(nextPage);
      if (data.categories) {
        setDynamicCategories(data.categories);
      }
    } catch (err) {
      console.error("Failed to fetch more search results:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    addSearchHistory(q);
    setHistory(getSearchHistory());
    router.push(`/search-results?query=${encodeURIComponent(q)}&category=${category}`);
  };

  useEffect(() => {
    const capCat = category.charAt(0).toUpperCase() + category.slice(1);
    if (!dynamicCategories.includes(capCat) && dynamicCategories.length > 0) {
      setCategory("All");
    }
  }, [dynamicCategories, category]);

  const selectCategory = (newCat: string) => {
    setCategory(newCat);
    router.push(`/search-results?query=${encodeURIComponent(searchQuery.trim())}&category=${newCat}`);
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
            <mark key={idx} className="bg-primary/20 text-primary px-0.5 rounded font-semibold">
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
    <div className="min-h-screen bg-base-100 font-sans">
      {/* Slim header — no full Navbar to avoid double header */}
      <div className="sticky top-0 z-40 bg-base-100/95 backdrop-blur-md border-b border-base-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="btn btn-ghost btn-sm btn-circle shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <BeautifulSearchBox
              value={searchQuery}
              onChange={setSearchQuery}
              onSubmit={handleSearchSubmit}
              placeholder="Search pages, people, news, categories…"
              variant="compact"
              autoFocus={autoFocus}
            />
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 pb-2">
          <BeautifulTabBar
            categories={dynamicCategories}
            activeCategory={category}
            onCategoryChange={selectCategory}
            categoryIconMap={CATEGORY_ICON_MAP}
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 pb-28">
        {history.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-base-content/40 mr-1">
              Recent
            </span>
            {history.map((item) => (
              <button
                key={item}
                onClick={() => {
                  setSearchQuery(item);
                  addSearchHistory(item);
                }}
                className="text-xs font-semibold text-base-content/70 bg-base-200 hover:bg-base-300 hover:text-base-content rounded-full px-3 py-1 transition-colors cursor-pointer"
              >
                {item}
              </button>
            ))}
            <button
              onClick={() => {
                clearSearchHistory();
                setHistory([]);
              }}
              className="text-[10px] font-bold uppercase tracking-wider text-base-content/40 hover:text-rose-500 transition-colors cursor-pointer ml-1"
            >
              Clear
            </button>
          </div>
        )}
        <div className="flex items-center justify-between mb-4 select-none">
          <p className="text-[10px] font-black text-base-content/50 uppercase tracking-widest">
            {loading ? "Searching…" : `${total} result${total !== 1 ? "s" : ""} found`}
          </p>
          {queryParam && (
            <p className="text-[10px] font-semibold text-base-content/40">
              for &ldquo;{queryParam}&rdquo;
            </p>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => <SearchResultSkeleton key={i} />)}
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {results.map((item) => {
                const colors = CATEGORY_COLOR_MAP[item.category] || {
                  bg: "bg-base-200",
                  text: "text-base-content/70",
                  border: "border-base-300",
                };
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    target={openInNewTab ? "_blank" : undefined}
                    rel={openInNewTab ? "noopener noreferrer" : undefined}
                    className="p-5 bg-base-100 border border-base-200 hover:border-primary/30 rounded-2xl flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group text-left cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3.5">
                        <span className={`text-[9px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-lg border ${colors.bg} ${colors.text} ${colors.border}`}>
                          {item.category}
                        </span>
                        {item.is_pending && (
                          <span className="badge badge-warning badge-xs">Pending</span>
                        )}
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

            {hasMore && (
              <div className="flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="btn btn-primary btn-sm rounded-xl px-6 font-bold cursor-pointer hover:scale-102 active:scale-98 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loadingMore ? (
                    <>
                      <span className="loading loading-spinner loading-xs" />
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-16 text-center select-none border border-dashed border-base-300 rounded-2xl bg-base-200/50 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center mx-auto text-base-content/50">
              <Search className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-base-content/85 mt-4">
              {queryParam ? "No results found" : "Start searching"}
            </h4>
            <p className="text-xs text-base-content/50 mt-1.5 px-6 leading-relaxed">
              {queryParam
                ? `Nothing matched "${queryParam}". Try different keywords.`
                : "Search across wiki pages, people, news, and categories."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-base-100 font-sans text-sm text-base-content/50 font-bold select-none">
        <span className="loading loading-spinner loading-md" />
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}
