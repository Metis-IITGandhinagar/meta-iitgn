"use client";

import Link from "next/link";
import { Article } from "@/lib/placeholder-articles";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, ArrowLeft, BookOpen, ChevronRight, FileText, PlusCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { apiService } from "@/api";
import { parseMarkdown } from "@/lib/utils";

interface CategoryPageProps {
  categorySlug: string;
}

export default function CategoryPage({ categorySlug }: CategoryPageProps) {
  const { categories } = useAuth();
  const category = categories.find(c => c.slug === categorySlug);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategoryArticles() {
      try {
        // Fetch recent pages to categorize dynamically
        const [recentNewList, recentUpdatedList] = await Promise.all([
          apiService.getRecentNewPages(200),
          apiService.getRecentUpdatedPages(200),
        ]);

        const merged = [...recentNewList, ...recentUpdatedList];
        const uniquePagesMap = new Map();
        for (const page of merged) {
          uniquePagesMap.set(page.slug || page.page_id, page);
        }
        const uniquePages = Array.from(uniquePagesMap.values());

        // Map and filter pages matching this categorySlug
        const filtered = uniquePages.filter((page: any) => {
          const meta = page.metadata || {};
          const metaCategory = (meta.category || "").toLowerCase();
          
          let parsedCategory = "";
          if (page.content) {
            try {
              const parsed = parseMarkdown(page.content);
              const categoryRow = parsed.infobox?.rows?.find((row: any) => 
                row.label?.toLowerCase() === "category"
              );
              if (categoryRow && categoryRow.value && typeof categoryRow.value === "string") {
                parsedCategory = categoryRow.value.toLowerCase();
              }
            } catch (e) {
              // ignore
            }
          }

          let categoryName = (metaCategory || parsedCategory).trim().toLowerCase();
          
          if (categoryName === "campus facilities") categoryName = "facilities";
          if (categoryName === "faculty profiles") categoryName = "faculty";
          if (categoryName === "courses info") categoryName = "courses";
          if (categoryName === "research labs") categoryName = "research";
          if (categoryName === "hostels guide") categoryName = "hostels";
          if (categoryName === "student clubs") categoryName = "clubs";
          if (categoryName === "institute fests") categoryName = "fests";
          if (categoryName === "placement stats") categoryName = "placements";
          if (categoryName === "institute policies") categoryName = "policies";
          if (categoryName === "academic calendar") categoryName = "calendar";

          // 1-1 mapping: check if the pageCategory matches the categorySlug directly
          if (categoryName === categorySlug) {
            return true;
          }

          // Implement routing logic mapping DB categories back to frontend categories
          if (categoryName === "academics") {
            const title = (page.title || "").toLowerCase();
            const slug = (page.slug || "").toLowerCase();
            if (categorySlug === "faculty") {
              return title.startsWith("prof.") || slug.includes("prof") || slug.includes("faculty");
            }
            if (categorySlug === "courses") {
              return (
                /^[a-z]{2,3}\s*\d{3}/i.test(title) ||
                /^[a-z]{2,3}-\d{3}/i.test(slug) ||
                title.includes(":")
              );
            }
            if (categorySlug === "departments") {
              return (
                !title.startsWith("prof.") &&
                !slug.includes("prof") &&
                !slug.includes("faculty") &&
                !/^[a-z]{2,3}\s*\d{3}/i.test(title) &&
                !/^[a-z]{2,3}-\d{3}/i.test(slug) &&
                !title.includes(":")
              );
            }
          }

          if (categoryName === "research") {
            return categorySlug === "research";
          }

          if (categoryName === "campus") {
            const title = (page.title || "").toLowerCase();
            const slug = (page.slug || "").toLowerCase();
            if (categorySlug === "hostels") {
              return title.includes("hostel") || slug.includes("hostel");
            }
            if (categorySlug === "facilities") {
              return !title.includes("hostel") && !slug.includes("hostel");
            }
          }

          if (categoryName === "clubs") {
            return categorySlug === "clubs";
          }

          if (categoryName === "fests") {
            return categorySlug === "fests";
          }

          if (categoryName === "policies") {
            const title = (page.title || "").toLowerCase();
            const slug = (page.slug || "").toLowerCase();
            if (categorySlug === "calendar") {
              return title.includes("calendar") || title.includes("date") || slug.includes("calendar") || slug.includes("date");
            }
            if (categorySlug === "placements") {
              return title.includes("placement") || slug.includes("placement");
            }
            if (categorySlug === "policies") {
              return (
                !title.includes("calendar") && !title.includes("date") && !slug.includes("calendar") && !slug.includes("date") &&
                !title.includes("placement") && !slug.includes("placement")
              );
            }
          }

          // Fallback heuristic if categoryName is empty: guess from title or slug
          if (!categoryName) {
            const title = (page.title || "").toLowerCase();
            const slug = (page.slug || "").toLowerCase();
            
            if (categorySlug === "faculty") {
              return title.startsWith("prof.") || slug.includes("prof") || slug.includes("faculty");
            }
            if (categorySlug === "courses") {
              return (
                /^[a-z]{2,3}\s*\d{3}/i.test(title) ||
                /^[a-z]{2,3}-\d{3}/i.test(slug) ||
                title.includes(":")
              );
            }
            if (categorySlug === "hostels") {
              return title.includes("hostel") || slug.includes("hostel");
            }
            if (categorySlug === "facilities") {
              return slug.includes("sports") || slug.includes("complex") || slug.includes("shop") || slug.includes("canteen") || slug.includes("center") || slug.includes("facility");
            }
            if (categorySlug === "clubs") {
              return slug.includes("club") || title.includes("club");
            }
            if (categorySlug === "fests") {
              return slug.includes("fest") || title.includes("fest") || slug.includes("amalthea") || slug.includes("blith");
            }
            if (categorySlug === "research") {
              return slug.includes("research") || slug.includes("lab") || title.includes("laboratory");
            }
            if (categorySlug === "calendar") {
              return title.includes("calendar") || title.includes("date") || slug.includes("calendar") || slug.includes("date");
            }
            if (categorySlug === "placements") {
              return title.includes("placement") || slug.includes("placement");
            }
            if (categorySlug === "departments") {
              return (
                !title.startsWith("prof.") &&
                !slug.includes("prof") &&
                !slug.includes("faculty") &&
                !/^[a-z]{2,3}\s*\d{3}/i.test(title) &&
                !/^[a-z]{2,3}-\d{3}/i.test(slug) &&
                !title.includes(":") &&
                (slug.includes("department") || slug.includes("engineering") || title.includes("engineering"))
              );
            }
          }

          return false;
        });

        // Map to Article format
        const mappedArticles: Article[] = filtered.map((page: any) => {
          let snippet = "";
          if (page.content) {
            const clean = page.content.replace(/^---[\s\S]*?---/, "").trim();
            snippet = clean.length > 150 ? clean.substring(0, 150) + "..." : clean;
          }
          return {
            slug: page.slug,
            title: page.title || "Untitled",
            snippet,
            content: page.content || "",
          };
        });

        setArticles(mappedArticles);
      } catch (err) {
        console.error("Error loading category articles:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCategoryArticles();
  }, [categorySlug]);

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

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
          ) : articles.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-gray-200 rounded-2xl text-gray-400 text-sm">
              No articles are currently listed under this category.
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-6 flex-wrap">
              {articles.map((article) => (
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