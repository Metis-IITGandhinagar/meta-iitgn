"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useHomeStore } from "@/store/useHomeStore";
import { PlusCircle, Pencil } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import { apiService } from "@/api";
import CategoryEditModal from "@/components/overlays/CategoryEditModal";
import CategoryCreateForm from "@/components/overlays/CategoryCreateForm";
import CategoryIconPicker from "@/components/overlays/CategoryIconPicker";
import { CategoryIcon } from "@/lib/categoryIcon";
import { useViewMode } from "@/hooks/useViewMode";
import ViewSwitcher from "@/components/helpers/ViewSwitcher";
import { getGridClass, humanizeSlug, getIconSize } from "@/lib/viewModes";
import UnifiedViewItem from "@/components/helpers/UnifiedViewItem";

export interface Article {
  slug: string;
  title: string;
  icon?: string | null;
  color?: string | null;
}

interface CategoryPageProps {
  categorySlug: string;
  // When true, the page is rendered inside a modal (e.g. a Quick Portal). Only
  // the page-only layout chrome is suppressed (the top-nav margin and the
  // page's own scroll container — the modal body already scrolls). All
  // management features (add subcategory, edit, new article, icon picker) are
  // kept so the overlay is a full-featured replacement for the route page.
  embedded?: boolean;
}

// localStorage keys for the user's preferred list views on category pages.
// Subcategories and Articles keep fully independent settings.
const CATEGORY_VIEW_KEY = "meta_iitgn_category_view";
const SUBCATEGORY_VIEW_KEY = "meta_iitgn_subcategory_view";

// Module-level cache of a category's loaded article list. The PortalOverlay
// unmounts CategoryPage whenever the Quick Portal closes, discarding its state,
// so the cache lives here (not in component state) to survive re-opens. Entries
// expire after a short TTL so newly created/edited articles still surface
// without a manual refresh.
const CATEGORY_ARTICLES_TTL = 2 * 60 * 1000; // 2 minutes

interface CategoryArticlesCacheEntry {
  articles: Article[];
  page: number;
  hasMore: boolean;
  ts: number;
}

const categoryArticlesCache = new Map<string, CategoryArticlesCacheEntry>();

const ArticleSkeleton = () => (
  <div className="card card-compact card-border w-full flex flex-col justify-between p-4 md:p-6 bg-base-100 border-base-200 shadow-[0_2px_10px_rgba(0,0,0,0.01)] animate-pulse select-none">
    <div className="space-y-3">
      <div className="h-4 bg-base-300 rounded-md w-3/4"></div>
      <div className="space-y-2">
        <div className="h-3 bg-base-200 rounded-md w-full"></div>
        <div className="h-3 bg-base-200 rounded-md w-5/6"></div>
      </div>
    </div>
    <div className="pt-6">
      <div className="h-3 bg-base-300 rounded-md w-20"></div>
    </div>
  </div>
);

export default function CategoryPage({ categorySlug, embedded = false }: CategoryPageProps) {
  const { user, categories, updateCategoryState } = useAuth();
  const { setActivePortalCategory, setActiveOverlay } = useHomeStore();
  const category = categories?.find(c => c.slug === categorySlug);
  const childCategories = (categories || []).filter(c => category && c.parent_id === category.category_id);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Article-list view (Default / Tiles / Details / Icons S–XL). Persisted to
  // localStorage under a category-page-specific key; hydrated after mount to
  // avoid a hydration mismatch (the server render has no localStorage).
  const [view, setView] = useViewMode(CATEGORY_VIEW_KEY);

  // Subcategory-list view — a separate persisted preference from the Articles
  // view so changing one never disturbs the other.
  const [subView, setSubView] = useViewMode(SUBCATEGORY_VIEW_KEY);

  // Edit Category modal state — the form itself lives in <CategoryEditModal />.
  const [isEditing, setIsEditing] = useState(false);
  const handleStartEdit = () => setIsEditing(true);

  // Gate the edit-modal portal on client mount so createPortal never runs during
  // SSR (where `document` is undefined).
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  // Icon picker popover (admin/moderator only) — opened by clicking the
  // category icon in the header; lets you set an icon+color or an emoji.
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const canManage = user?.role === "admin" || user?.role === "moderator";

  const handleIconSave = async (icon: string, color: string) => {
    if (!category) return;
    try {
      const updated = await apiService.updateCategory(category.category_id, { icon, color });
      updateCategoryState(updated);
      toast.success("Icon updated");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Failed to update icon");
      throw err;
    }
  };

  // "Add Subcategory" inline form state.
  const [showAddSub, setShowAddSub] = useState(false);

  const loadCategoryArticles = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      const res = await apiService.getCategoryArticles(categorySlug, { page: pageNum, limit: 6 });

      const mapped: Article[] = res.articles.map((art: any) => ({
        slug: art.slug,
        title: art.title,
        icon: art.icon,
        color: art.color
      }));

      setArticles(prev => {
        const next = append ? [...prev, ...mapped] : mapped;
        // Persist the freshly loaded list so a later re-open renders instantly
        // from the cache instead of refetching from the server.
        categoryArticlesCache.set(categorySlug, {
          articles: next,
          page: pageNum,
          hasMore: res.hasMore,
          ts: Date.now(),
        });
        return next;
      });
      setHasMore(res.hasMore);
      setPage(pageNum);
    } catch (err) {
      console.error("Error loading category articles:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [categorySlug]);

  useEffect(() => {
    // Reuse a cached article list while it's still fresh so re-opening the same
    // category — or bouncing back to it from a subcategory — is instant instead
    // of firing a fresh fetch every time the overlay mounts.
    const cached = categoryArticlesCache.get(categorySlug);
    if (cached && Date.now() - cached.ts < CATEGORY_ARTICLES_TTL) {
      setArticles(cached.articles);
      setPage(cached.page);
      setHasMore(cached.hasMore);
      setLoading(false);
      return;
    }
    loadCategoryArticles(1, false);
  }, [categorySlug, loadCategoryArticles]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadCategoryArticles(page + 1, true);
    }
  };

  if (!category) {
    return (
      <main className="flex-1 p-6 md:p-8 lg:p-12 bg-transparent">
        <div className="max-w-4xl mx-auto text-center py-20">
          <h1 className="text-3xl font-bold text-base-content">Category Not Found</h1>
          <p className="text-base-content/60 mt-2">The requested wiki category does not exist.</p>
          <Link
            href="/"
            className="btn btn-primary inline-flex items-center gap-2 mt-6 text-primary-content rounded-lg text-sm font-semibold transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className={`flex-1 p-6 md:p-8 ${embedded ? "" : "mt-15"} bg-transparent ${embedded ? "" : "overflow-y-auto"} ${loading ? "no-scrollbar" : ""}`}>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Category Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="relative">
              {canManage ? (
                <button
                  type="button"
                  onClick={() => setIconPickerOpen((o) => !o)}
                  className="inline-flex items-center justify-center p-3 rounded-2xl shadow-sm transition-transform duration-200 cursor-pointer hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: `${category.color || "#4f46e5"}1a`,
                    color: category.color || "#4f46e5",
                  }}
                  title="Set icon"
                >
                  <CategoryIcon icon={category.icon} size={24} />
                </button>
              ) : (
                <div
                  className="inline-flex items-center justify-center p-3 rounded-2xl shadow-sm"
                  style={{
                    backgroundColor: `${category.color || "#4f46e5"}1a`,
                    color: category.color || "#4f46e5",
                  }}
                >
                  <CategoryIcon icon={category.icon} size={24} />
                </div>
              )}
              {iconPickerOpen && canManage && (
                <CategoryIconPicker
                  currentIcon={category.icon}
                  currentColor={category.color || "#4f46e5"}
                  onSave={handleIconSave}
                  onClose={() => setIconPickerOpen(false)}
                />
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-black text-base-content tracking-tight">
              {category.name}
            </h1>
            <p className="text-base-content/60 max-w-2xl text-sm md:text-base leading-relaxed">
              {category.description}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 mb-1">
            {(user?.role === "admin" || user?.role === "moderator") && (
              <button
                onClick={() => setShowAddSub((s) => !s)}
                className="btn btn-outline btn-sm font-bold rounded-xl shadow-sm transition-all duration-200 cursor-pointer active:scale-95"
              >
                <PlusCircle className="h-4.5 w-4.5" />
                <span>Add Subcategory</span>
              </button>
            )}
            {(user?.role === "admin" || user?.role === "moderator") && (
              <button
                onClick={handleStartEdit}
                className="btn btn-outline btn-sm font-bold rounded-xl shadow-sm transition-all duration-200 cursor-pointer active:scale-95"
              >
                <Pencil className="h-4.5 w-4.5" />
                <span>Edit Category</span>
              </button>
            )}
            {(user?.role === "admin" || user?.role === "moderator") && (
              <Link
                href={`/wiki/${categorySlug}/new`}
                className="btn btn-primary btn-sm font-bold rounded-xl shadow-sm transition-all duration-200 cursor-pointer active:scale-95 text-primary-content"
              >
                <PlusCircle className="h-4.5 w-4.5" />
                <span>New Article</span>
              </Link>
            )}
          </div>
        </div>

        {/* Inline Add Subcategory form — opens as a panel, not a modal */}
        {showAddSub && (user?.role === "admin" || user?.role === "moderator") && category && (
          <CategoryCreateForm
            defaultParentId={category.category_id}
            parentName={category.name}
            onCancel={() => setShowAddSub(false)}
          />
        )}

        {/* Subcategories — child categories live "inside" their parent */}
        {childCategories.length > 0 && (
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-serif font-bold text-base-content tracking-tight">
                Subcategories
              </h2>

              <ViewSwitcher view={subView} onChange={setSubView} />
            </div>
            <div className={getGridClass(subView)}>
              {childCategories.map((child) => {
                const childColor = child.color || "#4f46e5";
                const iconBoxStyle = {
                  backgroundColor: `${childColor}1a`,
                  borderColor: `${childColor}33`,
                  color: childColor,
                };
                const childIcon = <CategoryIcon icon={child.icon} size={getIconSize(subView)} />;
                const openChild = () => {
                  setActivePortalCategory(child.slug);
                  setActiveOverlay("portal");
                };

                return (
                  <UnifiedViewItem
                    key={child.slug}
                    view={subView}
                    onClick={openChild}
                    title={child.name}
                    description={subView === "details" ? undefined : (child.description || "No description provided.")}
                    subtitle={subView === "details" ? humanizeSlug(child.slug) : undefined}
                    icon={childIcon}
                    iconBoxStyle={iconBoxStyle}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Articles List / Grid (Horizontal Stack) — hidden entirely when there
            are no articles (and we're not still loading them). */}
        {(loading || articles.length > 0) && (
        <div>
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-serif font-bold text-base-content tracking-tight">
              Articles in this Category
            </h2>

            <ViewSwitcher view={view} onChange={setView} />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
              <ArticleSkeleton />
              <ArticleSkeleton />
              <ArticleSkeleton />
            </div>
          ) : articles.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-base-300 rounded-2xl text-base-content/50 text-sm">
              No articles are currently listed under this category.
            </div>
          ) : (
            <div className="w-full flex flex-col gap-8">
              <div className={getGridClass(view)}>
                {articles.map((article) => {
                  // Each page carries its own icon+color (emoji or Lucide key),
                  // editable from the article header. Fall back to the category's
                  // icon/color when a page hasn't set its own.
                  const pageColor = article.color || category.color || "#4f46e5";
                  const iconBoxStyle = {
                    backgroundColor: `${pageColor}1a`,
                    borderColor: `${pageColor}33`,
                    color: pageColor,
                  };
                  const href = `/wiki/${categorySlug}/${article.slug}`;
                  const pageIcon = (
                    <CategoryIcon
                      icon={article.icon || category.icon}
                      size={getIconSize(view)}
                    />
                  );

                  return (
                    <UnifiedViewItem
                      key={article.slug}
                      view={view}
                      href={href}
                      title={article.title}
                      subtitle={view === "details" ? humanizeSlug(article.slug) : undefined}
                      icon={pageIcon}
                      iconBoxStyle={iconBoxStyle}
                    />
                  );
                })}
                {loadingMore && !view.startsWith("icon-") && (
                  <>
                    <ArticleSkeleton />
                    <ArticleSkeleton />
                    <ArticleSkeleton />
                  </>
                )}
              </div>

              {hasMore && (
                <div className="w-full flex justify-center pt-4">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="btn btn-outline btn-md font-bold rounded-xl shadow-sm transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <span>Loading more...</span>
                    ) : (
                      <span>Load More Articles</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        )}

      </div>

      {/* Edit Category Modal — portaled to document.body so it renders as a true
          top-level dialog above the page/portal modal instead of being trapped
          inside its scrollable body. */}
      {isMounted && isEditing && category && createPortal(
        <CategoryEditModal category={category} onClose={() => setIsEditing(false)} />,
        document.body
      )}
    </main>
  );
}
