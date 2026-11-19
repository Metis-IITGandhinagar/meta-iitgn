"use client";

import { confirmDialog } from "@/components/helpers/confirmDialog";
import React, { useState, useEffect } from "react";
import { Loader2, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { apiService } from "@/api";
import { useAuth } from "@/hooks/useAuth";
import GenericOverlayModal from "@/components/overlays/GenericOverlayModal";
import { toast } from "react-hot-toast";
import { useViewMode } from "@/hooks/useViewMode";
import ViewSwitcher from "@/components/helpers/ViewSwitcher";
import { getGridClass } from "@/lib/viewModes";
import UnifiedViewItem from "@/components/helpers/UnifiedViewItem";

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

  // Article-list view (Default / Tiles / Details / Icons S–XL). Persisted to
  // localStorage under a news-specific key so it's independent of other surfaces.
  const [view, setView] = useViewMode("meta_iitgn_news_view");

  // Add form states
  const [showAddNewsForm, setShowAddNewsForm] = useState(false);
  const [selectedNews, setSelectedNews] = useState<any | null>(null);
  const [newNewsTitle, setNewNewsTitle] = useState("");
  const [newNewsContent, setNewNewsContent] = useState("");
  const [newNewsVideoUrl, setNewNewsVideoUrl] = useState("");
  const [isSubmittingNews, setIsSubmittingNews] = useState(false);

  // Edit form states
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editVideoUrl, setEditVideoUrl] = useState("");

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
      setIsEditing(false);
    }
  }, [isOpen]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchNews(page + 1, true);
    }
  };

  const renderNewsItem = (item: any, idx: number) => {
    const preview = item.content
      ? item.content.replace(/---[\s\S]*?---/, "").replace(/#[\s\S]*?\n/, "").trim()
      : item.description;
    const posted = `Posted: ${getRelativeTime(item.created_at)}`;

    return (
      <UnifiedViewItem
        key={item.slug || idx}
        view={view}
        onClick={() => setSelectedNews(item)}
        title={item.title}
        description={preview}
        subtitle={posted}
      />
    );
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

  const handleUpdateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNews || !editTitle.trim() || !editContent.trim()) return;
    setIsSubmittingNews(true);
    try {
      const updated = await apiService.updateNews(selectedNews.slug, {
        title: editTitle.trim(),
        content: editContent.trim(),
        video_url: editVideoUrl.trim() || undefined,
      });
      toast.success("News page updated successfully!");
      setSelectedNews(updated);
      setIsEditing(false);
      fetchNews(1, false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || err.message || "Failed to update news");
    } finally {
      setIsSubmittingNews(false);
    }
  };

  const handleDeleteNews = async () => {
    if (!selectedNews) return;
    if (!(await confirmDialog({ title: "Delete this article?", message: "It will be removed from campus news. This can't be undone.", confirmText: "Delete", type: "danger" }))) return;
    try {
      await apiService.deleteNews(selectedNews.slug);
      toast.success("News article deleted successfully.");
      setSelectedNews(null);
      fetchNews(1, false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || err.message || "Failed to delete news");
    }
  };

  const canManageNews = user?.role === "admin" || user?.role === "moderator";

  if (!isOpen) return null;

  const headerActions = canManageNews ? (
    isEditing ? (
      <button
        type="submit"
        form="edit-news-form"
        disabled={isSubmittingNews}
        className="btn btn-primary btn-xs px-3 font-bold rounded-lg shadow-sm cursor-pointer transition-all duration-150 active:scale-97"
      >
        {isSubmittingNews ? "Saving..." : "Save Changes"}
      </button>
    ) : showAddNewsForm ? (
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
        if (isEditing) {
          setIsEditing(false);
        } else if (showAddNewsForm) {
          setShowAddNewsForm(false);
        } else if (selectedNews) {
          setSelectedNews(null);
        } else {
          onClose();
        }
      }}
      title={isEditing ? "Edit Campus News" : showAddNewsForm ? "Add Campus News" : selectedNews ? selectedNews.title : "Campus News"}
      headerColorClass="text-blue-500 bg-base-200"
      headerActions={headerActions}
    >
      <div className="max-w-3xl mx-auto space-y-4 w-full">
        {isEditing ? (
          <form id="edit-news-form" onSubmit={handleUpdateNews} className="space-y-4 bg-base-100 p-6 border border-base-350 rounded-2xl shadow-xs text-left w-full">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold uppercase text-base-content/90">News Title</label>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="e.g. Annual Sports Fest Hallabol 2026 Announced"
                className="w-full border border-base-300 bg-base-100 text-base-content/80 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold uppercase text-base-content/90">YouTube Video URL (Optional)</label>
              <input
                type="text"
                value={editVideoUrl}
                onChange={(e) => setEditVideoUrl(e.target.value)}
                placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                className="w-full border border-base-300 bg-base-100 text-base-content/80 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold uppercase text-base-content/90">Content</label>
              <textarea
                required
                rows={8}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Write the news details here..."
                className="w-full border border-base-300 bg-base-100 text-base-content/80 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 resize-none font-semibold"
              />
            </div>
          </form>
        ) : showAddNewsForm ? (
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
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setSelectedNews(null)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80"
              >
                <ArrowLeft className="h-4 w-4" /> Back to news
              </button>
              {canManageNews && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditTitle(selectedNews.title);
                      setEditContent(selectedNews.content || selectedNews.description || "");
                      setEditVideoUrl(selectedNews.video_url || "");
                      setIsEditing(true);
                    }}
                    className="btn btn-outline btn-xs gap-1 rounded-lg cursor-pointer"
                    title="Edit News"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteNews}
                    className="btn btn-error btn-outline btn-xs gap-1 rounded-lg cursor-pointer"
                    title="Delete News"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
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
                <div className="flex flex-wrap gap-2 pt-2">
                  <a
                    href={selectedNews.video_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline btn-sm rounded-xl font-bold text-xs"
                  >
                    Watch related video
                  </a>
                </div>
              )}
            </article>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-end">
              <ViewSwitcher view={view} onChange={setView} />
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            ) : newsList.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-base-300 bg-base-100 rounded-2xl">
                <p className="text-base-content/60 font-medium">No campus news found.</p>
              </div>
            ) : (
              <div className={getGridClass(view)}>
                {newsList.map((item, idx) => renderNewsItem(item, idx))}

                {hasMore && (
                  <div className="col-span-full flex justify-center pt-4">
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
          </>
        )}
      </div>
    </GenericOverlayModal>
  );
}
