"use client"

import { useState } from "react";
import {CALENDAR_DATA,MONTHS_MAP} from "@/lib/calender"

const CATEGORIES = {
  REGISTRATION: { label: "Registration", bg: "bg-info/10 text-info border-info/20", dot: "bg-info" },
  CLASSES: { label: "Classes & Programs", bg: "bg-success/10 text-success border-success/20", dot: "bg-success" },
  EXAMS: { label: "Examinations", bg: "bg-error/10 text-error border-error/20", dot: "bg-error" },
  RECESS: { label: "Recess & Vacation", bg: "bg-warning/10 text-warning border-warning/20", dot: "bg-warning" },
  DEADLINE: { label: "Deadlines & Ceremonies", bg: "bg-accent/10 text-accent border-accent/20", dot: "bg-accent" },
};

export default function AcademicCalendar() {
  const [currentFilter, setCurrentFilter] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<"Semester I" | "Semester II" | "Summer Term">("Semester I");
  const [currentMonthIdx, setCurrentMonthIdx] = useState<number>(1); // Defaults to August 2025
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null); // Interactive day click filtering

  const activeMonthConfig = MONTHS_MAP[currentMonthIdx];
  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOffset = (month: number, year: number) => new Date(year, month, 1).getDay();

  const totalDays = getDaysInMonth(activeMonthConfig.m, activeMonthConfig.y);
  const startOffset = getFirstDayOffset(activeMonthConfig.m, activeMonthConfig.y);
  
  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);
  const emptyBoxesBefore = Array.from({ length: startOffset }, (_, i) => i);

  // Parse formatting for Agenda block dates
  const formatDateRange = (startStr: string, endStr: string) => {
    if (startStr === endStr) {
      return new Date(startStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    const s = new Date(startStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const e = new Date(endStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${s} – ${e}`;
  };

  // Agenda List Filtering Engine
  const agendaEvents = CALENDAR_DATA.filter(event => {
    const matchesSemester = event.semester === activeTab;
    const matchesCategory = currentFilter === "ALL" || event.category === currentFilter;
    
    if (selectedDateStr) {
      // If a day cell is clicked, show items active on that exact day
      const matchesClickedDate = selectedDateStr >= event.startDate && selectedDateStr <= event.endDate;
      return matchesSemester && matchesCategory && matchesClickedDate;
    }
    
    return matchesSemester && matchesCategory;
  });

  return (
    <main className="mt-15">
    <div className="h-dvh overflow-y-scroll bg-base p-4 md:p-8 antialiased selection:bg-primary/20 selection:text-primary-content">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-base-300 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-base-content sm:text-3xl">
              Academic Calendar
            </h1>
            <p className="text-sm text-base-content/60 mt-0.5">
              Click any calendar box day to filter the timeline feed to focus on specific dates.
            </p>
          </div>

          {/* Quick Tab Segment Control */}
          <div className="inline-flex rounded-xl bg-base-300/70 p-1 shadow-inner self-start">
            {(["Semester I", "Semester II", "Summer Term"] as const).map((sem) => (
              <button
                key={sem}
                onClick={() => {
                  setActiveTab(sem);
                  setSelectedDateStr(null); // Clear micro-filter on tab change
                  if (sem === "Semester II" && currentMonthIdx < 5) setCurrentMonthIdx(6);
                  if (sem === "Semester I" && currentMonthIdx > 5) setCurrentMonthIdx(1);
                }}
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === sem ? "bg-base-100 text-base-content shadow-xs" : "text-base-content/60 hover:text-base-content hover:bg-base-300"
                }`}
              >
                {sem}
              </button>
            ))}
          </div>
        </div>

        {/* Categories Filtering Line */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => { setCurrentFilter("ALL"); setSelectedDateStr(null); }}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                currentFilter === "ALL" && !selectedDateStr ? "bg-neutral text-neutral-content" : "bg-base-100 text-base-content/70 border border-base-300 hover:bg-base-200"
              }`}
            >
              Reset Filters
            </button>
            {Object.entries(CATEGORIES).map(([key, value]) => (
              <button
                key={key}
                onClick={() => setCurrentFilter(key)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-medium transition-colors bg-base-100 hover:bg-base-200 ${
                  currentFilter === key ? "ring-2 ring-base-content/10 border-base-content/30" : "border-base-300"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${value.dot}`} />
                <span className="text-base-content/70">{value.label}</span>
              </button>
            ))}
          </div>

          {/* Active Date Indicator Label */}
          {selectedDateStr && (
            <div className="inline-flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-3 py-1 text-xs text-primary">
              <span>Focusing Date: <strong>{new Date(selectedDateStr).toLocaleDateString("en-US", {month:'short', day:'numeric'})}</strong></span>
              <button onClick={() => setSelectedDateStr(null)} className="font-bold hover:opacity-70 ml-1">✕</button>
            </div>
          )}
        </div>

        {/* MASTER VIEWPORT GRID: Calendar Left (7 Columns) + Agenda Right (5 Columns) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: Complete Visual Grid Layout */}
          <div className="xl:col-span-8 bg-base-100 rounded-xl border border-base-300 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between border-b border-base-300 px-5 py-3.5 bg-base-200/40">
              <h2 className="text-sm font-semibold text-base-content flex items-center gap-2">
                {activeMonthConfig.name}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentMonthIdx === 0}
                  onClick={() => setCurrentMonthIdx(prev => prev - 1)}
                  className="p-1.5 rounded-lg border border-base-300 bg-base-100 text-base-content/70 disabled:opacity-30 hover:bg-base-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button
                  disabled={currentMonthIdx === MONTHS_MAP.length - 1}
                  onClick={() => setCurrentMonthIdx(prev => prev + 1)}
                  className="p-1.5 rounded-lg border border-base-300 bg-base-100 text-base-content/70 disabled:opacity-30 hover:bg-base-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 bg-base-200 border-b border-base-300 text-center text-[11px] font-bold tracking-wider text-base-content/50 py-2 uppercase">
              <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>

            <div className="grid grid-cols-7 bg-base-300/50 gap-[1px]">
              {emptyBoxesBefore.map((val) => (
                <div key={`empty-${val}`} className="min-h-[110px] bg-base-200/40" />
              ))}
              
              {daysArray.map((day) => {
                const dateStr = `${activeMonthConfig.y}-${String(activeMonthConfig.m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isSelected = selectedDateStr === dateStr;

                const dayEvents = CALENDAR_DATA.filter(e => {
                  const matchesRange = dateStr >= e.startDate && dateStr <= e.endDate;
                  const matchesFilter = currentFilter === "ALL" || e.category === currentFilter;
                  return matchesRange && matchesFilter;
                });

                return (
                  <div 
                    key={`day-${day}`} 
                    onClick={() => setSelectedDateStr(dateStr)}
                    className={`min-h-[115px] bg-base-100 p-1.5 flex flex-col justify-between hover:bg-base-200 transition-all cursor-pointer relative group ${
                      isSelected ? "ring-2 ring-primary ring-inset bg-primary/10" : ""
                    }`}
                  >
                    <span className={`font-bold text-xs ${isSelected ? "text-primary" : "text-base-content/40 group-hover:text-base-content"}`}>
                      {day}
                    </span>

                    <div className="flex-1 space-y-1 mt-1 overflow-hidden">
                      {dayEvents.map((ev) => (
                        <div
                          key={ev.id}
                          className={`px-1 py-0.5 rounded-[4px] text-[9px] font-semibold tracking-tight border truncate leading-tight ${CATEGORIES[ev.category].bg}`}
                        >
                          {ev.subject}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Detailed Dashboard Agenda Panel */}
          <div className="xl:col-span-4 bg-base-100 rounded-xl border border-base-300 shadow-xs overflow-hidden flex flex-col sticky top-6">
            <div className="p-4 border-b border-base-300 bg-base-200/50">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-base-content">Agenda Timeline Feed</h3>
                {selectedDateStr && (
                  <button 
                    onClick={() => setSelectedDateStr(null)} 
                    className="text-[11px] font-medium text-primary hover:opacity-80"
                  >
                    Show Full Term
                  </button>
                )}
              </div>
              <p className="text-xs text-base-content/50 mt-0.5">
                {selectedDateStr ? "Showing specific events for your selected cell date row." : `Showing current schedule for ${activeTab}`}
              </p>
            </div>

            <div className="divide-y divide-base-300/60 max-h-[660px] overflow-y-auto">
              {agendaEvents.length === 0 ? (
                <div className="p-12 text-center text-base-content/40 text-xs">
                  No active events mapped to this filter slice context.
                </div>
              ) : (
                agendaEvents.map((item) => {
                  const design = CATEGORIES[item.category];
                  return (
                    <div key={item.id} className="p-4 hover:bg-base-200/40 transition-colors flex items-start gap-3">
                      <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${design.dot}`} />
                      <div className="space-y-0.5 flex-1">
                        <h4 className="text-xs font-semibold text-base-content leading-snug">
                          {item.subject}
                        </h4>
                        <p className="text-[11px] font-medium text-base-content/60">
                          {formatDateRange(item.startDate, item.endDate)}
                        </p>
                        {item.audience && (
                          <span className="inline-block bg-base-200 text-base-content/60 text-[9px] font-bold px-1.5 py-0.5 rounded mt-1">
                            {item.audience}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
    </main>
  );
}