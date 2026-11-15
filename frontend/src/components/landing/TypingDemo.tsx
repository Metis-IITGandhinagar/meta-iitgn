"use client";

import { useEffect, useState } from "react";
import { BookOpen, Search } from "lucide-react";

const DEMOS = [
  {
    q: "hostel allotment",
    r: [
      { title: "Hostel allotment", hint: "How rooms are assigned each year", meta: "Student life" },
      { title: "Hostel rules", hint: "Timings, guests and what to expect", meta: "Student life" },
      { title: "Room change requests", hint: "When and how to ask", meta: "Student life" },
    ],
  },
  {
    q: "placement notes",
    r: [
      { title: "Company-wise notes", hint: "Rounds, questions and tips from seniors", meta: "PrepMat" },
      { title: "Interview experiences", hint: "Stories from past placement seasons", meta: "Stories" },
      { title: "Resume checklist", hint: "What recruiters look at first", meta: "PrepMat" },
    ],
  },
  {
    q: "joining a club",
    r: [
      { title: "Councils and clubs", hint: "Who runs what on campus", meta: "Clubs" },
      { title: "Recruitment calendar", hint: "When each club opens applications", meta: "Clubs" },
      { title: "Fests and events", hint: "Where to volunteer", meta: "Campus life" },
    ],
  },
];

/** Hero preview: types a query, shows its results, then moves on. Static under reduced motion. */
export function TypingDemo() {
  const [i, setI] = useState(0);
  const [n, setN] = useState(DEMOS[0].q.length);
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const full = DEMOS[i].q.length;
    let t: ReturnType<typeof setTimeout>;
    if (n < full) {
      t = setTimeout(() => setN(n + 1), 70);
    } else {
      t = setTimeout(() => {
        const next = (i + 1) % DEMOS.length;
        setI(next);
        setN(0);
      }, 2600);
    }
    return () => clearTimeout(t);
  }, [n, i, reduced]);

  const demo = DEMOS[i];
  const done = n >= demo.q.length;

  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 overflow-hidden" role="img" aria-label="Preview: searching the wiki and getting matching pages">
      <div className="flex items-center gap-3 px-5 h-14 border-b border-base-300">
        <Search className="h-4 w-4 text-base-content/55" aria-hidden />
        <span className="text-[15px] text-left" aria-hidden>
          {demo.q.slice(0, n)}
          {!reduced && <span className="demo-caret" />}
        </span>
        <span className="ml-auto font-mono text-[11px] text-base-content/55 border border-base-300 rounded px-1.5 py-0.5" aria-hidden>⌘K</span>
      </div>
      <ul className={`transition-opacity duration-300 ${done ? "opacity-100" : "opacity-40"}`} aria-hidden>
        {demo.r.map((r, idx) => (
          <li key={r.title} className={`flex items-center gap-4 px-5 py-3.5 ${idx === 0 ? "bg-base-200" : ""} ${idx > 0 ? "border-t border-base-300/70" : ""}`}>
            <span className="h-8 w-8 rounded-md border border-base-300 inline-flex items-center justify-center text-primary shrink-0 bg-base-100">
              <BookOpen className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-[14px] font-medium truncate">{r.title}</span>
              <span className="block text-[13px] text-base-content/65 truncate">{r.hint}</span>
            </span>
            <span className="text-[12px] text-base-content/65 shrink-0">{r.meta}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
