"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import NextLink from "next/link";
import { parseMarkdown, stringifyMarkdown } from "@/lib/utils";
import { InfoboxData } from "@/lib/types";
import { TIERS, TIER_ICONS, menuItems } from "@/lib/constants";
import { EditableCell } from "@/components/article/editable-cell";
import {
  Search,
  ChevronDown,
  Share2,
  Edit3,
  Bookmark,
  Download,
  Check,
  X,
  Home,
  Map,
  Users,
  ChevronRight,
  Menu,
  Tag,
  Settings,
  HelpCircle,
  History,
  LogOut,
  Trash2,
  PlusCircle,
  Calendar,
  MessageSquare
} from "lucide-react";

// Dynamically import MilkdownEditor so it doesn't run during SSR
const MilkdownEditor = dynamic(() => import("@/components/article/milkdown-editor"), {
  ssr: false,
});

interface WikiClientProps {
  initialMarkdown: string;
}

export default function WikiClient({ initialMarkdown }: WikiClientProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const parsed = useMemo(() => parseMarkdown(markdown), [markdown]);
  const [activeSection, setActiveSection] = useState<string>("");
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toolbarContainer, setToolbarContainer] = useState<HTMLDivElement | null>(null);

  const [rightWidth, setRightWidth] = useState(320);
  const [currentTier, setCurrentTier] = useState<keyof typeof TIERS>("gold");

  useEffect(() => {
    setSearchExpanded(false);
  }, [isEditing]);

  useEffect(() => {
    const savedRight = localStorage.getItem("wiki-right-sidebar-width");
    if (savedRight) setRightWidth(Math.max(200, Number(savedRight)));
  }, []);

  const startResizeRight = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rightWidth;
    let currentWidth = startWidth;
    const doDrag = (moveEvent: MouseEvent) => {
      currentWidth = Math.max(200, Math.min(600, startWidth - (moveEvent.clientX - startX)));
      setRightWidth(currentWidth);
    };
    const stopDrag = () => {
      document.removeEventListener("mousemove", doDrag);
      document.removeEventListener("mouseup", stopDrag);
      localStorage.setItem("wiki-right-sidebar-width", String(currentWidth));
    };
    document.addEventListener("mousemove", doDrag);
    document.addEventListener("mouseup", stopDrag);
  };

  const handleRightDoubleClick = () => {
    setRightWidth(320);
    localStorage.setItem("wiki-right-sidebar-width", "320");
  };
  const markdownRef = useRef(markdown);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (menuOpen || profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen, profileOpen]);

  // Sync ref with initialMarkdown / state changes
  useEffect(() => {
    markdownRef.current = markdown;
  }, [markdown]);

  // Reset editor loaded state when switching modes
  useEffect(() => {
    setEditorLoaded(false);
  }, [isEditing]);

  // Debounce state update to keep the UI smooth while typing
  const debouncedSetMarkdown = useMemo(() => {
    let timeout: NodeJS.Timeout;
    return (value: string) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setMarkdown(value);
      }, 300);
    };
  }, []);



  const handleMarkdownChange = (newContentMarkdown: string) => {
    const newMarkdown = stringifyMarkdown(newContentMarkdown, parsed.infobox, parsed.title);
    markdownRef.current = newMarkdown;
    debouncedSetMarkdown(newMarkdown);
  };

  const handleTitleChange = (newTitle: string) => {
    const parsedLatest = parseMarkdown(markdownRef.current);
    const newMarkdown = stringifyMarkdown(parsedLatest.contentMarkdown, parsedLatest.infobox, newTitle);
    markdownRef.current = newMarkdown;
    setMarkdown(newMarkdown);
  };

  const handleInfoboxChange = (newInfobox: InfoboxData) => {
    const parsedLatest = parseMarkdown(markdownRef.current);
    const newMarkdown = stringifyMarkdown(parsedLatest.contentMarkdown, newInfobox, parsedLatest.title);
    markdownRef.current = newMarkdown;
    setMarkdown(newMarkdown);
  };

  const handleSave = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/page/1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: markdownRef.current }),
      });
      if (!response.ok) {
        console.warn("Backend save failed or endpoint not implemented. Saved locally.");
      }
    } catch (error) {
      console.error("Error saving to backend:", error);
    }
    setIsEditing(false);
  };

  const handleNewArticle = () => {
    const template = "# Untitled Page\n\nWrite your content here...";
    markdownRef.current = template;
    setMarkdown(template);
    setIsEditing(true);
  };

  // Add IDs to headings dynamically when content changes or is loaded
  useEffect(() => {
    const container = document.querySelector(".milkdown-container");
    if (!container) return;

    const headings = container.querySelectorAll("h2, h3");
    headings.forEach((heading) => {
      const text = heading.textContent || "";
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      if (heading.id !== id) {
        heading.id = id;
      }
    });
  }, [editorLoaded]);

  // Scrollspy to set active TOC item
  useEffect(() => {
    const mainElement = document.querySelector("main");
    if (!mainElement) return;

    const container = document.querySelector(".milkdown-container");
    if (!container) return;

    const handleScroll = () => {
      const headingElements = Array.from(container.querySelectorAll("h2, h3"));
      if (headingElements.length === 0) return;

      const mainRect = mainElement.getBoundingClientRect();
      let currentActive = "";

      // Find the heading closest to the top of the viewport
      for (const el of headingElements) {
        const rect = el.getBoundingClientRect();
        if (rect.top - mainRect.top < 150) {
          currentActive = el.id;
        } else {
          break;
        }
      }

      if (currentActive && currentActive !== activeSection) {
        setActiveSection(currentActive);
      }
    };

    mainElement.addEventListener("scroll", handleScroll, { passive: true });
    // Run once on load
    handleScroll();

    return () => {
      mainElement.removeEventListener("scroll", handleScroll);
    };
  }, [editorLoaded]);

  const handleTocClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const heading = document.getElementById(id);
    const mainElement = document.querySelector("main");
    if (heading && mainElement) {
      heading.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
    }
  };





  return (
    <div className="flex flex-col w-full h-screen bg-[#fcfcfd] overflow-hidden font-sans">
      {/* Top Header Bar */}
      <header className="h-16 border-b border-gray-100 flex items-center justify-between px-8 shrink-0 bg-white shadow-sm z-10">
        {/* Leftmost: Hamburger Menu & Brand Logo */}
        <div className="flex items-center gap-4">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {menuOpen && (
              <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-300 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="py-1">
                  <a href="#" className="flex items-center gap-3 px-4 py-2 text-xs text-gray-900 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors font-semibold">
                    <PlusCircle className="h-4 w-4 text-gray-500" />
                    <span>New Article</span>
                  </a>
                  <a href="#" className="flex items-center gap-3 px-4 py-2 text-xs text-gray-900 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors font-semibold">
                    <History className="h-4 w-4 text-gray-500" />
                    <span>History</span>
                  </a>
                  <a href="#" className="flex items-center gap-3 px-4 py-2 text-xs text-gray-900 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors font-semibold">
                    <Settings className="h-4 w-4 text-gray-500" />
                    <span>Settings</span>
                  </a>
                  <a href="#" className="flex items-center gap-3 px-4 py-2 text-xs text-gray-900 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors font-semibold">
                    <HelpCircle className="h-4 w-4 text-gray-500" />
                    <span>Help</span>
                  </a>
                </div>

                {/* Section 2: Campus Tools */}
                <div className="px-4 py-1.5 border-t border-b border-gray-50 mt-1">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Campus</p>
                </div>
                <div className="py-1">
                  <a href="#" className="flex items-center gap-3 px-4 py-2 text-xs text-gray-900 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors font-semibold">
                    <Map className="h-4 w-4 text-gray-500" />
                    <span>Map</span>
                  </a>
                  <a href="#" className="flex items-center gap-3 px-4 py-2 text-xs text-gray-900 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors font-semibold">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>Events</span>
                  </a>
                  <a href="#" className="flex items-center gap-3 px-4 py-2 text-xs text-gray-900 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors font-semibold">
                    <MessageSquare className="h-4 w-4 text-gray-500" />
                    <span>Forum</span>
                  </a>
                  <a href="#" className="flex items-center gap-3 px-4 py-2 text-xs text-gray-900 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors font-semibold">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>Directory</span>
                  </a>
                </div>

                <div className="border-t border-gray-50 my-1"></div>
                <div className="py-1">
                  <a href="#" className="flex items-center gap-3 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50/50 transition-colors font-semibold">
                    <LogOut className="h-4 w-4 text-rose-400" />
                    <span>Sign Out</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          <NextLink href="/" className="flex items-center gap-3 select-none cursor-pointer group">
            <div className="flex items-center justify-center w-9 h-9 bg-gray-950 text-white font-display font-black text-xs rounded-full shadow transition-transform group-hover:scale-105">
              mI
            </div>
            <span className="hidden md:block text-xl font-sans font-black tracking-tight text-gray-900 transition-colors group-hover:text-indigo-600">
              meta IITGN
            </span>
          </NextLink>
        </div>

        <div className={`relative flex items-center flex-1 w-full h-full mx-8 transition-all duration-500 ease-in-out ${
          isEditing ? "max-w-5xl animate-in fade-in" : "max-w-xl"
        }`}>
          {/* Editor Toolbar Portal */}
          <div
            id="editor-toolbar-portal"
            ref={setToolbarContainer}
            className={`milkdown hidden lg:flex w-full h-full items-center justify-center transition-all duration-500 ease-in-out ${
              isEditing
                ? "opacity-100 pointer-events-auto translate-y-0 scale-100 relative w-full shrink-0"
                : "opacity-0 pointer-events-none -translate-y-2 scale-95 absolute inset-x-0"
            }`}
            onMouseDown={() => {
              setTimeout(() => {
                const miniBar = document.querySelector(".milkdown-toolbar");
                if (miniBar) {
                  (miniBar as HTMLElement).style.display = "none";
                }
              }, 50);
            }}
          />

          {/* Search Box */}
          <div className={`transition-all duration-500 ease-in-out ${
            searchExpanded
              ? "opacity-100 pointer-events-auto translate-y-0 scale-100 fixed inset-x-0 top-0 h-16 bg-white z-50 flex items-center justify-center px-8 shadow-sm"
              : isEditing
                ? "opacity-0 pointer-events-none translate-y-2 scale-95 absolute inset-x-0"
                : "hidden lg:block lg:opacity-100 lg:pointer-events-auto lg:translate-y-0 lg:scale-100 lg:relative lg:w-full lg:shrink-0"
          }`}>
            <div className={`w-full flex items-center gap-3 ${isEditing || searchExpanded ? "max-w-xl" : ""}`}>
              <div className="relative flex items-center flex-1 h-10 bg-slate-50 border border-slate-200/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] rounded-full px-4 transition-all focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-100/50">
                <input
                  type="text"
                  placeholder="SEARCH..."
                  className="w-full text-xs text-slate-800 placeholder:text-slate-400 placeholder:font-semibold placeholder:tracking-widest bg-transparent focus:outline-none h-full pr-8"
                />
                <button
                  type="submit"
                  className="absolute right-4 text-slate-400 hover:text-indigo-650 transition-colors cursor-pointer"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
              {searchExpanded && (
                <button
                  onClick={() => setSearchExpanded(false)}
                  className="px-3 h-10 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl cursor-pointer text-xs font-bold transition-colors shrink-0"
                >
                  CANCEL
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Profile Info */}
        <div className="flex items-center gap-4 relative z-30" ref={profileRef}>
          {!searchExpanded && (
            <button
              onClick={() => setSearchExpanded(true)}
              className={`h-10 w-10 items-center justify-center text-slate-500 hover:text-indigo-650 hover:bg-gray-50 border border-slate-200/80 hover:border-indigo-200 rounded-full transition-all duration-200 cursor-pointer hover:scale-105 shadow-sm active:scale-95 bg-white ${
                isEditing ? "flex" : "flex lg:hidden"
              }`}
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
          )}

          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl bg-transparent hover:bg-gray-50 border-0 focus:outline-none transition-all duration-200 group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {/* Circle 1: Profile Avatar */}
              <div className="h-10 w-10 rounded-full border border-gray-200 bg-white flex items-center justify-center font-bold text-sm text-slate-800 transition-transform duration-300 group-hover:scale-105">
                AC
              </div>
              
              {/* Circle 2: Level Badge (Lucide icon, no emoji) */}
              {(() => {
                const IconComponent = TIER_ICONS[currentTier];
                return (
                  <div className={`h-10 w-10 rounded-full border border-gray-200 bg-gradient-to-r ${TIERS[currentTier].gradient} animate-gradient-slow flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-105`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                );
              })()}
            </div>
            
            <ChevronDown className={`h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {profileOpen && (
            <>
              {/* Mobile Full Screen Profile Page */}
              <div className="lg:hidden fixed inset-0 w-full h-full bg-slate-50 p-4 z-50 flex flex-col gap-4 overflow-y-auto font-sans animate-in fade-in duration-200">
                {/* Header Title with Close */}
                <div className="flex items-center justify-between pb-1 flex-shrink-0">
                  <span className="text-xl font-black text-slate-800 tracking-tight">Account Settings</span>
                  <button
                    onClick={() => setProfileOpen(false)}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded-full bg-white border border-slate-100 shadow-sm cursor-pointer"
                    aria-label="Close Profile"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* User Identity Card */}
                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-150/40 shadow-sm relative flex-shrink-0">
                  <div className={`h-14 w-14 bg-gradient-to-tr ${TIERS[currentTier].avatarGradient} animate-gradient-slow rounded-full flex items-center justify-center p-[2.5px] shadow-sm`}>
                    <div className="w-full h-full bg-white text-slate-800 rounded-full flex items-center justify-center font-black text-base">
                      AC
                    </div>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-base font-bold text-gray-900 leading-none">Alex Carter</span>
                    <span className="text-xs text-gray-400 font-medium mt-1">alex.carter@iitgn.ac.in</span>
                    <span className={`self-start mt-2 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-gradient-to-r ${TIERS[currentTier].gradient} animate-gradient-slow`}>
                      {TIERS[currentTier].name}
                    </span>
                  </div>
                </div>

                {/* Stats Card */}
                <div className="bg-white border border-slate-150/40 rounded-2xl p-4 shadow-sm flex flex-col gap-3.5 flex-shrink-0">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Rank & Progress</span>
                  <div className="grid grid-cols-3 gap-2 text-center divide-x divide-slate-100">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">XP Progress</span>
                      <span className="text-xs font-black text-slate-800 mt-1">1.2k / 2k</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">Edits</span>
                      <span className="text-xs font-black text-slate-850 mt-1">148</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">Rank</span>
                      <span className="text-xs font-black text-indigo-650 mt-1">#42</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden p-[1px]">
                    <div 
                      className={`h-full bg-gradient-to-r ${TIERS[currentTier].gradient} animate-gradient-slow rounded-full transition-all duration-300`}
                      style={{ width: currentTier === "singularity" ? "100%" : `${(1248 / 2000) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Simulator Card */}
                <div className="bg-white border border-slate-150/40 rounded-2xl p-4 shadow-sm flex flex-col gap-3 flex-shrink-0 text-left">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Simulator Tier Switcher</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {Object.keys(TIERS).map((key) => {
                      const t = TIERS[key];
                      const active = currentTier === key;
                      const IconComponent = TIER_ICONS[key];
                      return (
                        <button
                          key={key}
                          onClick={() => setCurrentTier(key as keyof typeof TIERS)}
                          className={`px-3 py-2 text-[9px] font-black rounded-xl transition-all duration-150 active:scale-95 cursor-pointer border text-center flex items-center justify-center gap-1.5 ${
                            active
                              ? `bg-gradient-to-r ${t.gradient} animate-gradient-slow border-transparent text-white shadow-sm`
                              : "bg-white hover:bg-slate-50 text-slate-500 border-slate-250/60"
                          }`}
                        >
                          <IconComponent className="h-3 w-3 shrink-0" />
                          <span>{t.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Actions List Card */}
                <div className="bg-white border border-slate-150/40 rounded-2xl p-2 shadow-sm flex flex-col divide-y divide-slate-100 flex-shrink-0">
                  <a
                    href="#"
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group/item"
                  >
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-500 group-hover/item:bg-indigo-50 group-hover/item:text-indigo-650 transition-colors">
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="flex-1 flex flex-col text-left">
                      <span className="text-sm font-bold text-slate-800">My Profile</span>
                      <span className="text-[10px] text-slate-400 font-medium">View details & rankings</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </a>

                  <a
                    href="#"
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group/item"
                  >
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-500 group-hover/item:bg-indigo-50 group-hover/item:text-indigo-650 transition-colors">
                      <Settings className="h-5 w-5" />
                    </div>
                    <div className="flex-1 flex flex-col text-left">
                      <span className="text-sm font-bold text-slate-800">Account Settings</span>
                      <span className="text-[10px] text-slate-400 font-medium">Manage preferences</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </a>

                  <a
                    href="#"
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-rose-50/30 transition-colors group/item"
                  >
                    <div className="p-2 rounded-lg bg-rose-50 text-rose-500">
                      <LogOut className="h-5 w-5" />
                    </div>
                    <div className="flex-1 flex flex-col text-left">
                      <span className="text-sm font-bold text-rose-600">Sign Out</span>
                      <span className="text-[10px] text-rose-450 font-medium">Exit your session</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-rose-300" />
                  </a>
                </div>
              </div>

              {/* Desktop Profile Popover */}
              <div className="hidden lg:flex absolute right-0 top-full -mt-1 w-80 bg-white border border-gray-150 rounded-2xl shadow-xl p-4 z-50 flex-col gap-4 font-sans animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                {/* Desktop Header */}
                <div className="flex items-center gap-3">
                  <div className={`h-11 w-11 bg-gradient-to-tr ${TIERS[currentTier].avatarGradient} animate-gradient-slow rounded-xl flex items-center justify-center p-[2px] shadow-sm`}>
                    <div className="w-full h-full bg-white text-slate-800 rounded-[10px] flex items-center justify-center font-black text-sm">
                      AC
                    </div>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-bold text-gray-900 leading-none">Alex Carter</span>
                    <span className="text-[11px] text-gray-400 font-medium mt-1">alex.carter@iitgn.ac.in</span>
                  </div>
                  <span className={`ml-auto px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r ${TIERS[currentTier].gradient} animate-gradient-slow`}>
                    {TIERS[currentTier].name}
                  </span>
                </div>

                {/* Stats Panel */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">XP Progress</span>
                    <span className="text-xs font-black text-slate-800 mt-1">1.2k / 2k</span>
                  </div>
                  <div className="flex flex-col border-x border-slate-200">
                    <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">Edits</span>
                    <span className="text-xs font-black text-slate-850 mt-1">148</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">Rank</span>
                    <span className="text-xs font-black text-indigo-650 mt-1">#42</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden p-[1px]">
                  <div 
                    className={`h-full bg-gradient-to-r ${TIERS[currentTier].gradient} animate-gradient-slow rounded-full transition-all duration-300`}
                    style={{ width: currentTier === "singularity" ? "100%" : `${(1248 / 2000) * 100}%` }}
                  />
                </div>

                {/* Switcher */}
                <div className="flex flex-col gap-2 text-left">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Simulator Tier Switcher</span>
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(TIERS).map((key) => {
                      const t = TIERS[key];
                      const active = currentTier === key;
                      const IconComponent = TIER_ICONS[key];
                      return (
                        <button
                          key={key}
                          onClick={() => setCurrentTier(key as keyof typeof TIERS)}
                          className={`px-2.5 py-1.5 text-[9px] font-black rounded-lg transition-all duration-150 active:scale-95 cursor-pointer border text-center flex items-center justify-center gap-1.5 ${
                            active
                              ? `bg-gradient-to-r ${t.gradient} animate-gradient-slow border-transparent text-white shadow-sm`
                              : "bg-white hover:bg-slate-50 text-slate-500 border-slate-250/60"
                          }`}
                          title={t.name}
                        >
                          <IconComponent className="h-3 w-3 shrink-0" />
                          <span>{t.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Desktop Actions */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                  <a
                    href="#"
                    className="flex flex-col items-center gap-1.5 py-2 rounded-xl text-[10px] font-bold text-slate-600 hover:text-indigo-650 hover:bg-indigo-50/50 transition-colors"
                  >
                    <Users className="h-4 w-4 text-slate-400" />
                    <span>Profile</span>
                  </a>
                  <a
                    href="#"
                    className="flex flex-col items-center gap-1.5 py-2 rounded-xl text-[10px] font-bold text-slate-600 hover:text-indigo-650 hover:bg-indigo-50/50 transition-colors"
                  >
                    <Settings className="h-4 w-4 text-slate-400" />
                    <span>Settings</span>
                  </a>
                  <a
                    href="#"
                    className="flex flex-col items-center gap-1.5 py-2 rounded-xl text-[10px] font-bold text-rose-650 hover:bg-rose-50/50 transition-colors"
                  >
                    <LogOut className="h-4 w-4 text-rose-450" />
                    <span>Sign Out</span>
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main Content Workspace */}
      <div className="flex flex-1 overflow-hidden w-full relative">
        {/* Left Sidebar */}
        <aside className="hidden lg:flex w-60 border-r border-gray-300 p-6 shrink-0 overflow-y-auto bg-white flex flex-col gap-6 select-none">
          {/* Main Navigation Menu */}
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 tracking-wider mb-3 uppercase">
              Explore
            </h3>
            <nav className="flex flex-col gap-1">
              {menuItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <NextLink
                    key={index}
                    href={item.link}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all duration-150"
                  >
                    <IconComponent className="h-4 w-4 text-gray-400 group-hover:text-indigo-600" />
                    <span className="flex-1">{item.title}</span>
                    <ChevronRight className="h-3 w-3 text-gray-300 opacity-0 hover:opacity-100" />
                  </NextLink>
                );
              })}
            </nav>
          </div>

          <hr className="border-gray-100" />

          {/* Action Toolbar */}
          <div className="flex flex-col gap-2">
            <h3 className="text-[10px] font-bold text-gray-400 tracking-wider mb-2 uppercase">
              Actions
            </h3>
            <nav className="flex flex-col gap-2 text-xs text-gray-600 font-semibold">
              <button
                onClick={handleNewArticle}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-gray-600 w-full"
              >
                <PlusCircle className="h-4 w-4 text-gray-400" /> NEW ARTICLE
              </button>
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-emerald-50 text-emerald-600 font-bold cursor-pointer transition-colors"
                  >
                    <Check className="h-4 w-4" /> SAVE CHANGES
                  </button>
                  <button
                    onClick={() => {
                      setMarkdown(initialMarkdown);
                      markdownRef.current = initialMarkdown;
                      setIsEditing(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-500 font-bold cursor-pointer transition-colors"
                  >
                    <X className="h-4 w-4" /> CANCEL
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-indigo-50 text-indigo-600 font-bold cursor-pointer transition-colors"
                >
                  <Edit3 className="h-4 w-4" /> EDIT ARTICLE
                </button>
              )}
              <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <History className="h-4 w-4 text-gray-400" /> CHANGES
              </button>
              <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <Share2 className="h-4 w-4 text-gray-400" /> SHARE
              </button>
              <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <Bookmark className="h-4 w-4 text-gray-400" /> BOOKMARK
              </button>
              <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <Download className="h-4 w-4 text-gray-400" /> DOWNLOAD
              </button>
            </nav>
          </div>

          <hr className="border-gray-100" />

          {/* Dynamic Table of Contents */}
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 tracking-wider mb-3 uppercase">
              Contents
            </h3>
            <ul className="text-xs flex flex-col gap-2.5 font-semibold">
              {parsed.toc.map((item, index) => {
                const isActive = activeSection === item.id;
                return (
                  <div key={item.id} className="flex flex-col gap-1.5">
                    <li className="flex items-center justify-between">
                      <a
                        href={`#${item.id}`}
                        onClick={(e) => handleTocClick(e, item.id)}
                        className={`truncate flex-1 py-0.5 transition-all duration-150 ${
                          isActive
                            ? "text-indigo-600 font-bold translate-x-1"
                            : "text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        {index + 1}. {item.title}
                      </a>
                    </li>
                    {item.subItems && item.subItems.length > 0 && (
                      <ul className="flex flex-col gap-1.5 pl-3 text-[11px] font-medium border-l border-gray-100 ml-1.5">
                        {item.subItems.map((sub, idx) => {
                          const subId = sub.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                          const isSubActive = activeSection === subId;
                          return (
                            <li key={idx}>
                              <a
                                href={`#${subId}`}
                                onClick={(e) => handleTocClick(e, subId)}
                                className={`truncate block py-0.5 transition-all duration-150 ${
                                  isSubActive
                                    ? "text-indigo-500 font-bold translate-x-0.5"
                                    : "text-gray-400 hover:text-gray-600"
                                }`}
                              >
                                {index + 1}.{idx + 1} {sub.title}
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </ul>
          </div>
        </aside>



        {/* Main Scrollable Article Body */}
        <main className="flex-1 px-4 md:px-16 pt-8 pb-24 lg:pb-12 overflow-y-auto bg-white relative scroll-smooth">
          <article className="w-full max-w-4xl mx-auto">
            {/* Title Header (Separated from editor to prevent accidental deletion) */}
            {isEditing ? (
              <EditableCell
                initialValue={parsed.title}
                onChange={handleTitleChange}
                placeholder="Untitled Page"
                className="text-4xl font-display font-black tracking-tight text-gray-900 w-full border-none focus:outline-none focus:ring-0 mb-8 bg-transparent placeholder-gray-200"
              />
            ) : (
              <h1 className="text-4xl font-display font-black tracking-tight text-gray-900 mb-8">
                {parsed.title}
              </h1>
            )}

            {/* Milkdown Editor */}
            <MilkdownEditor
              key={isEditing ? "edit" : "view"}
              initialMarkdown={parsed.contentMarkdown}
              onMarkdownChange={handleMarkdownChange}
              readOnly={!isEditing}
              onLoaded={() => setEditorLoaded(true)}
              toolbarContainer={toolbarContainer}
            />
          </article>
        </main>

        <div
          onMouseDown={startResizeRight}
          onDoubleClick={handleRightDoubleClick}
          className="hidden lg:block w-1.5 -mr-1 cursor-col-resize hover:bg-indigo-500/30 active:bg-indigo-500/50 transition-colors z-20 h-full flex-shrink-0"
          title="Drag to resize, double-click to reset"
        />
        {/* InfoBox (Right Sidebar) */}
        <aside
          style={{ width: `${rightWidth}px` }}
          className="hidden lg:flex border-l border-gray-300 shrink-0 overflow-y-auto bg-white flex flex-col select-none"
        >
          {/* Infobox Image */}
          <div
            className={`w-full relative bg-gray-50 border-b border-gray-100 flex items-center justify-center overflow-hidden transition-all duration-300 ${
              isEditing ? "h-32 p-4 bg-gray-50/50" : "aspect-square"
            }`}
          >
            <div className={`w-full h-full relative overflow-hidden transition-all duration-300 ${
              isEditing ? "rounded-xl border border-gray-200 shadow-sm bg-white" : ""
            }`}>
              {parsed.infobox.image ? (
                <img
                  src={parsed.infobox.image}
                  alt={parsed.infobox.imageAlt}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-300 text-sm font-medium absolute inset-0 flex items-center justify-center bg-gray-50">No Image</div>
              )}
            </div>
          </div>

          {/* Inline Image Editor Fields (In-place, only shown when editing) */}
          {isEditing && (
            <div className="p-6 border-b border-gray-100 flex flex-col gap-4 bg-gray-50/30 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">
                  Image Options
                </h4>
                {parsed.infobox.image && (
                  <button
                    onClick={() =>
                      handleInfoboxChange({
                        ...parsed.infobox,
                        image: "",
                        imageAlt: "",
                      })
                    }
                    className="text-rose-500 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Remove Image"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              
              {/* Image URL input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">
                  Image URL
                </label>
                <input
                  type="text"
                  value={parsed.infobox.image || ""}
                  onChange={(e) =>
                    handleInfoboxChange({
                      ...parsed.infobox,
                      image: e.target.value,
                    })
                  }
                  placeholder="https://example.com/image.jpg"
                  className="w-full border border-gray-200 hover:border-gray-300 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-gray-800 placeholder-gray-400 bg-white focus:outline-none transition-all duration-150 shadow-sm"
                />
              </div>

              {/* Alt Text input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">
                  Caption / Alt Text
                </label>
                <input
                  type="text"
                  value={parsed.infobox.imageAlt || ""}
                  onChange={(e) =>
                    handleInfoboxChange({
                      ...parsed.infobox,
                      imageAlt: e.target.value,
                    })
                  }
                  placeholder="e.g. Campus View"
                  className="w-full border border-gray-200 hover:border-gray-300 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-gray-800 placeholder-gray-400 bg-white focus:outline-none transition-all duration-150 shadow-sm"
                />
              </div>
            </div>
          )}

          {/* Infobox Fields Table */}
          <div className="p-6">
            <h4 className="text-[10px] font-bold text-gray-400 tracking-wider mb-4 uppercase">
              Key Information
            </h4>
            <table className="w-full text-xs text-gray-700">
              <tbody>
                {parsed.infobox.rows.map((row, index) => {
                  const isLast = index === parsed.infobox.rows.length - 1;
                  return (
                    <tr
                      key={index}
                      className={isLast ? "" : "border-b border-gray-50"}
                    >
                      <td className="py-3 pr-2 align-top w-[35%]">
                        {isEditing ? (
                          <EditableCell
                            initialValue={row.label}
                            onChange={(newLabel) => {
                              const newRows = [...parsed.infobox.rows];
                              newRows[index] = {
                                ...row,
                                label: newLabel,
                              };
                              handleInfoboxChange({
                                ...parsed.infobox,
                                rows: newRows,
                              });
                            }}
                            placeholder="Label"
                            className="w-full border border-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-indigo-500 font-semibold text-gray-700 uppercase tracking-wider bg-transparent"
                          />
                        ) : (
                          <span className="font-semibold text-gray-400 uppercase tracking-wider">{row.label}</span>
                        )}
                      </td>
                      <td className="py-3 align-top font-semibold text-gray-900">
                        {isEditing ? (
                          <div className="flex gap-2 items-center w-full">
                            <EditableCell
                              initialValue={Array.isArray(row.value) ? row.value.join(", ") : (row.value as string)}
                              onChange={(newVal) => {
                                const isBadgeType = row.type === "badge";
                                const parsedValue = isBadgeType
                                  ? newVal.split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean)
                                  : newVal;
                                
                                const newRows = [...parsed.infobox.rows];
                                newRows[index] = {
                                  ...row,
                                  value: parsedValue,
                                };
                                handleInfoboxChange({
                                  ...parsed.infobox,
                                  rows: newRows,
                                });
                              }}
                              placeholder="Value (use comma for tags)"
                              className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 font-normal bg-transparent resize-none"
                              as={row.type === "badge" ? "textarea" : "input"}
                            />
                            <button
                              onMouseDown={(e) => {
                                e.preventDefault(); // Prevent input from losing focus
                                const currentType = row.type || "text";
                                const nextType = currentType === "badge" ? "text" : "badge";
                                const newRows = [...parsed.infobox.rows];
                                
                                let nextValue = row.value;
                                if (nextType === "badge" && typeof row.value === "string") {
                                  nextValue = row.value.split(",").map((s) => s.trim()).filter(Boolean);
                                } else if (nextType === "text" && Array.isArray(row.value)) {
                                  nextValue = row.value.join(", ");
                                }

                                newRows[index] = {
                                  ...row,
                                  type: nextType,
                                  value: nextValue,
                                };
                                handleInfoboxChange({
                                  ...parsed.infobox,
                                  rows: newRows,
                                });
                              }}
                              className={`p-1 rounded cursor-pointer transition-colors ${
                                row.type === "badge"
                                  ? "text-indigo-600 bg-indigo-50 hover:bg-indigo-100/80"
                                  : "text-gray-400 hover:text-indigo-600 hover:bg-gray-50"
                              }`}
                              title={`Toggle representation (currently: ${row.type === "badge" ? "Badges/Tags" : "Text line"}). Click to switch.`}
                            >
                              <Tag className="h-4 w-4" />
                            </button>
                            <button
                              onMouseDown={(e) => {
                                e.preventDefault(); // Prevent input from losing focus
                                const newRows = parsed.infobox.rows.filter((_, idx) => idx !== index);
                                handleInfoboxChange({
                                  ...parsed.infobox,
                                  rows: newRows,
                                });
                              }}
                              className="text-gray-400 hover:text-rose-500 p-1 cursor-pointer transition-colors"
                              title="Delete fact row"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ) : row.type === "badge" && Array.isArray(row.value) ? (
                          <div className="flex flex-wrap gap-1">
                            {row.value.map((val) => (
                              <span
                                key={val}
                                className="text-[10px] text-indigo-600 border border-indigo-200 rounded-full px-2 py-0.5 font-semibold bg-indigo-50/50"
                              >
                                {val}
                              </span>
                            ))}
                          </div>
                        ) : (
                          row.value
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {isEditing && (
              <button
                onClick={() => {
                  const newRows = [...parsed.infobox.rows];
                  newRows.push({
                    label: "",
                    value: "",
                    type: "text"
                  });
                  handleInfoboxChange({
                    ...parsed.infobox,
                    rows: newRows
                  });
                }}
                className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-gray-200 hover:border-indigo-300 text-gray-400 hover:text-indigo-600 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150 hover:bg-indigo-50/5"
              >
                <span>+ Add</span>
              </button>
            )}
          </div>
        </aside>

        {/* Pinned Bottom Dock for Small Screens */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200/85 shadow-lg p-3 flex items-center justify-around z-40">
          {isEditing ? (
            <div className="flex w-full divide-x divide-slate-200">
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
              >
                <Check className="h-5 w-5" />
                <span>SAVE CHANGES</span>
              </button>
              <button
                onClick={() => {
                  setMarkdown(initialMarkdown);
                  markdownRef.current = initialMarkdown;
                  setIsEditing(false);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
                <span>CANCEL</span>
              </button>
            </div>
          ) : (
            <>
              {/* Button 1: Home */}
              <NextLink
                href="/"
                className="flex flex-col items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <Home className="h-5 w-5" />
                <span>Home</span>
              </NextLink>

              {/* Button 2: Edit */}
              <button
                onClick={() => setIsEditing(true)}
                className="flex flex-col items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
              >
                <Edit3 className="h-5 w-5" />
                <span>Edit</span>
              </button>

              {/* Button 3: New Article */}
              <button
                onClick={handleNewArticle}
                className="flex flex-col items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-indigo-655 transition-colors cursor-pointer"
              >
                <PlusCircle className="h-5 w-5" />
                <span>New Page</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
