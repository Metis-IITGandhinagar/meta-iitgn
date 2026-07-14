"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Eye, Layout, Bell, ChevronLeft, Search, User, Shield, HelpCircle, HardDrive, Cpu } from "lucide-react";
import { WIKI_THEMES, DARK_THEMES } from "@/lib/constants";

interface SettingsModalProps {
  onClose: () => void;
  initialTab?: TabType;
}

type TabType = "appearance" | "layout" | "search" | "alerts" | "account" | "language" | "storage" | "performance" | "help";

export default function SettingsModal({ onClose, initialTab = "appearance" }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // Mobile view navigation layer state: "list" shows settings categories, "details" shows the setting controls
  const [mobileView, setMobileView] = useState<"list" | "details">("list");

  // User settings states (persisted to localStorage)
  const [theme, setTheme] = useState("light");
  const [fontSize, setFontSize] = useState("normal");
  const [fontStyle, setFontStyle] = useState("sans");
  const [zoomLevel, setZoomLevel] = useState("100%");
  const [compactLayout, setCompactLayout] = useState(false);
  const [enableSound, setEnableSound] = useState(true);
  const [readingProgress, setReadingProgress] = useState(true);

  const [autoFocusSearch, setAutoFocusSearch] = useState(true);
  const [historyLimit, setHistoryLimit] = useState(10);
  const [openInNewTab, setOpenInNewTab] = useState(false);

  const [emailDigest, setEmailDigest] = useState(true);
  const [articleEditsAlert, setArticleEditsAlert] = useState(true);
  const themeTransitionTimer = useRef<number | null>(null);

  const [isMounted, setIsMounted] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ isDragging: boolean; startX: number; startY: number; startPos: { x: number; y: number } }>({
    isDragging: false,
    startX: 0,
    startY: 0,
    startPos: { x: 0, y: 0 },
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (window.innerWidth < 640) return;
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input") || target.closest("select") || target.closest("a")) {
      return;
    }
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startPos: { ...position },
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragRef.current.isDragging) return;
    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;
    setPosition({
      x: dragRef.current.startPos.x + deltaX,
      y: dragRef.current.startPos.y + deltaY,
    });
  };

  const handleMouseUp = () => {
    dragRef.current.isDragging = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  const withThemeTransition = (updateFn: () => void) => {
    document.documentElement.classList.add("theme-changing");
    if (themeTransitionTimer.current) {
      window.clearTimeout(themeTransitionTimer.current);
    }
    updateFn();
    themeTransitionTimer.current = window.setTimeout(() => {
      document.documentElement.classList.remove("theme-changing");
      themeTransitionTimer.current = null;
    }, 280);
  };

  useEffect(() => {
    setIsMounted(true);
    // Load settings from localStorage
    const savedTheme = localStorage.getItem("wiki_theme") || "light";
    const savedFontSize = localStorage.getItem("wiki_font_size") || "normal";
    const savedFontStyle = localStorage.getItem("wiki_font_style") || "sans";
    const savedZoom = localStorage.getItem("wiki_zoom_level") || "100%";

    const savedCompact = localStorage.getItem("wiki_compact_layout") === "true";
    const savedSound = localStorage.getItem("wiki_enable_sound") !== "false";
    const savedProgress = localStorage.getItem("wiki_reading_progress") !== "false";

    const savedAutoFocus = localStorage.getItem("wiki_autofocus_search") !== "false";
    const savedHistoryLimit = Number(localStorage.getItem("wiki_history_limit") || "10");
    const savedNewTab = localStorage.getItem("wiki_open_new_tab") === "true";

    const savedDigest = localStorage.getItem("wiki_email_digest") !== "false";
    const savedEditsAlert = localStorage.getItem("wiki_article_edits_alert") !== "false";

    setTheme(savedTheme);
    setFontSize(savedFontSize);
    setFontStyle(savedFontStyle);
    setZoomLevel(savedZoom);
    setCompactLayout(savedCompact);
    setEnableSound(savedSound);
    setReadingProgress(savedProgress);
    setAutoFocusSearch(savedAutoFocus);
    setHistoryLimit(savedHistoryLimit);
    setOpenInNewTab(savedNewTab);
    setEmailDigest(savedDigest);
    setArticleEditsAlert(savedEditsAlert);

    if (initialTab) {
      setActiveTab(initialTab);
      setMobileView("details");
    }

    // Disable background scrolling when modal is open
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      if (themeTransitionTimer.current) {
        window.clearTimeout(themeTransitionTimer.current);
      }
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [initialTab]);

  const handleSaveTheme = (newTheme: string) => {
    withThemeTransition(() => {
      setTheme(newTheme);
      localStorage.setItem("wiki_theme", newTheme);
      localStorage.setItem("wiki_daisyui_theme", newTheme);
      document.documentElement.setAttribute("data-theme", newTheme);
      if (DARK_THEMES.includes(newTheme)) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      window.dispatchEvent(new Event("wiki_settings_changed"));
    });
  };

  const handleSaveFontSize = (size: string) => {
    setFontSize(size);
    localStorage.setItem("wiki_font_size", size);
    window.dispatchEvent(new Event("wiki_settings_changed"));
  };

  const handleSaveFontStyle = (style: string) => {
    setFontStyle(style);
    localStorage.setItem("wiki_font_style", style);
    window.dispatchEvent(new Event("wiki_settings_changed"));
  };

  const handleSaveZoomLevel = (zoom: string) => {
    setZoomLevel(zoom);
    localStorage.setItem("wiki_zoom_level", zoom);
    window.dispatchEvent(new Event("wiki_settings_changed"));
  };

  const handleSaveCompact = (val: boolean) => {
    setCompactLayout(val);
    localStorage.setItem("wiki_compact_layout", val ? "true" : "false");
  };

  const handleSaveSound = (val: boolean) => {
    setEnableSound(val);
    localStorage.setItem("wiki_enable_sound", val ? "true" : "false");
  };

  const handleSaveProgress = (val: boolean) => {
    setReadingProgress(val);
    localStorage.setItem("wiki_reading_progress", val ? "true" : "false");
  };

  const handleSaveAutoFocus = (val: boolean) => {
    setAutoFocusSearch(val);
    localStorage.setItem("wiki_autofocus_search", val ? "true" : "false");
  };

  const handleSaveHistoryLimit = (val: number) => {
    setHistoryLimit(val);
    localStorage.setItem("wiki_history_limit", String(val));
  };

  const handleSaveNewTab = (val: boolean) => {
    setOpenInNewTab(val);
    localStorage.setItem("wiki_open_new_tab", val ? "true" : "false");
  };

  const handleSaveDigest = (val: boolean) => {
    setEmailDigest(val);
    localStorage.setItem("wiki_email_digest", val ? "true" : "false");
  };

  const handleSaveEditsAlert = (val: boolean) => {
    setArticleEditsAlert(val);
    localStorage.setItem("wiki_article_edits_alert", val ? "true" : "false");
  };

  // Helper Switch Component matching the application's clean design system
  const Switch = ({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="toggle toggle-primary toggle-sm cursor-pointer"
    />
  );

  return (
    <div className="fixed inset-0 z-[20000] flex min-h-screen items-center justify-center bg-transparent overflow-hidden font-sans p-0 sm:p-4">
      {/* Settings Dialog Card - Exactly matches sidebar height alignment & gray borders */}
      <div 
        style={isMounted && window.innerWidth >= 640 ? { transform: `translate(${position.x}px, ${position.y}px)` } : undefined}
        className="relative box-border flex h-full w-full max-w-5xl shrink-0 grow-0 overflow-hidden rounded-none border-0 bg-base-100 shadow-xl animate-in zoom-in-95 duration-200 transition-colors duration-300 ease-in-out sm:h-[min(680px,calc(100vh-2rem))] sm:min-h-0 sm:max-h-[calc(100vh-2rem)] sm:rounded-lg sm:border sm:border-base-200"
      >

        {/* Left Panel: Navigation Categories list */}
        <div className={`w-full sm:w-[280px] bg-base-100 border-r border-base-200 p-4 flex flex-col justify-between shrink-0 select-none overflow-hidden ${mobileView === "details" ? "hidden sm:flex" : "flex"
          }`}>
          <div className="flex flex-col gap-6 h-full overflow-hidden">
            {/* Header info */}
            <div 
              onMouseDown={handleMouseDown}
              className="flex items-center justify-between gap-2 px-3 pb-1 border-b border-base-200 sm:border-0 cursor-move select-none"
            >
              <div className="flex items-center gap-2">
                {/* Back / Close Button (renders as back chevron Left on mobile and desktop categories header) */}
                <button
                  onClick={onClose}
                  className="p-1 text-base-content hover:bg-base-200 rounded-lg transition-colors cursor-pointer -ml-2"
                  aria-label="Exit settings"
                >
                  <ChevronLeft className="w-6 h-6 shrink-0 text-base-content" />
                </button>
                <h2 className="text-[10px] font-bold tracking-wider text-base-content/70 uppercase">
                  Settings
                </h2>
              </div>
            </div>

            {/* Navigation Tabs */}
            <ul className="menu bg-base-100 p-0 gap-1.5 flex-1 grid grid-cols-1 w-full">
              {[
                { id: "appearance", label: "Appearance", desc: "Theme, font styles, colors", icon: Eye },
                { id: "layout", label: "Layout & Reading", desc: "List styling & reading bar", icon: Layout },
                { id: "search", label: "Search Preferences", desc: "Behavior & history limit", icon: Search },
                { id: "alerts", label: "Notifications", desc: "Digest & bookmark alerts", icon: Bell },
                { id: "account", label: "Account & Security", desc: "Session settings & roles", icon: User },
                { id: "language", label: "Language", desc: "Translation & locale", icon: Shield },
                { id: "storage", label: "Cache & Offline", desc: "Manage offline storage", icon: HardDrive },
                { id: "performance", label: "Performance", desc: "Accelerators & animations", icon: Cpu },
                { id: "help", label: "Help & About", desc: "View documentation & source", icon: HelpCircle },
              ].map((tab) => {
                const isAct = activeTab === tab.id;
                const IconComponent = tab.icon;
                return (
                  <li key={tab.id} className="w-full">
                    <button
                      onClick={() => {
                        setActiveTab(tab.id as TabType);
                        setMobileView("details");
                      }}
                      className={`flex items-start gap-3 p-2.5 rounded-lg transition-all duration-200 cursor-pointer w-full text-left ${isAct
                        ? "bg-primary! text-primary-content!"
                        : "text-base-content hover:bg-base-200 bg-transparent"
                        }`}
                    >
                      <IconComponent className={`h-4.5 w-4.5 mt-0.5 transition-colors duration-200 ${isAct ? "text-primary-content" : "text-base-content/70"}`} />
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] leading-tight font-bold">{tab.label}</span>
                        <span className={`block text-[9.5px] font-normal leading-normal mt-0.5 ${isAct ? "text-primary-content/80" : "text-base-content/50"}`}>
                          {tab.desc}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Right Panel: Detail Configuration View */}
        <div className={`flex-1 flex flex-col justify-between overflow-hidden bg-base-100 ${mobileView === "list" ? "hidden sm:flex" : "flex"
          }`}>

          {/* Header Action Bar */}
          <div 
            onMouseDown={handleMouseDown}
            className="px-5 sm:px-6 py-4 border-b border-base-200 flex items-center justify-between shrink-0 bg-base-100 cursor-move select-none"
          >
            <div className="flex items-center gap-1">
              {/* Back to Categories (Mobile Only) */}
              <button
                onClick={() => setMobileView("list")}
                className="p-1.5 text-base-content hover:bg-base-200 rounded-lg transition-colors cursor-pointer sm:hidden -ml-2"
                aria-label="Back to settings list"
              >
                <ChevronLeft className="w-6 h-6 shrink-0 text-base-content" />
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-base-200 text-base-content rounded-lg transition-colors cursor-pointer"
              aria-label="Close settings"
            >
              <X className="w-5.5 h-5.5 text-base-content" />
            </button>
          </div>

          {/* Active Category Settings Content */}
          <div className="flex-1 p-6 overflow-y-auto min-h-0 space-y-6 bg-base-100">

            {/* Tab: Appearance */}
            {activeTab === "appearance" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <h4 className="text-[13px] font-bold text-base-content">Appearance Settings</h4>
                  <p className="text-[11px] text-base-content/60">Configure visual themes, sizing scaling, and colors.</p>
                </div>

                <div className="space-y-4 bg-base-200/40 p-4 rounded-xl border border-base-200">
                  {/* Font Size */}
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-base-content block">Article Font Size</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "small", label: "Small" },
                        { id: "normal", label: "Standard" },
                        { id: "large", label: "Large" }
                      ].map((f) => {
                        const isSel = fontSize === f.id;
                        return (
                          <button
                            key={f.id}
                            onClick={() => handleSaveFontSize(f.id)}
                            className={`flex items-center justify-center px-3 py-2 rounded-lg text-xs font-semibold border transition-all duration-150 cursor-pointer active:scale-95 ${isSel
                              ? "bg-primary/10 border-primary text-primary font-bold"
                              : "bg-base-100 text-base-content border-base-300 hover:bg-base-200/60"
                              }`}
                          >
                            {f.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t border-base-200 my-1" />

                  {/* Font Style */}
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-base-content block">Article Font Style</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "sans", label: "Sans-Serif" },
                        { id: "serif", label: "Serif" },
                        { id: "mono", label: "Monospace" }
                      ].map((fontItem) => {
                        const isSel = fontStyle === fontItem.id;
                        return (
                          <button
                            key={fontItem.id}
                            onClick={() => handleSaveFontStyle(fontItem.id)}
                            className={`flex items-center justify-center px-3 py-2 rounded-lg text-xs font-semibold border transition-all duration-150 cursor-pointer active:scale-95 ${isSel
                              ? "bg-primary/10 border-primary text-primary font-bold"
                              : "bg-base-100 text-base-content border-base-300 hover:bg-base-200/60"
                              }`}
                          >
                            {fontItem.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t border-base-200 my-1" />

                  {/* Interface Size */}
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-base-content block">Interface Size</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "90%", label: "90% Compact" },
                        { id: "100%", label: "100% Default" },
                        { id: "110%", label: "110% Large" }
                      ].map((z) => {
                        const isSel = zoomLevel === z.id;
                        return (
                          <button
                            key={z.id}
                            onClick={() => handleSaveZoomLevel(z.id)}
                            className={`flex items-center justify-center px-3 py-2 rounded-lg text-xs font-semibold border transition-all duration-150 cursor-pointer active:scale-95 ${isSel
                              ? "bg-primary/10 border-primary text-primary font-bold"
                              : "bg-base-100 text-base-content border-base-300 hover:bg-base-200/60"
                              }`}
                          >
                            {z.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t border-base-200 my-1" />

                  {/* Theme Mode */}
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-base-content block">Interface Theme</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pr-1">
                      {WIKI_THEMES.map((t) => {
                        const isSel = theme === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleSaveTheme(t.id)}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold border transition-all duration-150 cursor-pointer bg-base-100 border-base-300 text-base-content hover:bg-base-200/60 ${isSel ? "border-primary ring-1 ring-primary bg-base-200" : ""
                              }`}
                          >
                            <span>{t.label}</span>
                            <div data-theme={t.id} className="flex gap-0.5 shrink-0 ml-1 bg-transparent">
                              <span className="w-2.5 h-2.5 rounded-full border border-base-300 bg-primary" />
                              <span className="w-2.5 h-2.5 rounded-full border border-base-300 bg-secondary" />
                              <span className="w-2.5 h-2.5 rounded-full border border-base-300 bg-accent" />
                              <span className="w-2.5 h-2.5 rounded-full border border-base-300 bg-neutral" />
                            </div>
                          </button>
                        );
                      })}
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* Tab: Layout Preferences */}
            {activeTab === "layout" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <h4 className="text-[13px] font-bold text-base-content">Layout Settings</h4>
                  <p className="text-[11px] text-base-content/50">Configure presentation structure and micro-interactions.</p>
                </div>

                <div className="space-y-3 bg-base-200/40 p-4 rounded-xl border border-base-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-base-content/85 block text-[12px]">Compact lists view</span>
                      <span className="text-[10px] text-base-content/50 block">Removes card gaps to display more content items.</span>
                    </div>
                    <Switch checked={compactLayout} onChange={handleSaveCompact} />
                  </div>

                  <div className="border-t border-base-300/60 my-1" />

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-base-content/85 block text-[12px]">Show article reading progress bar</span>
                      <span className="text-[10px] text-base-content/50 block">Render a thin visual scrolling progress bar on top.</span>
                    </div>
                    <Switch checked={readingProgress} onChange={handleSaveProgress} />
                  </div>

                  <div className="border-t border-base-300/60 my-1" />

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-base-content/85 block text-[12px]">Enable micro sound effects</span>
                      <span className="text-[10px] text-base-content/50 block">Play subtle mechanical sounds on clicks.</span>
                    </div>
                    <Switch checked={enableSound} onChange={handleSaveSound} />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Search Preferences */}
            {activeTab === "search" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <h4 className="text-[13px] font-bold text-base-content">Search Engine Behavior</h4>
                  <p className="text-[11px] text-base-content/50">Customize lookup defaults and query indexing preferences.</p>
                </div>

                <div className="space-y-3 bg-base-200/40 p-4 rounded-xl border border-base-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-base-content/85 block text-[12px]">Auto-focus search box</span>
                      <span className="text-[10px] text-base-content/50 block">Focus search queries automatically on page load.</span>
                    </div>
                    <Switch checked={autoFocusSearch} onChange={handleSaveAutoFocus} />
                  </div>

                  <div className="border-t border-base-300/60 my-1" />

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-base-content/85 block text-[12px]">Open links in new tab</span>
                      <span className="text-[10px] text-base-content/50 block">Default click redirection target will use _blank tab.</span>
                    </div>
                    <Switch checked={openInNewTab} onChange={handleSaveNewTab} />
                  </div>

                  <div className="border-t border-base-300/60 my-1" />

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-base-content/85 block text-[12px]">Search history limit</span>
                      <span className="text-[10px] text-base-content/50 block">Select local query caching length.</span>
                    </div>
                    <select
                      value={historyLimit}
                      onChange={(e) => handleSaveHistoryLimit(Number(e.target.value))}
                      className="select select-bordered select-xs h-8 px-2 bg-base-100 border-base-300 text-xs font-semibold text-base-content/85 cursor-pointer"
                    >
                      <option value={5}>5 items</option>
                      <option value={10}>10 items</option>
                      <option value={20}>20 items</option>
                      <option value={50}>50 items</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Alerts & Notifications */}
            {activeTab === "alerts" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <h4 className="text-[13px] font-bold text-base-content">Weekly Summaries & Digests</h4>
                  <p className="text-[11px] text-base-content/50">Set up alert schedules for edits on bookmarked articles.</p>
                </div>

                <div className="space-y-3 bg-base-200/40 p-4 rounded-xl border border-base-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-base-content/85 block text-[12px]">Weekly highlights email</span>
                      <span className="text-[10px] text-base-content/50 block">Weekly edits summary and ranking updates.</span>
                    </div>
                    <Switch checked={emailDigest} onChange={handleSaveDigest} />
                  </div>

                  <div className="border-t border-base-300/60 my-1" />

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-base-content/85 block text-[12px]">Bookmarked page edit alerts</span>
                      <span className="text-[10px] text-base-content/50 block">Get instant alerts when bookmarked articles are updated.</span>
                    </div>
                    <Switch checked={articleEditsAlert} onChange={handleSaveEditsAlert} />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Account & Security */}
            {activeTab === "account" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <h4 className="text-[13px] font-bold text-base-content">Account & Security</h4>
                  <p className="text-[11px] text-base-content/50">Configure login sessions, API tokens, and access roles.</p>
                </div>

                <div className="space-y-3 bg-base-200/40 p-4 rounded-xl border border-base-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-base-content/85 block text-[12px]">Remember active session</span>
                      <span className="text-[10px] text-base-content/50 block">Keep you signed in on this browser for 30 days.</span>
                    </div>
                    <Switch checked={true} onChange={() => { }} />
                  </div>
                  <div className="border-t border-base-300/60 my-1" />
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-base-content/85 block text-[12px]">Two-Factor authentication</span>
                      <span className="text-[10px] text-base-content/50 block">Request verification codes when logging in.</span>
                    </div>
                    <Switch checked={false} onChange={() => { }} />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Language */}
            {activeTab === "language" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <h4 className="text-[13px] font-bold text-base-content">Language & Translation</h4>
                  <p className="text-[11px] text-base-content/50">Select language preferences for the portal content.</p>
                </div>

                <div className="space-y-3 bg-base-200/40 p-4 rounded-xl border border-base-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-base-content/85 block text-[12px]">Default language</span>
                      <span className="text-[10px] text-base-content/50 block">Pick language for general interface buttons.</span>
                    </div>
                    <select className="h-8 px-2 bg-base-100 border border-base-300 rounded-lg text-xs font-semibold text-base-content/85 focus:outline-none cursor-pointer">
                      <option value="en">English (US)</option>
                      <option value="hi">Hindi (हिन्दी)</option>
                      <option value="es">Spanish</option>
                    </select>
                  </div>
                  <div className="border-t border-base-300/60 my-1" />
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-base-content/85 block text-[12px]">Auto-translate articles</span>
                      <span className="text-[10px] text-base-content/50 block">Translate external resources dynamically.</span>
                    </div>
                    <Switch checked={false} onChange={() => { }} />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Cache & Offline */}
            {activeTab === "storage" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <h4 className="text-[13px] font-bold text-base-content">Cache & Offline Storage</h4>
                  <p className="text-[11px] text-base-content/50">Manage downloaded articles and saved browser cache space.</p>
                </div>

                <div className="space-y-3 bg-base-200/40 p-4 rounded-xl border border-base-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-base-content/85 block text-[12px]">Save bookmarked pages offline</span>
                      <span className="text-[10px] text-base-content/50 block">Downloads bookmarks for reading without internet.</span>
                    </div>
                    <Switch checked={true} onChange={() => { }} />
                  </div>
                  <div className="border-t border-base-300/60 my-1" />
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-base-content/85 block text-[12px]">Clear browser settings cache</span>
                      <span className="text-[10px] text-base-content/50 block">Wipe out configuration settings history.</span>
                    </div>
                    <button className="btn btn-error btn-outline btn-xs font-semibold cursor-pointer">Clear Cache</button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Performance */}
            {activeTab === "performance" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <h4 className="text-[13px] font-bold text-base-content">Performance</h4>
                  <p className="text-[11px] text-base-content/50">Manage rendering preferences for maximum system speed.</p>
                </div>

                <div className="space-y-3 bg-base-200/40 p-4 rounded-xl border border-base-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-base-content/85 block text-[12px]">Enable interface animations</span>
                      <span className="text-[10px] text-base-content/50 block">Disable transitions to boost rendering speed.</span>
                    </div>
                    <Switch checked={true} onChange={() => { }} />
                  </div>
                  <div className="border-t border-base-300/60 my-1" />
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-base-content/85 block text-[12px]">Hardware acceleration</span>
                      <span className="text-[10px] text-base-content/50 block">Leverage GPU computing for loading articles.</span>
                    </div>
                    <Switch checked={true} onChange={() => { }} />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Help & About */}
            {activeTab === "help" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <h4 className="text-[13px] font-bold text-base-content">Help & About</h4>
                  <p className="text-[11px] text-base-content/50">View wiki version specifications and licensing references.</p>
                </div>

                {/* Centered mI circle logo */}
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="w-16 h-16 bg-primary text-primary-content rounded-full flex items-center justify-center font-serif font-black text-2xl shadow-sm">
                    mI
                  </div>
                  <span className="block text-xs font-bold text-base-content/60 mt-2">META IITGN</span>
                </div>

                <div className="space-y-3 bg-base-200/40 p-4 rounded-xl border border-base-200">
                  <div className="flex items-center justify-between pb-2 border-b border-base-300/50">
                    <div>
                      <span className="font-semibold text-base-content/85 block text-[12px]">Software Build</span>
                      <span className="text-[10px] text-base-content/50 block">v1.12.4-stable</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-base-300/50">
                    <div>
                      <span className="font-semibold text-base-content/85 block text-[12px]">Application Engine</span>
                      <span className="text-[10px] text-base-content/50 block">Powered by Next.js 15 & Turbopack</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1.5">
                    <div>
                      <span className="font-semibold text-base-content/85 block text-[12px]">Resources & Licenses</span>
                      <span className="text-[10px] text-base-content/50 block">Read system instructions and project code rules.</span>
                    </div>
                    <div className="flex gap-2">
                      <a href="https://github.com" target="_blank" rel="noreferrer" className="btn btn-outline btn-xs font-semibold text-blue-600">Docs</a>
                      <a href="https://github.com" target="_blank" rel="noreferrer" className="btn btn-outline btn-xs font-semibold text-blue-600">License</a>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>



        </div>

      </div>
    </div>
  );
}
