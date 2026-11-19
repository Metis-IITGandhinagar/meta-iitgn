"use client";

import React from "react";
import { Search, X } from "lucide-react";

// --- BeautifulSearchBox Props ---
interface BeautifulSearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  placeholder?: string;
  variant?: "default" | "compact";
  autoFocus?: boolean;
}

/** Search field in the shared style: hairline box, focus shown on the box, not the bare input. */
export function BeautifulSearchBox({
  value,
  onChange,
  onSubmit,
  placeholder = "Find…",
  variant = "default",
  autoFocus = false,
}: BeautifulSearchBoxProps) {
  const isCompact = variant === "compact";

  return (
    <form onSubmit={onSubmit} role="search" className="w-full">
      <label className="sr-only" htmlFor="page-search">
        Search
      </label>
      <div
        className={`flex items-center gap-3 px-4 rounded-xl border border-base-300 bg-base-100 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition ${
          isCompact ? "h-12" : "h-14"
        }`}
      >
        <Search className="h-[18px] w-[18px] shrink-0 text-base-content/55" aria-hidden />
        <input
          id="page-search"
          type="search"
          name="query"
          spellCheck={false}
          enterKeyHint="search"
          autoComplete="off"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`flex-1 min-w-0 bg-transparent outline-none placeholder:text-base-content/50 ${isCompact ? "text-[15px]" : "text-base"}`}
          autoFocus={autoFocus}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="h-9 w-9 -mr-2 inline-flex items-center justify-center rounded-lg text-base-content/60 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>
    </form>
  );
}

// --- BeautifulTabBar Props ---
interface BeautifulTabBarProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  categoryIconMap?: Record<string, React.ComponentType<{ className?: string }>>;
}

/** Filter chips in the shared style. */
export function BeautifulTabBar({
  categories,
  activeCategory,
  onCategoryChange,
  categoryIconMap,
}: BeautifulTabBarProps) {
  return (
    <div role="tablist" aria-label="Filter results" className="flex gap-2 overflow-x-auto scrollbar-none select-none">
      {categories.map((cat) => {
        const isSelected = activeCategory === cat;
        const Icon = categoryIconMap?.[cat];

        return (
          <button
            key={cat}
            role="tab"
            aria-selected={isSelected}
            onClick={() => onCategoryChange(cat)}
            className={`inline-flex items-center gap-2 min-h-9 px-3.5 rounded-full border text-[13px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
              isSelected
                ? "bg-base-content text-base-100 border-base-content"
                : "border-base-300 text-base-content/75 hover:border-base-content/40 hover:text-base-content"
            }`}
          >
            {Icon && <Icon className="h-4 w-4" aria-hidden />}
            <span>{cat}</span>
          </button>
        );
      })}
    </div>
  );
}
