"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { apiService } from "@/api";
import { useAuth } from "@/hooks/useAuth";
import { useHomeStore } from "@/store/useHomeStore";
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
  Building2,
  Calendar,
  Shield,
  TrendingUp,
  LucideIcon,
  Settings,
  GraduationCap,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { BeautifulSearchBox } from "@/components/SearchDesign";

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

const PORTAL_ICON_MAP: Record<string, LucideIcon> = {
  Building2,
  Users2,
  BookOpen,
  Trophy,
  Tent,
  MapPin,
  FlaskConical,
  Sparkles,
  Calendar,
  Shield,
  TrendingUp,
  GraduationCap,
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
  spawnHearts,
}: LeftPanelProps) {
  const { categories, activeTier: globalActiveTier, setSettingsTab, auth } = useAuth();
  const { setActiveOverlay, setActivePortalCategory } = useHomeStore();
  const isGold = globalActiveTier === "gold";
  const isLoggedIn = auth === true;
  const [pageCount, setPageCount] = useState<number | null>(null);

  const portalsToDisplay = useMemo(() => {
    const pinned = categories.filter((c) => c.is_pinned);
    const colors = [
      { bg: "bg-rose-50 text-rose-500", icon: "text-rose-500", textBg: "hover:bg-rose-50/50" },
      { bg: "bg-amber-50 text-amber-600", icon: "text-amber-600", textBg: "hover:bg-amber-50/50" },
      { bg: "bg-emerald-50 text-emerald-600", icon: "text-emerald-600", textBg: "hover:bg-emerald-50/50" },
      { bg: "bg-indigo-50 text-indigo-600", icon: "text-indigo-600", textBg: "hover:bg-indigo-50/50" },
      { bg: "bg-sky-50 text-sky-500", icon: "text-sky-500", textBg: "hover:bg-sky-50/50" },
      { bg: "bg-secondary/10 text-secondary", icon: "text-purple-500", textBg: "hover:bg-purple-50/50" },
    ];

    return pinned.map((c, idx) => ({
      name: c.name,
      slug: c.slug,
      path: `/wiki/${c.slug}`,
      iconName: c.icon || "BookOpen",
      colorTheme: colors[idx % colors.length],
    }));
  }, [categories]);

  useEffect(() => {
    async function loadStats() {
      try {
        const stats = await apiService.getPageStats();
        if (stats && typeof stats.totalPages === "number") {
          setPageCount(stats.totalPages);
          localStorage.setItem("wiki-total-pages-count", JSON.stringify(pageCount));
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
        className={`w-full lg:w-120 shrink-0 border-b lg:border-b-0 lg:border-r border-base-200 flex flex-col justify-between p-4 bg-base-100  h-auto lg:h-full mb-10 md:mb-0 overflow-y-visible lg:overflow-hidden select-none pb-0 lg:pb-6 ${activeTab !== "home" ? "hidden lg:flex" : "flex"
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
              <div className="w-12" /> {/* Left balance spacer */}
              <h2 className="text-xl font-serif font-bold text-base-content tracking-tight">
                Quick Portals
              </h2>
              {isLoggedIn ? (
                <Link
                  href="/wiki/categories"
                  className="text-[10px] font-extrabold text-primary hover:text-blue-700 hover:underline tracking-wider uppercase shrink-0"
                >
                  All
                </Link>
              ) : (
                <div className="w-12" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {portalsToDisplay.slice(0, 10).map((portal) => (
                <button
                  key={portal.name}
                  type="button"
                  onClick={() => {
                    setActivePortalCategory(portal.slug);
                    setActiveOverlay("portal");
                  }}
                  className={`card card-compact card-bordered flex flex-row items-center gap-2 p-3 border-base-200 bg-base-100 shadow-xs hover:scale-105 transition-all duration-100 ease-in-out cursor-pointer group text-left w-full`}
                >
                  {renderPortalIcon(portal.iconName, portal.colorTheme)}
                  <span className="text-xs font-semibold text-base-content group-hover:text-primary transition-colors duration-200">
                    {portal.name}
                  </span>
                </button>
              ))}
            </div>
            {portalsToDisplay.length === 0 && (
              <div className="text-center py-6 border border-dashed border-base-300 rounded-xl bg-base-200/50">
                <p className="text-xs text-base-content/50 font-semibold mb-2">No Quick Portals pinned</p>
                <Link
                  href="/wiki/categories"
                  className="inline-flex text-[10px] font-extrabold text-primary hover:text-blue-700 uppercase tracking-wider hover:underline"
                >
                  Pin Portals
                </Link>
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
