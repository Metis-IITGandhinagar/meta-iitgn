"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import { apiService } from "../../../api";

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

export default function PendingChangesView({ setShowPendingChanges, pageId }: PendingChangesViewProps) {
  const [drafts, setDrafts] = useState<PendingDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleReview = async (pendingId: number, action: "approve" | "reject") => {
    try {
      await apiService.reviewDraft(pendingId, {
        reviewer_id: 0, // Simulated current reviewer ID
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
      window.dispatchEvent(new CustomEvent("wiki-pending-updated"));
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : `Error processing review`;
      alert(errMsg);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col h-screen w-screen overflow-hidden select-none animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <header className="h-16 border-b border-gray-200 flex items-center gap-4 px-4 lg:px-6 shrink-0 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] select-none">
        <button
          onClick={() => {
            setShowPendingChanges(false);
            window.dispatchEvent(new CustomEvent("hide-wiki-history"));
          }}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors duration-200 cursor-pointer active:scale-95 flex items-center justify-center animate-in fade-in"
          aria-label="Back to Wiki"
        >
          <ChevronLeft className="h-6 w-6 text-base-content" />
        </button>
        <span className="text-sm font-bold text-base-content uppercase tracking-wider">Changes</span>
      </header>

      {/* Changes Body */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 md:p-8 lg:p-12">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-serif font-black text-base-content tracking-tight">Pending Approval</h2>
            <p className="text-xs text-base-content/50 font-semibold uppercase tracking-wider">Review proposed community revisions before publishing</p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-base-content/60">Loading pending drafts...</p>
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
                                onClick={() => handleReview(pending.pending_id, "approve")}
                                className="text-xs font-extrabold text-primary hover:text-blue-700 transition-colors cursor-pointer duration-150"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReview(pending.pending_id, "reject")}
                                className="text-xs font-extrabold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer duration-150"
                              >
                                Reject
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
      </div>
    </div>
  );
}
