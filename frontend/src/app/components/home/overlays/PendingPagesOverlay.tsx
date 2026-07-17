"use client";

import React from "react";
import { createPortal } from "react-dom";
import { apiService } from "@/api";
import GenericOverlayModal from "@/components/GenericOverlayModal";
import WikiReadView from "@/components/article/WikiReadView";
import { useAuth } from "@/hooks/useAuth";

interface PendingPagesOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  pendingPages: any[];
  getRelativeTime: (dateString: string) => string;
  handleReview: (pending_id: number, action: "approve" | "reject") => Promise<void>;
  hasMore: boolean;
  onLoadMore: () => void;
}

export default function PendingPagesOverlay({
  isOpen,
  onClose,
  pendingPages,
  getRelativeTime,
  handleReview,
  hasMore,
  onLoadMore,
}: PendingPagesOverlayProps) {
  const { activeTier } = useAuth();
  const canModerate = activeTier !== "bronze";
  const [activeReviewDraft, setActiveReviewDraft] = React.useState<any | null>(null);
  const [liveContent, setLiveContent] = React.useState<string>("");
  const [reviewLoading, setReviewLoading] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isNewPageProposal = !!activeReviewDraft && !activeReviewDraft.page_id;

  const startReview = async (draft: any) => {
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

  const handleReviewAction = async (pendingId: number, action: "approve" | "reject") => {
    try {
      await handleReview(pendingId, action);
      setActiveReviewDraft(null);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  // Side-by-side review modal — rendered via portal with the global
  // GenericOverlayModal so it is never clipped by the parent modal.
  const reviewModal =
    mounted && activeReviewDraft
      ? createPortal(
          <GenericOverlayModal
            isOpen={true}
            onClose={() => setActiveReviewDraft(null)}
            title={`Review: ${activeReviewDraft.title}`}
            maxWidthClass="max-w-6xl"
            defaultMaximized
          >
            <div className="flex flex-col flex-1 min-h-0">
              <p className="text-xs text-base-content/50 mb-3 font-semibold uppercase tracking-wider shrink-0">
                Author:{" "}
                {activeReviewDraft.editor?.name ||
                  activeReviewDraft.users?.name ||
                  `User #${activeReviewDraft.editor_id}`}
              </p>

              {/* Two content columns side by side */}
              <div className="flex-1 min-h-0 flex flex-row gap-4">
                {/* Live version */}
                <div className="flex-1 min-w-0 min-h-0 border border-base-200 rounded-2xl overflow-hidden bg-base-200/20">
                  {reviewLoading ? (
                    <div className="flex flex-col gap-2.5 p-4 animate-pulse">
                      <div className="h-3.5 bg-base-300 rounded w-full" />
                      <div className="h-3.5 bg-base-300 rounded w-5/6" />
                      <div className="h-3.5 bg-base-300 rounded w-2/3" />
                    </div>
                  ) : isNewPageProposal ? (
                    <div className="h-full flex items-center justify-center text-center text-sm text-base-content/50 italic p-4">
                      New page proposal. No live version exists.
                    </div>
                  ) : (
                    <WikiReadView markdown={liveContent} />
                  )}
                </div>

                {/* Proposed draft */}
                <div className="flex-1 min-w-0 min-h-0 border border-base-200 rounded-2xl overflow-hidden bg-base-100">
                  <WikiReadView markdown={activeReviewDraft.content} />
                </div>
              </div>

              {/* Footer */}
              <footer className="pt-4 mt-2 border-t border-base-200 flex justify-end gap-3 shrink-0">
                {!canModerate && (
                  <p className="mr-auto self-center text-xs text-base-content/50 font-medium italic">
                    You have view-only access. Only moderators can approve or reject.
                  </p>
                )}
                <button
                  onClick={() => setActiveReviewDraft(null)}
                  className="btn btn-ghost btn-sm rounded-xl"
                >
                  Close
                </button>
                {canModerate && (
                  <>
                    <button
                      onClick={() => handleReviewAction(activeReviewDraft.pending_id, "reject")}
                      className="btn btn-error btn-sm rounded-xl text-error-content"
                    >
                      Reject Draft
                    </button>
                    <button
                      onClick={() => handleReviewAction(activeReviewDraft.pending_id, "approve")}
                      className="btn btn-success btn-sm rounded-xl text-success-content"
                    >
                      Approve &amp; Publish
                    </button>
                  </>
                )}
              </footer>
            </div>
          </GenericOverlayModal>,
          document.body
        )
      : null;

  return (
    <>
      <GenericOverlayModal
        isOpen={isOpen}
        onClose={onClose}
        title="Pending Changes Review"
        headerColorClass="text-accent bg-base-200"
      >
        <div className="max-w-3xl mx-auto space-y-6 w-full">
          {pendingPages.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-base-300 bg-base-100 rounded-2xl">
              <p className="text-base-content/60 font-medium">No pending drafts awaiting review.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPages.map((pending) => {
                const authorName =
                  pending.editor?.name || pending.users?.name || `User #${pending.editor_id}`;
                const initials =
                  authorName
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase() || "U";
                const timeString = getRelativeTime(pending.created_at);

                return (
                  <div
                    key={pending.pending_id+1}
                    className="p-5 border border-base-300 bg-base-100 rounded-2xl shadow-xs hover:shadow-md transition-all duration-150 relative text-left"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-base-200 border border-base-300 flex items-center justify-center font-bold text-sm text-base-content/85 shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="text-base font-bold text-base-content truncate">
                            {pending.title}
                          </h4>
                          <span className="text-xs text-base-content/50 shrink-0 font-medium">
                            {timeString}
                          </span>
                        </div>
                        <p className="text-sm text-base-content/70 mt-2 leading-relaxed line-clamp-3 font-medium">
                          {pending.content.replace(/---[\s\S]*?---/, "").trim()}
                        </p>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-base-200 border-dashed">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-base-content/80">
                              {authorName}
                            </span>
                            <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                              {pending.page_id ? "Edit Proposal" : "New Page Proposal"}
                            </span>
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
                          {pending.status === "in_review" && (
                            <button
                              onClick={() => startReview(pending)}
                              className="btn btn-xs btn-primary rounded-lg font-bold shrink-0"
                            >
                              Review Changes
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {hasMore && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={onLoadMore}
                    className="inline-flex items-center gap-2 px-6 py-2 border border-base-300 hover:border-primary text-base-content/80 bg-base-100 hover:bg-base-200 rounded-xl text-xs font-bold shadow-xs transition-all duration-200 cursor-pointer active:scale-95"
                  >
                    Load More Drafts
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </GenericOverlayModal>

      {/* Review modal rendered in document.body via portal — never clipped */}
      {reviewModal}
    </>
  );
}
