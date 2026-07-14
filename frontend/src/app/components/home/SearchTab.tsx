"use client";

import React from "react";
import { useRouter } from "next/navigation";
import ParallaxBackground from "@/components/ParallaxBackground";
import { BeautifulSearchBox } from "@/components/SearchDesign";

interface SearchTabProps {
  searchTabQuery: string;
  setSearchTabQuery: (query: string) => void;
  mousePos?: { x: number; y: number };
}

export default function SearchTab({
  searchTabQuery,
  setSearchTabQuery,
  mousePos,
}: SearchTabProps) {
  const router = useRouter();

  const handleSearch = (query: string) => {
    const q = query.trim();
    if (!q) {
      return;
    }
    router.push(`/search-results?query=${encodeURIComponent(q)}`);
  };

  return (
    <div className="relative w-full min-h-screen lg:min-h-dvh flex flex-col items-center justify-center text-center p-4 md:p-8 bg-primary overflow-hidden select-none">
      {/* Shared Reusable Parallax Background Component */}
      <ParallaxBackground
        mousePos={mousePos}
        imageSrc="/homepage_bg.png"
        overlayClass="bg-linear-to-b via-slate-900/45 to-slate-950/65"
      />

      <style>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          55% { background-position: 100% 50%; }
        }
        @keyframes slide-up-fade {
          0% { opacity: 0; transform: translateY(120px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-gradient-text {
          background-size: 200% auto;
          animation: gradient-x 6s ease infinite;
        }
        .animate-hero-content {
          animation: slide-up-fade 3.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Centered Content with Entry slide-up and fade-in animation */}
      <div className="relative z-10 max-w-2xl w-full px-4 space-y-10 flex flex-col items-center animate-hero-content pb-28 md:pb-0">
        
        {/* Large Brand Header with high contrast shadow drop */}
        <h1 className="select-none leading-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)] filter">
          <span className="text-3xl sm:text-5xl lg:text-[60px] font-serif font-light tracking-wide bg-linear-to-r from-white to-slate-200 bg-clip-text text-transparent block">
            Search
          </span>
          <span className="text-4xl sm:text-6xl lg:text-[85px] font-sans font-bold tracking-widest bg-linear-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent block mt-3 filter drop-shadow-[0_2px_12px_rgba(59,130,246,0.5)] animate-gradient-text uppercase">
            META IITGN
          </span>
        </h1>

        {/* Oversized Glassmorphic Search Bar */}
        <div className="w-full">
          <BeautifulSearchBox
            value={searchTabQuery}
            onChange={setSearchTabQuery}
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(searchTabQuery);
            }}
            placeholder="Find articles, pages, policies..."
          />
        </div>

      </div>
    </div>
  );
}
