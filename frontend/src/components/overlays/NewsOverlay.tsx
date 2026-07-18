"use client";

import React, { useState, useEffect } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import { apiService } from "@/api";
import { useAuth } from "@/hooks/useAuth";
import GenericOverlayModal from "@/components/overlays/GenericOverlayModal";
import { toast } from "react-hot-toast";

interface NewsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  getRelativeTime: (dateString: string) => string;
}

export default function NewsOverlay({
  isOpen,
  onClose,
  getRelativeTime,
}: NewsOverlayProps) {
  const { user } = useAuth();

  // News list and pagination states
  const [newsList, setNewsList] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Add form states
  const [showAddNewsForm, setShowAddNewsForm] = useState(false);
  const [selectedNews, setSelectedNews] = useState<any | null>(null);
  const [newNewsTitle, setNewNewsTitle] = useState("");
  const [newNewsContent, setNewNewsContent] = useState("");
  const [newNewsVideoUrl, setNewNewsVideoUrl] = useState("");
  const [isSubmittingNews, setIsSubmittingNews] = useState(false);

  const fetchNews = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      const res = await apiService.getNewsList({ page: pageNum, limit: 5 });
      setNewsList(prev => append ? [...prev, ...res.news] : res.news);
      setHasMore(res.hasMore);
      setPage(pageNum);
    } catch (err) {
      console.error("Error loading news:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNews(1, false);
      setShowAddNewsForm(false);
      setSelectedNews(null);
      setNewNewsVideoUrl("");
    }
  }, [isOpen]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchNews(page + 1, true);
    }
  };

  const handleAddNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNewsTitle.trim() || !newNewsContent.trim()) return;
    setIsSubmittingNews(true);
    try {
      await apiService.createNews({
        title: newNewsTitle.trim(),
        content: newNewsContent.trim(),
        video_url: newNewsVideoUrl.trim() || undefined,
      });

      toast.success("News page published successfully!");
      setNewNewsTitle("");
      setNewNewsContent("");
      setNewNewsVideoUrl("");
      setShowAddNewsForm(false);
      fetchNews(1, false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || err.message || "Failed to publish news");
    } finally {
      setIsSubmittingNews(false);
    }
  };

  const canManageNews = user?.role === "admin" || user?.role === "moderator";

  if (!isOpen) return null;

  const headerActions = canManageNews ? (
    showAddNewsForm ? (
      <button
        type="submit"
        form="add-news-form"
        disabled={isSubmittingNews}
        className="btn btn-primary btn-xs px-3 font-bold rounded-lg shadow-sm cursor-pointer transition-all duration-150 active:scale-97"
      >
        {isSubmittingNews ? "Publishing..." : "Publish News"}
      </button>
    ) : !selectedNews ? (
      <button
        onClick={() => setShowAddNewsForm(true)}
        className="btn btn-primary btn-xs px-3 font-bold rounded-lg shadow-sm cursor-pointer transition-all duration-150 active:scale-97"
      >
        Add News
      </button>
    ) : null
  ) : null;

  return (
    <GenericOverlayModal
      isOpen={isOpen}
      onClose={() => {
        if (showAddNewsForm) {
          setShowAddNewsForm(false);
        } else if (selectedNews) {
          setSelectedNews(null);
        } else {
          onClose();
        }
      }}
      title={showAddNewsForm ? "Add Campus News" : selectedNews ? selectedNews.title : "Campus News"}
      headerColorClass="text-blue-500 bg-base-200"
      headerActions={headerActions}
    >
      <div className="max-w-3xl mx-auto space-y-4 w-full">
        {showAddNewsForm ? (
          <form id="add-news-form" onSubmit={handleAddNews} className="space-y-4 bg-base-100 p-6 border border-base-350 rounded-2xl shadow-xs text-left w-full">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold uppercase text-base-content/90">News Title</label>
              <input
                type="text"
                required
                value={newNewsTitle}
                onChange={(e) => setNewNewsTitle(e.target.value)}
                placeholder="e.g. Annual Sports Fest Hallabol 2026 Announced"
                className="w-full border border-base-300 bg-base-100 text-base-content/80 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold uppercase text-base-content/90">YouTube Video URL (Optional)</label>
              <input
                type="text"
                value={newNewsVideoUrl}
                onChange={(e) => setNewNewsVideoUrl(e.target.value)}
                placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                className="w-full border border-base-300 bg-base-100 text-base-content/80 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold uppercase text-base-content/90">Content</label>
              <textarea
                required
                rows={8}
                value={newNewsContent}
                onChange={(e) => setNewNewsContent(e.target.value)}
                placeholder="Write the news details here..."
                className="w-full border border-base-300 bg-base-100 text-base-content/80 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 resize-none font-semibold"
              />
            </div>
          </form>
        ) : selectedNews ? (
          <div className="space-y-5">
            <button
              type="button"
              onClick={() => setSelectedNews(null)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80"
            >
              <ArrowLeft className="h-4 w-4" /> Back to news
            </button>
            <article className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm space-y-4">
              <div className="space-y-2">
                <h3 className="text-xl font-black text-base-content">{selectedNews.title}</h3>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-base-content/50">
                  Posted {getRelativeTime(selectedNews.created_at)}
                </p>
              </div>
              <p className="text-sm leading-7 text-base-content/80 whitespace-pre-line">
                {selectedNews.content ? selectedNews.content.replace(/---[\s\S]*?---/, "").replace(/#[\s\S]*?\n/, "").trim() : selectedNews.description}
              </p>
              {selectedNews.video_url && (
                <a
                  href={selectedNews.video_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline btn-sm"
                >
                  Watch related video
                </a>
              )}
            </article>
          </div>
        ) : (
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            ) : newsList.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-base-300 bg-base-100 rounded-2xl">
                <p className="text-base-content/60 font-medium">No campus news found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {newsList.map((item, idx) => (
                  <button
                    key={item.slug || idx}
                    type="button"
                    onClick={() => setSelectedNews(item)}
                    className="p-5 border border-base-300 bg-base-100 rounded-2xl shadow-xs hover:shadow-md hover:border-primary transition-all duration-150 cursor-pointer text-left animate-in fade-in w-full"
                  >
                    <h4 className="text-base font-bold text-primary">{item.title}</h4>
                    <p className="text-xs text-base-content/60 mt-1 line-clamp-2">
                      {item.content ? item.content.replace(/---[\s\S]*?---/, "").replace(/#[\s\S]*?\n/, "").trim() : item.description}
                    </p>
                    <span className="text-[9px] text-base-content/50 font-semibold block mt-2">
                      Posted: {getRelativeTime(item.created_at)}
                    </span>
                  </button>
                ))}

                {hasMore && (
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="btn btn-outline btn-sm gap-2 px-6 shadow-sm transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                          <span>Loading...</span>
                        </>
                      ) : (
                        <span>Load More News</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </GenericOverlayModal>
  );
}
