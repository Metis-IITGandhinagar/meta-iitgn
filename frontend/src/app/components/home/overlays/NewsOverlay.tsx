"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Pencil, Trash2, Loader2 } from "lucide-react";
import { apiService } from "@/api";
import { useAuth } from "@/hooks/useAuth";

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

  // Active item and sub-views states
  const [activeNewsItem, setActiveNewsItem] = useState<any | null>(null);
  const [showAddNewsForm, setShowAddNewsForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Add form states
  const [newNewsTitle, setNewNewsTitle] = useState("");
  const [newNewsContent, setNewNewsContent] = useState("");
  const [newNewsVideoUrl, setNewNewsVideoUrl] = useState("");
  const [isSubmittingNews, setIsSubmittingNews] = useState(false);

  // Edit form states
  const [editNewsTitle, setEditNewsTitle] = useState("");
  const [editNewsContent, setEditNewsContent] = useState("");
  const [editNewsVideoUrl, setEditNewsVideoUrl] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const getYouTubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

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
      setIsEditing(false);
      setActiveNewsItem(null);
      setNewNewsVideoUrl("");
      setEditNewsVideoUrl("");
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
      const content = `---
image: https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=600
imageAlt: News Article
rows:
  - label: Category
    value: News
    type: text
---

# ${newNewsTitle.trim()}

${newNewsContent.trim()}`;

      await apiService.createNews({
        title: newNewsTitle.trim(),
        content,
        video_url: newNewsVideoUrl.trim() || undefined,
      });

      alert("News page published successfully!");
      setNewNewsTitle("");
      setNewNewsContent("");
      setNewNewsVideoUrl("");
      setShowAddNewsForm(false);
      fetchNews(1, false);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || err.message || "Failed to publish news");
    } finally {
      setIsSubmittingNews(false);
    }
  };

  const handleStartEdit = () => {
    if (!activeNewsItem) return;
    setEditNewsTitle(activeNewsItem.title);
    
    // Extract actual content by stripping frontmatter and main title
    const cleanContent = activeNewsItem.content
      ? activeNewsItem.content.replace(/---[\s\S]*?---/, "").replace(/#[\s\S]*?\n/, "").trim()
      : activeNewsItem.description || "";
      
    setEditNewsContent(cleanContent);
    setEditNewsVideoUrl(activeNewsItem.video_url || "");
    setIsEditing(true);
  };

  const handleEditNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNewsTitle.trim() || !editNewsContent.trim() || !activeNewsItem) return;
    setIsSubmittingEdit(true);
    try {
      const content = `---
image: https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=600
imageAlt: News Article
rows:
  - label: Category
    value: News
    type: text
---

# ${editNewsTitle.trim()}

${editNewsContent.trim()}`;

      const updated = await apiService.updateNews(activeNewsItem.slug, {
        title: editNewsTitle.trim(),
        content,
        video_url: editNewsVideoUrl.trim() || undefined,
      });

      alert("News page updated successfully!");
      setIsEditing(false);
      setActiveNewsItem(updated);
      fetchNews(1, false);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || err.message || "Failed to update news");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteNews = async () => {
    if (!activeNewsItem) return;
    if (!window.confirm("Are you sure you want to delete this news article? This action cannot be undone.")) return;
    try {
      await apiService.deleteNews(activeNewsItem.slug);
      alert("News article deleted successfully.");
      setActiveNewsItem(null);
      fetchNews(1, false);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || err.message || "Failed to delete news");
    }
  };

  const canManageNews = user?.role === "admin" || user?.role === "moderator";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-[99999] flex flex-col h-dvh w-screen overflow-hidden select-none animate-in fade-in duration-200">
      <header className="h-16 border-b border-gray-200 flex items-center justify-between px-6 shrink-0 bg-white shadow-sm select-none">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (isEditing) {
                setIsEditing(false);
              } else if (activeNewsItem) {
                setActiveNewsItem(null);
              } else if (showAddNewsForm) {
                setShowAddNewsForm(false);
              } else {
                onClose();
              }
            }}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-center"
          >
            <ArrowLeft className="h-6 w-6 text-gray-900" />
          </button>
          <span className="text-sm font-bold text-blue-400 uppercase tracking-wider ml-2">
            {showAddNewsForm
              ? "Add Campus News"
              : isEditing
              ? "Edit Campus News"
              : activeNewsItem
              ? "Read News"
              : "Campus News"}
          </span>
        </div>

        {/* Action buttons in header */}
        {activeNewsItem && !showAddNewsForm && !isEditing && canManageNews && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleStartEdit}
              className="p-2.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-center"
              title="Edit News Article"
            >
              <Pencil className="h-5 w-5 text-gray-900" />
            </button>
            <button
              onClick={handleDeleteNews}
              className="p-2.5 hover:bg-rose-50 rounded-lg text-rose-600 transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-center"
              title="Delete News Article"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        )}

        {!activeNewsItem && !showAddNewsForm && !isEditing && canManageNews && (
          <button
            onClick={() => setShowAddNewsForm(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-all duration-150 active:scale-97"
          >
            Add News
          </button>
        )}
      </header>

      <div className={`flex-1 ${(activeNewsItem && !isEditing) ? "bg-white overflow-hidden" : "bg-gray-55 overflow-y-auto overscroll-contain"} p-6 flex flex-col`}>
        {showAddNewsForm ? (
          <form onSubmit={handleAddNews} className="max-w-xl mx-auto space-y-4 bg-white p-6 border border-gray-200 rounded-2xl shadow-xs text-left w-full">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold uppercase text-black">News Title</label>
              <input
                type="text"
                required
                value={newNewsTitle}
                onChange={(e) => setNewNewsTitle(e.target.value)}
                placeholder="e.g. Annual Sports Fest Hallabol 2026 Announced"
                className="w-full border border-gray-200 text-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold uppercase text-black">YouTube Video URL (Optional)</label>
              <input
                type="text"
                value={newNewsVideoUrl}
                onChange={(e) => setNewNewsVideoUrl(e.target.value)}
                placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                className="w-full border border-gray-200 text-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold uppercase text-black">Content</label>
              <textarea
                required
                rows={8}
                value={newNewsContent}
                onChange={(e) => setNewNewsContent(e.target.value)}
                placeholder="Write the news details here..."
                className="w-full border border-gray-200 text-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 resize-none font-semibold"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmittingNews}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm rounded-xl cursor-pointer transition-all duration-150 active:scale-97"
            >
              {isSubmittingNews ? "Publishing..." : "Publish News"}
            </button>
          </form>
        ) : isEditing ? (
          <form onSubmit={handleEditNews} className="max-w-xl mx-auto space-y-4 bg-white p-6 border border-gray-200 rounded-2xl shadow-xs text-left w-full">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold uppercase text-black">News Title</label>
              <input
                type="text"
                required
                value={editNewsTitle}
                onChange={(e) => setEditNewsTitle(e.target.value)}
                placeholder="e.g. News Title"
                className="w-full border border-gray-200 text-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold uppercase text-black">YouTube Video URL (Optional)</label>
              <input
                type="text"
                value={editNewsVideoUrl}
                onChange={(e) => setEditNewsVideoUrl(e.target.value)}
                placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                className="w-full border border-gray-200 text-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold uppercase text-black">Content</label>
              <textarea
                required
                rows={8}
                value={editNewsContent}
                onChange={(e) => setEditNewsContent(e.target.value)}
                placeholder="Write the news details here..."
                className="w-full border border-gray-200 rounded-xl px-4 text-gray-700 py-2.5 text-sm focus:outline-none focus:border-blue-500 resize-none font-semibold"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="w-1/2 py-3 border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-sm rounded-xl cursor-pointer transition-all duration-150 active:scale-97"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingEdit}
                className="w-1/2 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm rounded-xl cursor-pointer transition-all duration-150 active:scale-97"
              >
                {isSubmittingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : activeNewsItem ? (
          <div className="max-w-2xl w-full mx-auto text-left space-y-4 pt-4 overflow-y-auto overscroll-contain flex-1 pr-2">
            <h3 className="text-2xl font-bold text-gray-900 leading-snug">{activeNewsItem.title}</h3>
            <span className="text-[10px] text-gray-400 font-semibold block">
              Posted: {getRelativeTime(activeNewsItem.created_at)}
            </span>
            {activeNewsItem.video_url && (() => {
              const videoId = getYouTubeId(activeNewsItem.video_url);
              if (videoId) {
                return (
                  <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-md mt-4 border border-gray-150 relative z-10 pointer-events-auto">
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title="YouTube video player"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                );
              }
              return null;
            })()}
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap pt-4 font-semibold border-t border-gray-100">
              {activeNewsItem.content ? activeNewsItem.content.replace(/---[\s\S]*?---/, "").replace(/#[\s\S]*?\n/, "").trim() : activeNewsItem.description}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4 w-full">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              </div>
            ) : newsList.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-gray-300 bg-white rounded-2xl">
                <p className="text-gray-500 font-medium">No campus news found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {newsList.map((item, idx) => (
                  <div
                    key={item.slug || idx}
                    onClick={() => setActiveNewsItem(item)}
                    className="p-5 border border-gray-250/60 bg-white rounded-2xl shadow-xs hover:shadow-md hover:border-blue-400 transition-all duration-150 cursor-pointer text-left animate-in fade-in"
                  >
                    <h4 className="text-base font-bold text-blue-400">{item.title}</h4>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {item.content ? item.content.replace(/---[\s\S]*?---/, "").replace(/#[\s\S]*?\n/, "").trim() : item.description}
                    </p>
                    <span className="text-[9px] text-gray-400 font-semibold block mt-2">
                      Posted: {getRelativeTime(item.created_at)}
                    </span>
                  </div>
                ))}

                {hasMore && (
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="inline-flex items-center gap-2 px-6 py-2 border border-gray-200 hover:border-gray-300 text-gray-700 bg-white hover:bg-gray-55 rounded-xl text-xs font-bold shadow-sm transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
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
    </div>
  );
}
