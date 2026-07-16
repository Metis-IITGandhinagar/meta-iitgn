"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, BookOpen, PlusCircle, Pencil, Sparkles, Building2, Users2, Trophy, Tent, MapPin, FlaskConical, Calendar, Shield, TrendingUp, GraduationCap } from "lucide-react";
import { useEffect, useState } from "react";
import { apiService } from "@/api";
import CategoryEditModal from "@/components/CategoryEditModal";

export interface Article {
  slug: string;
  title: string;
  snippet: string;
  content: string;
}

export const ICON_MAP: Record<string, any> = {
  BookOpen,
  Building2,
  Users2,
  Trophy,
  Tent,
  MapPin,
  FlaskConical,
  Sparkles,
  Calendar,
  Shield,
  TrendingUp,
  GraduationCap,
};

interface CategoryPageProps {
  categorySlug: string;
  // When true, the page is rendered inside a modal (e.g. a Quick Portal) and
  // its page-only chrome (edit/new buttons, nested edit modal, top nav margin)
  // is suppressed.
  embedded?: boolean;
}

const ArticleSkeleton = () => (
  <div className="card card-compact card-bordered flex-1 min-w-75 md:max-w-[48%] lg:max-w-[32%] flex flex-col justify-between p-4 md:p-6 bg-base-100 border-base-200 shadow-[0_2px_10px_rgba(0,0,0,0.01)] animate-pulse select-none">
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
  const { user, categories } = useAuth();
  const category = categories?.find(c => c.slug === categorySlug);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Edit Category modal state — the form itself lives in <CategoryEditModal />.
  const [isEditing, setIsEditing] = useState(false);
  const handleStartEdit = () => setIsEditing(true);

  const loadCategoryArticles = async (pageNum = 1, append = false) => {
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
        snippet: art.description,
        content: ""
      }));

      setArticles(prev => append ? [...prev, ...mapped] : mapped);
      setHasMore(res.hasMore);
      setPage(pageNum);
    } catch (err) {
      console.error("Error loading category articles:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadCategoryArticles(1, false);
  }, [categorySlug]);

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
    <main className={`flex-1 p-6 md:p-8 ${embedded ? "" : "mt-15"} bg-transparent overflow-y-auto`}>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Category Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 text-primary rounded-2xl shadow-sm">
              {(() => {
                const IconComponent = ICON_MAP[category.icon || "BookOpen"] || BookOpen;
                return <IconComponent className="h-6 w-6" />;
              })()}
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-black text-base-content tracking-tight">
              {category.name}
            </h1>
            <p className="text-base-content/60 max-w-2xl text-sm md:text-base leading-relaxed">
              {category.description}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 mb-1">
            {!embedded && (user?.role === "admin" || user?.role === "moderator") && (
              <button
                onClick={handleStartEdit}
                className="btn btn-outline btn-sm font-bold rounded-xl shadow-xs transition-all duration-200 cursor-pointer active:scale-95"
              >
                <Pencil className="h-4.5 w-4.5" />
                <span>Edit Category</span>
              </button>
            )}
            {!embedded && (user?.role === "admin" || user?.role === "moderator") && (
              <Link
                href={`/wiki/${categorySlug}/new`}
                className="btn btn-primary btn-sm font-bold rounded-xl shadow-md transition-all duration-200 cursor-pointer text-primary-content"
              >
                <PlusCircle className="h-4.5 w-4.5" />
                <span>New Article</span>
              </Link>
            )}
          </div>
        </div>

        {/* Articles List / Grid (Horizontal Stack) */}
        <div>
          <h2 className="text-lg font-serif font-bold text-base-content mb-4 tracking-tight">
            Articles in this Category
          </h2>

          {loading ? (
            <div className="flex flex-col md:flex-row gap-6 flex-wrap w-full">
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
              <div className="flex flex-col md:flex-row gap-6 flex-wrap">
                {articles.map((article) => (
                  <div
                    key={article.slug}
                    className="card card-compact card-bordered flex-1 min-w-75 md:max-w-[48%] lg:max-w-[32%] flex flex-col justify-between p-4 md:p-6 bg-base-100 border-base-200 shadow-[0_2px_10px_rgba(0,0,0,0.01)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:border-primary transition-all duration-300 group"
                  >
                    <div className="space-y-2 md:space-y-3">
                      <h3 className="text-sm md:text-base font-bold text-base-content font-serif group-hover:text-primary transition-colors duration-300">
                        {article.title}
                      </h3>

                      <p className="text-xs text-base-content/60 leading-relaxed line-clamp-3">
                        {article.snippet}
                      </p>
                    </div>

                    <div className="pt-6">
                      <Link
                        href={`/wiki/${categorySlug}/${article.slug}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline transition-colors uppercase tracking-wider cursor-pointer"
                      >
                        <span>Read Article</span>
                        <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                ))}
                {loadingMore && (
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

      </div>

      {/* Edit Category Modal */}
      {isEditing && !embedded && category && (
        <CategoryEditModal category={category} onClose={() => setIsEditing(false)} />
      )}
    </main>
  );
}
