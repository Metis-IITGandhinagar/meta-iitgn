"use client";

import React, { useState } from "react";
import { CalendarDays, UtensilsCrossed, Clock } from "lucide-react";
import { WEEK_DAYS, MessDay, getTimeOfDay, MESS_THEME, parseWeeklyMessMenu } from "@/lib/messMenu";

interface MessMenuViewProps {
  content?: string | null;
  days?: MessDay[];
}

/**
 * Read-only structured view of the weekly mess menu. Parses the markdown
 * into weekday sections and renders day tabs + meal cards. Used both inline
 * on the mess-menu wiki page and inside the MessMenuOverlay view mode.
 */
export default function MessMenuView({ content, days: propsDays }: MessMenuViewProps) {
  const days = propsDays || parseWeeklyMessMenu(content ?? "");
  const [activeDay, setActiveDay] = useState<string>(
    days.find((d) => d.day === WEEK_DAYS[new Date().getDay()])?.day ?? days[0]?.day ?? ""
  );
  const selectedDay: MessDay | undefined = days.find((d) => d.day === activeDay);

  if (days.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed border-base-300 rounded-2xl">
        <p className="text-base-content/60 font-medium">Mess menu not available yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-1.5 mb-5">
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
      </div>

      {selectedDay && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-success" />
            <h3 className="text-lg font-black text-base-content">{selectedDay.day}</h3>
          </div>
          {selectedDay.meals.length === 0 ? (
            <p className="text-sm text-base-content/50">No meals listed for this day.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {selectedDay.meals.map((meal, i) => {
                const tod = getTimeOfDay(meal);
                const theme = MESS_THEME[tod];
                return (
                  <div
                    key={i}
                    className={`rounded-xl border p-4 ${theme.card}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`text-sm font-black uppercase tracking-wide ${theme.mealName}`}
                      >
                        {meal.name}
                      </span>
                      {meal.time && (
                        <span
                          className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${theme.timeBadge}`}
                        >
                          <Clock className="h-3 w-3" />
                          {meal.time}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {meal.items.map((item, j) => (
                        <span
                          key={j}
                          className="rounded-lg border border-base-300 bg-base-100 px-3 py-1 text-[12px] font-medium text-base-content/70"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}
