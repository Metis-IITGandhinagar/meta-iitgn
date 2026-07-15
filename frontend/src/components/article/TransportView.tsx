"use client";

import React, { useState, useMemo } from "react";
import { Bus, Clock, MapPin, Navigation, ArrowRight, X } from "lucide-react";
import {
  TransportLine,
  TransportTrip,
  parseTransport,
  tripTimeToMinutes,
  lineTheme,
  lineActiveTheme,
} from "@/lib/transport";

interface TransportViewProps {
  content?: string | null;
}

/** Distinct, de-duplicated stop names for a given direction across all lines. */
function uniqueStops(lines: TransportLine[], dir: "from" | "to"): string[] {
  const set = new Set<string>();
  for (const line of lines) {
    for (const slot of line.slots) {
      for (const t of slot.trips) {
        const v = dir === "from" ? t.from : t.to;
        if (v?.trim()) set.add(v.trim());
      }
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

/**
 * Read-only structured view of the campus transport schedule.
 *
 * A journey filter at the top has two stacked rows of stop buttons —
 * **From** (line 1) and **To** (line 2) — that filter *together*: a trip is
 * shown only when its origin matches the selected From stop AND its
 * destination matches the selected To stop. Tapping a stop button selects it;
 * tapping the same button again clears it (undo). Matching trips are grouped
 * by bus line, each on two lines:
 *   · time · route (from → to)            ← line 1
 *   · Via: …                              ← line 2 (when present)
 *
 * Used both inline on the campus-transport wiki page and inside the
 * TransportOverlay view mode.
 */
export default function TransportView({ content }: TransportViewProps) {
  const lines = parseTransport(content ?? "");
  const [fromQ, setFromQ] = useState("");
  const [toQ, setToQ] = useState("");

  const fromStops = useMemo(() => uniqueStops(lines, "from"), [lines]);
  const toStops = useMemo(() => uniqueStops(lines, "to"), [lines]);

  const fromQl = fromQ.trim().toLowerCase();
  const toQl = toQ.trim().toLowerCase();

  const toggleFrom = (stop: string) =>
    setFromQ(fromQl === stop.toLowerCase() ? "" : stop);
  const toggleTo = (stop: string) =>
    setToQ(toQl === stop.toLowerCase() ? "" : stop);

  const tripMatches = (trip: TransportTrip) =>
    (!fromQl || trip.from.toLowerCase().includes(fromQl)) &&
    (!toQl || (trip.to ?? "").toLowerCase().includes(toQl));

  const filteredLines = lines
    .map((line) => ({
      line,
      trips: line.slots.flatMap((s) => s.trips).filter(tripMatches),
    }))
    .filter((l) => l.trips.length > 0);

  // The single soonest upcoming trip across the whole schedule — flagged with a
  // "NEXT" badge in the read view (presentational only, mirrors the mockup).
  const nowMinutes = (() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  })();
  const nextTripRef: TransportTrip | null = (() => {
    const parsed = lines
      .flatMap((l) => l.slots.flatMap((s) => s.trips))
      .map((t) => ({ t, m: tripTimeToMinutes(t.time) }))
      .filter((x) => x.m !== null) as { t: TransportTrip; m: number }[];
    if (parsed.length === 0) return null;
    const upcoming = parsed.filter((x) => x.m >= nowMinutes).sort((a, b) => a.m - b.m);
    return (upcoming[0] ?? [...parsed].sort((a, b) => a.m - b.m)[0]).t;
  })();

  if (lines.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed border-base-300 rounded-2xl">
        <p className="text-base-content/60 font-medium">Transport schedule not available yet.</p>
      </div>
    );
  }

  return (
    <>
      {/* ── From / To journey filter (two lines of stop buttons) ────────────── */}
      <div className="space-y-3 mb-5">
        {/* Line 1 — From */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
            <MapPin className="h-3 w-3" /> From
          </label>
          <div className="flex flex-wrap gap-1.5">
            {fromStops.map((stop) => {
              const selected = fromQl === stop.toLowerCase();
              return (
                <button
                  key={stop}
                  onClick={() => toggleFrom(stop)}
                  aria-pressed={selected}
                  className={`relative inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold cursor-pointer transition-all ${
                    selected
                      ? "bg-primary text-primary-content border-primary shadow-sm"
                      : "bg-base-100 border-base-300 text-base-content/70 hover:border-primary/50"
                  }`}
                >
                  {stop}
                  {selected && (
                    <X className="absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full border border-base-300 bg-base-100 text-base-content/70 shadow-sm" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Line 2 — To */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-secondary">
            <Navigation className="h-3 w-3 rotate-45" /> To
          </label>
          <div className="flex flex-wrap gap-1.5">
            {toStops.map((stop) => {
              const selected = toQl === stop.toLowerCase();
              return (
                <button
                  key={stop}
                  onClick={() => toggleTo(stop)}
                  aria-pressed={selected}
                  className={`relative inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold cursor-pointer transition-all ${
                    selected
                      ? "bg-secondary text-secondary-content border-secondary shadow-sm"
                      : "bg-base-100 border-base-300 text-base-content/70 hover:border-secondary/50"
                  }`}
                >
                  {stop}
                  {selected && (
                    <X className="absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full border border-base-300 bg-base-100 text-base-content/70 shadow-sm" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Matching trips, grouped by line ────────────────────────────────── */}
      {filteredLines.length === 0 ? (
        <p className="text-sm text-base-content/50 italic px-1">
          No trips {fromQ && `from “${fromQ}”`} {toQ && `to “${toQ}”`} in the current schedule.
        </p>
      ) : (
        filteredLines.map(({ line, trips }, i) => (
          <div key={i} className="mb-5 last:mb-0">
            {/* Bus line banner (mirrors the mockup's dark bus-type bar) */}
            <div className="mb-3 flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-[11px] font-black tracking-wide ${lineActiveTheme(i)}`}
              >
                <Bus className="h-3.5 w-3.5" />
                {line.name}
              </span>
              {line.note && (
                <span className="truncate text-[11px] font-semibold text-base-content/50">
                  · {line.note}
                </span>
              )}
            </div>

            <div className="space-y-2.5">
              {trips.map((trip, ti) => {
                const isNext = nextTripRef != null && trip === nextTripRef;
                return (
                  <div
                    key={ti}
                    className={`relative overflow-hidden rounded-2xl border p-3 transition-colors ${
                      isNext
                        ? "border-secondary/40 bg-secondary/5"
                        : "border-base-200 bg-base-100 hover:border-secondary/30"
                    }`}
                  >
                    {/* Left accent bar for the next departure */}
                    {isNext && (
                      <div className="absolute inset-y-0 left-0 w-1 bg-secondary" />
                    )}
                    <div className="flex items-center gap-3">
                      <span className="inline-flex w-[104px] shrink-0 items-center justify-center gap-1.5 rounded-xl bg-base-200 px-3 py-1.5 text-[13px] font-bold text-base-content">
                        <Clock className="h-4 w-4" />
                        {trip.time}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-bold text-sm text-base-content">
                            {trip.from}
                          </span>
                          <ArrowRight className="h-4 w-4 shrink-0 text-base-content/30" />
                          <span className="truncate font-bold text-sm text-base-content">
                            {trip.to ?? "—"}
                          </span>
                        </div>
                        {trip.via?.trim() && (
                          <span
                            className={`mt-1 inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${lineTheme(i)}`}
                          >
                            Via: {trip.via.trim()}
                          </span>
                        )}
                      </div>
                      {isNext && (
                        <span className="badge badge-secondary font-mono text-[9px] tracking-widest uppercase shrink-0">
                          Next
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </>
  );
}
