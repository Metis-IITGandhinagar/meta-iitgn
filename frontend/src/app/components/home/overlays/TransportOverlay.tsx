"use client";

import React, { useState, useEffect } from "react";
import {
  Loader2,
  Pencil,
  Save,
  Plus,
  Trash2,
  X,
  Clock,
  ArrowUp,
  ArrowDown,
  Bus,
} from "lucide-react";
import { apiService } from "@/api";
import { useAuth } from "@/hooks/useAuth";
import GenericOverlayModal from "@/components/GenericOverlayModal";
import TransportView from "@/components/article/TransportView";
import {
  TransportLine,
  TransportSlot,
  TransportTrip,
  splitTransportContent,
  buildTransportContent,
  parseTransport,
} from "@/lib/transport";

interface TransportOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  transport: any | null;
  onSaved?: () => void;
}

export default function TransportOverlay({
  isOpen,
  onClose,
  transport,
}: TransportOverlayProps) {
  const { user } = useAuth();
  const canEdit = user?.role === "admin" || user?.role === "moderator";

  const [lines, setLines] = useState<TransportLine[]>([]);
  const [activeLine, setActiveLine] = useState<number>(0);
  const [editing, setEditing] = useState(false);
  const [header, setHeader] = useState("");
  const [newLineName, setNewLineName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Draft metadata captured on edit so we can submit a review draft
  // (no direct live-page edits for the transport schedule).
  const [pageId, setPageId] = useState<number | null>(null);
  const [baseVersion, setBaseVersion] = useState<number>(1);
  const [pageMetadata, setPageMetadata] = useState<any>({ category: "campus-transport" });
  const [pageTitle, setPageTitle] = useState<string>("Campus Transport");

  useEffect(() => {
    if (!isOpen) return;
    setEditing(false);
    setError(null);
    setSuccess(null);
    const parsed = transport?.content ? parseTransport(transport.content) : [];
    setLines(parsed);
    setActiveLine(0);
  }, [isOpen, transport]);

  const selectedLine: TransportLine | undefined = lines[activeLine];

  // ── Visual edit helpers (operate on the active line) ────────────────────────
  const patchActiveLine = (
    patch: Partial<TransportLine> | ((l: TransportLine) => TransportLine)
  ) => {
    setLines((prev) =>
      prev.map((l, i) => {
        if (i !== activeLine) return l;
        return typeof patch === "function" ? patch(l) : { ...l, ...patch };
      })
    );
  };

  const setSlots = (slots: TransportSlot[]) => patchActiveLine({ slots });

  const addSlot = () => {
    const slots = selectedLine?.slots ?? [];
    setSlots([...slots, { name: "New Slot", trips: [] }]);
  };

  const updateSlot = (si: number, patch: Partial<TransportSlot>) => {
    const slots = selectedLine?.slots ?? [];
    setSlots(slots.map((s, i) => (i === si ? { ...s, ...patch } : s)));
  };

  const removeSlot = (si: number) => {
    const slots = selectedLine?.slots ?? [];
    setSlots(slots.filter((_, i) => i !== si));
  };

  const moveSlot = (si: number, dir: -1 | 1) => {
    const slots = selectedLine?.slots ?? [];
    const target = si + dir;
    if (target < 0 || target >= slots.length) return;
    const next = [...slots];
    [next[si], next[target]] = [next[target], next[si]];
    setSlots(next);
  };

  const addTrip = (si: number) => {
    const slots = selectedLine?.slots ?? [];
    setSlots(
      slots.map((s, i) =>
        i === si ? { ...s, trips: [...s.trips, { time: "", from: "", to: "", via: "" }] } : s
      )
    );
  };

  const updateTrip = (si: number, ti: number, patch: Partial<TransportTrip>) => {
    const slots = selectedLine?.slots ?? [];
    setSlots(
      slots.map((s, i) =>
        i === si
          ? { ...s, trips: s.trips.map((t, j) => (j === ti ? { ...t, ...patch } : t)) }
          : s
      )
    );
  };

  const removeTrip = (si: number, ti: number) => {
    const slots = selectedLine?.slots ?? [];
    setSlots(
      slots.map((s, i) => (i === si ? { ...s, trips: s.trips.filter((_, j) => j !== ti) } : s))
    );
  };

  const moveTrip = (si: number, ti: number, dir: -1 | 1) => {
    const slots = selectedLine?.slots ?? [];
    setSlots(
      slots.map((s, i) => {
        if (i !== si) return s;
        const target = ti + dir;
        if (target < 0 || target >= s.trips.length) return s;
        const next = [...s.trips];
        [next[ti], next[target]] = [next[target], next[ti]];
        return { ...s, trips: next };
      })
    );
  };

  const addLine = (name: string) => {
    if (!name.trim()) return;
    setLines((prev) => [...prev, { name: name.trim(), slots: [] }]);
    setActiveLine(lines.length);
    setNewLineName("");
  };

  const handleEdit = async () => {
    setError(null);
    try {
      const editRes: any = await apiService.getPageForEdit("campus-transport");
      const fullPage: any = await apiService.getPage("campus-transport");
      const content = editRes?.content ?? transport?.content ?? "";
      const { header: parsedHeader, lines: parsedLines } = splitTransportContent(content);
      setHeader(parsedHeader);
      setLines(parsedLines);
      setPageId(editRes?.page_id ?? fullPage?.page_id ?? transport?.page_id ?? null);
      setBaseVersion(editRes?.versionId ?? fullPage?.version ?? 1);
      setPageMetadata(fullPage?.metadata ?? { category: "campus-transport" });
      setPageTitle(editRes?.title ?? fullPage?.title ?? "Campus Transport");
      setActiveLine(0);
      setNewLineName("");
      setEditing(true);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Failed to load schedule for editing");
    }
  };

  const handleSave = async () => {
    if (lines.length === 0 && !header.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const content = buildTransportContent(header, lines);
      await apiService.submitDraft({
        page_id: pageId,
        title: pageTitle,
        content,
        metadata: pageMetadata,
        editor_id: user?.user_id ?? 0,
        base_version: baseVersion,
      });
      setEditing(false);
      setSuccess("Changes submitted for review. A moderator will publish them after approval.");
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Failed to submit schedule for review");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setSuccess(null);
    if (editing) {
      setEditing(false);
      setError(null);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <GenericOverlayModal
      isOpen={isOpen}
      onClose={handleClose}
      title={editing ? "Edit Transport" : "Campus Transport"}
      headerColorClass="text-secondary bg-base-200"
    >
      <div className="max-w-3xl mx-auto w-full">
        {/* Action bar */}
        {!editing && canEdit && (
          <div className="flex justify-end mb-3">
            <button
              onClick={handleEdit}
              className="btn btn-sm btn-outline border-secondary/40 text-secondary hover:bg-secondary hover:text-secondary-content gap-1.5 font-bold"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit schedule
            </button>
          </div>
        )}

        {error && <div className="alert alert-error text-xs mb-3 py-2">{error}</div>}
        {success && <div className="alert alert-secondary text-xs mb-3 py-2">{success}</div>}

        {editing ? (
          <div className="space-y-4">
            <p className="text-xs text-base-content/60">
              Edit bus lines, slots, and trips below — your changes are submitted for review and
              published by a moderator.
            </p>

            {/* Line switcher (dropdown) + add line */}
            <div className="flex flex-wrap items-center gap-2">
              <Bus className="h-4 w-4 text-secondary" />
              <select
                value={activeLine}
                onChange={(e) => setActiveLine(Number(e.target.value))}
                className="select select-sm select-bordered border-base-300 bg-base-100 text-base-content/80 font-semibold min-w-0 flex-1"
              >
                {lines.map((l, i) => (
                  <option key={i} value={i}>
                    {l.name || `Line ${i + 1}`}
                  </option>
                ))}
              </select>
              <button
                onClick={() => addLine(newLineName || `Line ${lines.length + 1}`)}
                className="btn btn-ghost btn-sm gap-1 text-secondary"
              >
                <Plus className="h-3.5 w-3.5" /> Line
              </button>
            </div>

            {selectedLine ? (
              <div className="space-y-4">
                {/* Line header: name + note */}
                <div className="space-y-2 rounded-xl border border-base-200 bg-base-100 p-3">
                  <input
                    value={selectedLine.name}
                    onChange={(e) => patchActiveLine({ name: e.target.value })}
                    placeholder="Bus line name (e.g. 29-Seater Non-AC Bus)"
                    className="input input-sm input-bordered font-bold w-full"
                  />
                  <input
                    value={selectedLine.note ?? ""}
                    onChange={(e) => patchActiveLine({ note: e.target.value })}
                    placeholder="Optional note (e.g. JEET Royal Hostel Accommodation)"
                    className="input input-sm input-bordered text-xs w-full"
                  />
                </div>

                {/* Slots */}
                {selectedLine.slots.length === 0 ? (
                  <p className="text-sm text-base-content/50 italic px-1">No slots yet — add one below.</p>
                ) : (
                  selectedLine.slots.map((slot, si) => {
                    const isFirst = si === 0;
                    const isLast = si === selectedLine.slots.length - 1;
                    return (
                      <div key={si} className="rounded-xl border border-base-200 bg-base-100 p-3 space-y-2.5">
                        {/* Slot name + range + reorder / remove */}
                        <div className="flex items-start gap-2">
                          <input
                            value={slot.name}
                            onChange={(e) => updateSlot(si, { name: e.target.value })}
                            placeholder="Slot (e.g. Morning)"
                            className="input input-sm input-bordered font-bold flex-1 min-w-0"
                          />
                          <input
                            value={slot.range ?? ""}
                            onChange={(e) => updateSlot(si, { range: e.target.value })}
                            placeholder="Range (e.g. 7:45 am – 11:15 am)"
                            className="input input-sm input-bordered text-xs w-40 shrink-0"
                          />
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              onClick={() => moveSlot(si, -1)}
                              disabled={isFirst}
                              aria-label="Move slot up"
                              className="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-secondary disabled:opacity-20"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => moveSlot(si, 1)}
                              disabled={isLast}
                              aria-label="Move slot down"
                              className="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-secondary disabled:opacity-20"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => removeSlot(si)}
                              aria-label="Remove slot"
                              className="btn btn-ghost btn-sm btn-square text-base-content/40 hover:text-error"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Trips */}
                        <div className="space-y-1.5 pl-1">
                          {slot.trips.map((trip, ti) => {
                            const tFirst = ti === 0;
                            const tLast = slot.trips.length - 1 === ti;
                            return (
                              <div key={ti} className="flex items-center gap-1.5">
                                <span className="text-base leading-none shrink-0 text-secondary">•</span>
                                <div className="relative">
                                  <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-base-content/40 pointer-events-none" />
                                  <input
                                    value={trip.time}
                                    onChange={(e) => updateTrip(si, ti, { time: e.target.value })}
                                    placeholder="7:45 am"
                                    className="input input-sm input-bordered text-xs pl-8 w-28"
                                  />
                                </div>
                                <input
                                  value={trip.from}
                                  onChange={(e) => updateTrip(si, ti, { from: e.target.value })}
                                  placeholder="From"
                                  className="input input-sm input-bordered text-xs flex-1 min-w-0"
                                />
                                <span className="text-base-content/40 shrink-0">→</span>
                                <input
                                  value={trip.to ?? ""}
                                  onChange={(e) => updateTrip(si, ti, { to: e.target.value })}
                                  placeholder="To"
                                  className="input input-sm input-bordered text-xs flex-1 min-w-0"
                                />
                                <input
                                  value={trip.via ?? ""}
                                  onChange={(e) => updateTrip(si, ti, { via: e.target.value })}
                                  placeholder="Via (optional)"
                                  className="input input-sm input-bordered text-xs w-40 shrink-0 hidden sm:block"
                                />
                                <div className="flex items-center gap-0.5 shrink-0">
                                  <button
                                    onClick={() => moveTrip(si, ti, -1)}
                                    disabled={tFirst}
                                    aria-label="Move trip up"
                                    className="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-secondary disabled:opacity-20"
                                  >
                                    <ArrowUp className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => moveTrip(si, ti, 1)}
                                    disabled={tLast}
                                    aria-label="Move trip down"
                                    className="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-secondary disabled:opacity-20"
                                  >
                                    <ArrowDown className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => removeTrip(si, ti)}
                                    aria-label="Remove trip"
                                    className="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-error"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                          <button
                            onClick={() => addTrip(si)}
                            className="btn btn-ghost btn-xs text-secondary gap-1"
                          >
                            <Plus className="h-3 w-3" /> Add trip
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}

                <button
                  onClick={addSlot}
                  className="btn btn-outline btn-sm border-secondary/40 text-secondary hover:bg-secondary hover:text-secondary-content gap-1.5 w-full"
                >
                  <Plus className="h-3.5 w-3.5" /> Add slot to {selectedLine.name}
                </button>
              </div>
            ) : (
              <div className="text-center py-16 border border-dashed border-base-300 rounded-2xl">
                <p className="text-base-content/60 font-medium mb-3">No lines added yet.</p>
                <button onClick={() => addLine("")} className="btn btn-secondary btn-sm gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Add line
                </button>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button onClick={handleClose} disabled={saving} className="btn btn-ghost btn-sm">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn btn-secondary btn-sm gap-1.5 font-bold"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting…
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" /> Submit for review
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <TransportView content={transport?.content} />
        )}
      </div>
    </GenericOverlayModal>
  );
}
