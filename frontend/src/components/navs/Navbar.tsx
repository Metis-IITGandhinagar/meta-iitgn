"use client";

import { toast } from "react-hot-toast";
import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useHomeStore } from "@/store/useHomeStore";
import { useCommonStore } from "@/store/useCommonStore";
import Link from "next/link";
import {
  ChevronLeft,
  Menu,
  X,
  Search,
  History,
  MoreVertical,
  Share2,
  Bookmark,
  User,
  Settings,
  LogOut,
  Printer,
  AlertTriangle,
} from "lucide-react";
import { InstituteLogo } from "@/components/helpers/InstituteLogo";
import { ThemeToggle } from "@/components/helpers/ThemeToggle";
import { Portal } from "@/components/helpers/Portal";
import { Spotlight } from "@/components/helpers/Spotlight";
import { SECTIONS, sectionForPath } from "@/lib/sections";
import { BrandMark } from "@/components/helpers/BrandMark";
import Avatar from "@/components/helpers/Avatar";
import ShareModal from "@/components/overlays/ShareModal";
import { db } from "@/lib/db";

interface NavbarProps {
  onToggleSidebar?: () => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  hideSearch?: boolean;
  currentTier?: string;
  onChangeTier?: (tier: string) => void;
  /** "overlay" floats transparently over a hero photo with white text. */
  variant?: "default" | "overlay";
}

export default function Navbar({
  hideSearch = false,
  variant = "default",
}: NavbarProps) {
  const ov = variant === "overlay";
  const { user, setSettingsTab } = useAuth();
  const addBookmark = useHomeStore((s) => s.addBookmark);
  const removeBookmark = useHomeStore((s) => s.removeBookmark);
  const bookmarks = useHomeStore((s) => s.bookmarks);
  const pathname = usePathname();
  const router = useRouter();
  const segments = pathname?.split("/").filter(Boolean) ?? [];
  const isWikiArticlePage = (segments[0] === "wiki" || segments[0] === "blog") && segments.length >= 3;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareData, setShareData] = useState({ url: "", title: "" });
  const userStats = useCommonStore((s) => s.userStats);
  const loadUserStats = useCommonStore((s) => s.loadUserStats);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);



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
    if (!dropdownOpen || !user?.user_id) {
      return;
    }
    void loadUserStats(user.user_id);
  }, [dropdownOpen, user?.user_id, loadUserStats]);


  const [mobileOpen, setMobileOpen] = useState(false); // "Menu" popover
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [isMac, setIsMac] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const current = sectionForPath(pathname);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSpotlightOpen((o) => !o);
      }
      if (e.key === "Escape") {
        setDropdownOpen(false);
        setMoreMenuOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMobileOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  const pill = ov
    ? "text-white hover:bg-white/15"
    : "text-base-content hover:bg-base-200";

  return (
    <header className={`h-16 shrink-0 z-40 select-none w-full ${ov ? "absolute inset-x-0 top-0 text-white bg-gradient-to-b from-black/60 to-transparent" : "sticky top-0 bg-base-100/85 backdrop-blur-md border-b border-base-300"}`}>
      <a
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          const m = document.querySelector<HTMLElement>("#main-content, main");
          if (m) {
            if (!m.hasAttribute("tabindex")) m.setAttribute("tabindex", "-1");
            m.focus();
          }
        }}
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-base-content focus:px-4 focus:py-2 focus:text-sm focus:text-base-100"
      >
        Skip to main content
      </a>
      <div className="max-w-6xl mx-auto w-full h-full flex items-center gap-2 px-5 lg:px-8">
        {/* Brand + where you are */}
        {segments.length >= 2 && (
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
            aria-label="Go back"
            className={`h-11 w-11 -ml-2 inline-flex shrink-0 items-center justify-center rounded-full cursor-pointer touch-manipulation ${ov ? "hover:bg-white/15" : "hover:bg-base-200"}`}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
        )}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 rounded-full pr-2" aria-label="Meta IITGN home">
          <BrandMark size={30} />
          <span className="text-[15px] font-semibold tracking-tight" translate="no">Meta IITGN</span>
        </Link>
        {current && (
          <span className="hidden sm:flex items-center gap-2 text-[14px] min-w-0" aria-label={`Current section: ${current.label}`}>
            <span className={ov ? "text-white/60" : "text-base-content/40"} aria-hidden>/</span>
            <span className="truncate">{current.label}</span>
          </span>
        )}

        <div className="flex-1" />

        {/* Search / jump */}
        {!hideSearch && (
          <button
            type="button"
            onClick={() => setSpotlightOpen(true)}
            aria-label="Search or jump to"
            className={`hidden md:flex items-center gap-2 h-10 pl-3.5 pr-2.5 rounded-full text-[13px] w-60 cursor-pointer touch-manipulation transition-colors ${ov ? "bg-white/15 text-white hover:bg-white/25" : "bg-base-200 text-base-content/70 hover:bg-base-300"}`}
          >
            <Search className="h-3.5 w-3.5" aria-hidden />
            <span className="flex-1 text-left">Search or jump to…</span>
            <kbd className="text-[11px] font-mono opacity-80" aria-hidden="true">{isMac ? "⌘K" : "Ctrl K"}</kbd>
          </button>
        )}
        <button
          type="button"
          onClick={() => setSpotlightOpen(true)}
          aria-label="Search or jump to"
          className={`${hideSearch ? "" : "md:hidden"} h-11 w-11 inline-flex items-center justify-center rounded-full cursor-pointer touch-manipulation ${pill}`}
        >
          <Search className="h-[18px] w-[18px]" aria-hidden />
        </button>

        <ThemeToggle onPhoto={ov} />

        {/* Menu: every place in the app */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={mobileOpen}
            aria-label="Menu"
            className={`h-11 min-w-11 px-3 sm:px-4 inline-flex items-center justify-center gap-2 rounded-full text-[13px] font-medium cursor-pointer touch-manipulation transition-colors ${pill}`}
          >
            {mobileOpen ? <X className="h-4 w-4" aria-hidden /> : <Menu className="h-4 w-4" aria-hidden />}
            <span className="hidden sm:inline">Menu</span>
          </button>
          {mobileOpen && (
            <nav
              aria-label="Primary"
              className="absolute right-0 top-12 w-[min(22rem,calc(100vw-2.5rem))] rounded-2xl border border-base-300 bg-base-100 text-base-content p-2 z-50 spot-pop"
            >
              {SECTIONS.map((sec) => {
                const Icon = sec.icon;
                const active = (sec.href === "/" ? pathname === "/" : current?.href === sec.href);
                return (
                  <Link
                    key={sec.href}
                    href={sec.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 min-h-14 py-2 transition-colors ${active ? "bg-base-200" : "hover:bg-base-200"}`}
                  >
                    <span className="h-9 w-9 rounded-lg border border-base-300 inline-flex items-center justify-center text-primary shrink-0">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[14px] font-medium">{sec.label}</span>
                      <span className="block text-[12px] text-base-content/70 truncate">{sec.hint}</span>
                    </span>
                  </Link>
                );
              })}
              <a
                href="https://iitgn.ac.in"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center gap-3 border-t border-base-300 px-3 min-h-14 pt-2 text-[12px] text-base-content/70 hover:text-base-content"
              >
                <InstituteLogo size={28} />
                <span translate="no">IIT Gandhinagar website</span>
              </a>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {!user ? (
            <Link href="/login" className={`h-11 px-4 sm:px-5 inline-flex items-center whitespace-nowrap rounded-full text-[13px] font-medium hover:opacity-85 transition-opacity ${ov ? "bg-white text-[#1B1A18]" : "bg-base-content text-base-100"}`}>
              Sign in
            </Link>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDropdownOpen(!dropdownOpen);
                }}
                className="flex items-center rounded-full cursor-pointer"
                aria-label="Account menu"
                aria-haspopup="menu"
                aria-expanded={dropdownOpen}
              >
                <Avatar email={user.email} name={user.name} className="w-8 h-8 rounded-full object-cover" />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 top-11 w-64 rounded-xl border border-base-300 bg-base-100 p-1.5 z-50">
                  <div className="px-3 py-2.5">
                    <div className="text-sm font-medium truncate">{user.name}</div>
                    <div className="text-xs text-base-content/65 truncate">{user.email}</div>
                    <div className="mt-2 text-xs text-base-content/60">
                      {userStats?.points ?? user.points} points
                      {userStats ? ` · ${userStats.streak}-day streak` : ""}
                    </div>
                  </div>
                  <div className="h-px bg-base-300 my-1" />
                  {[
                    { href: "/user/profile", label: "Profile", icon: User },
                    { href: "/user/profile", label: "My contributions", icon: History },
                  ].map(({ href, label, icon: Icon }) => (
                    <Link key={href} href={href} onClick={() => setDropdownOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] hover:bg-base-200">
                      <Icon className="h-4 w-4 text-base-content/65" /> {label}
                    </Link>
                  ))}
                  <button onClick={() => { setDropdownOpen(false); setSettingsTab?.("appearance"); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] hover:bg-base-200 text-left cursor-pointer">
                    <Settings className="h-4 w-4 text-base-content/65" /> Settings
                  </button>
                  <Link href="/logout" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] hover:bg-base-200 text-error">
                    <LogOut className="h-4 w-4" /> Sign out
                  </Link>
                </div>
              )}
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
                className={`h-11 w-11 inline-flex items-center justify-center rounded-full cursor-pointer touch-manipulation transition-colors ${ov ? "hover:bg-white/15" : "hover:bg-base-200"}`}
                aria-label="More Actions"
                aria-haspopup="menu"
                aria-expanded={moreMenuOpen}
              >
                <MoreVertical className="h-5 w-5 text-base-content" />
              </button>
              {moreMenuOpen && (
                <div role="menu" className="absolute right-0 top-12 w-56 max-h-[calc(100vh-80px)] overflow-y-auto rounded-xl border border-base-300 bg-base-100 text-base-content p-1.5 z-[100] select-none spot-pop no-scrollbar">
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
                    className="w-full text-left px-3 min-h-10 text-[13px] text-base-content hover:bg-base-200 transition-colors flex items-center gap-2.5 whitespace-nowrap truncate cursor-pointer rounded-lg"
                  >
                    <Share2 className="h-4 w-4 text-base-content/65 shrink-0" />
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
                    className="w-full text-left px-3 min-h-10 text-[13px] text-base-content hover:bg-base-200 transition-colors flex items-center gap-2.5 whitespace-nowrap truncate cursor-pointer rounded-lg"
                  >
                    <Bookmark
                      className={`h-4 w-4 shrink-0 ${
                        isBookmarked ? "text-primary fill-primary" : "text-base-content/65"
                      }`}
                    />
                    <span>{isBookmarked ? "Remove Bookmark" : "Bookmark Page"}</span>
                  </button>
                  <button
                    onClick={() => {
                      window.print();
                      setMoreMenuOpen(false);
                    }}
                    className="w-full text-left px-3 min-h-10 text-[13px] text-base-content hover:bg-base-200 transition-colors flex items-center gap-2.5 whitespace-nowrap truncate cursor-pointer rounded-lg"
                  >
                    <Printer className="h-4 w-4 text-base-content/65 shrink-0" />
                    <span>Print Article</span>
                  </button>
                  <button
                    onClick={() => {
                      setSettingsTab("layout");
                      setMoreMenuOpen(false);
                    }}
                    className="w-full text-left px-3 min-h-10 text-[13px] text-base-content hover:bg-base-200 transition-colors flex items-center gap-2.5 whitespace-nowrap truncate cursor-pointer rounded-lg"
                  >
                    <Settings className="h-4 w-4 text-base-content/65 shrink-0" />
                    <span>Page Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent("show-wiki-revisions"));
                      setMoreMenuOpen(false);
                    }}
                    className="w-full text-left px-3 min-h-10 text-[13px] text-base-content hover:bg-base-200 transition-colors flex items-center gap-2.5 whitespace-nowrap truncate cursor-pointer rounded-lg"
                  >
                    <History className="h-4 w-4 text-base-content/65 shrink-0" />
                    <span>History</span>
                  </button>
                  <div className="border-t border-base-200 my-1" />
                  <button
                    onClick={() => {
                      toast("Reporting isn't connected yet. Please tell a moderator about this page.");
                      setMoreMenuOpen(false);
                    }}
                    className="w-full text-left px-3 min-h-10 text-[13px] text-base-content hover:bg-base-200 transition-colors flex items-center gap-2.5 whitespace-nowrap truncate cursor-pointer rounded-lg"
                  >
                    <AlertTriangle className="h-4 w-4 text-base-content/65 shrink-0" />
                    <span>Report Content</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Spotlight open={spotlightOpen} onClose={() => setSpotlightOpen(false)} />
      <Portal>
      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        url={shareData.url}
        title={shareData.title}
      />
      </Portal>
    </header>
  );
}
