"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, BookOpen, ChevronRight, FolderPlus, PlusCircle, Search, Sparkles } from "lucide-react";
import { getAllCategories, addCustomCategory } from "@/lib/categories";
import { apiService } from "@/api";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any>({});
  const [articleCounts, setArticleCounts] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [error, setError] = useState("");

  const loadCategoriesData = () => {
    const allCats = getAllCategories();
    setCategories(allCats);
  };

  useEffect(() => {
    loadCategoriesData();

    // Fetch articles to count them dynamically
    async function loadCounts() {
      try {
        const [recentNew, recentUpdated] = await Promise.all([
          apiService.getRecentNewPages(200),
          apiService.getRecentUpdatedPages(200),
        ]);
        const merged = [...recentNew, ...recentUpdated];
        const uniquePagesMap = new Map();
        for (const page of merged) {
          uniquePagesMap.set(page.slug || page.page_id, page);
        }
        const pages = Array.from(uniquePagesMap.values());

        // Count per category
        const counts: Record<string, number> = {};
        for (const page of pages) {
          const meta = page.metadata || {};
          let cat = (meta.category || "").toLowerCase().trim();
          if (cat) {
            counts[cat] = (counts[cat] || 0) + 1;
          }
        }
        setArticleCounts(counts);
      } catch (err) {
        console.error("Error loading article counts:", err);
      }
    }
    loadCounts();
  }, []);

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setError("Category name is required.");
      return;
    }

    const slug = addCustomCategory(newName.trim(), newDescription.trim());
    if (!slug) {
      setError("Failed to create category. A category with this name might already exist.");
      return;
    }

    // Reset and reload
    setNewName("");
    setNewDescription("");
    setError("");
    setShowAddForm(false);
    loadCategoriesData();
  };

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    const list = Object.entries(categories).map(([slug, info]: [string, any]) => ({
      slug,
      name: info.name,
      description: info.description,
      count: articleCounts[slug] || 0,
    }));

    if (!searchQuery) return list;

    return list.filter(
      (cat) =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categories, searchQuery, articleCounts]);

  return (
    <main className="flex-1 p-6 md:p-8 mt-15 bg-[#FCFCFD] overflow-y-auto min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-gray-400 select-none">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-blue-700">All Categories</span>
        </nav>

        {/* Categories Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between border-b border-gray-100 pb-5 gap-6">
          <div className="space-y-3 flex-1">
            <div className="inline-flex items-center justify-center p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-sm">
              <BookOpen className="h-6 w-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-black text-gray-900 tracking-tight">
              Wiki Categories
            </h1>
            <p className="text-gray-500 max-w-2xl text-sm md:text-base leading-relaxed">
              Browse page categories across META IITGN Wiki, explore matching articles, or create your own custom categories.
            </p>
          </div>
          
          <div className="shrink-0 mb-1">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs md:text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            >
              <PlusCircle className="h-4.5 w-4.5" />
              <span>Create Category</span>
            </button>
          </div>
        </div>

        {/* Create Category Dialog Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreateCategory}
            className="p-6 bg-white border border-blue-100 rounded-2xl shadow-md space-y-4 max-w-xl animate-in fade-in slide-in-from-top-4 duration-250"
          >
            <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
              <FolderPlus className="h-5 w-5" />
              <span>Add Custom Category</span>
            </div>

            {error && (
              <div className="p-3 text-xs bg-rose-50 text-rose-600 border border-rose-100 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="cat-name" className="text-xs font-bold text-gray-500 uppercase">
                Category Name
              </label>
              <input
                id="cat-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Alumni, Research Grants, Internships"
                className="w-full px-3 py-2 text-sm border border-gray-250 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cat-desc" className="text-xs font-bold text-gray-500 uppercase">
                Description
              </label>
              <textarea
                id="cat-desc"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Brief summary of what pages are found in this category..."
                className="w-full px-3 py-2 text-sm border border-gray-250 rounded-xl focus:outline-none focus:border-blue-500 transition-colors min-h-20 max-h-40"
              />
            </div>

            <div className="flex items-center gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setError("");
                }}
                className="px-3.5 py-1.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
              >
                Create
              </button>
            </div>
          </form>
        )}

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-450 h-4.5 w-4.5" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full text-sm bg-white placeholder-gray-450 focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
          />
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((cat) => (
            <div
              key={cat.slug}
              className="flex flex-col justify-between p-6 bg-white border border-gray-150 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.01)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:border-blue-200 transition-all duration-300 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <Sparkles className="h-3 w-3 text-blue-500" />
                    <span>Category</span>
                  </div>
                  {cat.count > 0 && (
                    <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                      {cat.count} articles
                    </span>
                  )}
                </div>
                
                <h3 className="text-base font-bold text-gray-800 font-serif group-hover:text-blue-600 transition-colors duration-300">
                  {cat.name}
                </h3>
                
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                  {cat.description || "No description provided."}
                </p>
              </div>

              <div className="pt-6">
                <Link
                  href={`/wiki/${cat.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors uppercase tracking-wider cursor-pointer"
                >
                  <span>Explore Category</span>
                  <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}
