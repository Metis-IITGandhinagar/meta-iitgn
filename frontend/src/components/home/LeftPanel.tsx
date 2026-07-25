"use client";

import React, { useEffect, useMemo } from "react";
import Link from "next/link";

import { useAuth } from "@/hooks/useAuth";
import { useHomeStore } from "@/store/useHomeStore";
import { Menu, Heart, Settings } from "lucide-react";
import Sidebar from "@/components/navs/Sidebar";
import { CategoryIcon, CATEGORY_COLORS } from "@/lib/categoryIcon";
import { useCommonStore } from "@/store/useCommonStore";
import { BeautifulSearchBox } from "@/components/helpers/SearchDesign";
import { motion } from "framer-motion";

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
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconClass}`}>
          <CategoryIcon icon={iconName} size={20} />
        </div>
      );
    }
    return (
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
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
          cardClass: "bg-indigo-500 hover:bg-indigo-600 text-white",
          iconClass: "bg-white/20 text-white",
          textClass: "text-white",
        };
      case "#3b82f6":
        return {
          cardClass: "bg-blue-500 hover:bg-blue-600 text-white",
          iconClass: "bg-white/20 text-white",
          textClass: "text-white",
        };
      case "#0ea5e9":
        return {
          cardClass: "bg-sky-400 hover:bg-sky-500 text-sky-950",
          iconClass: "bg-sky-950/10 text-sky-950",
          textClass: "text-sky-950",
        };
      case "#10b981":
        return {
          cardClass: "bg-emerald-400 hover:bg-emerald-500 text-emerald-950",
          iconClass: "bg-emerald-950/10 text-emerald-950",
          textClass: "text-emerald-950",
        };
      case "#84cc16":
        return {
          cardClass: "bg-lime-400 hover:bg-lime-500 text-lime-950",
          iconClass: "bg-lime-950/10 text-lime-950",
          textClass: "text-lime-950",
        };
      case "#f59e0b":
        return {
          cardClass: "bg-amber-300 hover:bg-amber-400 text-amber-950",
          iconClass: "bg-amber-950/10 text-amber-950",
          textClass: "text-amber-950",
        };
      case "#f97316":
        return {
          cardClass: "bg-orange-500 hover:bg-orange-600 text-white",
          iconClass: "bg-white/20 text-white",
          textClass: "text-white",
        };
      case "#ef4444":
        return {
          cardClass: "bg-red-500 hover:bg-red-600 text-white",
          iconClass: "bg-white/20 text-white",
          textClass: "text-white",
        };
      case "#f43f5e":
        return {
          cardClass: "bg-rose-500 hover:bg-rose-600 text-white",
          iconClass: "bg-white/20 text-white",
          textClass: "text-white",
        };
      case "#ec4899":
        return {
          cardClass: "bg-pink-100 border-2 border-pink-300 text-pink-700 hover:bg-pink-200",
          iconClass: "bg-pink-700/10 text-pink-700",
          textClass: "text-pink-700",
        };
      case "#a855f7":
        return {
          cardClass: "bg-purple-500 hover:bg-purple-600 text-white",
          iconClass: "bg-white/20 text-white",
          textClass: "text-white",
        };
      case "#8b5cf6":
        return {
          cardClass: "bg-violet-500 hover:bg-violet-600 text-white",
          iconClass: "bg-white/20 text-white",
          textClass: "text-white",
        };
      case "#14b8a6":
        return {
          cardClass: "bg-teal-400 hover:bg-teal-500 text-teal-950",
          iconClass: "bg-teal-950/10 text-teal-950",
          textClass: "text-teal-950",
        };
      case "#64748b":
        return {
          cardClass: "bg-slate-700 hover:bg-slate-800 text-white",
          iconClass: "bg-white/20 text-white",
          textClass: "text-white",
        };
      case "#0f172a":
        return {
          cardClass: "bg-slate-800 hover:bg-slate-900 text-slate-100",
          iconClass: "bg-white/10 text-slate-100",
          textClass: "text-slate-100",
        };
      case "#78716c":
        return {
          cardClass: "bg-stone-700 hover:bg-stone-800 text-white",
          iconClass: "bg-white/20 text-white",
          textClass: "text-white",
        };
      default:
        return {
          cardClass: "bg-indigo-500 hover:bg-indigo-600 text-white",
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
        className={`w-full lg:w-120 shrink-0 border-b lg:border-b-0 lg:border-r border-base-200 flex flex-col justify-between p-4 bg-base-100 h-auto lg:h-full min-h-0 mb-10 md:mb-0 overflow-y-auto select-none pb-0 lg:pb-6 ${activeTab !== "home" ? "hidden lg:flex" : "flex"
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
            {portalsToDisplay.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 mt-3">
                {portalsToDisplay.slice(0, 10).map((portal) => {
                  const theme = getEmojiCardStyle(portal.color);

                  return (
                    <motion.div
                      key={portal.slug}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className={`rounded-full overflow-hidden border-0 flex flex-row items-center gap-3 p-2 pr-5 ${theme.cardClass} card-hover cursor-pointer shadow-sm transition-all duration-200 w-full font-inter hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5`}
                      onClick={() => {
                        setActivePortalCategory(portal.slug);
                        setActiveOverlay("portal");
                      }}
                    >
                      {renderPortalIcon(portal.iconName, portal.color, theme.iconClass)}
                      <span className={`text-sm font-bold ${theme.textClass} leading-tight truncate pointer-events-none`}>
                        {portal.name}
                      </span>
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
