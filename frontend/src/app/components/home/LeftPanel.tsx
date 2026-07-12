"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { apiService } from "@/api";
import {
  Menu,
  Heart,
  HelpCircle,
  Users2,
  BookOpen,
  Trophy,
  Tent,
  MapPin,
  FlaskConical,
  Sparkles,
  Search,
  Building2,
  LucideIcon,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { QUICK_PORTALS } from "@/lib/constants";
import { BeautifulSearchBox } from "@/components/SearchDesign";

interface LeftPanelProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeTier: string;
  setActiveTier: (tier: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearchSubmit: (e: React.FormEvent) => void;
  activeTab: "home" | "search" | "bookmarks";
  setActiveTab: (tab: "home" | "search" | "bookmarks") => void;
  spawnHearts: (e: React.MouseEvent) => void;
}

const PORTAL_ICON_MAP: Record<string, LucideIcon> = {
  Building2,
  Users2,
  BookOpen,
  Trophy,
  Tent,
  MapPin,
  FlaskConical,
  Sparkles,
};

export default function LeftPanel({
  sidebarOpen,
  setSidebarOpen,
  activeTier,
  setActiveTier,
  searchQuery,
  setSearchQuery,
  handleSearchSubmit,
  activeTab,
  setActiveTab,
  spawnHearts,
}: LeftPanelProps) {
  const [pageCount, setPageCount] = useState<number | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const stats = await apiService.getPageStats();
        if (stats && typeof stats.totalPages === "number") {
          setPageCount(stats.totalPages);
        }
      } catch (err) {
        console.error("Failed to load page stats count:", err);
      }
    }
    loadStats();
  }, []);

  const renderPortalIcon = (
    iconName: string,
    colorTheme: { bg: string; icon: string }
  ) => {
    const IconComponent = PORTAL_ICON_MAP[iconName] || HelpCircle;

    return (
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorTheme.bg}`}
      >
        <IconComponent className={`h-5 w-5 ${colorTheme.icon}`} />
      </div>
    );
  };

  return (
    <>
      {/* Collapsible Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentTier={activeTier}
        onChangeTier={setActiveTier}
      />

      {/* Left Panel: Fixed Dashboard on Desktop */}
      <div
        className={`w-full lg:w-120 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-150 flex flex-col justify-between p-4 bg-white z-20 h-auto lg:h-full mb-10 md:mb-0 overflow-y-visible lg:overflow-hidden select-none pb-0 lg:pb-6 ${
          activeTab !== "home" ? "hidden lg:flex" : "flex"
        }`}
      >
        <div className="space-y-2">
          {/* Header with Hamburger Menu and Profile Dropdown inside Left Panel */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 w-full shrink-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-650 transition-colors duration-200 cursor-pointer active:scale-95"
              aria-label="Toggle Sidebar"
            >
              <Menu className="h-5.5 w-5.5 text-black" />
            </button>
            <Link
              href="/"
              className="flex items-center gap-2 select-none cursor-pointer group"
              onClick={() => setActiveTab("home")}
            >
              <div className="block">
                <span className="font-serif text-2xl font-extrabold tracking-tight  text-blue-500">
                  META
                </span>
                <span className="ml-1 text-sm font-semibold uppercase tracking-wider text-gray-500">
                  IITGN
                </span>
              </div>
            </Link>
          </div>

          {/* Logo / Badge */}
          <div className="flex flex-col items-center text-center mt-1">
            <Link
              href="/"
              className="w-18 h-18 sm:w-20 sm:h-20 bg-blue-400 text-white rounded-full flex items-center justify-center font-serif font-black text-2xl sm:text-3xl shadow-md cursor-pointer hover:scale-105 transition-transform duration-300"
            >
              mI
            </Link>
            <div className="mt-4">
              <span className="block text-2xl font-serif font-black text-slate-900 tracking-tight">
                {pageCount !== null ? pageCount.toLocaleString() : "..."}
              </span>
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Articles & Campus Pages
              </span>
            </div>
          </div>

          {/* Search Form */}
          <BeautifulSearchBox
            value={searchQuery}
            onChange={setSearchQuery}
            onSubmit={handleSearchSubmit}
            placeholder="Search..."
            variant="compact"
          />

          {/* Category Cards (Modern box type redirecting to category sub-pages) */}
          <div className="space-y-2 mt-6 lg:mt-8">
            <h2 className="text-xl font-serif text-center font-bold text-gray-900 tracking-tight">
              Quick Portals
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {QUICK_PORTALS.map((portal) => (
                <Link
                  key={portal.name}
                  href={portal.path}
                  className={`flex items-center gap-2 p-3 rounded-xl border border-gray-150 bg-white shadow-xs hover:scale-105 transition-all duration-100 ease-in-out cursor-pointer group`}
                >
                  {renderPortalIcon(portal.iconName, portal.colorTheme)}
                  <span className="text-xs font-semibold text-gray-700 group-hover:text-blue-700 transition-colors duration-200">
                    {portal.name}
                  </span>
                </Link>
              ))}
          </div>
        </div>
      </div>
        {/* Credits Footer */}
        <div className="pt-5 border-t hidden lg:flex border-slate-100/60 flex-col items-center text-center gap-1.5 select-none mt-6 w-full">
          <div className="text-[12px] text-slate-500 font-medium flex items-center justify-center gap-1.5 uppercase tracking-wider">
            <span>Made with</span>
            <Heart
              onClick={spawnHearts}
              className="w-6 h-6 text-red-500 fill-red-500 cursor-pointer hover:scale-130 transition-transform duration-200 filter drop-shadow-[0_0_4px_rgba(239,68,68,0.4)] animate-pulse shrink-0"
            />
          </div>
          <div className="text-[12px] text-slate-500 font-semibold tracking-wide">
            by{" "}
            <span className="font-extrabold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-indigo-700 transition-colors">
              Technical Council, IITGN
            </span>
          </div>
          <div className="text-[9px] font-bold text-slate-400/60 tracking-widest uppercase mt-1">
            © {new Date().getFullYear()} IIT Gandhinagar
          </div>
        </div>
      </div>
    </>
  );
}
