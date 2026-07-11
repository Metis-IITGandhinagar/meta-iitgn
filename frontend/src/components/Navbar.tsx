"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Menu,
  Search,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Sparkles,
  ArrowLeft,
  MoreVertical,
  Share2,
  Download,
  History,
  Trash2,
  Printer,
  Moon,
  AlertTriangle,
  Bookmark,
} from "lucide-react";
import { TIERS } from "@/lib/constants";

interface NavbarProps {
  onToggleSidebar: () => void;
  currentTier?: string;
  onChangeTier?: (tier: string) => void;
}

export default function Navbar({
  onToggleSidebar,
  currentTier,
  onChangeTier,
}: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [localTier, setLocalTier] = useState("gold");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const segments = pathname?.split("/").filter(Boolean) ?? [];
  const isWiki = segments[0] === "wiki" && segments.length >= 3;

  const activeTier = currentTier || localTier;
  const setActiveTier = onChangeTier || setLocalTier;

  const activeTierData = TIERS[activeTier as keyof typeof TIERS] || TIERS.gold;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(event.target as Node)
      ) {
        setMoreMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/wiki/page/1?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/wiki/page/1");
    }
  };

  return (
    <header className="h-16 flex items-center justify-between px-4 lg:px-6 shrink-0 bg-white sticky top-0 z-40 select-none shadow-sm border-b border-gray-150/30">
      {/* Left side: Hamburger and Logo */}
      <div className="flex items-center gap-2">
        {isWiki ? (
          <button
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push("/");
              }
            }}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors duration-200 cursor-pointer active:scale-95 flex items-center justify-center"
            aria-label="Go Back"
          >
            <ArrowLeft className="h-6 w-6 text-black" />
          </button>
        ) : (
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors duration-200 cursor-pointer active:scale-95"
            aria-label="Toggle Sidebar"
          >
            <Menu className="h-6 w-6 text-black" />
          </button>
        )}

        <Link
          href="/"
          className="flex items-center gap-2 select-none cursor-pointer group"
        >
          <div className="block">
            <span className="font-serif text-2xl font-extrabold tracking-tight text-blue-500">
              META
            </span>
            <span className="ml-1 text-sm font-semibold uppercase tracking-wider text-gray-500">
              IITGN
            </span>
          </div>
        </Link>
      </div>

      {/* Middle: Search input */}
      <form
        onSubmit={handleSearchSubmit}
        className="hidden md:flex flex-1 max-w-lg mx-8 relative items-center"
      >
        <div className="relative w-full flex items-center h-10 bg-gray-50 border border-gray-200 hover:border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100/50 rounded-full px-4 transition-all duration-200 shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.03)]">
          <input
            type="text"
            placeholder="Search IITGN Wiki..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm text-gray-800 placeholder:text-gray-400 bg-transparent focus:outline-none pr-8 h-full"
          />
          <button
            type="submit"
            className="absolute right-4 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
            aria-label="Submit search"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </form>

      {/* Right side: User avatar & dropdown & Kebab Actions */}
      <div className="flex items-center gap-2">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDropdownOpen(!dropdownOpen);
            }}
            className="flex items-center gap-2 hover:bg-gray-50 border border-gray-150 hover:border-gray-250 py-1.5 px-3 rounded-full shadow-sm transition-all duration-200 cursor-pointer active:scale-97"
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-inner transition-colors duration-300 ${activeTierData.progressBar}`}
            >
              AC
            </div>
            <span className="text-sm font-semibold text-gray-700 hidden sm:inline">
              Alex Carter
            </span>
            <span
              className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full hidden md:inline-block transition-colors duration-300 ${activeTierData.badgeBg}`}
            >
              {activeTier}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute -right-10 top-12 mt-2 w-80 sm:w-88 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Header info */}
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg text-slate-800 bg-white border-2 transition-colors duration-300 ${activeTierData.avatarBorder} shadow-sm shrink-0`}
                >
                  AC
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-900 truncate">
                      Alex Carter
                    </h3>
                    <span
                      className={`text-[9px] font-black tracking-wider px-2.5 py-0.5 rounded-full shrink-0 uppercase transition-colors duration-300 ${activeTierData.badgeBg}`}
                    >
                      {activeTier}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    alex.carter@iitgn.ac.in
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-slate-50/70 border border-slate-100/50 rounded-2xl p-3.5 mt-3.5">
                <div className="grid grid-cols-3 text-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                      XP Progress
                    </span>
                    <span className="text-[13px] font-extrabold text-slate-800 mt-1 transition-all duration-300">
                      {activeTierData.xp}
                    </span>
                  </div>
                  <div className="flex flex-col border-l border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                      Edits
                    </span>
                    <span className="text-[13px] font-extrabold text-slate-800 mt-1 transition-all duration-300">
                      {activeTierData.edits}
                    </span>
                  </div>
                  <div className="flex flex-col border-l border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                      Rank
                    </span>
                    <span className="text-[13px] font-extrabold text-slate-800 mt-1 transition-all duration-300">
                      {activeTierData.rank}
                    </span>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full mt-3.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${activeTierData.progressBar}`}
                    style={{ width: `${activeTierData.percent}%` }}
                  />
                </div>
              </div>

              {/* Perks */}
              <div className="mt-3 p-3 bg-blue-50/50 rounded-2xl border border-blue-100/30 text-[11px] leading-relaxed">
                <div className="flex items-center gap-1.5 text-blue-850 font-bold mb-0.5">
                  <Sparkles className="h-3.5 w-3.5 text-blue-500 shrink-0 animate-pulse" />
                  <span className="text-black">Contribution Value</span>
                </div>
                <p className="text-slate-600 font-medium">
                  Current Perks:{" "}
                  <span className="font-semibold text-slate-800">
                    {activeTierData.benefits.join(", ")}
                  </span>
                </p>
                {activeTierData.nextTier && (
                  <p className="text-blue-700 font-semibold mt-1">
                    💡 Contribute more to unlock{" "}
                    <span className="underline">
                      {activeTierData.nextTier} Perks
                    </span>
                  </p>
                )}
              </div>

              {/* Simulator Tier Switcher */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <h4 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-2">
                  Simulator Tier Switcher
                </h4>
                <div className="grid grid-cols-3 gap-1.5">
                  {Object.keys(TIERS).map((tierKey) => {
                    const t = TIERS[tierKey as keyof typeof TIERS];
                    const isSelected = activeTier === tierKey;
                    const IconComp = t.iconComponent;
                    return (
                      <button
                        key={tierKey}
                        onClick={() => setActiveTier(tierKey)}
                        className={`flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-bold rounded-lg border transition-all duration-150 select-none cursor-pointer hover:scale-102 active:scale-98 ${
                          isSelected
                            ? t.activeButton
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-350 hover:bg-slate-50"
                        }`}
                      >
                        <IconComp className="h-3.5 w-3.5" />
                        <span className="truncate">{t.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="border-t border-slate-100 mt-4 pt-2.5 grid grid-cols-3 text-center">
                <Link
                  href="/user/profile"
                  className="flex flex-col items-center gap-1 py-1 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-colors duration-150"
                  onClick={() => setDropdownOpen(false)}
                >
                  <User className="h-5 w-5 text-slate-400" />
                  <span className="text-[11px] font-bold">Profile</span>
                </Link>
                <Link
                  href="/user/settings"
                  className="flex flex-col items-center gap-1 py-1 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-colors duration-150"
                  onClick={() => setDropdownOpen(false)}
                >
                  <Settings className="h-5 w-5 text-slate-400" />
                  <span className="text-[11px] font-bold">Settings</span>
                </Link>
                <Link
                  href="/user/signout"
                  className="flex flex-col items-center gap-1 py-1 text-slate-450 hover:text-rose-600 hover:bg-rose-50/50 rounded-xl transition-colors duration-150"
                  onClick={() => setDropdownOpen(false)}
                >
                  <LogOut className="h-5 w-5 text-slate-400" />
                  <span className="text-[11px] font-bold text-red-400">
                    Sign Out
                  </span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Kebab More Menu (Wiki Page Only) */}
        {isWiki && (
          <div className="relative flex items-center" ref={moreMenuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMoreMenuOpen(!moreMenuOpen);
              }}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-650 hover:text-slate-900 transition-colors cursor-pointer flex items-center justify-center"
              aria-label="More Actions"
            >
              <MoreVertical className="h-5.5 w-5.5 text-slate-700" />
            </button>
            {moreMenuOpen && (
              <div className="absolute right-0 top-12 mt-2 w-52 bg-white border border-slate-200 shadow-xl py-1 z-50 select-none animate-in fade-in duration-200">
                <button
                  onClick={() => {
                    alert("Sharing link copied!");
                    setMoreMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-800 hover:text-slate-950 hover:bg-slate-100 font-semibold transition-colors flex items-center gap-3 whitespace-nowrap truncate cursor-pointer rounded-none"
                >
                  <Share2 className="h-4.5 w-4.5 text-slate-500 shrink-0" />
                  <span>Share Page</span>
                </button>
                <button
                  onClick={() => {
                    alert("Page bookmarked successfully!");
                    setMoreMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-800 hover:text-slate-950 hover:bg-slate-100 font-semibold transition-colors flex items-center gap-3 whitespace-nowrap truncate cursor-pointer rounded-none"
                >
                  <Bookmark className="h-4.5 w-4.5 text-slate-500 shrink-0" />
                  <span>Bookmark Page</span>
                </button>
                <button
                  onClick={() => {
                    alert("Exporting to PDF...");
                    setMoreMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-800 hover:text-slate-950 hover:bg-slate-100 font-semibold transition-colors flex items-center gap-3 whitespace-nowrap truncate cursor-pointer rounded-none"
                >
                  <Download className="h-4.5 w-4.5 text-slate-500 shrink-0" />
                  <span>Export PDF</span>
                </button>
                <button
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent("show-wiki-revisions")
                    );
                    setMoreMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-800 hover:text-slate-950 hover:bg-slate-100 font-semibold transition-colors flex items-center gap-3 whitespace-nowrap truncate cursor-pointer rounded-none"
                >
                  <History className="h-4.5 w-4.5 text-slate-500 shrink-0" />
                  <span>Earlier Versions</span>
                </button>
                <button
                  onClick={() => {
                    window.print();
                    setMoreMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-800 hover:text-slate-950 hover:bg-slate-100 font-semibold transition-colors flex items-center gap-3 whitespace-nowrap truncate cursor-pointer rounded-none"
                >
                  <Printer className="h-4.5 w-4.5 text-slate-500 shrink-0" />
                  <span>Print Article</span>
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={() => {
                    alert("Toggling dark mode...");
                    setMoreMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-800 hover:text-slate-950 hover:bg-slate-100 font-semibold transition-colors flex items-center gap-3 whitespace-nowrap truncate cursor-pointer rounded-none"
                >
                  <Moon className="h-4.5 w-4.5 text-slate-500 shrink-0" />
                  <span>Dark Mode</span>
                </button>
                <button
                  onClick={() => {
                    alert("Loading settings...");
                    setMoreMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-800 hover:text-slate-950 hover:bg-slate-100 font-semibold transition-colors flex items-center gap-3 whitespace-nowrap truncate cursor-pointer rounded-none"
                >
                  <Settings className="h-4.5 w-4.5 text-slate-500 shrink-0" />
                  <span>Page Settings</span>
                </button>
                <button
                  onClick={() => {
                    alert("Report page submitted.");
                    setMoreMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-800 hover:text-slate-950 hover:bg-slate-100 font-semibold transition-colors flex items-center gap-3 whitespace-nowrap truncate cursor-pointer rounded-none"
                >
                  <AlertTriangle className="h-4.5 w-4.5 text-slate-500 shrink-0" />
                  <span>Report Content</span>
                </button>
                <div className="border-t border-slate-100 my-1" />
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
