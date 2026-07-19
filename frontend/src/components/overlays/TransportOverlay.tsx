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
import GenericOverlayModal from "@/components/overlays/GenericOverlayModal";
import TransportView from "@/components/article/TransportView";
import {
  TransportBus,
  TransportTrip,
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
  onSaved,
}: TransportOverlayProps) {
  const { user } = useAuth();
  const canEdit = user?.role === "admin" || user?.role === "moderator";

  const [buses, setBuses] = useState<TransportBus[]>([]);
  const [activeBus, setActiveBus] = useState<number>(0);
  const [editing, setEditing] = useState(false);
  const [newBusName, setNewBusName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setEditing(false);
    setError(null);
    setSuccess(null);
    const parsed = Array.isArray(transport) ? transport : [];
    const items = parsed.map((item: any) => ({
      name: item.name || item.route || "",
      note: item.note || item.type || "",
      trips: item.trips || item.schedule || []
    }));
    setBuses(items);
    setActiveBus(0);
  }, [isOpen, transport]);

  const selectedBus: TransportBus | undefined = buses[activeBus];

  // ── Visual edit helpers (operate on the active bus) ───────────────────────
  const patchActiveBus = (
    patch: Partial<TransportBus> | ((b: TransportBus) => TransportBus)
  ) => {
    setBuses((prev) =>
      prev.map((b, i) => {
        if (i !== activeBus) return b;
        return typeof patch === "function" ? patch(b) : { ...b, ...patch };
      })
    );
  };

  const addTrip = () => {
    const trips = selectedBus?.trips ?? [];
    patchActiveBus({ trips: [...trips, { time: "", from: "", to: "", via: "" }] });
  };

  const updateTrip = (ti: number, patch: Partial<TransportTrip>) => {
    const trips = selectedBus?.trips ?? [];
    patchActiveBus({ trips: trips.map((t, j) => (j === ti ? { ...t, ...patch } : t)) });
  };

  const removeTrip = (ti: number) => {
    const trips = selectedBus?.trips ?? [];
    patchActiveBus({ trips: trips.filter((_, j) => j !== ti) });
  };

  const moveTrip = (ti: number, dir: -1 | 1) => {
    const trips = selectedBus?.trips ?? [];
    const target = ti + dir;
    if (target < 0 || target >= trips.length) return;
    const next = [...trips];
    [next[ti], next[target]] = [next[target], next[ti]];
    patchActiveBus({ trips: next });
  };

  const addBus = (name: string) => {
    const finalName = name.trim() || `Bus ${buses.length + 1}`;
    setBuses((prev) => [...prev, { name: finalName, trips: [] }]);
    setActiveBus(buses.length);
    setNewBusName("");
  };

  const removeBus = (bi: number) => {
    setBuses((prev) => prev.filter((_, i) => i !== bi));
    setActiveBus((curr) => {
      const newLen = buses.length - 1; // pre-deletion length
      if (curr === bi) return Math.min(bi, Math.max(0, newLen - 1));
      if (curr > bi) return curr - 1;
      return Math.min(curr, Math.max(0, newLen - 1));
    });
  };

  const moveBus = (bi: number, dir: -1 | 1) => {
    const target = bi + dir;
    if (target < 0 || target >= buses.length) return;
    const next = [...buses];
    [next[bi], next[target]] = [next[target], next[bi]];
    setBuses(next);
  };

  const handleEdit = async () => {
    setError(null);
    setEditing(true);
  };

  const handleSave = async () => {
    if (buses.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const payload = buses.map((b) => ({
        route: b.name || "",
        type: b.note || "",
        schedule: b.trips || [],
        name: b.name || "",
        note: b.note || "",
        trips: b.trips || []
      }));
      await apiService.updateCampusTransport(payload);
      setEditing(false);
      setSuccess("Transport schedule updated successfully!");
      if (onSaved) onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Failed to save schedule");
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

  const headerActions = editing ? (
    <>
      <button
        onClick={handleClose}
        disabled={saving}
        className="btn btn-ghost btn-xs"
      >
        Cancel
      </button>
      <button
        onClick={handleSave}
        disabled={saving}
        className="btn btn-secondary btn-xs gap-1.5 font-bold"
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
    </>
  ) : canEdit ? (
    <button
      onClick={handleEdit}
      className="btn btn-xs btn-outline border-secondary/40 text-secondary hover:bg-secondary hover:text-secondary-content gap-1.5 font-bold"
    >
      <Pencil className="h-3.5 w-3.5" /> Edit schedule
    </button>
  ) : null;

  return (
    <GenericOverlayModal
      isOpen={isOpen}
      onClose={handleClose}
      title={editing ? "Edit Transport" : "Campus Transport"}
      headerColorClass="text-secondary bg-base-200"
      headerActions={headerActions}
    >
      <div className="max-w-3xl mx-auto w-full">
        {error && <div className="alert alert-error text-xs mb-3 py-2">{error}</div>}
        {success && <div className="alert alert-secondary text-xs mb-3 py-2">{success}</div>}

        {editing ? (
          <div className="space-y-4">
            <p className="text-xs text-base-content/60">
              Edit buses and trips below — your changes are submitted for review and
              published by a moderator.
            </p>

            {/* Bus switcher (dropdown) + add bus */}
            <div className="flex flex-wrap items-center gap-2">
              <Bus className="h-4 w-4 text-secondary" />
              <select
                value={activeBus}
                onChange={(e) => setActiveBus(Number(e.target.value))}
                className="select select-sm select-bordered border-base-300 bg-base-100 text-base-content/80 font-semibold min-w-0 flex-1"
              >
                {buses.map((b, i) => (
                  <option key={i} value={i}>
                    {b.name || `Bus ${i + 1}`}
                  </option>
                ))}
              </select>
              <button
                onClick={() => addBus(newBusName || `Bus ${buses.length + 1}`)}
                className="btn btn-ghost btn-sm gap-1 text-secondary"
              >
                <Plus className="h-3.5 w-3.5" /> Bus
              </button>
            </div>

            {selectedBus ? (
              <div className="space-y-4">
                {/* Bus header: name + note + delete */}
                <div className="space-y-2 rounded-xl border border-base-200 bg-base-100 p-3">
                  <div className="flex items-center gap-2">
                    <input
                      value={selectedBus.name}
                      onChange={(e) => patchActiveBus({ name: e.target.value })}
                      placeholder="Bus name (e.g. 29-Seater Non-AC Bus)"
                      className="input input-sm input-bordered font-bold w-full"
                    />
                    <button
                      onClick={() => removeBus(activeBus)}
                      aria-label="Delete bus"
                      className="btn btn-ghost btn-sm btn-square shrink-0 text-base-content/40 hover:text-error"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    value={selectedBus.note ?? ""}
                    onChange={(e) => patchActiveBus({ note: e.target.value })}
                    placeholder="Optional note (e.g. JEET Royal Hostel Accommodation)"
                    className="input input-sm input-bordered text-xs w-full"
                  />
                </div>

                {/* Trips */}
                <div className="space-y-1.5 pl-1">
                  {selectedBus.trips.length === 0 ? (
                    <p className="text-sm text-base-content/50 italic px-1">No trips yet — add one below.</p>
                  ) : (
                    selectedBus.trips.map((trip, ti) => {
                      const tFirst = ti === 0;
                      const tLast = selectedBus.trips.length - 1 === ti;
                      return (
                        <div key={ti} className="flex items-center gap-1.5">
                          <span className="text-base leading-none shrink-0 text-secondary">•</span>
                          <div className="relative">
                            <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-base-content/40 pointer-events-none" />
                            <input
                              value={trip.time}
                              onChange={(e) => updateTrip(ti, { time: e.target.value })}
                              placeholder="7:45 am"
                              className="input input-sm input-bordered text-xs pl-8 w-28"
                            />
                          </div>
                          <input
                            value={trip.from}
                            onChange={(e) => updateTrip(ti, { from: e.target.value })}
                            placeholder="From"
                            className="input input-sm input-bordered text-xs flex-1 min-w-0"
                          />
                          <span className="text-base-content/40 shrink-0">→</span>
                          <input
                            value={trip.to ?? ""}
                            onChange={(e) => updateTrip(ti, { to: e.target.value })}
                            placeholder="To"
                            className="input input-sm input-bordered text-xs flex-1 min-w-0"
                          />
                          <input
                            value={trip.via ?? ""}
                            onChange={(e) => updateTrip(ti, { via: e.target.value })}
                            placeholder="Via (optional)"
                            className="input input-sm input-bordered text-xs w-40 shrink-0 hidden sm:block"
                          />
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              onClick={() => moveTrip(ti, -1)}
                              disabled={tFirst}
                              aria-label="Move trip up"
                              className="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-secondary disabled:opacity-20"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => moveTrip(ti, 1)}
                              disabled={tLast}
                              aria-label="Move trip down"
                              className="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-secondary disabled:opacity-20"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => removeTrip(ti)}
                              aria-label="Remove trip"
                              className="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-error"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <button
                    onClick={addTrip}
                    className="btn btn-ghost btn-xs text-secondary gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add trip
                  </button>
                </div>

                {selectedBus.trips.length > 0 && (
                  <button
                    onClick={addTrip}
                    className="btn btn-outline btn-sm border-secondary/40 text-secondary hover:bg-secondary hover:text-secondary-content gap-1.5 w-full"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add trip to {selectedBus.name}
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-16 border border-dashed border-base-300 rounded-2xl">
                <p className="text-base-content/60 font-medium mb-3">No buses added yet.</p>
                <button onClick={() => addBus("")} className="btn btn-secondary btn-sm gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Add bus
                </button>
              </div>
            )}
          </div>
        ) : (
          <TransportView buses={buses} />
        )}
      </div>
    </GenericOverlayModal>
  );
}
