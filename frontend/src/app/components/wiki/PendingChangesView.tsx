"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import GenericOverlayModal from "@/components/GenericOverlayModal";
import WikiReadView from "@/components/article/WikiReadView";
import { apiService } from "../../../api";
import { useAuth } from "@/hooks/useAuth";

interface PendingChangesViewProps {
  setShowPendingChanges: (show: boolean) => void;
  pageId?: number;
}

interface PendingDraft {
  pending_id: number;
  page_id: number | null;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  status: string;
  editor_id: number;
  version: number | null;
  created_at: string;
  users?: {
    name: string;
  } | null;
}

const DraftSkeleton = () => (
  <div className="p-4 sm:p-5 border border-gray-200 bg-white rounded-2xl shadow-sm animate-pulse select-none">
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-base-200 shrink-0"></div>
      <div className="flex-1 min-w-0 space-y-3">
        <div className="h-5 bg-base-300 rounded-md w-1/3"></div>
        <div className="space-y-2">
          <div className="h-3 bg-base-200 rounded-md w-full"></div>
          <div className="h-3 bg-base-200 rounded-md w-5/6"></div>
        </div>
        <div className="h-4 bg-base-200 rounded-md w-1/4 mt-4"></div>
      </div>
    </div>
  </div>
);

export default function PendingChangesView({ setShowPendingChanges, pageId }: PendingChangesViewProps) {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<PendingDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Side-by-side review states
  const [activeReviewDraft, setActiveReviewDraft] = useState<PendingDraft | null>(null);
  const [liveContent, setLiveContent] = useState<string>("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchDrafts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getPendingDrafts(pageId);
      setDrafts(data);
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : "An error occurred while loading pending changes.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const startReview = async (draft: PendingDraft) => {
    setActiveReviewDraft(draft);
    setLiveContent("");
    if (draft.page_id) {
      setReviewLoading(true);
      try {
        const livePage = await apiService.getPageById(draft.page_id);
        setLiveContent(livePage.content || "");
      } catch (err) {
        console.error("Failed to load live page for comparison:", err);
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
      await apiService.reviewDraft(pendingId, {
        reviewer_id: reviewerId,
        action: action,
        rejection_reason: action === "reject" ? "Rejected by reviewer/moderator." : undefined,
      });

      alert(`Draft ${action === "approve" ? "approved and published" : "rejected"} successfully!`);

      // Update state status
      setDrafts((prev) =>
        prev.map((d) =>
          d.pending_id === pendingId
            ? { ...d, status: action === "approve" ? "approved" : "rejected" }
            : d
        )
      );
      setActiveReviewDraft(null);
      window.dispatchEvent(new CustomEvent("wiki-pending-updated"));
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : `Error processing review`;
      alert(errMsg);
    }
  };

  const closeModal = () => {
    setShowPendingChanges(false);
    window.dispatchEvent(new CustomEvent("hide-wiki-history"));
  };

  const isNewPageProposal = !!activeReviewDraft && !activeReviewDraft.page_id;

  return (
    <GenericOverlayModal isOpen={true} onClose={closeModal} title="Pending Approval">
      <div className="max-w-3xl mx-auto space-y-6 w-full">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-serif font-black text-base-content tracking-tight">Pending Approval</h2>
          <p className="text-xs text-base-content/50 font-semibold uppercase tracking-wider">Review proposed community revisions before publishing</p>
        </div>

        {loading ? (
          <div className="space-y-4 pt-4">
            <DraftSkeleton />
            <DraftSkeleton />
            <DraftSkeleton />
          </div>
        ) : error ? (
          <div className="p-6 border border-rose-200 bg-rose-50 text-rose-800 rounded-2xl">
            <p className="font-semibold">Error Loading Drafts</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={fetchDrafts}
              className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : drafts.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-300 bg-white rounded-2xl">
            <p className="text-base-content/60 font-medium">No pending drafts awaiting review.</p>
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            {drafts.map((pending) => {
              const authorName = pending.users?.name || `User #${pending.editor_id}`;
              const initials = authorName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() || "U";
              const timeString = new Date(pending.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              });

              return (
                <div key={pending.pending_id} className="p-4 sm:p-5 border border-gray-200 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-150 relative group">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-base-200 border border-base-300 flex items-center justify-center font-bold text-sm text-base-content/80 shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3">
                        <h4 className="text-base font-bold text-base-content truncate leading-snug">{pending.title}</h4>
                        <span className="text-xs text-base-content/50 shrink-0 font-medium">{timeString}</span>
                      </div>
                      <p className="text-sm text-base-content/60 mt-1.5 leading-relaxed line-clamp-3">
                        {pending.content.replace(/---[\s\S]*?---/, "").trim()}
                      </p>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-base-200 border-dashed">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-base-content/80">{authorName}</span>
                          <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-primary border border-blue-200">
                            {pending.page_id ? "Edit Proposal" : "New Page Proposal"}
                          </span>
                          {pending.version !== null && (
                            <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-gray-50 text-gray-600 border border-gray-200">
                              v{pending.version}
                            </span>
                          )}
                          {pending.status === "approved" && (
                            <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Approved
                            </span>
                          )}
                          {pending.status === "rejected" && (
                            <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              Rejected
                            </span>
                          )}
                          {pending.status === "in_review" && (
                            <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              Pending Review
                            </span>
                          )}
                        </div>

                        {pending.status === "in_review" && (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => startReview(pending)}
                              className="btn btn-xs btn-primary rounded-lg font-bold"
                            >
                              Review Changes
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {mounted && activeReviewDraft &&
        createPortal(
          <GenericOverlayModal
            isOpen={true}
            onClose={() => setActiveReviewDraft(null)}
            title={`Review: ${activeReviewDraft.title}`}
            maxWidthClass="max-w-6xl"
          >
            <div className="flex flex-col h-[80vh] min-h-0">
              <p className="text-xs text-base-content/50 mb-3 font-semibold uppercase tracking-wider shrink-0">
                Compare live content with proposal. Author: {activeReviewDraft.users?.name || `User #${activeReviewDraft.editor_id}`}
              </p>

              <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-4">
                <div className="flex-1 min-w-0 min-h-0 border border-base-200 rounded-2xl overflow-hidden bg-base-200/20">
                  {reviewLoading ? (
                    <div className="flex-1 flex flex-col gap-2.5 p-4 animate-pulse">
                      <div className="h-3.5 bg-base-300 rounded w-full"></div>
                      <div className="h-3.5 bg-base-300 rounded w-5/6"></div>
                      <div className="h-3.5 bg-base-300 rounded w-2/3"></div>
                    </div>
                  ) : isNewPageProposal ? (
                    <div className="h-full flex items-center justify-center text-center text-sm text-base-content/50 italic p-4">
                      New page proposal. No live version exists.
                    </div>
                  ) : (
                    <WikiReadView markdown={liveContent} />
                  )}
                </div>

                <div className="flex-1 min-w-0 min-h-0 border border-base-200 rounded-2xl overflow-hidden bg-base-100">
                  <WikiReadView markdown={activeReviewDraft.content} />
                </div>
              </div>

              <footer className="pt-4 mt-2 border-t border-base-200 flex justify-end gap-3 shrink-0">
                <button
                  onClick={() => setActiveReviewDraft(null)}
                  className="btn btn-ghost btn-sm rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReview(activeReviewDraft.pending_id, "reject")}
                  className="btn btn-error btn-sm rounded-xl text-white"
                >
                  Reject Draft
                </button>
                <button
                  onClick={() => handleReview(activeReviewDraft.pending_id, "approve")}
                  className="btn btn-success btn-sm rounded-xl text-white"
                >
                  Approve & Publish
                </button>
              </footer>
            </div>
          </GenericOverlayModal>,
          document.body
        )}
    </GenericOverlayModal>
  );
}
