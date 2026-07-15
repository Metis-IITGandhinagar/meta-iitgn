"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Pencil, Save, CalendarDays, UtensilsCrossed, Plus, Trash2, X, Clock, ArrowUp, ArrowDown } from "lucide-react";
import { apiService } from "@/api";
import { useAuth } from "@/hooks/useAuth";
import GenericOverlayModal from "@/components/GenericOverlayModal";
import MessMenuView from "@/components/article/MessMenuView";
import {
  WEEK_DAYS,
  MessDay,
  MessMeal,
  TimeOfDay,
  TIME_OF_DAY_META,
  TIME_OF_DAY_ORDER,
  MESS_MOCK_THEME,
  getTimeOfDay,
  parseWeeklyMessMenu,
} from "@/lib/messMenu";

interface MessMenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  messMenu: any | null;
  onSaved?: () => void;
}

// Split a full page document into its preserved header (frontmatter + intro)
// and the editable weekly day structure.
function splitContent(content: string): { header: string; days: MessDay[] } {
  const lines = content.split("\n");
  let firstDayIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^##\s+(.+?)\s*$/);
    if (m && WEEK_DAYS.includes(m[1].trim())) {
      firstDayIdx = i;
      break;
    }
  }
  if (firstDayIdx === -1) {
    return { header: content, days: [] };
  }
  const header = lines.slice(0, firstDayIdx).join("\n").replace(/\s+$/, "");
  const body = lines.slice(firstDayIdx).join("\n");
  return { header, days: parseWeeklyMessMenu(body) };
}

function serializeDays(days: MessDay[]): string {
  return days
    .map((d) => {
      const blocks = d.meals
        .filter((m) => m.name.trim() !== "" || m.items.some((it) => it.trim() !== ""))
        .map((m) => {
          const lines = [`**${m.name.trim()}**${m.time?.trim() ? ` (${m.time.trim()})` : ""}`];
          for (const item of m.items) {
            if (item.trim() !== "") lines.push(`- ${item.trim()}`);
          }
          return lines.join("\n");
        })
        .join("\n\n");
      return `## ${d.day}\n\n${blocks}`;
    })
    .join("\n\n");
}

function buildContent(header: string, days: MessDay[]): string {
  const h = header.replace(/\s+$/, "");
  const body = serializeDays(days);
  if (!body) return `${h}\n`;
  return `${h}\n\n${body}\n`;
}

export default function MessMenuOverlay({
  isOpen,
  onClose,
  messMenu,
}: MessMenuOverlayProps) {
  const { user } = useAuth();
  const canEdit = user?.role === "admin" || user?.role === "moderator";

  const [days, setDays] = useState<MessDay[]>([]);
  const [activeDay, setActiveDay] = useState<string>(WEEK_DAYS[new Date().getDay()]);
  const [editing, setEditing] = useState(false);
  const [header, setHeader] = useState("");
  const [newDay, setNewDay] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Draft metadata captured on edit so we can submit a review draft
  // (no direct live-page edits for the mess menu).
  const [pageId, setPageId] = useState<number | null>(null);
  const [baseVersion, setBaseVersion] = useState<number>(1);
  const [pageMetadata, setPageMetadata] = useState<any>({ category: "mess-menu" });
  const [pageTitle, setPageTitle] = useState<string>("Weekly Mess Menu");

  useEffect(() => {
    if (!isOpen) return;
    setEditing(false);
    setError(null);
    setSuccess(null);
    if (messMenu?.content) {
      setDays(parseWeeklyMessMenu(messMenu.content));
      setActiveDay(WEEK_DAYS[new Date().getDay()]);
    } else {
      setDays([]);
    }
  }, [isOpen, messMenu]);

  const selectedDay = days.find((d) => d.day === activeDay) ?? null;
  const remainingDays = WEEK_DAYS.filter((d) => !days.some((x) => x.day === d));
  const addDayValue = newDay && remainingDays.includes(newDay) ? newDay : remainingDays[0] ?? "";

  // ── Visual edit helpers (operate on the active day) ────────────────────────
  const patchSelectedDay = (patch: Partial<MessDay> | ((d: MessDay) => MessDay)) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.day !== activeDay) return d;
        return typeof patch === "function" ? patch(d) : { ...d, ...patch };
      })
    );
  };

  const setMeals = (meals: MessMeal[]) => patchSelectedDay({ meals });

  const addMeal = () => {
    const meals = selectedDay?.meals ?? [];
    setMeals([...meals, { name: "", time: "", items: [""] }]);
  };

  const updateMeal = (mi: number, patch: Partial<MessMeal>) => {
    const meals = selectedDay?.meals ?? [];
    setMeals(meals.map((m, i) => (i === mi ? { ...m, ...patch } : m)));
  };

  const removeMeal = (mi: number) => {
    const meals = selectedDay?.meals ?? [];
    setMeals(meals.filter((_, i) => i !== mi));
  };

  const addItem = (mi: number) => {
    const meals = selectedDay?.meals ?? [];
    setMeals(meals.map((m, i) => (i === mi ? { ...m, items: [...m.items, ""] } : m)));
  };

  // Move a meal up/down within the active day's list to reorder the schedule.
  const moveMeal = (mi: number, dir: -1 | 1) => {
    const meals = selectedDay?.meals ?? [];
    const target = mi + dir;
    if (target < 0 || target >= meals.length) return;
    const next = [...meals];
    [next[mi], next[target]] = [next[target], next[mi]];
    setMeals(next);
  };

  // Pick a time-of-day bucket: fills in that bucket's representative time range
  // and recolours the meal accordingly.
  const applyTimeOfDay = (mi: number, tod: TimeOfDay) => {
    updateMeal(mi, { time: TIME_OF_DAY_META[tod].presets[0] });
  };

  const updateItem = (mi: number, ii: number, value: string) => {
    const meals = selectedDay?.meals ?? [];
    setMeals(
      meals.map((m, i) =>
        i === mi ? { ...m, items: m.items.map((it, j) => (j === ii ? value : it)) } : m
      )
    );
  };

  const removeItem = (mi: number, ii: number) => {
    const meals = selectedDay?.meals ?? [];
    setMeals(
      meals.map((m, i) => (i === mi ? { ...m, items: m.items.filter((_, j) => j !== ii) } : m))
    );
  };

  const addDay = (day: string) => {
    if (!day) return;
    const next = [...days, { day, meals: [] }].sort(
      (a, b) => WEEK_DAYS.indexOf(a.day) - WEEK_DAYS.indexOf(b.day)
    );
    setDays(next);
    setActiveDay(day);
  };

  const handleEdit = async () => {
    setError(null);
    try {
      // Fetch the freshest content + live page metadata so we can build a
      // review draft (mess menu changes are never applied directly).
      const editRes: any = await apiService.getPageForEdit("mess-menu");
      const fullPage: any = await apiService.getPage("mess-menu");
      const content = editRes?.content ?? messMenu?.content ?? "";
      const { header: parsedHeader, days: parsedDays } = splitContent(content);
      setHeader(parsedHeader);
      setDays(parsedDays);
      setPageId(editRes?.page_id ?? fullPage?.page_id ?? messMenu?.page_id ?? null);
      setBaseVersion(editRes?.versionId ?? fullPage?.version ?? 1);
      setPageMetadata(fullPage?.metadata ?? { category: "mess-menu" });
      setPageTitle(editRes?.title ?? fullPage?.title ?? "Weekly Mess Menu");
      setActiveDay(
        parsedDays.find((d) => d.day === WEEK_DAYS[new Date().getDay()])?.day ??
          parsedDays[0]?.day ??
          WEEK_DAYS[new Date().getDay()]
      );
      setNewDay("");
      setEditing(true);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Failed to load menu for editing");
    }
  };

  const handleSave = async () => {
    if (days.length === 0 && !header.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const content = buildContent(header, days);
      // Submit as a review draft — mess menu changes are not applied directly.
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
      setError(err?.response?.data?.error || err?.message || "Failed to submit menu for review");
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
      title={editing ? "Edit Mess Menu" : "Weekly Mess Menu"}
      headerColorClass="text-success bg-base-200"
    >
      <div className="max-w-3xl mx-auto w-full">
        {/* Action bar */}
        {!editing && canEdit && (
          <div className="flex justify-end mb-3">
            <button
              onClick={handleEdit}
              className="btn btn-sm btn-outline border-success/40 text-success hover:bg-success hover:text-success-content gap-1.5 font-bold"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit menu
            </button>
          </div>
        )}

        {error && (
          <div className="alert alert-error text-xs mb-3 py-2">{error}</div>
        )}

        {success && (
          <div className="alert alert-success text-xs mb-3 py-2">{success}</div>
        )}

        {editing ? (
          <div className="space-y-4">
            <p className="text-xs text-base-content/60">
              Edit meals for each day. Add meals and items below — your changes are submitted for
              review and published by a moderator.
            </p>

            {/* Day tabs + add day */}
            <div className="flex flex-wrap items-center gap-1.5">
              {days.map((d) => {
                const isActive = d.day === activeDay;
                const isToday = d.day === WEEK_DAYS[new Date().getDay()];
                return (
                  <button
                    key={d.day}
                    onClick={() => setActiveDay(d.day)}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-all cursor-pointer border ${
                      isActive
                        ? "bg-success text-success-content border-success shadow-sm"
                        : "bg-base-100 text-base-content/70 border-base-300 hover:border-success/60"
                    }`}
                  >
                    {isToday && <CalendarDays className="h-3 w-3" />}
                    {d.day}
                  </button>
                );
              })}
              {remainingDays.length > 0 && (
                <div className="flex items-center gap-1 ml-1">
                  <select
                    value={addDayValue}
                    onChange={(e) => setNewDay(e.target.value)}
                    className="select select-sm select-bordered border-base-300 bg-base-100 text-base-content/80 font-semibold"
                  >
                    {remainingDays.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => addDay(addDayValue)}
                    className="btn btn-ghost btn-sm gap-1 text-success"
                  >
                    <Plus className="h-3.5 w-3.5" /> Day
                  </button>
                </div>
              )}
            </div>

            {selectedDay ? (
              <div className="space-y-4">
                {/* Day header */}
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="h-5 w-5 text-success" />
                  <h3 className="text-lg font-black text-base-content">{selectedDay.day}</h3>
                </div>

                {/* Meals */}
                {selectedDay.meals.length === 0 ? (
                  <p className="text-sm text-base-content/50 italic px-1">
                    No meals yet — add one below.
                  </p>
                ) : (
                  selectedDay.meals.map((meal, mi) => {
                    const tod = getTimeOfDay(meal);
                    const theme = MESS_MOCK_THEME[tod];
                    const isFirst = mi === 0;
                    const isLast = mi === selectedDay.meals.length - 1;
                    return (
                      <div
                        key={mi}
                        className={`rounded-xl border p-3 space-y-2.5 ${theme.card}`}
                      >
                        {/* Meal name + reorder / remove controls */}
                        <div className="flex items-start gap-2">
                          <span
                            className={`mt-2.5 hidden sm:inline text-[10px] font-black uppercase tracking-wider ${theme.mealName} shrink-0 w-14`}
                          >
                            #{mi + 1}
                          </span>
                          <input
                            value={meal.name}
                            onChange={(e) => updateMeal(mi, { name: e.target.value })}
                            placeholder="Meal (e.g. Breakfast)"
                            className="input input-sm input-bordered font-bold flex-1 min-w-0"
                          />
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              onClick={() => moveMeal(mi, -1)}
                              disabled={isFirst}
                              aria-label="Move meal up"
                              className="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-success disabled:opacity-20"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => moveMeal(mi, 1)}
                              disabled={isLast}
                              aria-label="Move meal down"
                              className="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-success disabled:opacity-20"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => removeMeal(mi)}
                              aria-label="Remove meal"
                              className="btn btn-ghost btn-sm btn-square text-base-content/40 hover:text-error"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Time field + live time-of-day pill */}
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1 min-w-0">
                            <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-base-content/40 pointer-events-none" />
                            <input
                              value={meal.time ?? ""}
                              onChange={(e) => updateMeal(mi, { time: e.target.value })}
                              placeholder="Time (e.g. 7:30 AM – 9:00 AM)"
                              className="input input-sm input-bordered text-xs pl-8 w-full"
                            />
                          </div>
                          {meal.time?.trim() && (
                            <span
                              className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${theme.timeBadge}`}
                            >
                              <Clock className="h-3 w-3" />
                              {TIME_OF_DAY_META[tod].label}
                            </span>
                          )}
                        </div>

                        {/* Time-of-day quick picks (colour-coded) */}
                        <div className="flex flex-wrap gap-1">
                          {TIME_OF_DAY_ORDER.map((t) => {
                            const m = TIME_OF_DAY_META[t];
                            const active = t === tod;
                            return (
                              <button
                                key={t}
                                onClick={() => applyTimeOfDay(mi, t)}
                                aria-pressed={active}
                                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold cursor-pointer transition-all select-none ${MESS_MOCK_THEME[t].timeBadge} ${
                                  active ? "ring-2 ring-offset-1 ring-current scale-105" : "opacity-60 hover:opacity-100"
                                }`}
                              >
                                {m.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Items */}
                        <div className="space-y-1.5 pl-1">
                          {meal.items.map((item, ii) => (
                            <div key={ii} className="flex items-center gap-2">
                              <span
                                className={`text-base leading-none shrink-0 ${theme.mealName}`}
                              >
                                •
                              </span>
                              <input
                                value={item}
                                onChange={(e) => updateItem(mi, ii, e.target.value)}
                                placeholder="Dish or item"
                                className="input input-sm input-bordered flex-1 min-w-0"
                              />
                              <button
                                onClick={() => removeItem(mi, ii)}
                                aria-label="Remove item"
                                className="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-error shrink-0"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => addItem(mi)}
                            className="btn btn-ghost btn-xs text-success gap-1"
                          >
                            <Plus className="h-3 w-3" /> Add item
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}

                <button
                  onClick={addMeal}
                  className="btn btn-outline btn-sm border-success/40 text-success hover:bg-success hover:text-success-content gap-1.5 w-full"
                >
                  <Plus className="h-3.5 w-3.5" /> Add meal to {selectedDay.day}
                </button>
              </div>
            ) : (
              <div className="text-center py-16 border border-dashed border-base-300 rounded-2xl">
                <p className="text-base-content/60 font-medium mb-3">No days added yet.</p>
                {remainingDays.length > 0 ? (
                  <button
                    onClick={() => addDay(addDayValue)}
                    className="btn btn-success btn-sm gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add {addDayValue}
                  </button>
                ) : null}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button onClick={handleClose} disabled={saving} className="btn btn-ghost btn-sm">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn btn-success btn-sm gap-1.5 font-bold"
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
          <MessMenuView content={messMenu?.content} />
        )}
      </div>
    </GenericOverlayModal>
  );
}
