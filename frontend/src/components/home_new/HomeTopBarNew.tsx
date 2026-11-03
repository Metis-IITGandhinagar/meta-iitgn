"use client";

import React from "react";
import Link from "next/link";
import {
  Menu,
  Home,
  Search,
  Bookmark,
  User,
  Sun,
  Moon,
  Bell,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCommonStore } from "@/store/useCommonStore";
import { DARK_THEMES } from "@/lib/constants";

interface HomeTopBarNewProps {
  activeTab: "home" | "search" | "bookmarks" | "profile";
  setActiveTab: (tab: "home" | "search" | "bookmarks" | "profile") => void;
  onToggleSidebar: () => void;
  onOpenNews?: () => void;
  onSearchFocus?: () => void;
}

export default function HomeTopBarNew({
  activeTab = "home",
  setActiveTab,
  onToggleSidebar,
  onOpenNews,
  onSearchFocus,
}: HomeTopBarNewProps) {
  const { user,setSettingsTab } = useAuth();
  const { theme, setTheme } = useCommonStore();

  const isDarkMode = DARK_THEMES.includes(theme);

  const handleToggleTheme = () => {
    setTheme(isDarkMode ? "light" : "dark");
  };

  return (
    <>
      {/* 1. Mobile Top Bar (< lg screens only) */}
      <div className="lg:hidden sticky top-0 z-30 w-full bg-base-100/90 backdrop-blur-md border-b border-base-200 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSidebar}
            className="btn btn-ghost btn-sm btn-square text-base-content/80"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link
            href="/"
            onClick={() => setActiveTab("home")}
            className="font-serif text-lg font-black text-primary tracking-tight flex gap-2 items-center"
          >
            <span className="font-serif text-2xl font-extrabold tracking-tight text-blue-400">
              META
            </span>
            <span className="text-xs font-sans font-bold uppercase tracking-wider text-base-content/70">
              IITGN
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenNews}
            className="btn btn-ghost btn-sm btn-circle text-base-content/70 relative"
            aria-label="Campus News"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          </button>
        </div>
      </div>

      {/* 2. Desktop Floating Pill Navigation Bar (Clean & Non-Intrusive) */}
      <div className="hidden lg:flex sticky top-3 z-30 mx-auto w-fit items-center gap-1 p-1 rounded-full bg-base-100/80 backdrop-blur-xl border border-base-300/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] select-none">
        <button
          onClick={() => setActiveTab("home")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
            activeTab === "home"
              ? "bg-primary text-white shadow-xs"
              : "text-base-content/70 hover:text-base-content hover:bg-base-200/60"
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("search");
            onSearchFocus?.();
          }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
            activeTab === "search"
              ? "bg-primary text-white shadow-xs"
              : "text-base-content/70 hover:text-base-content hover:bg-base-200/60"
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search</span>
        </button>

        <button
          onClick={() => setActiveTab("bookmarks")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
            activeTab === "bookmarks"
              ? "bg-primary text-white shadow-xs"
              : "text-base-content/70 hover:text-base-content hover:bg-base-200/60"
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Bookmarks</span>
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
            activeTab === "profile"
              ? "bg-primary text-white shadow-xs"
              : "text-base-content/70 hover:text-base-content hover:bg-base-200/60"
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>{user?.name ? user.name.split(" ")[0] : "Profile"}</span>
        </button>
      </div>
    </>
  );
}
