"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Building2,
  BookOpen,
  Users2,
  Trophy,
  FlaskConical,
  Shield,
  Sparkles,
  HelpCircle,
  LucideIcon,
} from "lucide-react";

interface SearchTabProps {
  searchTabQuery: string;
  setSearchTabQuery: (query: string) => void;
}

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  Campus: Building2,
  Academics: BookOpen,
  Clubs: Users2,
  Fests: Trophy,
  Research: FlaskConical,
  Policies: Shield,
  All: Sparkles,
};

export default function SearchTab({
  searchTabQuery,
  setSearchTabQuery,
}: SearchTabProps) {
  const router = useRouter();

  return (
    <div className="h-full flex flex-col items-center justify-center bg-[#FCFCFD] p-6 md:p-12">
      <div className="max-w-xl w-full text-center space-y-6">
        <div className="space-y-2 select-none">
          <h1 className="text-3xl font-serif font-black text-slate-900 tracking-tight">
            Search Wiki
          </h1>
          <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto">
            Explore courses, clubs, hostels, and campus resources at IITGN.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (searchTabQuery.trim()) {
              router.push(`/search-results?query=${encodeURIComponent(searchTabQuery.trim())}`);
            } else {
              router.push("/search-results");
            }
          }}
          className="relative w-full flex items-center h-12 bg-white border border-slate-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-105 rounded-2xl px-4 transition-all duration-200 shadow-sm"
        >
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Type query and press Enter to search..."
            value={searchTabQuery}
            onChange={(e) => setSearchTabQuery(e.target.value)}
            className="w-full text-sm text-slate-800 placeholder:text-gray-400 bg-transparent focus:outline-none px-3 h-full"
            autoFocus
          />
          {searchTabQuery && (
            <button
              type="button"
              onClick={() => setSearchTabQuery("")}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold px-2.5 py-1 bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </form>

        <div className="flex flex-wrap gap-2 justify-center select-none pt-2">
          {["Campus", "Academics", "Clubs", "Fests"].map((cat) => {
            const Icon = CATEGORY_ICON_MAP[cat] || HelpCircle;
            return (
              <button
                key={cat}
                onClick={() => {
                  router.push(`/search-results?query=&category=${cat}`);
                }}
                className="px-3.5 py-1.5 rounded-xl text-[10px] font-extrabold border bg-white text-slate-600 border-slate-200 hover:border-slate-350 hover:bg-slate-55 transition-all duration-200 cursor-pointer flex items-center gap-1.5"
              >
                <Icon className="h-3 w-3 shrink-0 text-slate-400" />
                {cat}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
