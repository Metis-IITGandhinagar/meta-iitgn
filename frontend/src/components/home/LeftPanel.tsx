"use client";

import React, { useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useHomeStore } from "@/store/useHomeStore";
import { Menu, Settings, Search } from "lucide-react";
import { useCommonStore } from "@/store/useCommonStore";
import { BeautifulSearchBox } from "@/components/helpers/SearchDesign";
import { motion } from "framer-motion";
import { isEmojiIcon, CategoryIcon, CATEGORY_COLORS } from "@/lib/categoryIcon";

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
}: LeftPanelProps) {
  const { categories, setSettingsTab } = useAuth();
  const { setActiveOverlay, setActivePortalCategory } = useHomeStore();
  const pageCount = useCommonStore((state) => state.stats?.totalPages ?? null);
  const loadStats = useCommonStore((state) => state.loadStats);

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

  const getPortalStyle = (colorHex: string) => {
    const hex = colorHex.toLowerCase();
    const shadows: Record<string, string> = {
      "#4f46e5": "pill-shadow-indigo",
      "#3b82f6": "pill-shadow-blue",
      "#0ea5e9": "pill-shadow-blue",
      "#10b981": "pill-shadow-green",
      "#84cc16": "pill-shadow-green",
      "#22c55e": "pill-shadow-green",
      "#f59e0b": "pill-shadow-yellow",
      "#facc15": "pill-shadow-yellow",
      "#f97316": "pill-shadow-yellow",
      "#ef4444": "pill-shadow-pink",
      "#f43f5e": "pill-shadow-pink",
      "#ec4899": "pill-shadow-pink",
      "#a855f7": "pill-shadow-purple",
      "#8b5cf6": "pill-shadow-purple",
      "#14b8a6": "pill-shadow-green",
      "#06b6d4": "pill-shadow-blue",
      "#d946ef": "pill-shadow-pink",
      "#fb7185": "pill-shadow-light-pink",
      "#38bdf8": "pill-shadow-blue",
      "#c084fc": "pill-shadow-purple",
      "#f472b6": "pill-shadow-light-pink",
      "#fb923c": "pill-shadow-yellow",
      "#4ade80": "pill-shadow-green",
      "#60a5fa": "pill-shadow-blue",
      "#a78bfa": "pill-shadow-purple",
      "#64748b": "pill-shadow-gray",
      "#0f172a": "pill-shadow-gray",
      "#78716c": "pill-shadow-gray",
      "#4b4542": "pill-shadow-gray",
    };

    const gradients: Record<string, string> = {
      "#4f46e5": "from-[#4c39ec] to-[#604dec]",
      "#3b82f6": "from-[#00b4ff] to-[#00c6ff]",
      "#0ea5e9": "from-[#00b4ff] to-[#00c6ff]",
      "#10b981": "from-[#00d292] to-[#00e396]",
      "#84cc16": "from-[#00d292] to-[#00e396]",
      "#22c55e": "from-[#00d292] to-[#00e396]",
      "#f59e0b": "from-[#fcd34d] to-[#fde047]",
      "#facc15": "from-[#fcd34d] to-[#fde047]",
      "#f97316": "from-[#fcd34d] to-[#fde047]",
      "#ef4444": "from-[#ff5e7e] to-[#ff758c]",
      "#f43f5e": "from-[#ff5e7e] to-[#ff758c]",
      "#ec4899": "from-[#ff5e7e] to-[#ff758c]",
      "#a855f7": "from-[#8b5cf6] to-[#a855f7]",
      "#8b5cf6": "from-[#8b5cf6] to-[#a855f7]",
      "#14b8a6": "from-[#00d292] to-[#00e396]",
      "#06b6d4": "from-[#00b4ff] to-[#00c6ff]",
      "#d946ef": "from-[#8b5cf6] to-[#a855f7]",
      "#fb7185": "from-[#ff5e7e] to-[#ff758c]",
      "#38bdf8": "from-[#00b4ff] to-[#00c6ff]",
      "#c084fc": "from-[#8b5cf6] to-[#a855f7]",
      "#f472b6": "from-[#ff5e7e] to-[#ff758c]",
      "#fb923c": "from-[#fcd34d] to-[#fde047]",
      "#4ade80": "from-[#00d292] to-[#00e396]",
      "#60a5fa": "from-[#00b4ff] to-[#00c6ff]",
      "#a78bfa": "from-[#8b5cf6] to-[#a855f7]",
      "#64748b": "from-[#4b4542] to-[#4b4542]",
      "#0f172a": "from-[#4b4542] to-[#4b4542]",
      "#78716c": "from-[#4b4542] to-[#4b4542]",
      "#4b4542": "from-[#4b4542] to-[#4b4542]",
    };

    const textColors: Record<string, string> = {
      "#4f46e5": "text-white",
      "#3b82f6": "text-slate-900",
      "#0ea5e9": "text-slate-900",
      "#10b981": "text-slate-900",
      "#84cc16": "text-slate-900",
      "#22c55e": "text-slate-900",
      "#f59e0b": "text-slate-900",
      "#facc15": "text-slate-900",
      "#f97316": "text-slate-900",
      "#ef4444": "text-white",
      "#f43f5e": "text-white",
      "#ec4899": "text-white",
      "#a855f7": "text-white",
      "#8b5cf6": "text-white",
      "#14b8a6": "text-slate-900",
      "#06b6d4": "text-slate-900",
      "#d946ef": "text-white",
      "#fb7185": "text-white",
      "#38bdf8": "text-slate-900",
      "#c084fc": "text-white",
      "#f472b6": "text-white",
      "#fb923c": "text-slate-900",
      "#4ade80": "text-slate-900",
      "#60a5fa": "text-slate-900",
      "#a78bfa": "text-white",
      "#64748b": "text-white",
      "#0f172a": "text-white",
      "#78716c": "text-white",
      "#4b4542": "text-white",
    };

    const iconBgColors: Record<string, string> = {
      "#4f46e5": "bg-white/20",
      "#3b82f6": "bg-black/10",
      "#0ea5e9": "bg-black/10",
      "#10b981": "bg-black/10",
      "#84cc16": "bg-black/10",
      "#22c55e": "bg-black/10",
      "#f59e0b": "bg-white/40",
      "#facc15": "bg-white/40",
      "#f97316": "bg-white/20",
      "#ef4444": "bg-white/20",
      "#f43f5e": "bg-white/20",
      "#ec4899": "bg-white/20",
      "#a855f7": "bg-white/20",
      "#8b5cf6": "bg-white/20",
      "#14b8a6": "bg-black/10",
      "#06b6d4": "bg-black/10",
      "#d946ef": "bg-white/20",
      "#fb7185": "bg-white/20",
      "#38bdf8": "bg-black/10",
      "#c084fc": "bg-white/20",
      "#f472b6": "bg-white/20",
      "#fb923c": "bg-white/20",
      "#4ade80": "bg-black/10",
      "#60a5fa": "bg-black/10",
      "#a78bfa": "bg-white/20",
      "#64748b": "bg-white/10",
      "#0f172a": "bg-white/10",
      "#78716c": "bg-white/10",
      "#4b4542": "bg-white/10",
    };

    const borderColors: Record<string, string> = {
      "#ec4899": "border-2 border-[#fbcce0] bg-[#ffe4f1] text-[#c02660]",
      "#facc15": "border border-yellow-300",
    };

    return {
      shadowClass: shadows[hex] || "pill-shadow-indigo",
      gradientClass: `bg-gradient-to-r ${gradients[hex] || "from-[#4c39ec] to-[#604dec]"}`,
      textClass: textColors[hex] || "text-white",
      iconBgClass: iconBgColors[hex] || "bg-white/20",
      specialClass: borderColors[hex] || "",
    };
  };

  const renderPortalIcon = (iconName: string | undefined, iconBgClass: string) => {
    return (
      <div className={`w-12 h-12 flex-shrink-0 icon-circle mr-4 shadow-sm ${iconBgClass}`}>
        {isEmojiIcon(iconName) ? (
          <span className="text-xl filter drop-shadow-sm" aria-hidden>{iconName}</span>
        ) : (
          <CategoryIcon icon={iconName} size={24} className="text-white" />
        )}
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
        className={`w-full lg:w-120 shrink-0 border-b lg:border-b-0 lg:border-r border-base-200 flex flex-col justify-between p-4 bg-base-100 h-auto lg:h-full min-h-0 mb-10 md:mb-0 overflow-y-auto select-none pb-0 lg:pb-6 ${activeTab !== "home" ? "hidden lg:flex" : "flex"}`}
      >
        <div className="space-y-2">
          {/* Header with Hamburger Menu and Settings inside Left Panel */}
          <div className="flex items-center justify-between pb-3 w-full shrink-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-full hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Toggle Sidebar"
            >
              <Menu className="w-6 h-6 text-slate-700" />
            </button>
            <button
              onClick={() => setSettingsTab("appearance")}
              className="p-2 rounded-full hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Open Settings"
            >
              <Settings className="w-6 h-6 text-slate-700" />
            </button>
          </div>

          {/* Logo / Badge - Redesigned to match mock */}
          <div className="flex flex-col items-center text-center mt-1">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#4c39ec] to-[#604dec] rounded-full blur opacity-40 group-hover:opacity-60 transition duration-500" />
              <Link
                href="/"
                className="relative bg-[#4c39ec] text-white w-28 h-28 rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(76,57,236,0.4)] border-2 border-white/10"
              >
                <span className="text-5xl font-bold tracking-tighter font-serif">mI</span>
              </Link>
            </div>
            <div className="mt-4">
              <span className="block text-4xl font-extrabold text-slate-800 font-serif">
                {pageCount !== null ? pageCount.toLocaleString() : "..."}
              </span>
              <span className="block text-xs font-bold text-slate-500 tracking-widest uppercase mt-1">
                Articles & Campus Pages
              </span>
            </div>
          </div>

          {/* Search Form - Redesigned to match mock */}
          <div className="w-full relative mt-2">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <BeautifulSearchBox
              value={searchQuery}
              onChange={setSearchQuery}
              onSubmit={handleSearchSubmit}
              placeholder="Search..."
              variant="compact"
            />
          </div>

          {/* Category Cards (Pill style) */}
          <div className="space-y-2 mt-6 lg:mt-8">
            {portalsToDisplay.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {portalsToDisplay.slice(0, 10).map((portal) => {
                  const style = getPortalStyle(portal.color);

                  return (
                    <motion.div
                      key={portal.slug}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                      <Link
                        href={portal.path}
                        className={`group relative flex items-center p-4 pr-6 rounded-[2rem] transition-transform transform hover:-translate-y-1 hover:scale-[1.02] active:scale-95 ${style.shadowClass} ${style.gradientClass} ${style.textClass} ${style.specialClass}`}
                        onClick={(e) => {
                          e.preventDefault();
                          setActivePortalCategory(portal.slug);
                          setActiveOverlay("portal");
                        }}
                      >
                        {renderPortalIcon(portal.iconName, style.iconBgClass)}
                        <span className="font-bold text-sm tracking-wide truncate">
                          {portal.name}
                        </span>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-base-300 rounded-xl bg-base-200/50">
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
      </div>
    </>
  );
}

// Sidebar component extracted to avoid circular imports
import Sidebar from "@/components/navs/Sidebar";