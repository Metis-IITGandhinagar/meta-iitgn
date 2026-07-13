"use client";

import React from "react";
import { Search } from "lucide-react";

// --- BeautifulSearchBox Props ---
interface BeautifulSearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  placeholder?: string;
  variant?: "default" | "compact";
  autoFocus?: boolean;
}

export function BeautifulSearchBox({
  value,
  onChange,
  onSubmit,
  placeholder = "Find...",
  variant = "default",
  autoFocus = false,
}: BeautifulSearchBoxProps) {
  const isCompact = variant === "compact";

  return (
    <div className={`relative w-full mx-auto select-none ${isCompact ? "py-1" : "py-4 px-2"}`}>
      {/* Elevated input container with balanced border and centered omnidirectional shadow */}
      <form
        onSubmit={onSubmit}
        className={`relative z-10 w-full flex items-center bg-base-100 backdrop-blur-md border border-base-300 focus-within:bg-base-100 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all duration-300 shadow-[0_0_36px_rgba(0,0,0,0.10)] hover:shadow-[0_0_48px_rgba(0,0,0,0.15)] ${
          isCompact ? "h-11 rounded-full px-4" : "h-16 rounded-3xl px-6"
        }`}
      >
        <Search className={`${isCompact ? "h-4.5 w-4.5" : "h-6 w-6"} text-base-content/40 shrink-0 mr-2.5`} />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-transparent focus:outline-none h-full font-medium text-base-content placeholder-base-content/40 ${
            isCompact ? "text-xs md:text-sm" : "text-lg"
          }`}
          autoFocus={autoFocus}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className={`text-base-content/60 hover:text-base-content font-bold transition-all cursor-pointer mr-1 active:scale-95 ${
              isCompact ? "text-[10px] px-2 py-1 bg-base-200 hover:bg-base-300 rounded-lg" : "text-xs px-3 py-1.5 bg-base-200 hover:bg-base-300 rounded-xl"
            }`}
          >
            Clear
          </button>
        )}
      </form>
    </div>
  );
}

// --- BeautifulTabBar Props ---
interface BeautifulTabBarProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  categoryIconMap?: Record<string, React.ComponentType<{ className?: string }>>;
}

export function BeautifulTabBar({
  categories,
  activeCategory,
  onCategoryChange,
  categoryIconMap,
}: BeautifulTabBarProps) {
  return (
    <div className="relative w-full max-w-3xl mx-auto px-4 py-2 select-none">
      {/* Elevated tab container with balanced border and centered omnidirectional shadow */}
      <div className="flex gap-2 overflow-x-auto p-2 bg-base-100/90 backdrop-blur-md border border-base-300 rounded-2xl scrollbar-none shadow-[0_0_28px_rgba(0,0,0,0.08)]">
        {categories.map((cat) => {
          const isSelected = activeCategory === cat;
          const Icon = categoryIconMap?.[cat];

          return (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap border border-transparent transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "bg-primary text-primary-content shadow-lg transform scale-[1.02]"
                  : "bg-base-200 text-base-content/70 hover:bg-base-300 hover:text-base-content"
              }`}
            >
              {Icon && <Icon className={`w-4 h-4 ${isSelected ? "text-primary-content/90" : "text-base-content/50"}`} />}
              <span>{cat}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
