"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Article } from "@/lib/placeholder-articles";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, BookOpen, ChevronRight, PlusCircle, Loader2, Pencil, X, Sparkles, Building2, Users2, Trophy, Tent, MapPin, FlaskConical, Calendar, Shield, TrendingUp, GraduationCap } from "lucide-react";
import { useEffect, useState } from "react";
import { apiService } from "@/api";
import { parseMarkdown } from "@/lib/utils";

const ICON_MAP: Record<string, any> = {
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
}

export default function CategoryPage({ categorySlug }: CategoryPageProps) {
  const router = useRouter();
  const { user, categories, activeTier, updateCategoryState } = useAuth();
  const category = categories?.find(c => c.slug === categorySlug);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Edit Category states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIcon, setEditIcon] = useState("BookOpen");
  const [editError, setEditError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isGold = activeTier === "gold";

  const handleStartEdit = () => {
    if (!category) return;
    setEditName(category.name);
    setEditDescription(category.description);
    setEditIcon(category.icon || "BookOpen");
    setEditError("");
    setIsEditing(true);
  };

  const onEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) return;
    if (!editName.trim() || !editDescription.trim()) {
      setEditError("Name and description are required");
      return;
    }
    try {
      setEditError("");
      setSubmitting(true);
      const updatedCat = await apiService.updateCategory(category.category_id, {
        name: editName.trim(),
        description: editDescription.trim(),
        icon: editIcon || "BookOpen"
      });
      updateCategoryState(updatedCat);
      setIsEditing(false);
      if (updatedCat.slug !== categorySlug) {
        router.push(`/wiki/${updatedCat.slug}`);
      }
    } catch (err: any) {
      console.error(err);
      setEditError(err.response?.data?.error || err.message || "Failed to update category");
    } finally {
      setSubmitting(false);
    }
  };

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
      <main className="flex-1 p-6 md:p-8 lg:p-12 bg-[#FCFCFD]">
        <div className="max-w-4xl mx-auto text-center py-20">
          <h1 className="text-3xl font-bold text-gray-800">Category Not Found</h1>
          <p className="text-gray-500 mt-2">The requested wiki category does not exist.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6 md:p-8 mt-15 bg-[#FCFCFD] overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-gray-400 select-none">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-blue-700">{category.name}</span>
        </nav>

        {/* Category Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between border-b border-gray-100 pb-5 gap-6">
          <div className="space-y-3 flex-1">
            <div className="inline-flex items-center justify-center p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-sm">
              {(() => {
                const IconComponent = ICON_MAP[category.icon || "BookOpen"] || BookOpen;
                return <IconComponent className="h-6 w-6" />;
              })()}
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-black text-gray-900 tracking-tight">
              {category.name}
            </h1>
            <p className="text-gray-500 max-w-2xl text-sm md:text-base leading-relaxed">
              {category.description}
            </p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0 mb-1">
            {(user?.role === "admin" || user?.role === "moderator") && (
              <button
                onClick={handleStartEdit}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-250 text-gray-700 hover:bg-gray-50 rounded-xl text-xs md:text-sm font-bold shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer active:scale-95"
              >
                <Pencil className="h-4.5 w-4.5" />
                <span>Edit Category</span>
              </button>
            )}
            {(user?.role === "admin" || user?.role === "moderator") && (
              <Link
                href={`/wiki/${categorySlug}/new`}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs md:text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              >
                <PlusCircle className="h-4.5 w-4.5" />
                <span>New Article</span>
              </Link>
            )}
          </div>
        </div>

        {/* Articles List / Grid (Horizontal Stack) */}
        <div>
          <h2 className="text-lg font-serif font-bold text-gray-800 mb-4 tracking-tight">
            Articles in this Category
          </h2>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
          ) : articles.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-gray-200 rounded-2xl text-gray-400 text-sm">
              No articles are currently listed under this category.
            </div>
          ) : (
            <div className="w-full flex flex-col gap-8">
              <div className="flex flex-col md:flex-row gap-6 flex-wrap">
                {articles.map((article) => (
                  <div
                    key={article.slug}
                    className="flex-1 min-w-75 md:max-w-[48%] lg:max-w-[32%] flex flex-col justify-between p-4 md:p-6 bg-white border border-gray-150 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.01)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:border-blue-200 transition-all duration-300 group"
                  >
                    <div className="space-y-2 md:space-y-3">
                      <h3 className="text-sm md:text-base font-bold text-gray-800 font-serif group-hover:text-blue-600 transition-colors duration-300">
                        {article.title}
                      </h3>
                      
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                        {article.snippet}
                      </p>
                    </div>

                    <div className="pt-6">
                      <Link
                        href={`/wiki/${categorySlug}/${article.slug}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors uppercase tracking-wider cursor-pointer"
                      >
                        <span>Read Article</span>
                        <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {hasMore && (
                <div className="w-full flex justify-center pt-4">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-2 px-6 py-3 border border-gray-200 hover:border-gray-300 text-gray-700 bg-white hover:bg-gray-55 rounded-xl text-sm font-bold shadow-sm transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <span>Loading...</span>
                      </>
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

      {/* Edit Category Modal Overlay */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-200">
          <form
            onSubmit={onEditSubmit}
            className="w-full h-full sm:h-auto sm:max-w-md bg-white border-0 sm:border border-gray-100 p-6 rounded-none sm:rounded-2xl shadow-none sm:shadow-xl space-y-4 animate-in zoom-in-95 duration-200 overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-blue-700 font-bold">
                <Pencil className="h-5 w-5" />
                <span>Edit Category</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditError("");
                }}
                className="text-gray-400 hover:text-gray-650 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 text-xs bg-rose-50 text-rose-600 border border-rose-100 rounded-lg">
                {editError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-770 uppercase">
                Category Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Category Name"
                className="w-full px-3 py-2 text-sm border border-gray-200 text-gray-600 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Description
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Description..."
                className="w-full px-3 py-2 text-sm border border-gray-200 text-gray-600 rounded-xl focus:outline-none focus:border-blue-500 transition-colors min-h-20 max-h-40"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-750 uppercase block">
                Category Icon
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 max-w-lg">
                {Object.keys(ICON_MAP).map((iconKey) => {
                  const IconComponent = ICON_MAP[iconKey];
                  const isSelected = editIcon === iconKey;
                  return (
                    <button
                      key={iconKey}
                      type="button"
                      onClick={() => setEditIcon(iconKey)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer active:scale-95 group ${
                        isSelected
                          ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20 scale-105"
                          : "bg-white border-gray-200 text-gray-500 hover:text-gray-850 hover:border-gray-350"
                      }`}
                      title={iconKey}
                    >
                      <IconComponent className="h-5 w-5" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditError("");
                }}
                className="px-3.5 py-1.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-55 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}