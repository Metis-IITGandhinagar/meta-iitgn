"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Calendar, Video, Pencil, Trash2, X, Check, Loader2 } from "lucide-react";
import { apiService, NewsItem } from "@/api";
import { useAuth } from "@/hooks/useAuth";

interface NewsDetailClientProps {
  initialNewsItem: NewsItem;
}

export default function NewsDetailClient({ initialNewsItem }: NewsDetailClientProps) {
  const { user } = useAuth();
  const router = useRouter();

  const [newsItem, setNewsItem] = useState<NewsItem>(initialNewsItem);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [editTitle, setEditTitle] = useState(newsItem.title);
  const [editContent, setEditContent] = useState(newsItem.content);
  const [editVideoUrl, setEditVideoUrl] = useState(newsItem.video_url || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  function getRelativeTime(dateString: string) {
    if (!dateString) return "some time ago";
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  }

  const getYouTubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleEditNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !editContent.trim()) return;
    setIsSubmitting(true);
    try {
      const updated = await apiService.updateNews(newsItem.slug, {
        title: editTitle.trim(),
        content: editContent.trim(),
        video_url: editVideoUrl.trim() || undefined,
      });

      alert("News page updated successfully!");
      setNewsItem(updated);
      setIsEditing(false);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || err.message || "Failed to update news");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNews = async () => {
    if (!window.confirm("Are you sure you want to delete this news article? This action cannot be undone.")) return;
    setIsDeleting(true);
    try {
      await apiService.deleteNews(newsItem.slug);
      alert("News article deleted successfully.");
      router.push("/");
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || err.message || "Failed to delete news");
      setIsDeleting(false);
    }
  };

  const canManageNews = user?.role === "admin" || user?.role === "moderator";
  const videoId = newsItem.video_url ? getYouTubeId(newsItem.video_url) : null;

  return (
    <main className="flex-1 p-6 md:p-8 lg:p-12 bg-base-100 mt-10 overflow-y-auto h-full w-full select-text">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-base-content/60 hover:text-primary transition-colors font-medium"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Home
          </Link>

          {/* Edit/Delete controls for Admins/Moderators */}
          {canManageNews && !isEditing && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditTitle(newsItem.title);
                  setEditContent(newsItem.content);
                  setEditVideoUrl(newsItem.video_url || "");
                  setIsEditing(true);
                }}
                className="btn btn-outline btn-sm rounded-xl gap-1.5 cursor-pointer font-bold text-xs"
                title="Edit News Article"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <button
                onClick={handleDeleteNews}
                disabled={isDeleting}
                className="btn btn-error btn-outline btn-sm rounded-xl gap-1.5 cursor-pointer font-bold text-xs"
                title="Delete News Article"
              >
                {isDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Delete
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          /* Editing Form */
          <form onSubmit={handleEditNews} className="space-y-5 bg-base-200/50 p-6 border border-base-300 rounded-3xl shadow-xs text-left w-full animate-in fade-in duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-base-300">
              <h3 className="text-sm font-black uppercase text-primary tracking-wider">Edit News Article</h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1 hover:bg-base-300 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold uppercase text-base-content/75">News Title</label>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="News Title"
                className="w-full border border-base-300 bg-base-100 text-base-content rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary font-medium"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold uppercase text-base-content/75">YouTube Video URL (Optional)</label>
              <input
                type="text"
                value={editVideoUrl}
                onChange={(e) => setEditVideoUrl(e.target.value)}
                placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                className="w-full border border-base-300 bg-base-100 text-base-content rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary font-medium"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold uppercase text-base-content/75">Content (Markdown Supported)</label>
              <textarea
                required
                rows={12}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Write the news details in markdown..."
                className="w-full border border-base-300 bg-base-100 text-base-content rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary resize-none font-semibold"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn btn-outline btn-md w-1/2 font-bold text-sm rounded-xl cursor-pointer transition-all duration-150 active:scale-97"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary btn-md w-1/2 font-bold text-sm rounded-xl cursor-pointer transition-all duration-150 active:scale-97"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* View Mode */
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-serif font-black text-base-content leading-tight">
                {newsItem.title}
              </h1>
              <div className="flex items-center gap-4 text-xs text-base-content/60 font-semibold border-b border-base-200 pb-4">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {getRelativeTime(newsItem.created_at)}
                </span>
                {newsItem.video_url && (
                  <span className="flex items-center gap-1.5 text-primary">
                    <Video className="h-4 w-4" /> Video Attached
                  </span>
                )}
              </div>
            </div>

            {/* Video embed if URL is present and valid */}
            {videoId && (
              <div className="aspect-video w-full rounded-3xl overflow-hidden shadow-lg border border-base-200 relative z-10">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {/* Main content body rendered as Markdown */}
            <article className="prose prose-sm md:prose-base max-w-none text-base-content/90 prose-headings:text-base-content prose-p:leading-8 prose-li:my-1 prose-blockquote:border-primary prose-blockquote:text-base-content/70 pt-2 pb-10">
              <ReactMarkdown>{newsItem.content}</ReactMarkdown>
            </article>
          </div>
        )}
      </div>
    </main>
  );
}
