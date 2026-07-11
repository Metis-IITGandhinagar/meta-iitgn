"use client";

import Link from "next/link";
import { CATEGORIES_DATA } from "@/lib/placeholder-articles";
import { ArrowRight, BookOpen, ChevronRight, FileText, PlusCircle } from "lucide-react";

interface CategoryPageProps {
  categorySlug: string;
}

export default function CategoryPage({ categorySlug }: CategoryPageProps) {
  const category = CATEGORIES_DATA[categorySlug];

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
        <div className="flex flex-col md:flex-row md:items-end md:justify-between border-b border-gray-100  gap-6">
          <div className="space-y-3 flex-1">
            <div className="inline-flex items-center justify-center p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-sm">
              <BookOpen className="h-6 w-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-black text-gray-900 tracking-tight">
              {category.name}
            </h1>
            <p className="text-gray-500 max-w-2xl text-sm md:text-base leading-relaxed">
              {category.description}
            </p>
          </div>
          
          <div className="shrink-0 mb-1">
            <Link
              href={`/wiki/${categorySlug}/new`}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs md:text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            >
              <PlusCircle className="h-4.5 w-4.5" />
              <span>New Article</span>
            </Link>
          </div>
        </div>

        {/* Articles List / Grid (Horizontal Stack) */}
        <div>
          <h2 className="text-lg font-serif font-bold text-gray-800 mb-4 tracking-tight">
            Articles in this Category
          </h2>

          {category.articles.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-gray-200 rounded-2xl text-gray-400 text-sm">
              No articles are currently listed under this category.
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-6 flex-wrap">
              {category.articles.map((article) => (
                <div
                  key={article.slug}
                  className="flex-1 min-w-75 md:max-w-[48%] lg:max-w-[32%] flex flex-col justify-between p-6 bg-white border border-gray-150 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.01)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:border-blue-200 transition-all duration-300 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <FileText className="h-3.5 w-3.5 text-gray-400" />
                      <span>Article</span>
                    </div>
                    
                    <h3 className="text-base font-bold text-gray-800 font-serif group-hover:text-blue-600 transition-colors duration-300">
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
          )}
        </div>

      </div>
    </main>
  );
}