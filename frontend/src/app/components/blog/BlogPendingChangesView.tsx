"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import GenericOverlayModal from "@/components/GenericOverlayModal";
import { apiService } from "../../../api";
import { useAuth } from "@/hooks/useAuth";
import dynamic from "next/dynamic";
import ConfirmationModal from "@/components/ConfirmationModal";

const BlockNoteReader = dynamic(
  () => import("@/components/blog/BlockNoteReader"),
  { ssr: false }
);

interface BlogPendingChangesViewProps {
  setShowPendingChanges: (show: boolean) => void;
  blogId?: number;
  slug?: string;
  title?: string;
  isGlobal?: boolean;
}

interface PendingBlogDraft {
  pending_id: number;
  blog_id: number | null;
  title: string | null;
  description: string | null;
  slug: string | null;
  content: string | null;
  status: string;
  editor_id: number;
  version: number | null;
  created_at: string;
  editor: {
    user_id: number;
    name: string;
    avatar_url: string | null;
  } | null;
}

const DraftSkeleton = () => (
  <div className="p-4 sm:p-5 border border-base-300 bg-base-100 rounded-2xl shadow-sm animate-pulse select-none">
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-base-300 shrink-0"></div>
      <div className="flex-1 min-w-0 space-y-3">
        <div className="h-5 bg-base-300 rounded-md w-1/3"></div>
        <div className="space-y-2">
          <div className="h-3 bg-base-200/60 rounded-md w-full"></div>
          <div className="h-3 bg-base-200/60 rounded-md w-5/6"></div>
        </div>
      </div>
    </div>
  </div>
);

export default function BlogPendingChangesView({
  setShowPendingChanges,
  blogId,
  slug,
  title,
  isGlobal = false,
}: BlogPendingChangesViewProps) {
  const { user } = useAuth();
  const isAdminOrMod = user?.role === "admin" || user?.role === "moderator";

  const [drafts, setDrafts] = useState<PendingBlogDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showCancelDraftConfirm, setShowCancelDraftConfirm] = useState(false);
  const [draftToCancel, setDraftToCancel] = useState<number | null>(null);

  // Review states
  const [activeReviewDraft, setActiveReviewDraft] = useState<PendingBlogDraft | null>(null);
  const [liveContent, setLiveContent] = useState<string | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [editorTheme, setEditorTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark") || 
                     document.documentElement.getAttribute("data-theme") === "dark";
      setEditorTheme(isDark ? "dark" : "light");
    }
  }, []);

  const limit = 4;

  const fetchDrafts = useCallback(async (pageNum: number, append = false) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);
    try {
      const data = await apiService.getPendingBlogDrafts({ page: pageNum, limit: isGlobal ? 50 : limit });
      if (data && data.success) {
        let filtered = data.drafts;
        
        if (!isGlobal) {
          if (blogId) {
            filtered = data.drafts.filter((d: PendingBlogDraft) => d.blog_id === blogId);
          } else {
            filtered = data.drafts.filter((d: PendingBlogDraft) => {
              if (d.blog_id === null) {
                return d.slug === slug || d.title === title;
              }
              return false;
            });
          }
        }
        
        if (append) {
          setDrafts((prev) => [...prev, ...filtered]);
        } else {
          setDrafts(filtered);
        }
        setHasMore(data.hasMore);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.message || "Failed to load pending changes.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [blogId, slug, title, isGlobal]);

  useEffect(() => {
    fetchDrafts(1, false);
  }, [fetchDrafts]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchDrafts(next, true);
  };

  const startReview = async (draft: PendingBlogDraft) => {
    setActiveReviewDraft(draft);
    setLiveContent(null);
    if (draft.blog_id) {
      setReviewLoading(true);
      try {
        const res = await apiService.getBlog(draft.slug || "");
        if (res && res.success) {
          setLiveContent(res.blog.content || "");
        }
      } catch (err) {
        console.error("Failed to load live blog for comparison:", err);
        setLiveContent("Error loading live version.");
      } finally {
        setReviewLoading(false);
      }
    }
  };

  const handleReview = async (pendingId: number, action: "approve" | "reject") => {
    const reviewerId = user?.user_id ?? 0;
    if (!reviewerId) {
      alert("You must be logged in to review drafts.");
      return;
    }
    try {
      await apiService.reviewBlogDraft(pendingId, {
        reviewer_id: reviewerId,
        action: action,
      });

      alert(`Draft ${action === "approve" ? "approved and published" : "rejected"} successfully!`);

      setDrafts((prev) =>
        prev.map((d) =>
          d.pending_id === pendingId
            ? { ...d, status: action === "approve" ? "approved" : "rejected" }
            : d
        )
      );
      setActiveReviewDraft(null);
      window.dispatchEvent(new CustomEvent("blog-pending-updated"));
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || err.message || "Error processing review");
    }
  };

  const handleDeleteDraft = (pendingId: number) => {
    setDraftToCancel(pendingId);
    setShowCancelDraftConfirm(true);
  };

  const confirmDeleteDraft = async () => {
    if (draftToCancel === null) return;
    try {
      await apiService.deleteBlogDraft(draftToCancel);
      alert("Draft cancelled successfully!");
      setDrafts((prev) => prev.filter((d) => d.pending_id !== draftToCancel));
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || "Failed to cancel draft");
    } finally {
      setDraftToCancel(null);
    }
  };

  const closeModal = () => {
    setShowPendingChanges(false);
  };

  const isNewBlogProposal = !!activeReviewDraft && !activeReviewDraft.blog_id;

  return (
    <GenericOverlayModal isOpen={true} onClose={closeModal} title="Blog Pending Approvals">
      <div className="max-w-3xl mx-auto space-y-6 w-full">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-serif font-black text-base-content tracking-tight">Blog Pending Approvals</h2>
          <p className="text-xs text-base-content/50 font-semibold uppercase tracking-wider">
            {isAdminOrMod ? "Review proposed blog drafts before publishing" : "Track your submitted blog proposals"}
          </p>
        </div>

        {loading ? (
          <div className="space-y-4 pt-4">
            <DraftSkeleton />
            <DraftSkeleton />
          </div>
        ) : error ? (
          <div className="p-6 border border-error/20 bg-error/10 text-error rounded-2xl">
            <p className="font-semibold">Error Loading Drafts</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={() => { setPage(1); fetchDrafts(1, false); }}
              className="mt-4 px-4 py-2 bg-error text-error-content rounded-lg text-xs font-bold hover:bg-error/80 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : drafts.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-base-300 bg-base-100 rounded-2xl">
            <p className="text-base-content/60 font-medium">No pending drafts found.</p>
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            {drafts.map((pending) => {
              const authorName = pending.editor?.name || `User #${pending.editor_id}`;
              const initials = authorName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() || "U";
              const timeString = new Date(pending.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              });

              const isOwner = user?.user_id === pending.editor_id;

              return (
                <div key={pending.pending_id} className="p-4 sm:p-5 border border-base-300 bg-base-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-150 relative group">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-base-200 border border-base-300 flex items-center justify-center font-bold text-sm text-base-content/80 shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3">
                        <h4 className="text-base font-bold text-base-content truncate leading-snug">{pending.title}</h4>
                        <span className="text-xs text-base-content/50 shrink-0 font-medium">{timeString}</span>
                      </div>
                      {pending.description && (
                        <p className="text-xs text-base-content/60 mt-1 italic line-clamp-2">
                          {pending.description}
                        </p>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-base-200 border-dashed">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-base-content/80">{authorName}</span>
                          <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {pending.blog_id ? "Edit Proposal" : "New Post Proposal"}
                          </span>
                          {pending.version !== null && (
                            <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-neutral/20 text-base-content/80 border border-base-300">
                              v{pending.version}
                            </span>
                          )}
                          {pending.status === "approved" && (
                            <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-success/10 text-success border border-success/20">
                              Approved
                            </span>
                          )}
                          {pending.status === "rejected" && (
                            <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-error/10 text-error border border-error/20">
                              Rejected
                            </span>
                          )}
                          {pending.status === "in_review" && (
                            <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/20">
                              Pending Review
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          {pending.status === "in_review" && isOwner && (
                            <button
                              onClick={() => handleDeleteDraft(pending.pending_id)}
                              className="btn btn-xs btn-outline btn-error rounded-lg font-bold"
                            >
                              Cancel Draft
                            </button>
                          )}
                          {pending.status === "in_review" && isAdminOrMod && (
                            <button
                              onClick={() => startReview(pending)}
                              className="btn btn-xs btn-primary rounded-lg font-bold"
                            >
                              Review Changes
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="btn btn-sm btn-outline rounded-xl font-bold"
                >
                  {loadingMore ? "Loading..." : "Load More Drafts"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={showCancelDraftConfirm}
        onClose={() => {
          setShowCancelDraftConfirm(false);
          setDraftToCancel(null);
        }}
        onConfirm={confirmDeleteDraft}
        title="Cancel Draft Proposal"
        message="Are you sure you want to cancel and delete this draft proposal? This action is permanent and cannot be undone."
        confirmText="Cancel Proposal"
        cancelText="Keep Draft"
        type="danger"
      />

      {mounted && activeReviewDraft &&
        createPortal(
          <GenericOverlayModal
            isOpen={true}
            onClose={() => setActiveReviewDraft(null)}
            title={`Review Blog: ${activeReviewDraft.title}`}
            maxWidthClass="max-w-6xl"
            defaultMaximized
          >
            <div className="flex flex-col flex-1 min-h-0 select-text overflow-hidden h-[85vh]">
              <p className="text-xs text-base-content/50 mb-3 font-semibold uppercase tracking-wider shrink-0">
                Compare live content with proposal. Author: {activeReviewDraft.editor?.name || `User #${activeReviewDraft.editor_id}`}
              </p>

              {/* Two content columns side by side */}
              <div className="flex-1 min-h-0 flex flex-row gap-4 overflow-y-auto">
                <div className="flex-1 min-w-0 border border-base-200 rounded-2xl overflow-y-auto bg-base-200/20 p-4">
                  <h3 className="text-sm font-bold text-base-content/50 border-b pb-2 mb-4 uppercase">Live version</h3>
                  {reviewLoading ? (
                    <div className="flex-1 flex flex-col gap-2.5 p-4 animate-pulse">
                      <div className="h-3.5 bg-base-300 rounded w-full"></div>
                      <div className="h-3.5 bg-base-300 rounded w-5/6"></div>
                    </div>
                  ) : isNewBlogProposal ? (
                    <div className="h-full flex items-center justify-center text-center text-sm text-base-content/50 italic p-4">
                      New blog proposal. No live version exists.
                    </div>
                  ) : (
                    <BlockNoteReader contentJson={liveContent} theme={editorTheme} />
                  )}
                </div>

                <div className="flex-1 min-w-0 border border-base-200 rounded-2xl overflow-y-auto bg-base-100 p-4">
                  <h3 className="text-sm font-bold text-base-content/50 border-b pb-2 mb-4 uppercase">Proposed changes</h3>
                  <BlockNoteReader contentJson={activeReviewDraft.content} theme={editorTheme} />
                </div>
              </div>

              <footer className="pt-4 mt-4 border-t border-base-200 flex justify-end gap-3 shrink-0">
                <button
                  onClick={() => setActiveReviewDraft(null)}
                  className="btn btn-ghost btn-sm rounded-xl"
                >
                  Close
                </button>
                {isAdminOrMod && (
                  <>
                    <button
                      onClick={() => handleReview(activeReviewDraft.pending_id, "reject")}
                      className="btn btn-error btn-sm rounded-xl text-error-content"
                    >
                      Reject Draft
                    </button>
                    <button
                      onClick={() => handleReview(activeReviewDraft.pending_id, "approve")}
                      className="btn btn-success btn-sm rounded-xl text-success-content"
                    >
                      Approve & Publish
                    </button>
                  </>
                )}
              </footer>
            </div>
          </GenericOverlayModal>,
          document.body
        )}
    </GenericOverlayModal>
  );
}
