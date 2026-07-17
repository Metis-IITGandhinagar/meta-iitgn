"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ArrowRight, BookOpen, PlusCircle, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { apiService } from "@/api";
import Avatar from "@/components/Avatar";

interface BlogAuthor {
  user_id: number;
  name: string;
  avatar_url?: string | null;
}

interface BlogItem {
  blog_id: number;
  title: string;
  description?: string | null;
  slug: string;
  created_at: string;
  view_count: number;
  original_author: BlogAuthor;
}

const BlogSkeleton = () => (
  <div className="card card-compact card-bordered flex-1 min-w-75 md:max-w-[48%] lg:max-w-[32%] flex flex-col justify-between p-4 md:p-6 bg-base-100 border-base-200 shadow-xs animate-pulse select-none">
    <div className="space-y-3">
      <div className="h-4 bg-base-300 rounded-md w-3/4"></div>
      <div className="space-y-2">
        <div className="h-3 bg-base-200 rounded-md w-full"></div>
        <div className="h-3 bg-base-200 rounded-md w-5/6"></div>
      </div>
    </div>
    <div className="pt-6 flex items-center justify-between">
      <div className="h-3 bg-base-300 rounded-md w-20"></div>
      <div className="h-6 w-6 rounded-full bg-base-300"></div>
    </div>
  </div>
);

export default function BlogGridPage() {
  const { user } = useAuth();
  useDocumentTitle("Blog");
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadBlogs = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      const res = await apiService.getBlogs({ page: pageNum, limit: 6 });
      if (res && res.success) {
        setBlogs(prev => (append ? [...prev, ...res.blogs] : res.blogs));
        setHasMore(res.hasMore);
        setPage(pageNum);
      }
    } catch (err) {
      console.error("Error loading blogs:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadBlogs(1, false);
  }, []);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadBlogs(page + 1, true);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch {
      return "Unknown Date";
    }
  };

  return (
    <main className="flex-1 p-6 md:p-8 mt-16 bg-transparent overflow-y-auto h-full w-full">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Blog Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-base-200 pb-6">
          <div className="space-y-3 flex-1">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 text-primary rounded-2xl shadow-xs">
              <BookOpen className="h-6 w-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-black text-base-content tracking-tight">
              Explore Campus Blogs
            </h1>
            <p className="text-base-content/60 max-w-2xl text-sm md:text-base leading-relaxed">
              Discover stories, technical guides, research experiences, and student life articles from across the IITGN community.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 mb-1">
            {user && (
              <Link
                href="/blog/new/edit"
                className="btn btn-primary btn-sm font-bold rounded-xl shadow-md transition-all duration-200 cursor-pointer text-primary-content"
              >
                <PlusCircle className="h-4.5 w-4.5" />
                <span>Write a Blog</span>
              </Link>
            )}
          </div>
        </div>

        {/* Blogs Grid */}
        <div>
          {loading ? (
            <div className="flex flex-col md:flex-row gap-6 flex-wrap w-full">
              <BlogSkeleton />
              <BlogSkeleton />
              <BlogSkeleton />
            </div>
          ) : blogs.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-base-300 rounded-2xl text-base-content/50 text-sm">
              No blog posts are currently listed. Be the first to share one!
            </div>
          ) : (
            <div className="w-full flex flex-col gap-8">
              <div className="flex flex-col md:flex-row gap-6 flex-wrap">
                {blogs.map((blog) => (
                  <div
                    key={blog.blog_id}
                    className="card card-compact card-bordered flex-1 min-w-[280px] md:max-w-[48%] lg:max-w-[32%] flex flex-col justify-between p-4 md:p-6 bg-base-100 border-base-200 shadow-xs hover:shadow-md hover:-translate-y-1 hover:border-primary/40 transition-all duration-300 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[10px] text-base-content/40 uppercase font-black tracking-wider">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(blog.created_at)}
                        </span>
                        <span>{blog.view_count} views</span>
                      </div>
                      
                      <h3 className="text-sm md:text-base font-bold text-base-content font-serif group-hover:text-primary transition-colors duration-300 line-clamp-2">
                        {blog.title}
                      </h3>

                      <p className="text-xs text-base-content/60 leading-relaxed line-clamp-3">
                        {blog.description}
                      </p>
                    </div>

                    <div className="pt-6 flex items-center justify-between border-t border-base-200 mt-4">
                      {/* Author Info */}
                      <div className="flex items-center gap-2">
                        <Avatar
                          seed={String(blog.original_author.user_id)}
                          name={blog.original_author.name}
                          className="h-6 w-6 rounded-full object-cover border border-base-300"
                        />
                        <span className="text-[11px] font-bold text-base-content/70 truncate max-w-[120px]">
                          {blog.original_author.name}
                        </span>
                      </div>

                      <Link
                        href={`/blog/${blog.slug}`}
                        className="inline-flex items-center gap-1 text-[10px] font-black text-primary hover:underline transition-colors uppercase tracking-wider cursor-pointer"
                      >
                        <span>Read Blog</span>
                        <ArrowRight className="h-3 w-3 transform group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                ))}
                {loadingMore && (
                  <>
                    <BlogSkeleton />
                    <BlogSkeleton />
                    <BlogSkeleton />
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
                      <span>Load More Blogs</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
