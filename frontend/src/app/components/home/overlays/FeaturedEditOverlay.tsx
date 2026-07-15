"use client";

import React, { useState } from "react";
import { Search, Plus, Trash2, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useHomeStore } from "@/store/useHomeStore";
import { apiService } from "@/api";
import GenericOverlayModal from "@/components/GenericOverlayModal";

interface FeaturedEditOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeaturedEditOverlay({
  isOpen,
  onClose,
}: FeaturedEditOverlayProps) {
  const { activeTier, user } = useAuth();
  const isGold = activeTier === "gold" || user?.role === "admin";

  const featuredPages = useHomeStore((s) => s.featuredPages);
  const setFeaturedPages = useHomeStore((s) => s.setFeaturedPages);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Re-fetch the featured list from the server and sync the store so the
  // home carousel updates live.
  const refresh = async () => {
    try {
      const res = await apiService.getFeaturedPages();
      const data = (res.data || []).map((item: any) => ({
        ...item,
        id: String(item.featured_id),
      }));
      setFeaturedPages(data);
    } catch (err) {
      console.error("Failed to refresh featured pages:", err);
    }
  };

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await apiService.searchPages(q, 1, 8, "All");
      // Some backend versions don't include page_id in search results, so we
      // filter by slug here and resolve page_id at add-time (via getPage).
      const featuredSlugs = new Set(
        featuredPages.map((f: any) => f.slug)
      );
      const pages = (res.results || []).filter(
        (r: any) =>
          r.type === "page" &&
          !r.is_pending &&
          !featuredSlugs.has(r.slug)
      );
      setResults(pages);
    } catch (err) {
      console.error("Featured search failed:", err);
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async (result: any) => {
    setBusyId(`add-${result.slug}`);
    try {
      // Prefer page_id from search (newer backend); otherwise resolve via slug.
      let pageId = result.page_id;
      if (pageId == null) {
        const page = await apiService.getPage(result.slug);
        pageId = page?.page_id;
      }
      if (pageId == null) {
        alert("That page can't be featured (no page id).");
        return;
      }
      await apiService.setFeaturedPage({ page_id: pageId });
      setResults([]);
      setQuery("");
      await refresh();
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.error?.message ||
        err?.message ||
        "Failed to add featured page.";
      alert(msg);
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (featuredId: number) => {
    setBusyId(`remove-${featuredId}`);
    try {
      await apiService.removeFeaturedPage(featuredId);
      await refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to remove featured page.");
    } finally {
      setBusyId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <GenericOverlayModal
      isOpen={isOpen}
      onClose={onClose}
      title="Featured Pages"
      headerColorClass="text-primary bg-base-200"
    >
      <div className="space-y-6 w-full">
        {!isGold && (
          <div className="rounded-xl border border-base-300 bg-base-200/40 px-4 py-3 text-xs text-base-content/70 font-semibold">
            You&rsquo;re viewing the featured list. Editing is available to gold
            members.
          </div>
        )}

        {/* Gold-only: search & add */}
        {isGold && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/40" />
              <input
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search pages to feature…"
                className="w-full border border-base-300 hover:border-base-content/30 focus:border-primary rounded-xl pl-9 pr-3 py-2.5 text-sm text-base-content placeholder-base-content/40 bg-base-100 focus:outline-none transition-all duration-150 shadow-sm"
              />
            </div>

            {searching && (
              <div className="flex items-center gap-2 text-xs text-base-content/50 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching…
              </div>
            )}

            {!searching && results.length > 0 && (
              <div className="space-y-2">
                {results.map((r) => (
                  <button
                    key={r.slug}
                    type="button"
                    disabled={busyId === `add-${r.slug}`}
                    onClick={() => handleAdd(r)}
                    className="w-full flex items-center justify-between gap-3 rounded-xl border border-base-200 bg-base-100 px-3 py-2.5 text-left hover:border-primary/40 hover:bg-primary/5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-base-content truncate">
                        {r.title}
                      </span>
                      <span className="block text-[10px] uppercase tracking-wider text-base-content/50">
                        {r.category || "Page"}
                      </span>
                    </span>
                    {busyId === `add-${r.slug}` ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                    ) : (
                      <Plus className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {!searching && query.trim() && results.length === 0 && (
              <p className="text-xs text-base-content/50 py-2">
                No new pages match &ldquo;{query}&rdquo;.
              </p>
            )}
          </div>
        )}

        {/* Listing (everyone) */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-base-content/50 tracking-wider uppercase">
            {isGold ? "Currently Featured" : "Featured List"}
          </h4>

          {featuredPages.length === 0 ? (
            <p className="text-sm text-base-content/50 py-6 text-center border border-dashed border-base-300 rounded-2xl">
              No featured pages yet.
            </p>
          ) : (
            featuredPages.map((f: any) => (
              <div
                key={f.id}
                className="flex items-center gap-3 rounded-xl border border-base-200 bg-base-100 p-2.5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.image || "/homepage_bg.png"}
                  alt={f.title || "Featured"}
                  className="w-14 h-14 object-cover rounded-lg shrink-0 bg-base-200"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-base-content truncate">
                    {f.title}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-base-content/50 truncate">
                    {f.tag || "Featured"}
                    {f.location ? ` · ${f.location}` : ""}
                  </p>
                </div>
                {isGold && (
                  <button
                    type="button"
                    disabled={busyId === `remove-${f.featured_id}`}
                    onClick={() => handleRemove(f.featured_id)}
                    className="btn btn-ghost btn-sm btn-square text-error hover:bg-error/10 shrink-0"
                    aria-label={`Remove ${f.title}`}
                    title="Remove from featured"
                  >
                    {busyId === `remove-${f.featured_id}` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </GenericOverlayModal>
  );
}
