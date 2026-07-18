"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { BookOpen, ChevronRight, FolderPlus, PlusCircle, Search, Sparkles, Pencil, X, Pin, Building2, Users2, Trophy, Tent, MapPin, FlaskConical, Calendar, Shield, TrendingUp, Loader2, GraduationCap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { apiService } from "@/api";
import { Category } from "@/context/AuthContext";
import { toast } from "react-hot-toast";

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

interface CategoryFormInput {
  name: string;
  description: string;
  icon: string;
}

export default function CategoriesPage() {
  useDocumentTitle("Categories");
  const router = useRouter();
  const { user, categories, addCategoryState, updateCategoryState, activeTier } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Add Category form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState("");

  // Edit Category form states
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editError, setEditError] = useState("");
  const [pinningCategoryId, setPinningCategoryId] = useState<number | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CategoryFormInput>({
    defaultValues: { icon: "BookOpen" }
  });
  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, setValue: setValueEdit, watch: watchEdit, formState: { errors: editErrors } } = useForm<CategoryFormInput>({
    defaultValues: { icon: "BookOpen" }
  });

  const isGold = activeTier === "gold";
  const selectedIcon = watch("icon") || "BookOpen";
  const selectedIconEdit = watchEdit("icon") || "BookOpen";

  const onCreateSubmit = async (data: CategoryFormInput) => {
    try {
      setError("");
      const newCat = await apiService.createCategory({
        name: data.name.trim(),
        description: data.description.trim(),
        icon: data.icon || "BookOpen"
      });
      addCategoryState(newCat);
      reset();
      setShowAddForm(false);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.message || "Failed to create category");
    }
  };

  const handleStartEdit = (cat: Category) => {
    setEditingCategory(cat);
    setValueEdit("name", cat.name);
    setValueEdit("description", cat.description);
    setValueEdit("icon", cat.icon || "BookOpen");
  };

  const onEditSubmit = async (data: CategoryFormInput) => {
    if (!editingCategory) return;
    try {
      setEditError("");
      const updatedCat = await apiService.updateCategory(editingCategory.category_id, {
        name: data.name.trim(),
        description: data.description.trim(),
        icon: data.icon || "BookOpen"
      });
      updateCategoryState(updatedCat);
      resetEdit();
      setEditingCategory(null);
    } catch (err: any) {
      console.error(err);
      setEditError(err.response?.data?.error || err.message || "Failed to update category");
    }
  };

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;

    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categories, searchQuery]);

  return (
    <main className="flex-1 p-6 md:p-8 mt-15 bg-transparent overflow-y-auto min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-base-content/50 select-none">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-primary">All Categories</span>
        </nav>

        {/* Categories Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 text-primary rounded-2xl shadow-sm">
              <BookOpen className="h-6 w-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-black text-base-content tracking-tight">
              Wiki Categories
            </h1>
            <p className="text-base-content/60 max-w-2xl text-sm md:text-base leading-relaxed">
              Browse page categories across META IITGN Wiki, explore matching articles, or create your own custom categories.
            </p>
          </div>

          {user && (
            <div className="shrink-0 mb-1">
              <button
                onClick={() => {
                  setShowAddForm(!showAddForm);
                  reset();
                  setError("");
                }}
                className="btn btn-primary btn-sm font-bold rounded-xl shadow-sm transition-all duration-200 cursor-pointer text-primary-content"
              >
                <PlusCircle className="h-4.5 w-4.5" />
                <span>Create Category</span>
              </button>
            </div>
          )}
        </div>

        {/* Create Category Form */}
        {showAddForm && (
          <form
            onSubmit={handleSubmit(onCreateSubmit)}
            className="p-6 bg-base-100 border border-primary/20 rounded-2xl shadow-md space-y-4 max-w-xl animate-in fade-in slide-in-from-top-4 duration-250"
          >
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <FolderPlus className="h-5 w-5" />
              <span>Add Custom Category</span>
            </div>

            {error && (
              <div className="p-3 text-xs bg-rose-50 text-rose-600 border border-rose-100 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="cat-name" className="text-xs font-bold text-base-content/80 uppercase">
                Category Name
              </label>
              <input
                id="cat-name"
                type="text"
                {...register("name", { required: "Category name is required" })}
                placeholder="e.g. Alumni, Research Grants, Internships"
                className="w-full px-3 py-2 text-sm border border-base-300 text-gray-600 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
              />
              {errors.name && (
                <span className="text-[10px] text-rose-500 font-semibold">{errors.name.message}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cat-desc" className="text-xs font-bold text-base-content/60 uppercase">
                Description
              </label>
              <textarea
                id="cat-desc"
                {...register("description", { required: "Description is required" })}
                placeholder="Brief summary of what pages are found in this category..."
                className="w-full px-3 py-2 text-sm border border-base-300 text-gray-600 rounded-xl focus:outline-none focus:border-blue-500 transition-colors min-h-20 max-h-40"
              />
              {errors.description && (
                <span className="text-[10px] text-rose-500 font-semibold">{errors.description.message}</span>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-750 uppercase block">
                Category Icon
              </label>
              <input type="hidden" {...register("icon", { required: "Category icon is required" })} />
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 bg-base-200 p-3.5 rounded-2xl border border-base-300/60 max-w-lg">
                {Object.keys(ICON_MAP).map((iconKey) => {
                  const IconComponent = ICON_MAP[iconKey];
                  const isSelected = selectedIcon === iconKey;
                  return (
                    <button
                      key={iconKey}
                      type="button"
                      onClick={() => setValue("icon", iconKey)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer active:scale-95 group ${isSelected
                          ? "bg-primary border-primary text-primary-content shadow-md shadow-primary/20 scale-105"
                          : "bg-base-100 border-base-300 text-base-content/60 hover:text-gray-850 hover:border-gray-350"
                        }`}
                      title={iconKey}
                    >
                      <IconComponent className="h-5 w-5" />
                    </button>
                  );
                })}
              </div>
              {errors.icon && (
                <span className="text-[10px] text-rose-500 font-semibold">{errors.icon.message}</span>
              )}
            </div>

            <div className="flex items-center gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setError("");
                }}
                className="px-3.5 py-1.5 border border-base-300 rounded-xl text-xs font-bold text-base-content/60 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-primary-content rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                Create
              </button>
            </div>
          </form>
        )}

        {/* Edit Category Modal Overlay */}
        {editingCategory && (
          <div className="fixed inset-0 bg-base-content/40 backdrop-blur-xs flex items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-200">
            <form
              onSubmit={handleSubmitEdit(onEditSubmit)}
              className="w-full h-full sm:h-auto sm:max-w-md bg-base-100 border-0 sm:border border-base-200 p-6 rounded-none sm:rounded-2xl shadow-none sm:shadow-xl space-y-4 animate-in zoom-in-95 duration-200 overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-base-200 pb-3">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <Pencil className="h-5 w-5" />
                  <span>Edit Category</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategory(null);
                    setEditError("");
                  }}
                  className="text-base-content/50 hover:text-gray-650 cursor-pointer"
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
                  {...registerEdit("name", { required: "Category name is required" })}
                  placeholder="Category Name"
                  className="w-full px-3 py-2 text-sm border border-base-300 text-gray-600 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                />
                {editErrors.name && (
                  <span className="text-[10px] text-rose-500 font-semibold">{editErrors.name.message}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-base-content/60 uppercase">
                  Description
                </label>
                <textarea
                  {...registerEdit("description", { required: "Description is required" })}
                  placeholder="Description..."
                  className="w-full px-3 py-2 text-sm border border-base-300 text-gray-600 rounded-xl focus:outline-none focus:border-blue-500 transition-colors min-h-20 max-h-40"
                />
                {editErrors.description && (
                  <span className="text-[10px] text-rose-500 font-semibold">{editErrors.description.message}</span>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-750 uppercase block">
                  Category Icon
                </label>
                <input type="hidden" {...registerEdit("icon", { required: "Category icon is required" })} />
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 bg-base-200 p-3.5 rounded-2xl border border-base-300/60 max-w-lg">
                  {Object.keys(ICON_MAP).map((iconKey) => {
                    const IconComponent = ICON_MAP[iconKey];
                    const isSelected = selectedIconEdit === iconKey;
                    return (
                      <button
                        key={iconKey}
                        type="button"
                        onClick={() => setValueEdit("icon", iconKey)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer active:scale-95 group ${isSelected
                            ? "bg-primary border-primary text-primary-content shadow-md shadow-primary/20 scale-105"
                            : "bg-base-100 border-base-300 text-base-content/60 hover:text-gray-850 hover:border-gray-350"
                          }`}
                        title={iconKey}
                      >
                        <IconComponent className="h-5 w-5" />
                      </button>
                    );
                  })}
                </div>
                {editErrors.icon && (
                  <span className="text-[10px] text-rose-500 font-semibold">{editErrors.icon.message}</span>
                )}
              </div>

              <div className="flex items-center gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategory(null);
                    setEditError("");
                  }}
                  className="px-3.5 py-1.5 border border-base-300 rounded-xl text-xs font-bold text-base-content/60 hover:bg-gray-55 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-primary-content rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-450 h-4.5 w-4.5" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border text-base-content border-gray-400 rounded-full text-sm bg-base-100 placeholder-gray-450 focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
          />
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {filteredCategories.map((cat) => (
            <div
              key={cat.slug}
              onClick={() => {
                router.push(`/wiki/${cat.slug}`);
              }}
              className={`card card-compact card-border relative flex flex-col justify-between p-4 md:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.01)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 group cursor-pointer ${cat.is_pinned
                  ? "bg-primary/10 border-2 border-primary hover:border-primary/80"
                  : "bg-base-100 border border-base-200 hover:border-primary"
                }`}
            >
              {/* Overlay Link to make the whole card clickable */}
              <Link href={`/wiki/${cat.slug}`} className="absolute inset-0 z-0 rounded-2xl" aria-label={`Explore ${cat.name}`} />

              <div className="space-y-2 relative z-10 pointer-events-none">
                {/* Header Row: Icon & Title on left, Buttons on right */}
                <div className="flex items-center justify-between gap-3 pointer-events-auto">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-50/80 border border-primary/20 flex items-center justify-center shrink-0 shadow-sm transition-all duration-300 group-hover:bg-blue-100/50">
                      {(() => {
                        const IconComponent = ICON_MAP[cat.icon || "BookOpen"] || Sparkles;
                        return <IconComponent className="h-4 w-4 text-primary" />;
                      })()}
                    </div>
                    <h3 className="text-sm md:text-base font-bold text-base-content font-serif group-hover:text-primary transition-colors duration-300 truncate">
                      {cat.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {cat.total_articles > 0 && (
                      <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full select-none">
                        {cat.total_articles}<span className="hidden sm:inline"> articles</span>
                      </span>
                    )}
                    {isGold && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const pinnedCount = categories.filter((c) => c.is_pinned).length;
                          if (!cat.is_pinned && pinnedCount >= 10) {
                            toast.error("Quick Portals is full! You can pin a maximum of 10 categories. Please unpin another category first.");
                            return;
                          }
                          setPinningCategoryId(cat.category_id);
                          try {
                            const updated = await apiService.updateCategory(cat.category_id, {
                              is_pinned: !cat.is_pinned
                            });
                            updateCategoryState(updated);
                          } catch (err) {
                            console.error(err);
                            toast.error("Failed to toggle pin");
                          } finally {
                            setPinningCategoryId(null);
                          }
                        }}
                        disabled={pinningCategoryId === cat.category_id}
                        className={`p-1 rounded-lg hover:bg-base-200 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed ${cat.is_pinned ? "text-primary hover:text-primary bg-blue-50/50" : "text-base-content/50 hover:text-primary"
                          }`}
                        title={cat.is_pinned ? "Unpin from Quick Portal" : "Pin to Quick Portal"}
                      >
                        {pinningCategoryId === cat.category_id ? (
                          <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                        ) : (
                          <Pin className={`h-3.5 w-3.5 ${cat.is_pinned ? 'fill-blue-600' : ''}`} style={{ transform: cat.is_pinned ? 'rotate(45deg)' : 'none' }} />
                        )}
                      </button>
                    )}
                    {isGold && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(cat);
                        }}
                        className="p-1 text-base-content/50 hover:text-primary rounded-lg hover:bg-gray-55 transition-all duration-150 cursor-pointer"
                        title="Edit Category"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Body: Description */}
                <p className="text-xs text-base-content/60 leading-relaxed line-clamp-4 md:pl-10.5">
                  {cat.description || "No description provided."}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}
