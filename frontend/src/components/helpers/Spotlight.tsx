"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, History, PenLine, Search, type LucideIcon } from "lucide-react";
import { SECTIONS } from "@/lib/sections";
import { Portal } from "@/components/helpers/Portal";
import { addSearchHistory, getSearchHistory } from "@/lib/searchHistory";

interface Item {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  group: string;
  run: () => void;
}

/** ⌘K palette: search the wiki, jump to a section, or start writing. */
export function Spotlight({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      returnFocus.current = document.activeElement as HTMLElement | null;
      setQ("");
      setIdx(0);
      setHistory(getSearchHistory().slice(0, 4));
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      returnFocus.current?.focus?.();
    }
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const go = (href: string) => () => {
      onClose();
      router.push(href);
    };
    const search = (term: string) => () => {
      addSearchHistory(term);
      onClose();
      router.push(`/search-results?query=${encodeURIComponent(term)}`);
    };
    const term = q.trim();
    const out: Item[] = [];
    if (term) {
      out.push({ id: "search", label: `Search the wiki for “${term}”`, icon: Search, group: "Search", run: search(term) });
    }
    const sections = SECTIONS.filter((s) => !term || s.label.toLowerCase().includes(term.toLowerCase()));
    sections.forEach((s) =>
      out.push({ id: `s-${s.href}`, label: s.label, hint: s.hint, icon: s.icon, group: "Go to", run: go(s.href) })
    );
    if (!term || "write page new".includes(term.toLowerCase())) {
      out.push({ id: "write", label: "Write a page", hint: "Add something to the wiki", icon: PenLine, group: "Do", run: go("/wiki/categories") });
    }
    if (!term) {
      history.forEach((h) => out.push({ id: `h-${h}`, label: h, icon: History, group: "Recent searches", run: search(h) }));
    }
    return out;
  }, [q, history, router, onClose]);

  useEffect(() => setIdx(0), [q]);

  if (!open) return null;

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIdx((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      items[idx]?.run();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  let lastGroup = "";
  return (
    <Portal>
    <div className="fixed inset-0 z-[10050] flex items-start justify-center px-4 pt-[12vh]" onKeyDown={onKey}>
      <button type="button" aria-label="Close search" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-black/55 backdrop-blur-[2px] cursor-default" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search or jump to"
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-base-300 bg-base-100 text-base-content shadow-none ring-1 ring-black/10 spot-pop"
      >
        <div className="flex items-center gap-3 px-5 h-14 border-b border-base-300">
          <Search className="h-4 w-4 text-base-content/65" aria-hidden />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            role="combobox"
            aria-expanded="true"
            aria-controls="spotlight-list"
            aria-activedescendant={items[idx] ? `spot-${items[idx].id}` : undefined}
            aria-label="Search or jump to"
            placeholder="Search or jump to…"
            spellCheck={false}
            autoComplete="off"
            className="flex-1 bg-transparent text-[16px] outline-none placeholder:text-base-content/55"
          />
          <kbd className="text-[11px] text-base-content/65 font-mono border border-base-300 rounded px-1.5 py-0.5">Esc</kbd>
        </div>
        <ul id="spotlight-list" role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
          {items.map((it, i) => {
            const header = it.group !== lastGroup;
            lastGroup = it.group;
            const Icon = it.icon;
            return (
              <React.Fragment key={it.id}>
                {header && (
                  <li role="presentation" className="px-3 pt-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-base-content/65">
                    {it.group}
                  </li>
                )}
                <li
                  id={`spot-${it.id}`}
                  role="option"
                  aria-selected={i === idx}
                  onMouseMove={() => setIdx(i)}
                  onClick={it.run}
                  className={`flex items-center gap-3 rounded-lg px-3 min-h-11 py-2 cursor-pointer ${i === idx ? "bg-base-200" : ""}`}
                >
                  <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[14px] truncate">{it.label}</span>
                    {it.hint && <span className="block text-[12px] text-base-content/65 truncate">{it.hint}</span>}
                  </span>
                  {i === idx && <CornerDownLeft className="h-3.5 w-3.5 text-base-content/65" aria-hidden />}
                </li>
              </React.Fragment>
            );
          })}
          {items.length === 0 && <li className="px-4 py-8 text-center text-sm text-base-content/70">No matches.</li>}
        </ul>
      </div>
    </div>
    </Portal>
  );
}
