export const WEEK_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export interface MessMeal {
  name: string;
  time?: string;
  items: string[];
}

export interface MessDay {
  day: string;
  meals: MessMeal[];
}

// ── Time of day ──────────────────────────────────────────────────────────────
// Used to colour-code meals by when they happen so the schedule reads at a
// glance. Derived from the meal name (preferred) and falling back to the time
// string, keeping the data fully serialisable as plain markdown.

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

export const TIME_OF_DAY_META: Record<
  TimeOfDay,
  {
    key: TimeOfDay;
    label: string;
    /** Badge colours (bg / text / border) for the time pill. */
    badge: string;
    /** Meal card tint (border / background). */
    card: string;
    /** Accent colour for the meal name + icon. */
    header: string;
    /** Suggested time ranges applied when a bucket is chosen. */
    presets: string[];
  }
> = {
  morning: {
    key: "morning",
    label: "Morning",
    badge: "bg-amber-100 text-amber-800 border-amber-300",
    card: "border-amber-300/50 bg-amber-50/50",
    header: "text-amber-700",
    presets: ["7:00 – 8:30 AM", "7:30 – 9:00 AM", "8:00 – 9:30 AM"],
  },
  afternoon: {
    key: "afternoon",
    label: "Afternoon",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
    card: "border-emerald-300/50 bg-emerald-50/50",
    header: "text-emerald-700",
    presets: ["12:00 – 1:30 PM", "12:30 – 2:00 PM", "1:00 – 2:30 PM"],
  },
  evening: {
    key: "evening",
    label: "Evening",
    badge: "bg-violet-100 text-violet-800 border-violet-300",
    card: "border-violet-300/50 bg-violet-50/50",
    header: "text-violet-700",
    presets: ["4:00 – 5:00 PM", "4:30 – 5:30 PM", "5:00 – 6:00 PM"],
  },
  night: {
    key: "night",
    label: "Night",
    badge: "bg-indigo-100 text-indigo-800 border-indigo-300",
    card: "border-indigo-300/50 bg-indigo-50/50",
    header: "text-indigo-700",
    presets: ["7:30 – 9:00 PM", "8:00 – 9:30 PM", "8:30 – 10:00 PM"],
  },
};

export const TIME_OF_DAY_ORDER: TimeOfDay[] = ["morning", "afternoon", "evening", "night"];

// ── Mock card theme ──────────────────────────────────────────────────────────
// daisyUI semantic colours shared by the mess-menu home card, the overlay, and
// the editor, keyed by time-of-day bucket so the UI stays data-driven and
// themeable. breakfast=warning, lunch=success, snacks=secondary, dinner=info;
// the accent green is `success`.
export const MESS_MOCK_THEME: Record<
  TimeOfDay,
  { mealName: string; timeBadge: string; card: string }
> = {
  morning: {
    mealName: "text-warning",
    timeBadge: "text-warning bg-warning/10 border-warning/30",
    card: "border-warning/30 bg-warning/5",
  },
  afternoon: {
    mealName: "text-success",
    timeBadge: "text-success bg-success/10 border-success/30",
    card: "border-success/30 bg-success/5",
  },
  evening: {
    mealName: "text-secondary",
    timeBadge: "text-secondary bg-secondary/10 border-secondary/30",
    card: "border-secondary/30 bg-secondary/5",
  },
  night: {
    mealName: "text-info",
    timeBadge: "text-info bg-info/10 border-info/30",
    card: "border-info/30 bg-info/5",
  },
};

/** Infer the time of day for a meal from its name, then its time string. */
export function getTimeOfDay(meal: MessMeal): TimeOfDay {
  const name = (meal.name || "").toLowerCase();
  const time = (meal.time || "").toLowerCase();

  if (/(breakfast|morning|early|dawn|sunrise|brunch)/.test(name)) return "morning";
  if (/(lunch|noon|afternoon|midday)/.test(name)) return "afternoon";
  if (/(snack|tea|evening|high tea|tiffin)/.test(name)) return "evening";
  if (/(dinner|night|supper|late)/.test(name)) return "night";

  // Fallback: read the hour out of the time string.
  const hourMatch = time.match(/(\d{1,2})\s*[:.]?\s*\d{0,2}\s*(am|pm)/);
  if (hourMatch) {
    let h = parseInt(hourMatch[1], 10) % 12;
    if (hourMatch[2] === "pm") h += 12;
    if (h < 11) return "morning";
    if (h < 16) return "afternoon";
    if (h < 19) return "evening";
    return "night";
  }

  return "afternoon";
}

// Parse a weekly mess menu markdown document into one entry per weekday.
// Recognised structure: `## <Weekday>` headings, `**Meal** (time)` lines,
// and `- item` bullet lines. Any other content is ignored.
export function parseWeeklyMessMenu(markdown: string): MessDay[] {
  const lines = markdown.split("\n");
  const days: MessDay[] = [];
  let currentDay: MessDay | null = null;
  let currentMeal: MessMeal | null = null;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      const dayName = line.replace("##", "").trim();
      if (WEEK_DAYS.includes(dayName)) {
        currentDay = { day: dayName, meals: [] };
        days.push(currentDay);
        currentMeal = null;
      }
      continue;
    }
    if (!currentDay) continue;

    const mealMatch = line.match(/^\*\*(.+?)\*\*(?:\s*\((.+?)\))?/);
    if (mealMatch) {
      currentMeal = { name: mealMatch[1].trim(), time: mealMatch[2]?.trim(), items: [] };
      currentDay.meals.push(currentMeal);
      continue;
    }
    if (line.startsWith("-") && currentMeal) {
      currentMeal.items.push(line.replace(/^-\s*/, "").trim());
    }
  }
  return days;
}
