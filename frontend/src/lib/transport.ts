// Campus transport data model + markdown (de)serialization.
//
// Organised as busES, each a single bus/route with an optional note and a flat
// list of TRIPS. A trip has a time, a from/to pair, and an optional via/route.
// The markdown schema is:
//
//   ## 29-Seater Non-AC Bus
//   > JEET Royal Hostel Accommodation · Highway Turning near JEET Gate-1
//
//   - 7:45 am · U-Corridor Circle → JEET Royal Hotel Apt.
//   - 9:00 am · JEET Royal Hotel Apt. → U-Corridor Circle
//
// (Legacy "**Morning**" style slot headings from the older grouping format are
// ignored when parsing, so old content round-trips without the empty tiers.)

export interface TransportTrip {
  time: string;
  from: string;
  to?: string;
  via?: string;
}

export interface TransportBus {
  name: string;
  note?: string;
  trips: TransportTrip[];
}

// ── Bus theme (daisyUI semantic colours) ───────────────────────────────────
// Keyed by bus index so the UI stays data-driven and themeable. Matches the
// mess-menu card palette: success / secondary / info / warning.
export const TRANSPORT_THEME: string[] = [
  "text-success bg-success/10 border-success/30",
  "text-secondary bg-secondary/10 border-secondary/30",
  "text-info bg-info/10 border-info/30",
  "text-warning bg-warning/10 border-warning/30",
];

export function lineTheme(index: number): string {
  return TRANSPORT_THEME[index % TRANSPORT_THEME.length];
}

// Solid filled style for the active bus tab (matches the bus's accent colour).
export const TRANSPORT_LINE_ACTIVE: string[] = [
  "bg-success text-success-content border-success",
  "bg-secondary text-secondary-content border-secondary",
  "bg-info text-info-content border-info",
  "bg-warning text-warning-content border-warning",
];

export function lineActiveTheme(index: number): string {
  return TRANSPORT_LINE_ACTIVE[index % TRANSPORT_LINE_ACTIVE.length];
}

// Format a trip as a compact route label, e.g. "(Kudasan-Palaj)".
// Used in summary displays instead of a spread-out "From → To" line.
export function formatRoute(trip: TransportTrip): string {
  const parts = [trip.from.trim(), trip.to?.trim()].filter(Boolean);
  return `(${parts.join("-")})`;
}

// ── Time helpers ─────────────────────────────────────────────────────────────
// Convert a trip time like "7:45 am", "1:00 pm", "1:15 am" into minutes since
// midnight (0–1439). Returns null if it can't be parsed.
export function tripTimeToMinutes(time: string): number | null {
  const m = time.trim().match(/(\d{1,2})\s*[:.]?\s*(\d{2})?\s*(am|pm)?/i);
  if (!m) return null;
  let h = parseInt(m[1], 10) % 24;
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const mer = m[3]?.toLowerCase();
  if (mer === "pm" && h < 12) h += 12;
  if (mer === "am" && h === 12) h = 0;
  return h * 60 + min;
}

// ── Parsing ───────────────────────────────────────────────────────────────────
function parseTripLine(line: string): TransportTrip | null {
  const text = line.replace(/^-\s*/, "").trim();
  if (!text) return null;

  const [timePart, ...rest] = text.split("·").map((s) => s.trim());
  if (!timePart) return null;

  const routePart = rest.join(" · ");
  let via: string | undefined;
  let arrowPart = routePart;

  const viaMatch = routePart.match(/Via:\s*(.+)$/i);
  if (viaMatch) {
    via = viaMatch[1].trim();
    // Drop the "Via: …" tail and any leftover " ·" separator before it.
    arrowPart = routePart.replace(/Via:\s*.+$/i, "").replace(/\s*·\s*$/, "").trim();
  }

  const [from, to] = arrowPart.split("→").map((s) => s.trim());
  if (!from) return null;

  return { time: timePart, from, to: to || undefined, via };
}

export function parseTransport(markdown: string): TransportBus[] {
  const lines = markdown.split("\n");
  const result: TransportBus[] = [];
  let current: TransportBus | null = null;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      const name = line.replace("##", "").trim();
      current = { name, trips: [] };
      result.push(current);
      continue;
    }
    if (!current) continue;

    // Optional note line immediately under a bus heading.
    if (line.startsWith(">")) {
      const note = line.replace(/^>\s*/, "").trim();
      if (note) current.note = note;
      continue;
    }

    // Ignore leftover "**Morning**" style slot headings from the old format.
    if (/^\*\*[^*]+\*\*\s*(\([^)]*\))?\s*$/.test(line.trim())) continue;

    if (line.startsWith("-")) {
      const trip = parseTripLine(line);
      if (trip) current.trips.push(trip);
    }
  }
  return result;
}

// ── Serialization ─────────────────────────────────────────────────────────────
// Empty buses are intentionally preserved so the editor can show and let the user
// delete them manually — we do not silently drop content on save.
export function serializeTransport(buses: TransportBus[]): string {
  return buses
    .filter((b) => b.name.trim() !== "" || b.trips.length > 0)
    .map((b) => {
      const head = [`## ${b.name.trim()}`];
      if (b.note?.trim()) head.push(`> ${b.note.trim()}`);
      const trips = b.trips
        .filter((t) => t.time.trim() && t.from.trim())
        .map((t) => {
          const route = [t.from.trim(), t.to?.trim()].filter(Boolean).join(" → ");
          const via = t.via?.trim() ? ` · Via: ${t.via.trim()}` : "";
          return `- ${t.time.trim()} · ${route}${via}`;
        });
      return [...head, "", ...trips].join("\n");
    })
    .join("\n\n");
}

// Split a full page document into its preserved header (frontmatter + intro)
// and the editable transport bus structure.
export function splitTransportContent(content: string): {
  header: string;
  buses: TransportBus[];
} {
  const lines = content.split("\n");
  let firstBusIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i])) {
      firstBusIdx = i;
      break;
    }
  }
  if (firstBusIdx === -1) {
    return { header: content, buses: [] };
  }
  const header = lines.slice(0, firstBusIdx).join("\n").replace(/\s+$/, "");
  const body = lines.slice(firstBusIdx).join("\n");
  return { header, buses: parseTransport(body) };
}

export function buildTransportContent(header: string, buses: TransportBus[]): string {
  const h = header.replace(/\s+$/, "");
  const body = serializeTransport(buses);
  if (!body) return `${h}\n`;
  return `${h}\n\n${body}\n`;
}
