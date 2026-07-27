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
      <form
        onSubmit={onSubmit}
        className="relative z-10 w-full"
      >
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`input border-none focus:border-none focus:outline-none focus:ring-0 focus-visible:ring-4 focus-visible:ring-indigo-500 block w-full pl-12 pr-4 py-4 bg-transparent  rounded-[2rem] text-slate-700 placeholder-slate-400  focus:ring-indigo-500  transition-all pill-shadow-white text-base shadow-[0_8px_30px_rgba(0,0,0,0.04)] ${isCompact ? "py-3 text-sm" : ""}`}
            autoFocus={autoFocus}
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
              aria-label="Clear search"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
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
