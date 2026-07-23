"use client";

import React, { useEffect, useMemo } from "react";
import Link from "next/link";

import { useAuth } from "@/hooks/useAuth";
import { useHomeStore } from "@/store/useHomeStore";
import { Menu, Heart, Settings, BookOpen, Users } from "lucide-react";
import Sidebar from "@/components/navs/Sidebar";
import { CategoryIcon, CATEGORY_COLORS } from "@/lib/categoryIcon";
import { useCommonStore } from "@/store/useCommonStore";
import { BeautifulSearchBox } from "@/components/helpers/SearchDesign";

interface LeftPanelProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeTier: string;
  setActiveTier: (tier: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearchSubmit: (e: React.FormEvent) => void;
  activeTab: "home" | "search" | "bookmarks" | "profile";
  setActiveTab: (tab: "home" | "search" | "bookmarks" | "profile") => void;
  spawnHearts: (e: React.MouseEvent) => void;
}

export default function LeftPanel({
  sidebarOpen,
  setSidebarOpen,
  activeTier,
  setActiveTier,
  searchQuery,
  setSearchQuery,
  handleSearchSubmit,
  activeTab,
  spawnHearts,
}: LeftPanelProps) {
  const { categories, setSettingsTab, auth } = useAuth();
  const { setActiveOverlay, setActivePortalCategory } = useHomeStore();
  const isLoggedIn = auth === true;
  const pageCount = useCommonStore((state) => state.stats?.totalPages ?? null);
  const loadStats = useCommonStore((state) => state.loadStats);

  // Calculate portals first (before any useEffect that uses it)
  const portalsToDisplay = useMemo(() => {
    const pinned = categories.filter((c) => c.is_pinned);

    return pinned.map((c, index) => {
      const color = (!c.color || c.color === "#4f46e5")
        ? CATEGORY_COLORS[index % CATEGORY_COLORS.length]
        : c.color;

      return {
        name: c.name,
        slug: c.slug,
        path: `/wiki/${c.slug}`,
        iconName: c.icon,
        color: color,
      };
    });
  }, [categories]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const renderPortalIcon = (iconName: string | undefined, color: string, iconClass?: string) => {
    if (iconClass) {
      return (
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}>
          <CategoryIcon icon={iconName} size={20} />
        </div>
      );
    }
    return (
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mb-1.5"
        style={{
          backgroundColor: `${color}1a`,
          color: color,
        }}
      >
        <CategoryIcon icon={iconName} size={20} />
      </div>
    );
  };

  const getEmojiCardStyle = (colorHex: string) => {
    const hex = colorHex.toLowerCase();
    switch (hex) {
      case "#4f46e5":
        return {
          cardClass: "bg-indigo-500 hover:bg-indigo-600 text-white hover:shadow-indigo-500/20",
          iconClass: "bg-white/20 text-white",
          textClass: "text-white",
        };
      case "#3b82f6":
        return {
          cardClass: "bg-blue-500 hover:bg-blue-600 text-white hover:shadow-blue-500/20",
          iconClass: "bg-white/20 text-white",
          textClass: "text-white",
        };
      case "#0ea5e9":
        return {
          cardClass: "bg-sky-400 hover:bg-sky-500 text-sky-950 hover:shadow-sky-400/20",
          iconClass: "bg-sky-950/15 text-sky-950",
          textClass: "text-sky-950",
        };
      case "#10b981":
        return {
          cardClass: "bg-emerald-450 hover:bg-emerald-550 text-emerald-950 hover:shadow-emerald-450/20",
          iconClass: "bg-emerald-950/15 text-emerald-950",
          textClass: "text-emerald-950",
        };
      case "#84cc16":
        return {
          cardClass: "bg-lime-400 hover:bg-lime-500 text-lime-950 hover:shadow-lime-400/20",
          iconClass: "bg-lime-950/15 text-lime-950",
          textClass: "text-lime-950",
        };
      case "#f59e0b":
        return {
          cardClass: "bg-amber-300 hover:bg-amber-400 text-amber-950 hover:shadow-amber-300/20",
          iconClass: "bg-amber-950/15 text-amber-950",
          textClass: "text-amber-950",
        };
      case "#f97316":
        return {
          cardClass: "bg-orange-500 hover:bg-orange-600 text-white hover:shadow-orange-500/20",
          iconClass: "bg-white/20 text-white",
          textClass: "text-white",
        };
      case "#ef4444":
        return {
          cardClass: "bg-red-500 hover:bg-red-600 text-white hover:shadow-red-500/20",
          iconClass: "bg-white/20 text-white",
          textClass: "text-white",
        };
      case "#f43f5e":
        return {
          cardClass: "bg-rose-500 hover:bg-rose-600 text-white hover:shadow-rose-500/20",
          iconClass: "bg-white/20 text-white",
          textClass: "text-white",
        };
      case "#ec4899":
        return {
          cardClass: "bg-pink-100 border-2 border-pink-300 text-pink-700 hover:bg-pink-200 hover:shadow-pink-200/20",
          iconClass: "bg-pink-700/10 text-pink-700",
          textClass: "text-pink-700",
        };
      case "#a855f7":
        return {
          cardClass: "bg-purple-500 hover:bg-purple-600 text-white hover:shadow-purple-500/20",
          iconClass: "bg-white/20 text-white",
          textClass: "text-white",
        };
      case "#8b5cf6":
        return {
          cardClass: "bg-violet-500 hover:bg-violet-600 text-white hover:shadow-violet-500/20",
          iconClass: "bg-white/20 text-white",
          textClass: "text-white",
        };
      case "#14b8a6":
        return {
          cardClass: "bg-teal-400 hover:bg-teal-500 text-teal-950 hover:shadow-teal-400/20",
          iconClass: "bg-teal-950/15 text-teal-950",
          textClass: "text-teal-950",
        };
      case "#64748b":
        return {
          cardClass: "bg-slate-700 hover:bg-slate-800 text-white hover:shadow-slate-700/20",
          iconClass: "bg-white/20 text-white",
          textClass: "text-white",
        };
      case "#0f172a":
        return {
          cardClass: "bg-slate-800 hover:bg-slate-900 text-slate-100 hover:shadow-slate-800/20",
          iconClass: "bg-white/10 text-slate-100",
          textClass: "text-slate-100",
        };
      case "#78716c":
        return {
          cardClass: "bg-stone-700 hover:bg-stone-800 text-white hover:shadow-stone-700/20",
          iconClass: "bg-white/20 text-white",
          textClass: "text-white",
        };
      default:
        return {
          cardClass: "bg-indigo-500 hover:bg-indigo-600 text-white hover:shadow-indigo-500/20",
          iconClass: "bg-white/20 text-white",
          textClass: "text-white",
        };
    }
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
        className={`w-full lg:w-120 shrink-0 border-b lg:border-b-0 lg:border-r border-base-200 flex flex-col justify-between p-4 bg-base-100 h-auto lg:h-full min-h-0 mb-10 md:mb-0 overflow-y-auto select-none pb-0 lg:pb-6 ${
          activeTab !== "home" ? "hidden lg:flex" : "flex"
        }`}
      >
        <div className="space-y-2">
          {/* Header with Hamburger Menu and Profile Dropdown inside Left Panel */}
          <div className="flex items-center justify-between pb-3 w-full shrink-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="btn btn-ghost btn-square btn-sm transition-colors duration-200 cursor-pointer active:scale-95 text-base-content"
              aria-label="Toggle Sidebar"
            >
              <Menu className="h-5.5 w-5.5 text-base-content" />
            </button>
            <button
              onClick={() => setSettingsTab("appearance")}
              className="btn btn-ghost btn-square btn-sm transition-colors duration-200 cursor-pointer active:scale-95 text-base-content"
              aria-label="Open Settings"
            >
              <Settings className="w-5.5 h-5.5 text-base-content" />
            </button>
          </div>

          {/* Logo / Badge */}
          <div className="flex flex-col items-center text-center mt-1">
            <div className="hover-3d">
              <Link
                href="/"
                className="w-18 h-18 sm:w-20 sm:h-20 bg-primary text-primary-content rounded-full flex items-center justify-center font-serif font-black text-2xl sm:text-3xl shadow-md cursor-pointer"
              >
                mI
              </Link>
              <div />
              <div />
              <div />
              <div />
              <div />
              <div />
              <div />
              <div />
            </div>
            <div className="mt-4">
              <span className="block text-2xl font-serif font-black text-base-content tracking-tight">
                {pageCount !== null ? pageCount.toLocaleString() : "..."}
              </span>
              <span className="block text-[9px] font-bold text-base-content/50 uppercase tracking-widest">
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
            <div className="flex items-center justify-between mb-2">
              <div className="w-12" />
              <h2 className="text-xl font-serif font-bold text-base-content tracking-tight">
                Quick Portals
              </h2>
              {isLoggedIn ? (
                <button
                  onClick={() => setActiveOverlay("categories")}
                  className="text-[10px] font-extrabold text-primary hover:text-blue-700 hover:underline tracking-wider uppercase shrink-0 cursor-pointer"
                >
                  All
                </button>
              ) : (
                <div className="w-12" />
              )}
            </div>

            {/* Premium, unified-size grid for Quick Portals */}
            <div className="grid grid-cols-2 gap-3 mt-2 w-full">
              {/* Default Portal 1: PYQ Papers */}
              <Link
                href="/paper"
                className="group relative flex flex-col items-center justify-center text-center p-2 h-24 rounded-[1.8rem] overflow-hidden shadow-md shadow-amber-500/10 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer select-none border border-amber-400/20"
              >
                {/* Background image */}
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundImage: "url('https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=300&auto=format&fit=crop')" }}
                />
                {/* Gradient tint overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-600/85 to-yellow-500/90 mix-blend-multiply group-hover:opacity-90 transition-opacity" />
                
                {/* Content */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/20 text-white mb-1.5 shrink-0 group-hover:scale-110 transition-transform duration-200">
                    <BookOpen className="w-4.5 h-4.5 animate-pulse" />
                  </div>
                  <span className="text-[8.5px] font-black tracking-wide leading-tight drop-shadow-md uppercase text-white">
                    PYQ Papers
                  </span>
                </div>
              </Link>

              {/* Default Portal 2: Interviews */}
              <Link
                href="/interviews"
                className="group relative flex flex-col items-center justify-center text-center p-2 h-24 rounded-[1.8rem] overflow-hidden shadow-md shadow-indigo-500/10 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer select-none border border-indigo-400/20"
              >
                {/* Background image */}
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundImage: "url('https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=300&auto=format&fit=crop')" }}
                />
                {/* Gradient tint overlay */}
                <div className="absolute inset-0 bg-linear-to-br from-indigo-600/85 to-purple-500/90 mix-blend-multiply group-hover:opacity-90 transition-opacity" />
                
                {/* Content */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/20 text-white mb-1.5 shrink-0 group-hover:scale-110 transition-transform duration-200">
                    <Users className="w-4.5 h-4.5 animate-pulse" />
                  </div>
                  <span className="text-[8.5px] font-black tracking-wide leading-tight drop-shadow-md uppercase text-white">
                    Collage Feed
                  </span>
                </div>
              </Link>

              {/* Pinned Category Portals */}
              {portalsToDisplay.map((portal) => {
                const theme = getEmojiCardStyle(portal.color);
                return (
                  <button
                    key={portal.slug}
                    onClick={() => {
                      setActivePortalCategory(portal.slug);
                      setActiveOverlay("portal");
                    }}
                    className={`group relative flex flex-col items-center justify-center text-center p-2.5 h-24 rounded-[1.8rem] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer select-none ${theme.cardClass} shadow-md`}
                  >
                    {renderPortalIcon(portal.iconName, portal.color, `${theme.iconClass} mb-1.5 group-hover:scale-110 transition-transform duration-200`)}
                    <span className={`text-[9px] font-extrabold ${theme.textClass} leading-tight break-words pointer-events-none uppercase`}>
                      {portal.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {portalsToDisplay.length === 0 && (
              <div className="text-center py-6 border border-dashed border-base-300 rounded-xl bg-base-200/50 mt-3">
                <p className="text-xs text-base-content/50 font-semibold mb-2">No Quick Portals pinned</p>
                <button
                  type="button"
                  onClick={() => setActiveOverlay("categories")}
                  className="inline-flex text-[10px] font-extrabold text-primary hover:text-blue-700 uppercase tracking-wider hover:underline cursor-pointer"
                >
                  Pin Portals
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Credits Footer */}
        <div className="pt-5 border-t hidden lg:flex border-base-200 flex-col items-center text-center gap-1.5 select-none mt-6 w-full">
          <div className="text-[12px] text-base-content/60 flex items-center justify-center gap-1.5 uppercase tracking-wider">
            <span>Made with</span>
            <Heart
              onClick={spawnHearts}
              className="w-6 h-6 text-red-500 fill-red-500 cursor-pointer hover:scale-130 transition-transform duration-200 filter drop-shadow-[0_0_4px_rgba(239,68,68,0.4)] animate-pulse shrink-0"
            />
          </div>
          <div className="text-[12px] text-base-content/60 font-semibold tracking-wide">
            by{" "}
            <span className="font-extrabold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-indigo-700 transition-colors">
              Technical Council, IITGN
            </span>
          </div>
          <div className="text-[9px] font-bold text-base-content/50/60 tracking-widest uppercase mt-1">
            © {new Date().getFullYear()} Technical Council
          </div>
        </div>
      </div>
    </>
  );
}
