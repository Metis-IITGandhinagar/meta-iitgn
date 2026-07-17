"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BeautifulSearchBox } from "@/components/SearchDesign";
import { getSearchHistory, addSearchHistory, clearSearchHistory } from "@/lib/searchHistory";

interface SearchTabProps {
  searchTabQuery: string;
  setSearchTabQuery: (query: string) => void;
  mousePos?: { x: number; y: number };
}

export default function SearchTab({
  searchTabQuery,
  setSearchTabQuery,
}: SearchTabProps) {
  const router = useRouter();
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    setHistory(getSearchHistory());
  }, []);

  const handleSearch = (query: string) => {
    const q = query.trim();
    if (!q) return;
    addSearchHistory(q);
    setHistory(getSearchHistory());
    router.push(`/search-results?query=${encodeURIComponent(q)}`);
  };

  const autoFocus = localStorage.getItem("wiki_autofocus_search") !== "false";

  return (
    <div className="relative w-full min-h-screen lg:min-h-dvh flex flex-col items-center justify-center text-center p-4 md:p-8 bg-base-100 overflow-hidden select-none">
      {styleBlock}

      <div className="relative z-10 max-w-2xl w-full px-4 space-y-8 flex flex-col items-center animate-hero-content pb-28 md:pb-0">

        {/* Brand Header */}
        <div className="text-center space-y-3 select-none">
          <h2 className="text-xs font-black uppercase tracking-[0.25em] text-primary">
            IIT Gandhinagar Campus Wiki
          </h2>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight text-base-content leading-none">
            Search <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">META IITGN</span>
          </h1>
          <p className="text-xs sm:text-sm text-base-content/55 max-w-md mx-auto font-medium leading-relaxed">
            Find campus pages, people, news articles, academic guides, club info, and more — all in one place.
          </p>
        </div>

        {/* Search Bar */}
        <div className="w-full">
          <BeautifulSearchBox
            value={searchTabQuery}
            onChange={setSearchTabQuery}
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(searchTabQuery);
            }}
            placeholder="Pages, people, news, categories…"
            autoFocus={autoFocus}
          />
        </div>

        {/* Recent searches */}
        {history.length > 0 && (
          <div className="w-full max-w-2xl flex flex-wrap items-center justify-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-base-content/40 mr-1">
              Recent
            </span>
            {history.map((item) => (
              <button
                key={item}
                onClick={() => handleSearch(item)}
                className="text-xs font-semibold text-base-content/70 bg-base-200 hover:bg-base-300 hover:text-base-content rounded-full px-3 py-1 transition-colors cursor-pointer"
              >
                {item}
              </button>
            ))}
            <button
              onClick={() => {
                clearSearchHistory();
                setHistory([]);
              }}
              className="text-[10px] font-bold uppercase tracking-wider text-base-content/40 hover:text-rose-500 transition-colors cursor-pointer ml-1"
            >
              Clear
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

const styleBlock = (
  <style>{`
    @keyframes slide-up-fade {
      0% { opacity: 0; transform: translateY(30px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    .animate-hero-content {
      animation: slide-up-fade 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `}</style>
);
