"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useHomeStore } from "@/store/useHomeStore";
import Link from "next/link";
import { BeautifulSearchBox } from "@/components/SearchDesign";
import {
  Menu,
  ChevronDown,
  Sparkles,
  Award,
  Users2,
  ChevronLeft,
  MoreVertical,
  Share2,
  Bookmark,
  User,
  Settings,
  LogOut,
  Printer,
  AlertTriangle,
} from "lucide-react";
import Avatar from "@/components/Avatar";
import ShareModal from "@/components/ShareModal";
import { apiService } from "@/api";
import { db } from "@/lib/db";

interface NavbarProps {
  onToggleSidebar?: () => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  hideSearch?: boolean;
  currentTier?: string;
  onChangeTier?: (tier: string) => void;
}

const TIERS = {
  bronze: {
    name: "Bronze Editor",
    edits: "5 edits",
    xp: "250 XP",
    rank: "#4,102",
    percent: 30,
    badgeBg: "bg-amber-100 text-amber-800 border-amber-200",
    progressBar: "bg-gradient-to-r from-amber-400 to-amber-500",
    avatarBorder: "border-amber-400",
    benefits: ["Basic Editing", "Add Comments"],
    nextTier: "Silver",
    iconComponent: Award,
    activeButton: "bg-amber-50 text-amber-800 border-amber-200 shadow-xs",
  },
  silver: {
    name: "Silver Contributor",
    edits: "28 edits",
    xp: "1,450 XP",
    rank: "#1,840",
    percent: 65,
    badgeBg: "bg-slate-100 text-slate-800 border-slate-200",
    progressBar: "bg-gradient-to-r from-slate-400 to-slate-500",
    avatarBorder: "border-slate-400",
    benefits: ["Create Pages", "Upload Images", "Markdown Editor"],
    nextTier: "Gold",
    iconComponent: Users2,
    activeButton: "bg-slate-50 text-slate-800 border-slate-200 shadow-xs",
  },
  gold: {
    name: "Gold Admin",
    edits: "156 edits",
    xp: "8,920 XP",
    rank: "#234",
    percent: 90,
    badgeBg: "bg-yellow-100 text-yellow-800 border-yellow-200",
    progressBar: "bg-gradient-to-r from-yellow-400 to-amber-500",
    avatarBorder: "border-yellow-400",
    benefits: ["Approve Edits", "Lock Pages", "Rollback Tool", "Custom Badges"],
    nextTier: null,
    iconComponent: Sparkles,
    activeButton: "bg-yellow-50 text-yellow-800 border-yellow-200 shadow-xs",
  },
};

export default function Navbar({
  onToggleSidebar,
  searchQuery: externalQuery,
  setSearchQuery: setExternalQuery,
  hideSearch = false,
}: NavbarProps) {
  const router = useRouter();
  const { user, activeTier, setSettingsTab } = useAuth();
  const addBookmark = useHomeStore((s) => s.addBookmark);
  const removeBookmark = useHomeStore((s) => s.removeBookmark);
  const bookmarks = useHomeStore((s) => s.bookmarks);
  const pathname = usePathname();
  const segments = pathname?.split("/").filter(Boolean) ?? [];
  const isWiki = ((segments[0] === "wiki" || segments[0] === "blog") && segments.length >= 2) || segments[0] === "search-results";
  const isWikiArticlePage = (segments[0] === "wiki" || segments[0] === "blog") && segments.length >= 3;

  const [searchQuery, setSearchQuery] = useState(externalQuery || "");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareData, setShareData] = useState({ url: "", title: "" });
  const [stats, setStats] = useState<any>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const activeTierData = TIERS[activeTier];

  useEffect(() => {
    if (externalQuery !== undefined) {
      setSearchQuery(externalQuery);
    }
  }, [externalQuery]);

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

  // Track whether the currently-open article is already bookmarked so the kebab
  // menu can show the correct action ("Bookmark" vs "Remove Bookmark") and a
  // filled visual cue. Dexie is the source of truth; `bookmarks` from the store
  // is a dependency so this re-syncs immediately after an add/remove.
  useEffect(() => {
    if (!isWikiArticlePage) {
      setIsBookmarked(false);
      return;
    }
    const slug = (pathname || "").replace(/\/$/, "").split("/").pop() || "";
    if (!slug) {
      setIsBookmarked(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const items = await db.bookmarks.toArray();
        if (!cancelled) {
          setIsBookmarked(items.some((b) => b.slug === slug));
        }
      } catch (err) {
        console.error("Failed to check bookmark status:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, isWikiArticlePage, bookmarks]);

  // Load the signed-in user's real contribution stats when the dropdown opens.
  useEffect(() => {
    if (!dropdownOpen || !user?.user_id || stats) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await apiService.getUserStats(user.user_id);
        if (!cancelled && res?.success) {
          setStats(res.data);
        }
      } catch (err) {
        console.error("Failed to load user stats for navbar dropdown:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dropdownOpen, user?.user_id, stats]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      return;
    }
    if (setExternalQuery) {
      setExternalQuery(q);
    }
    router.push(`/search-results?query=${encodeURIComponent(q)}`);
  };

  return (
    <header
      className={`h-16 shrink-0 sticky top-0 z-40 select-none w-full bg-base-100 border-b border-base-200 shadow-xs transition-all duration-200`}
    >
      {/* Actual Nav Content */}
      <div className="max-w-7xl mx-auto w-full h-full flex items-center justify-between px-4 lg:px-8">
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
              className="btn btn-ghost btn-circle p-2 text-base-content hover:bg-base-200/50 transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-center"
              aria-label="Go Back"
            >
              <ChevronLeft className="h-6 w-6 text-base-content" />
            </button>
          ) : (
            <button
              onClick={onToggleSidebar}
              className="btn btn-square btn-ghost btn-sm bg-base-200 border border-base-300 text-base-content hover:bg-base-300 transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-center shadow-xs"
              aria-label="Toggle Sidebar"
            >
              <Menu className="h-5 w-5 text-base-content" />
            </button>
          )}

          <Link
            href="/"
            className="flex items-center gap-2 select-none cursor-pointer group ml-1"
          >
            <div className="block">
              <span className="font-serif text-2xl font-extrabold tracking-tight text-primary group-hover:text-primary/80 transition-colors duration-200">
                META
              </span>
              <span className="ml-1 text-sm font-semibold text-base-content uppercase tracking-wider group-hover:opacity-80 transition-opacity duration-200">
                IITGN
              </span>
            </div>
          </Link>
        </div>

        {/* Middle: Embedded Search input */}
        {!hideSearch && (
          <div className="hidden md:block flex-1 max-w-lg mx-8">
            <BeautifulSearchBox
              value={searchQuery}
              onChange={setSearchQuery}
              onSubmit={handleSearchSubmit}
              placeholder="Search IITGN Wiki..."
              variant="compact"
            />
          </div>
        )}

        {/* Right side: User avatar & dropdown & Kebab Actions */}
        <div className="flex items-center gap-2">
          {!user ? (
            <Link
              href="/login"
              className="btn btn-primary btn-sm rounded-full text-primary-content font-semibold shadow-md cursor-pointer transition-all duration-200"
            >
              Sign In
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSettingsTab?.("appearance")}
                className="btn btn-ghost btn-circle btn-sm text-base-content hover:bg-base-200/50 transition-colors duration-200 cursor-pointer active:scale-95"
                title="Open Settings"
                aria-label="Open Settings"
              >
                <Settings className="w-5 h-5 text-base-content/80" />
              </button>

              <div className="relative" ref={dropdownRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDropdownOpen(!dropdownOpen);
                }}
                className="flex items-center gap-2 py-1.5 px-3 rounded-full transition-all duration-200 cursor-pointer active:scale-97"
              >
                <Avatar
                  email={user.email}
                  name={user.name}
                  className="w-7 h-7 rounded-full shadow-inner object-cover"
                />
                <span
                  className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full hidden md:inline-block transition-colors duration-300 ${activeTierData.badgeBg}`}
                >
                  {user.role}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-base-content/60 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div
                  className={`absolute ${isWiki ? "-right-10" : "right-0"} top-12 mt-2 w-80 sm:w-88 card card-bordered bg-base-100 shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200`}
                >
                  {/* Header info */}
                  <div className="flex items-center gap-3 pb-3 border-b border-base-200">
                    <Avatar
                      email={user.email}
                      name={user.name}
                      className={`w-14 h-14 rounded-2xl border-2 transition-colors duration-300 ${activeTierData.avatarBorder} shadow-sm shrink-0 object-cover`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-bold text-base-content truncate">
                          {user.name}
                        </h3>
                        <span
                          className={`text-[9px] font-black tracking-wider px-2.5 py-0.5 rounded-full shrink-0 uppercase transition-colors duration-300 ${activeTierData.badgeBg}`}
                        >
                          {user.role}
                        </span>
                      </div>
                      <p className="text-xs text-base-content/60 truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>
                  </div>

                {/* Stats — real contribution data from the user stats API */}
                <div className="bg-base-200 border border-base-300 rounded-2xl p-3.5 mt-3.5">
                  <div className="grid grid-cols-3 text-center">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-base-content/60 tracking-wider uppercase">
                        Points
                      </span>
                      <span className="text-[13px] font-extrabold text-base-content mt-1 transition-all duration-300">
                        {stats?.points ?? user.points}
                      </span>
                    </div>
                    <div className="flex flex-col border-l border-base-300">
                      <span className="text-[10px] font-bold text-base-content/60 tracking-wider uppercase">
                        Edits
                      </span>
                      <span className="text-[13px] font-extrabold text-base-content mt-1 transition-all duration-300">
                        {stats ? stats.editsThisMonth : "—"}
                      </span>
                    </div>
                    <div className="flex flex-col border-l border-base-300">
                      <span className="text-[10px] font-bold text-base-content/60 tracking-wider uppercase">
                        Streak
                      </span>
                      <span className="text-[13px] font-extrabold text-base-content mt-1 transition-all duration-300">
                        {stats ? `${stats.streak}d` : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="border-t border-base-200 mt-4 pt-2.5 grid grid-cols-2 text-center">
                  <Link
                    href="/user/profile"
                    className="flex flex-col items-center gap-1 py-1 text-base-content/80 hover:text-primary hover:bg-base-200 rounded-xl transition-colors duration-150"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User className="h-5 w-5 text-base-content/50" />
                    <span className="text-[11px] font-bold">Profile</span>
                  </Link>
                  <Link
                    href="/logout"
                    onClick={() => setDropdownOpen(false)}
                    className="flex flex-col items-center gap-1 py-1 text-base-content/75 hover:text-rose-600 hover:bg-rose-50/50 rounded-xl transition-colors duration-150 w-full"
                  >
                    <LogOut className="h-5 w-5 text-base-content/50" />
                    <span className="text-[11px] font-bold text-red-400">
                      Sign Out
                    </span>
                  </Link>
                </div>
              </div>
            )}
            </div>
          </div>
          )}
          {/* Kebab More Menu (Wiki Page Only) */}
          {isWikiArticlePage && (
            <div className="relative flex items-center" ref={moreMenuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMoreMenuOpen(!moreMenuOpen);
                }}
                className="btn btn-circle btn-ghost btn-sm bg-base-200 hover:bg-base-300 border border-base-300 text-base-content hover:text-base-content/85 cursor-pointer flex items-center justify-center shadow-xs"
                aria-label="More Actions"
              >
                <MoreVertical className="h-5 w-5 text-base-content" />
              </button>
              {moreMenuOpen && (
                <div className="absolute -right-2 md:right-0 top-10 mt-1 w-52 max-h-[calc(100vh-80px)] overflow-y-auto card card-bordered bg-base-100 shadow-[0_0_25px_rgba(0,0,0,0.15)] py-1 z-[100] select-none animate-in fade-in duration-200 rounded-xl no-scrollbar">
                  <button
                    onClick={() => {
                      const cleanPath = pathname.replace(/\/$/, "");
                      const title = (document.title || cleanPath.split("/").pop() || "Wiki Page")
                        .replace(" - META IITGN", "")
                        .trim();
                      setShareData({
                        url: `${window.location.origin}${cleanPath}`,
                        title,
                      });
                      setShareOpen(true);
                      setMoreMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs text-base-content hover:text-base-content/85 hover:bg-base-200 font-semibold transition-colors flex items-center gap-3 whitespace-nowrap truncate cursor-pointer rounded-none animate-none"
                  >
                    <Share2 className="h-4.5 w-4.5 text-slate-500 shrink-0" />
                    <span>Share Page</span>
                  </button>
                  <button
                    onClick={async () => {
                      setMoreMenuOpen(false);

                      const cleanPath = pathname.replace(/\/$/, "");
                      const title = document.title || cleanPath.split("/").pop() || "Wiki Page";
                      const bookmarkSlug = cleanPath.split("/").pop() || "";
                      const category = cleanPath.split("/")[2] || "general";
                      const titleClean = title.replace(" - META IITGN", "").trim();

                      if (isBookmarked) {
                        // Optimistically flip the cue; remove in the background.
                        setIsBookmarked(false);
                        try {
                          const items = await db.bookmarks.toArray();
                          const match = items.find((b) => b.slug === bookmarkSlug);
                          if (match) {
                            await removeBookmark(match.id);
                          }
                        } catch (err) {
                          console.error("Failed to remove bookmark:", err);
                          setIsBookmarked(true); // revert on failure
                        }
                      } else {
                        // Optimistically flip the cue; add in the background.
                        setIsBookmarked(true);
                        const res = await addBookmark({
                          slug: bookmarkSlug,
                          title: titleClean,
                          category,
                          user,
                        });
                        if (!res.ok && !res.already) {
                          console.error("Failed to add bookmark:", res.error);
                          setIsBookmarked(false); // revert on failure
                        }
                      }
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs text-base-content hover:text-base-content/85 hover:bg-base-200 font-semibold transition-colors flex items-center gap-3 whitespace-nowrap truncate cursor-pointer rounded-none"
                  >
                    <Bookmark
                      className={`h-4.5 w-4.5 shrink-0 ${
                        isBookmarked ? "text-primary fill-primary" : "text-slate-500"
                      }`}
                    />
                    <span>{isBookmarked ? "Remove Bookmark" : "Bookmark Page"}</span>
                  </button>
                  <button
                    onClick={() => {
                      window.print();
                      setMoreMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs text-base-content hover:text-base-content/85 hover:bg-base-200 font-semibold transition-colors flex items-center gap-3 whitespace-nowrap truncate cursor-pointer rounded-none"
                  >
                    <Printer className="h-4.5 w-4.5 text-slate-500 shrink-0" />
                    <span>Print Article</span>
                  </button>
                  <button
                    onClick={() => {
                      setSettingsTab("layout");
                      setMoreMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs text-base-content hover:text-base-content/85 hover:bg-base-200 font-semibold transition-colors flex items-center gap-3 whitespace-nowrap truncate cursor-pointer rounded-none"
                  >
                    <Settings className="h-4.5 w-4.5 text-slate-500 shrink-0" />
                    <span>Page Settings</span>
                  </button>
                  <div className="border-t border-base-200 my-1" />
                  <button
                    onClick={() => {
                      alert("Report page submitted.");
                      setMoreMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs text-base-content hover:text-base-content/85 hover:bg-base-200 font-semibold transition-colors flex items-center gap-3 whitespace-nowrap truncate cursor-pointer rounded-none"
                  >
                    <AlertTriangle className="h-4.5 w-4.5 text-slate-500 shrink-0" />
                    <span>Report Content</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        url={shareData.url}
        title={shareData.title}
      />
    </header>
  );
}
