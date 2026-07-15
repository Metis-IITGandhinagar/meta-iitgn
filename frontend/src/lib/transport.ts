// Campus transport data model + markdown (de)serialization.
//
// Mirrors messMenu.ts. The schedule is organised as bus LINES, each with optional
// SLOTS (e.g. "Morning") and TRIPS. A trip has a time, a from/to pair, and an
// optional via/route. The markdown schema is:
//
//   ## 29-Seater Non-AC Bus
//   > JEET Royal Hostel Accommodation · Highway Turning near JEET Gate-1
//
//   **Morning** (7:45 am – 11:15 am)
//   - 7:45 am · U-Corridor Circle → JEET Royal Hotel Apt.
//   - 9:00 am · JEET Royal Hotel Apt. → U-Corridor Circle
//
//   ## 56-Seater Bus · Institute Bus Schedule
//   **Schedule**
//   - 7:00 AM · From Palaj → To Palaj · Via: IITGN Mess Parking - Rakshashakti Circle - Kudasan

export interface TransportTrip {
  time: string;
  from: string;
  to?: string;
  via?: string;
}

export interface TransportSlot {
  name: string;
  range?: string;
  trips: TransportTrip[];
}

export interface TransportLine {
  name: string;
  note?: string;
  slots: TransportSlot[];
}

// ── Line theme (daisyUI semantic colours) ────────────────────────────────────
// Keyed by line index so the UI stays data-driven and themeable. Matches the
// mess-menu card palette: success / secondary / info / warning.
export const TRANSPORT_MOCK_THEME: string[] = [
  "text-success bg-success/10 border-success/30",
  "text-secondary bg-secondary/10 border-secondary/30",
  "text-info bg-info/10 border-info/30",
  "text-warning bg-warning/10 border-warning/30",
];

export function lineTheme(index: number): string {
  return TRANSPORT_MOCK_THEME[index % TRANSPORT_MOCK_THEME.length];
}

// Solid filled style for the active line tab (matches the line's accent colour).
export const TRANSPORT_LINE_ACTIVE: string[] = [
  "bg-success text-success-content border-success",
  "bg-secondary text-secondary-content border-secondary",
  "bg-info text-info-content border-info",
  "bg-warning text-warning-content border-warning",
];

export function lineActiveTheme(index: number): string {
  return TRANSPORT_LINE_ACTIVE[index % TRANSPORT_LINE_ACTIVE.length];
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

export function parseTransport(markdown: string): TransportLine[] {
  const lines = markdown.split("\n");
  const result: TransportLine[] = [];
  let currentLine: TransportLine | null = null;
  let currentSlot: TransportSlot | null = null;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      const name = line.replace("##", "").trim();
      currentLine = { name, slots: [] };
      currentSlot = null;
      result.push(currentLine);
      continue;
    }
    if (!currentLine) continue;

    // Optional note line immediately under a line heading.
    if (line.startsWith(">")) {
      const note = line.replace(/^>\s*/, "").trim();
      if (note) currentLine.note = note;
      continue;
    }

    const slotMatch = line.match(/^\*\*(.+?)\*\*(?:\s*\((.+?)\))?/);
    if (slotMatch) {
      currentSlot = {
        name: slotMatch[1].trim(),
        range: slotMatch[2]?.trim() || undefined,
        trips: [],
      };
      currentLine.slots.push(currentSlot);
      continue;
    }

    if (line.startsWith("-") && currentSlot) {
      const trip = parseTripLine(line);
      if (trip) currentSlot.trips.push(trip);
    }
  }
  return result;
}

// ── Serialization ──────────────────────────────────────────────────────────────
export function serializeTransport(lines: TransportLine[]): string {
  return lines
    .filter((l) => l.name.trim() !== "" || l.slots.some((s) => s.trips.length > 0))
    .map((l) => {
      const head = [`## ${l.name.trim()}`];
      if (l.note?.trim()) head.push(`> ${l.note.trim()}`);
      const slots = l.slots
        .filter((s) => s.name.trim() !== "" || s.trips.length > 0)
        .map((s) => {
          const title = s.range
            ? `**${s.name.trim()}** (${s.range.trim()})`
            : `**${s.name.trim()}**`;
          const trips = s.trips
            .filter((t) => t.time.trim() && t.from.trim())
            .map((t) => {
              const route = [t.from.trim(), t.to?.trim()]
                .filter(Boolean)
                .join(" → ");
              const via = t.via?.trim() ? ` · Via: ${t.via.trim()}` : "";
              return `- ${t.time.trim()} · ${route}${via}`;
            });
          return [title, ...trips].join("\n");
        });
      return [...head, "", ...slots].join("\n");
    })
    .join("\n\n");
}

// Split a full page document into its preserved header (frontmatter + intro)
// and the editable transport line structure.
export function splitTransportContent(content: string): {
  header: string;
  lines: TransportLine[];
} {
  const lines = content.split("\n");
  let firstLineIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i])) {
      firstLineIdx = i;
      break;
    }
  }
  if (firstLineIdx === -1) {
    return { header: content, lines: [] };
  }
  const header = lines.slice(0, firstLineIdx).join("\n").replace(/\s+$/, "");
  const body = lines.slice(firstLineIdx).join("\n");
  return { header, lines: parseTransport(body) };
}

export function buildTransportContent(header: string, lines: TransportLine[]): string {
  const h = header.replace(/\s+$/, "");
  const body = serializeTransport(lines);
  if (!body) return `${h}\n`;
  return `${h}\n\n${body}\n`;
}
