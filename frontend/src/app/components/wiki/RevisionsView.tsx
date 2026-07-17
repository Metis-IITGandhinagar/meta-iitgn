"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import GenericOverlayModal from "@/components/GenericOverlayModal";
import { apiService } from "@/api";
import { useAuth } from "@/hooks/useAuth";
import ConfirmationModal from "@/components/ConfirmationModal";
import { parseMarkdown } from "@/lib/utils";
import { PanelRight, Check, X } from "lucide-react";
import dynamic from "next/dynamic";

const MilkdownEditor = dynamic<any>(() => import("@/components/article/milkdown-editor"), { ssr: false });

interface RevisionsViewProps {
  setShowRevisions: (show: boolean) => void;
  slug: string;
}

const PreviewWikiInfoBox = ({ infobox }: { infobox: any }) => {
  return (
    <div className="w-80 border-l border-base-200 bg-base-100 flex flex-col shrink-0 h-full overflow-y-auto no-scrollbar select-none">
      {/* Infobox Image */}
      <div className="w-full relative bg-base-200/50 border-b border-base-200 flex items-center justify-center overflow-hidden shrink-0 p-1">
        <div className="w-full h-48 relative overflow-hidden">
          {infobox.image ? (
            <img
              src={infobox.image}
              alt={infobox.imageAlt || "Infobox image"}
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <div className="text-base-content/30 text-xs font-medium absolute inset-0 flex items-center justify-center bg-base-200/50 rounded-xl">No Image</div>
          )}
        </div>
      </div>
      {/* Description */}
      {infobox.description && (
        <div className="p-4 border-b border-base-200 bg-base-200/20 text-xs italic text-base-content/70 text-center font-medium leading-relaxed">
          {infobox.description}
        </div>
      )}
      {/* Rows */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <tbody>
            {infobox.rows && infobox.rows.map((row: any, idx: number) => (
              <tr key={idx} className="border-b border-base-200 last:border-b-0 hover:bg-base-200/20 transition-colors">
                <td className="py-2.5 font-bold text-base-content/60 w-1/3 valign-middle leading-snug">
                  {row.label}
                </td>
                <td className="py-2.5 pl-3 font-semibold text-base-content/85 valign-middle leading-relaxed">
                  {row.type === "badge" ? (
                    <span className="badge badge-sm font-extrabold uppercase bg-primary/10 text-primary border border-primary/20">
                      {row.value}
                    </span>
                  ) : Array.isArray(row.value) ? (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {row.value.map((v: string, i: number) => (
                        <span key={i} className="badge badge-sm bg-neutral/15 text-base-content/80 font-bold border border-base-200">
                          {v}
                        </span>
                      ))}
                    </div>
                  ) : (
                    row.value
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface RevisionRecord {
  revision_id: number;
  page_id: number;
  created_by_user_id: number;
  commit_message: string | null;
  title: string | null;
  slug: string;
  content: string | null;
  original_author_id: number;
  created_at: string;
  version: number | null;
  creator: {
    user_id: number;
    name: string;
    avatar_url: string | null;
    role: string;
  };
}

export default function RevisionsView({ setShowRevisions, slug }: RevisionsViewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [revisions, setRevisions] = useState<RevisionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [revisionToRestore, setRevisionToRestore] = useState<number | null>(null);

  const [selectedRevision, setSelectedRevision] = useState<RevisionRecord | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const limit = 5;

  const isAdminOrMod = user?.role === "admin" || user?.role === "moderator";

  const fetchRevisions = async (pageNum: number, append = false) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);
    try {
      const res = await apiService.getPageRevisions(slug, { page: pageNum, limit });
      if (res && res.success) {
        if (append) {
          setRevisions((prev) => [...prev, ...res.revisions]);
        } else {
          setRevisions(res.revisions);
        }
        setHasMore(res.hasMore);
      }
    } catch (err: any) {
      console.error("Error loading page revisions:", err);
      setError(err.response?.data?.error || err.message || "Failed to load revisions.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchRevisions(1, false);
    }
  }, [slug]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchRevisions(next, true);
  };

  const handleRestore = (revisionId: number) => {
    setRevisionToRestore(revisionId);
    setShowRestoreConfirm(true);
  };

  const confirmRestore = async () => {
    if (revisionToRestore === null) return;
    try {
      const res = await apiService.revertPage(slug, revisionToRestore);
      if (res && res.success) {
        alert("Page reverted successfully!");
        setShowRevisions(false);
        window.location.reload();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || "Failed to revert page.");
    } finally {
      setRevisionToRestore(null);
    }
  };

  const closeModal = () => {
    setShowRevisions(false);
    router.back();
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Unknown time";
    }
  };

  return (
    <>
      <GenericOverlayModal isOpen={true} onClose={closeModal} title="Recent Page Revisions">
      <div className="max-w-3xl mx-auto space-y-6 w-full">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-serif font-black text-base-content tracking-tight">Recent Page Revisions</h2>
          <p className="text-xs text-base-content/50 font-semibold uppercase tracking-wider">Track and restore past edits for this article</p>
        </div>

        {loading ? (
          <div className="space-y-4 pt-4">
            <div className="h-24 w-full bg-base-200 animate-pulse rounded-2xl"></div>
            <div className="h-24 w-full bg-base-200 animate-pulse rounded-2xl"></div>
          </div>
        ) : error ? (
          <div className="p-6 border border-error/20 bg-error/10 text-error rounded-2xl text-center">
            <p className="font-semibold">{error}</p>
            <button
              onClick={() => { setPage(1); fetchRevisions(1, false); }}
              className="btn btn-sm btn-error mt-4 text-error-content rounded-xl"
            >
              Retry
            </button>
          </div>
        ) : revisions.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-base-300 bg-base-100 rounded-2xl">
            <p className="text-base-content/60 font-medium">No revision history found for this page.</p>
          </div>
        ) : (
          <div className="space-y-4 pt-4 pb-12">
            {revisions.map((revision) => {
              const authorName = revision.creator?.name || `User #${revision.created_by_user_id}`;
              const initials = authorName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() || "U";
              const timeString = formatDate(revision.created_at);

              return (
                <div
                  key={revision.revision_id}
                  onClick={() => setSelectedRevision(revision)}
                  className="p-4 sm:p-5 border border-base-300 bg-base-100 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/50 cursor-pointer transition-all duration-150 relative group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-base-200 border border-base-300 flex items-center justify-center font-bold text-sm text-base-content/80 shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3">
                        <h4 className="text-base font-bold text-base-content truncate leading-snug">
                          {revision.title || "Untitled Version"}
                        </h4>
                        <span className="text-xs text-base-content/50 shrink-0 font-medium">{timeString}</span>
                      </div>
                      <p className="text-sm text-base-content/60 mt-1.5 leading-relaxed">
                        {revision.commit_message || `Version backup (v${revision.version})`}
                      </p>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-base-200 border-dashed">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                          <span className="text-xs font-semibold text-base-content/80">{authorName}</span>
                          <span className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                            Page Revision
                          </span>
                          {revision.version !== null && (
                            <span className="text-xs text-base-content/50">Version {revision.version}</span>
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
                  {loadingMore ? "Loading..." : "Load More Revisions"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

    </GenericOverlayModal>

    {selectedRevision && (
      <GenericOverlayModal
        isOpen={true}
        onClose={() => setSelectedRevision(null)}
        title={`Revision Preview - v${selectedRevision.version}`}
        maxWidthClass="max-w-6xl"
        paddingClass="p-0"
      >
        <div className="flex flex-col lg:flex-row flex-1 h-full min-h-0 w-full relative overflow-hidden select-text pb-16 font-sans bg-base-100">
          {/* Left pane: Main Content */}
          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
            <h3 className="text-2xl font-serif font-black text-base-content mb-6">
              {selectedRevision.title || "Untitled Version"}
            </h3>
            <div className="prose max-w-none">
              <MilkdownEditor
                key={selectedRevision.revision_id}
                initialMarkdown={parseMarkdown(selectedRevision.content || "").contentMarkdown}
                readOnly={true}
                onMarkdownChange={() => {}}
              />
            </div>
          </div>

          {/* Right pane: Sidebar (Infobox) */}
          {sidebarOpen && (
            <div className="w-full lg:w-80 h-[35vh] lg:h-full shrink-0 border-t lg:border-t-0 lg:border-l border-base-200">
              <PreviewWikiInfoBox
                infobox={parseMarkdown(selectedRevision.content || "").infobox}
              />
            </div>
          )}

          {/* Bottom Floating Control Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-base-100 border-t border-base-200 flex items-center justify-between px-6 z-50">
            <div className="flex gap-2">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`btn btn-sm rounded-xl font-bold flex items-center gap-1.5 cursor-pointer ${
                  sidebarOpen ? "btn-primary" : "btn-outline"
                }`}
              >
                <PanelRight className="h-4 w-4" />
                <span>{sidebarOpen ? "Hide InfoBox" : "Show InfoBox"}</span>
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedRevision(null)}
                className="btn btn-sm btn-ghost rounded-xl font-bold cursor-pointer"
              >
                Close Preview
              </button>
              {isAdminOrMod && (
                <button
                  onClick={() => {
                    handleRestore(selectedRevision.revision_id);
                  }}
                  className="btn btn-sm btn-success text-success-content rounded-xl font-bold cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  <span>Restore this Version</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </GenericOverlayModal>
    )}

      <ConfirmationModal
        isOpen={showRestoreConfirm}
        onClose={() => {
          setShowRestoreConfirm(false);
          setRevisionToRestore(null);
        }}
        onConfirm={confirmRestore}
        title="Revert Wiki Article"
        message="Are you sure you want to revert this live article to this previous version? This will overwrite the current live version (a backup will be saved)."
        confirmText="Revert"
        cancelText="Cancel"
        type="warning"
      />
    </>
  );
}
