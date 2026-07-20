"use client";

import { useState, Suspense, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiService } from "@/api";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  Search,
  User,
  Newspaper,
  FolderOpen,
  FileText,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";
import { BeautifulSearchBox, BeautifulTabBar } from "@/components/helpers/SearchDesign";
import { getSearchHistory, addSearchHistory, clearSearchHistory } from "@/lib/searchHistory";
import Avatar from "@/components/helpers/Avatar";
import { useViewMode } from "@/hooks/useViewMode";
import ViewSwitcher from "@/components/helpers/ViewSwitcher";
import { getGridClass, getIconSize } from "@/lib/viewModes";
import UnifiedViewItem from "@/components/helpers/UnifiedViewItem";
import {
  CategoryIcon,
  CATEGORY_ICON_SET,
  isEmojiIcon,
} from "@/lib/categoryIcon";

// Tint any CSS color (hex, theme name, …) the same way the category
// editor does, so icon boxes read consistently across every surface.
const tint = (color: string, pct: number) =>
  `color-mix(in srgb, ${color} ${pct}%, transparent)`;

// Resolve a search result to a Lucide/emoji glyph. The API now returns each
// result's real `icon` (a Lucide key or emoji) for pages/categories; type-only
// results (profile/news) and category fallbacks use fixed glyphs.
const getResultIcon = (item: SearchResult, size: number): React.ReactNode => {
  if (item.type === "profile") return <User size={size} />;
  if (item.type === "news") return <Newspaper size={size} />;
  if (item.type === "category") {
    if (item.icon && (isEmojiIcon(item.icon) || CATEGORY_ICON_SET[item.icon])) {
      return <CategoryIcon icon={item.icon} size={size} />;
    }
    return <FolderOpen size={size} />;
  }
  // page — use its own/category icon when present, else a neutral doc glyph
  if (item.icon && (isEmojiIcon(item.icon) || CATEGORY_ICON_SET[item.icon])) {
    return <CategoryIcon icon={item.icon} size={size} />;
  }
  return <FileText size={size} />;
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
  slug?: string;
  category: string;
  description: string;
  type?: string;
  is_pending?: boolean;
  icon?: string;
  color?: string;
  categoryName?: string | null;
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
  const [categoryMeta, setCategoryMeta] = useState<Record<string, { icon: string; color: string }>>({});
  const [history, setHistory] = useState<string[]>([]);

  // Article-list view (Default / Tiles / Details / Icons S–XL), persisted
  // independently from the other surfaces via a search-specific key.
  const [view, setView] = useViewMode("meta_iitgn_search_view");

  // Map the API's per-category meta (icon key + color) into the Lucide
  // components the tab bar expects. Emoji icons can't be a component, so
  // those tabs fall back to a text label (handled by BeautifulTabBar).
  const categoryIconMap = useMemo<Record<string, LucideIcon>>(() => {
    const map: Record<string, LucideIcon> = {};
    for (const [label, meta] of Object.entries(categoryMeta)) {
      const comp = CATEGORY_ICON_SET[meta.icon];
      if (comp) map[label] = comp;
    }
    return map;
  }, [categoryMeta]);

  useEffect(() => {
    setHistory(getSearchHistory());
  }, []);

  const autoFocus = localStorage.getItem("wiki_autofocus_search") === "true";
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
        setCategoryMeta(data.categoryMeta || {});
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
      if (data.categoryMeta) {
        setCategoryMeta(data.categoryMeta);
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
            categoryIconMap={categoryIconMap}
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 pb-28">
        <div className="min-h-[2rem] flex flex-wrap items-center gap-2 mb-4">
          {history.length > 0 && (
            <>
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
            </>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mb-4 select-none">
          <p className="text-[10px] font-black text-base-content/50 uppercase tracking-widest">
            {loading ? "Searching…" : `${total} result${total !== 1 ? "s" : ""} found`}
          </p>
          <div className="flex items-center gap-2">
            {queryParam && (
              <p className="text-[10px] font-semibold text-base-content/40">
                for &ldquo;{queryParam}&rdquo;
              </p>
            )}
            <ViewSwitcher view={view} onChange={setView} />
          </div>
        </div>

        {loading ? (
          <div className={getGridClass(view)}>
            {[1,2,3,4].map(i => <SearchResultSkeleton key={i} />)}
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-8">
            <div className={getGridClass(view)}>
              {results.map((item) => {
                const displayCategory = item.category
                  ? item.category.charAt(0).toUpperCase() + item.category.slice(1)
                  : "All";
                // The API now returns each result's real icon/color (a Lucide
                // key or emoji) plus a human categoryName, so glyph + tint come
                // straight from the data instead of a name-keyed fallback map.
                const color = item.color || "#4f46e5";
                const iconBoxStyle: React.CSSProperties = {
                  backgroundColor: tint(color, 12),
                  color,
                  borderColor: tint(color, 25),
                };
                // Category results have no real route (/wiki/<slug> 404s); they
                // open via the home PortalOverlay, so deep-link to it instead.
                const href =
                  item.type === "category"
                    ? `/?overlay=portal&category=${encodeURIComponent(item.slug || "")}`
                    : openInNewTab
                      ? undefined
                      : item.path;
                return (
                  <UnifiedViewItem
                    key={item.path}
                    view={view}
                    href={href}
                    onClick={
                      openInNewTab
                        ? () => window.open(href || item.path, "_blank", "noopener,noreferrer")
                        : undefined
                    }
                    title={highlightText(item.title, queryParam)}
                    subtitle={item.categoryName || displayCategory}
                    description={highlightText(item.description, queryParam)}
                    icon={getResultIcon(item, getIconSize(view))}
                    iconBoxStyle={iconBoxStyle}
                    avatar={
                      item.type === "profile" ? (
                        <Avatar
                          name={item.title}
                          className="h-7 w-7 rounded-full object-cover ring-1 ring-base-300 shrink-0"
                        />
                      ) : undefined
                    }
                    topRightAction={
                      item.is_pending ? (
                        <span className="badge badge-warning badge-xs">Pending</span>
                      ) : undefined
                    }
                  />
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
