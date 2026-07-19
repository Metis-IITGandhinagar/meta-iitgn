"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Pencil, Save, CalendarDays, UtensilsCrossed, Plus, Trash2, X, Clock, ArrowUp, ArrowDown, CirclePlus } from "lucide-react";
import { apiService } from "@/api";
import { useAuth } from "@/hooks/useAuth";
import GenericOverlayModal from "@/components/overlays/GenericOverlayModal";
import MessMenuView from "@/components/article/MessMenuView";
import {
  WEEK_DAYS,
  MessDay,
  MessMeal,
  TimeOfDay,
  TIME_OF_DAY_META,
  TIME_OF_DAY_ORDER,
  MEAL_SLOT_PILLS,
  getTimeOfDay,
} from "@/lib/messMenu";

interface MessMenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  messMenu: any | null;
  onSaved?: () => void;
}

export default function MessMenuOverlay({
  isOpen,
  onClose,
  messMenu,
  onSaved,
}: MessMenuOverlayProps) {
  const { user } = useAuth();
  const canEdit = user?.role === "admin" || user?.role === "moderator";

  const [days, setDays] = useState<MessDay[]>([]);
  const [activeDay, setActiveDay] = useState<string>(WEEK_DAYS[new Date().getDay()]);
  const [editing, setEditing] = useState(false);
  const [newDay, setNewDay] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setEditing(false);
    setError(null);
    setSuccess(null);
    if (messMenu) {
      setDays(messMenu);
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

  // Pick a meal slot (Breakfast/Lunch/Snacks/Dinner): sets the meal name to the
  // slot label so getTimeOfDay resolves to this bucket (which recolours the
  // card), and fills a representative time range when none is set yet.
  const applyTimeOfDay = (mi: number, tod: TimeOfDay) => {
    const meal = selectedDay?.meals[mi];
    updateMeal(mi, {
      name: MEAL_SLOT_PILLS[tod].label,
      time: meal?.time?.trim() ? meal.time : TIME_OF_DAY_META[tod].presets[0],
    });
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
      meals.map((m, i) =>
        i === mi ? { ...m, items: m.items.filter((_, j) => j !== ii) } : m
      )
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

  // ── Save handlers ──────────────────────────────────────────────────────────
  const handleEdit = async () => {
    setError(null);
    setEditing(true);
  };

  const handleSave = async () => {
    if (days.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await apiService.updateMessMenu(days);
      setEditing(false);
      setSuccess("Mess menu updated successfully!");
      if (onSaved) onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Failed to save menu");
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
        className="btn btn-success btn-xs gap-1.5 font-bold"
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
      className="btn btn-xs btn-outline border-success/40 text-success hover:bg-success hover:text-success-content gap-1.5 font-bold"
    >
      <Pencil className="h-3.5 w-3.5" /> Edit menu
    </button>
  ) : null;

  return (
    <GenericOverlayModal
      isOpen={isOpen}
      onClose={handleClose}
      title={editing ? "Edit Mess Menu" : "Weekly Mess Menu"}
      headerColorClass="text-success bg-base-200"
      headerActions={headerActions}
    >
      <div className="max-w-3xl mx-auto w-full">
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
                    const slot = MEAL_SLOT_PILLS[tod];
                    const isFirst = mi === 0;
                    const isLast = mi === selectedDay.meals.length - 1;
                    return (
                      <div
                        key={mi}
                        className={`rounded-2xl border p-4 shadow-sm space-y-3 transition-colors ${slot.card}`}
                      >
                        {/* Meal name + reorder / remove controls */}
                        <div className="flex justify-between items-center gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className={`${slot.accent} font-semibold text-base shrink-0`}>
                              #{mi + 1}
                            </span>
                            <input
                              value={meal.name}
                              onChange={(e) => updateMeal(mi, { name: e.target.value })}
                              placeholder="Breakfast"
                              className={`text-base-content font-semibold text-base rounded-lg bg-base-100 border border-base-300 px-2.5 py-1 outline-none focus:ring-2 placeholder:text-base-content/30 w-full min-w-0 transition-colors ${slot.fieldFocus}`}
                            />
                          </div>
                          <div className="flex items-center gap-1.5 text-base-content/40 shrink-0">
                            <button
                              onClick={() => moveMeal(mi, -1)}
                              disabled={isFirst}
                              aria-label="Move meal up"
                              className="hover:text-base-content/70 transition-colors disabled:opacity-20"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => moveMeal(mi, 1)}
                              disabled={isLast}
                              aria-label="Move meal down"
                              className="hover:text-base-content/70 transition-colors disabled:opacity-20"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeMeal(mi)}
                              aria-label="Remove meal"
                              className="hover:text-error transition-colors ml-0.5"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Time — editable */}
                        <div className="flex items-center gap-1.5 text-base-content/60">
                          <Clock className="w-4 h-4 shrink-0" />
                          <input
                            value={meal.time ?? ""}
                            onChange={(e) => updateMeal(mi, { time: e.target.value })}
                            placeholder="7:30 AM – 9:00 AM"
                            className={`text-sm text-base-content rounded-lg bg-base-100 border border-base-300 px-2.5 py-1 outline-none focus:ring-2 placeholder:text-base-content/30 w-full min-w-0 transition-colors ${slot.fieldFocus}`}
                          />
                        </div>

                        {/* Slot pills (Breakfast / Lunch / Snacks / Dinner) */}
                        <div className="flex flex-wrap items-center gap-2">
                          {TIME_OF_DAY_ORDER.map((t) => {
                            const s = MEAL_SLOT_PILLS[t];
                            const active = t === tod;
                            return active ? (
                              <div
                                key={t}
                                className={`inline-flex rounded-full border-[1.5px] p-[2px] ${s.activeBorder}`}
                              >
                                <span
                                  className={`rounded-full px-3 py-0.5 text-xs font-medium ${s.activeChip}`}
                                >
                                  {s.label}
                                </span>
                              </div>
                            ) : (
                              <button
                                key={t}
                                onClick={() => applyTimeOfDay(mi, t)}
                                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${s.inactive}`}
                              >
                                {s.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* List items */}
                        <div className="flex flex-col gap-1.5">
                          {meal.items.map((item, ii) => (
                            <div key={ii} className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${slot.dot} shrink-0`} />
                              <input
                                value={item}
                                onChange={(e) => updateItem(mi, ii, e.target.value)}
                                placeholder="Dish or item"
                                className={`text-sm text-base-content rounded-lg bg-base-100 border border-base-300 px-2.5 py-1 outline-none focus:ring-2 placeholder:text-base-content/30 w-full min-w-0 transition-colors ${slot.fieldFocus}`}
                              />
                              <button
                                onClick={() => removeItem(mi, ii)}
                                aria-label="Remove item"
                                className="text-base-content/30 hover:text-error shrink-0 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Add item */}
                        <button
                          onClick={() => addItem(mi)}
                          className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${slot.accent} hover:opacity-80`}
                        >
                          <CirclePlus className="w-4 h-4" />
                          <span>Add item</span>
                        </button>
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
          </div>
        ) : (
          <MessMenuView days={days} />
        )}
      </div>
    </GenericOverlayModal>
  );
}
