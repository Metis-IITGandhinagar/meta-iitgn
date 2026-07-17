"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Eye, Layout, ChevronLeft, Search, HelpCircle, HardDrive, Cpu, Maximize2, Minimize2, PenLine, Trash2, RotateCcw, Check } from "lucide-react";
import { WIKI_THEMES, DARK_THEMES } from "@/lib/constants";
import ProfilePopover from "@/components/ProfilePopover";
import { db } from "@/lib/db";

// Real build info shown in the Help & About tab.
const APP_VERSION = "1.1.0";
const REPO_URL = "https://github.com/Metis-IITGandhinagar/meta-iitgn";

interface SettingsModalProps {
  onClose: () => void;
  initialTab?: TabType;
}

type TabType = "appearance" | "editor" | "layout" | "search" | "storage" | "performance" | "help";

export default function SettingsModal({ onClose, initialTab = "appearance" }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [isMaximized, setIsMaximized] = useState(false);

  // Mobile view navigation layer state: "list" shows settings categories, "details" shows the setting controls
  const [mobileView, setMobileView] = useState<"list" | "details">("list");

  // Interface settings (applied to the whole UI, not the editor/article text)
  const [theme, setTheme] = useState("light");
  const [interfaceFontStyle, setInterfaceFontStyle] = useState("sans");
  const [zoomLevel, setZoomLevel] = useState("100%");
  const [compactLayout, setCompactLayout] = useState(false);
  const [readingProgress, setReadingProgress] = useState(true);

  // Editor settings (independent of the interface font)
  const [editorAutosave, setEditorAutosave] = useState(true);
  const [editorSpellCheck, setEditorSpellCheck] = useState(true);
  const [editorWordCount, setEditorWordCount] = useState(true);
  const [editorFontStyle, setEditorFontStyle] = useState("serif");
  const [editorFontSize, setEditorFontSize] = useState("normal");

  const [autoFocusSearch, setAutoFocusSearch] = useState(true);
  const [historyLimit, setHistoryLimit] = useState(10);
  const [openInNewTab, setOpenInNewTab] = useState(false);

  // Performance: interface animations (persisted + applied globally via data-reduce-motion)
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  // Storage: transient feedback for the clear/reset actions
  const [cacheCleared, setCacheCleared] = useState(false);
  const [settingsReset, setSettingsReset] = useState(false);

  const [isMounted, setIsMounted] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    isDragging: boolean;
    startX: number;
    startY: number;
    startPos: { x: number; y: number };
  }>({
    isDragging: false,
    startX: 0,
    startY: 0,
    startPos: { x: 0, y: 0 },
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (window.innerWidth < 640 || isMaximized) return;
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
    setIsDragging(true);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current.isDragging) return;
    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;
    setPosition({
      x: dragRef.current.startPos.x + deltaX,
      y: dragRef.current.startPos.y + deltaY,
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    dragRef.current.isDragging = false;
    setIsDragging(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove]);

  // Used to detect a double-tap on touch devices (the maximize button is
  // hidden on small screens, so a double-tap on the header is the only way
  // to maximize there).
  const lastTapRef = useRef(0);

  const toggleMaximize = () => setIsMaximized((m) => !m);

  const handleHeaderDoubleTap = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      e.preventDefault();
      toggleMaximize();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  useEffect(() => {
    setIsMounted(true);
    // Load settings from localStorage
    const savedTheme = localStorage.getItem("wiki_theme") || "light";
    const savedInterfaceFontStyle = localStorage.getItem("wiki_interface_font_style") || "sans";
    const savedZoom = localStorage.getItem("wiki_zoom_level") || "100%";

    const savedCompact = localStorage.getItem("wiki_compact_layout") === "true";
    const savedProgress = localStorage.getItem("wiki_reading_progress") !== "false";

    const savedEditorAutosave = localStorage.getItem("wiki_editor_autosave") !== "false";
    const savedEditorSpellCheck = localStorage.getItem("wiki_editor_spellcheck") !== "false";
    const savedEditorWordCount = localStorage.getItem("wiki_editor_word_count") !== "false";
    const savedEditorFontStyle = localStorage.getItem("wiki_editor_font_style") || "serif";
    const savedEditorFontSize = localStorage.getItem("wiki_editor_font_size") || "normal";

    const savedAutoFocus = localStorage.getItem("wiki_autofocus_search") !== "false";
    const savedHistoryLimit = Number(localStorage.getItem("wiki_history_limit") || "10");
    const savedNewTab = localStorage.getItem("wiki_open_new_tab") === "true";

    const savedAnimations = localStorage.getItem("wiki_animations") !== "false";

    setTheme(savedTheme);
    setInterfaceFontStyle(savedInterfaceFontStyle);
    setZoomLevel(savedZoom);
    setCompactLayout(savedCompact);
    setReadingProgress(savedProgress);
    setEditorAutosave(savedEditorAutosave);
    setEditorSpellCheck(savedEditorSpellCheck);
    setEditorWordCount(savedEditorWordCount);
    setEditorFontStyle(savedEditorFontStyle);
    setEditorFontSize(savedEditorFontSize);
    setAutoFocusSearch(savedAutoFocus);
    setHistoryLimit(savedHistoryLimit);
    setOpenInNewTab(savedNewTab);
    setAnimationsEnabled(savedAnimations);

    if (initialTab) {
      setActiveTab(initialTab);
      if (typeof window !== "undefined" && window.innerWidth >= 645) {
        setMobileView("details");
      } else {
        setMobileView("list");
      }
    }

    // Disable background scrolling when modal is open
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [initialTab, handleMouseMove, handleMouseUp]);

  const handleSaveTheme = (newTheme: string) => {
    // Apply everything in a single synchronous update so the entire palette
    // (background, borders, primary, etc.) swaps in one repaint instead of
    // animating each property independently.
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
  };

  const handleSaveInterfaceFontStyle = (style: string) => {
    setInterfaceFontStyle(style);
    localStorage.setItem("wiki_interface_font_style", style);
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
    window.dispatchEvent(new Event("wiki_settings_changed"));
  };

  const handleSaveProgress = (val: boolean) => {
    setReadingProgress(val);
    localStorage.setItem("wiki_reading_progress", val ? "true" : "false");
  };

  const handleSaveEditorAutosave = (val: boolean) => {
    setEditorAutosave(val);
    localStorage.setItem("wiki_editor_autosave", val ? "true" : "false");
    window.dispatchEvent(new Event("wiki_settings_changed"));
  };

  const handleSaveEditorSpellCheck = (val: boolean) => {
    setEditorSpellCheck(val);
    localStorage.setItem("wiki_editor_spellcheck", val ? "true" : "false");
    window.dispatchEvent(new Event("wiki_settings_changed"));
  };

  const handleSaveEditorWordCount = (val: boolean) => {
    setEditorWordCount(val);
    localStorage.setItem("wiki_editor_word_count", val ? "true" : "false");
    window.dispatchEvent(new Event("wiki_settings_changed"));
  };

  const handleSaveEditorFontStyle = (style: string) => {
    setEditorFontStyle(style);
    localStorage.setItem("wiki_editor_font_style", style);
    window.dispatchEvent(new Event("wiki_settings_changed"));
  };

  const handleSaveEditorFontSize = (size: string) => {
    setEditorFontSize(size);
    localStorage.setItem("wiki_editor_font_size", size);
    window.dispatchEvent(new Event("wiki_settings_changed"));
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

  const handleSaveAnimations = (val: boolean) => {
    setAnimationsEnabled(val);
    localStorage.setItem("wiki_animations", val ? "true" : "false");
    // Disable transitions/animations globally when turned off.
    document.documentElement.setAttribute("data-reduce-motion", val ? "false" : "true");
    window.dispatchEvent(new Event("wiki_settings_changed"));
  };

  // Clear the offline (Dexie / IndexedDB) content cache. This wipes downloaded
  // articles, bookmarks and other cached collections so they are re-fetched.
  const handleClearCache = async () => {
    try {
      await Promise.all([
        db.bookmarks.clear(),
        db.news.clear(),
        db.pendingpages.clear(),
        db.updatedpages.clear(),
        db.cachedpages.clear(),
        db.featured.clear(),
        db.popular.clear(),
        db.events.clear(),
        db.messmenu.clear(),
        db.transport.clear(),
        db.meta.clear(),
      ]);
      localStorage.removeItem("syncCheck");
    } catch (e) {
      console.error("Failed to clear offline cache:", e);
    }
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2000);
  };

  // Reset every locally-stored preference (theme, fonts, layout, etc.) back to
  // defaults, then reload so the fresh values are applied everywhere.
  const handleResetSettings = () => {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      // Only touch preference keys; leave auth/session caches untouched.
      if (key && key.startsWith("wiki_")) keys.push(key);
    }
    keys.forEach((k) => localStorage.removeItem(k));
    setSettingsReset(true);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  // Helper Switch Component matching the application's clean design system
  const Switch = ({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="toggle toggle-primary toggle-sm cursor-pointer shrink-0"
    />
  );

  return (
    <div className={`fixed inset-0 z-[20000] flex min-h-screen items-center justify-center bg-transparent overflow-hidden font-sans ${
      isMaximized ? "p-0" : "p-0 sm:p-4"
    }`}>
      {/* Settings Dialog Card - Exactly matches sidebar height alignment & gray borders */}
      <div 
        style={isMounted && window.innerWidth >= 640 && !isMaximized ? { 
          transform: `translate(${position.x}px, ${position.y}px)`,
          transition: isDragging ? "none" : undefined 
        } : undefined}
        className={`relative box-border flex flex-col shrink-0 grow-0 overflow-hidden bg-base-100 shadow-xl pointer-events-auto ${
          isDragging ? "" : "transition-all duration-200"
        } ${
          isMaximized
            ? "w-full h-full max-w-none max-h-none sm:w-screen sm:h-screen sm:max-h-none sm:rounded-none sm:border-0"
            : "w-full h-full max-w-5xl sm:h-[min(680px,calc(100vh-2rem))] sm:min-h-0 md:h-[min(620px,calc(100vh-2rem))] lg:h-[min(680px,calc(100vh-2rem))] sm:max-h-[calc(100vh-2rem)] sm:rounded-lg sm:border sm:border-base-200 md:max-w-2xl lg:max-w-5xl"
        }`}
      >
        {/* Unified Settings Header - using theme color, not too dark */}
        <div
          onMouseDown={handleMouseDown}
          onDoubleClick={(e) => {
            if ((e.target as HTMLElement).closest("button")) return;
            toggleMaximize();
          }}
          onTouchEnd={handleHeaderDoubleTap}
          className={`flex items-center justify-between px-4 py-2.5 border-b border-base-300 bg-base-200 text-base-content select-none shrink-0 ${
            "cursor-default"
          }`}
        >
          {/* Left: Close / Back Button */}
          <div className="flex items-center justify-start gap-1">
            {mobileView === "details" && typeof window !== "undefined" && window.innerWidth < 640 && (
              <button
                onClick={() => setMobileView("list")}
                className="p-1 hover:bg-base-300 rounded-lg transition-colors cursor-pointer text-base-content -ml-2"
                aria-label="Back"
              >
                <ChevronLeft className="w-5 h-5 shrink-0" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer text-red-400 hover:text-red-500"
              aria-label="Close settings"
            >
              <X className="w-5 h-5 shrink-0" />
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center justify-end gap-1">
            <ProfilePopover />
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="hidden sm:inline-flex p-1 hover:bg-base-300 rounded-lg transition-colors cursor-pointer text-base-content/70 hover:text-base-content"
              aria-label={isMaximized ? "Restore" : "Maximize"}
            >
              {isMaximized ? (
                <Minimize2 className="w-4 h-4 shrink-0" />
              ) : (
                <Maximize2 className="w-4 h-4 shrink-0" />
              )}
            </button>
          </div>
        </div>

        {/* Content Body Row */}
        <div className="flex flex-1 min-h-0 overflow-hidden w-full">
          {/* Left Panel: Navigation Categories list */}
          <div className={`w-full sm:w-56 md:w-60 lg:w-[280px] bg-base-100 border-r border-base-200 flex flex-col justify-between shrink-0 select-none overflow-hidden ${mobileView === "details" ? "hidden sm:flex" : "flex"
            }`}>
            <div className="flex flex-col gap-6 h-full overflow-hidden pt-4">
              {/* Navigation Tabs */}
              <ul className="menu bg-base-100 px-3 md:px-4 py-0 gap-1.5 flex-1 grid grid-cols-1 w-full overflow-y-auto">
                {[
                  { id: "appearance", label: "Interface", desc: "Theme & interface font", icon: Eye },
                  { id: "editor", label: "Editor", desc: "Writing & draft preferences", icon: PenLine },
                  { id: "layout", label: "Layout & Reading", desc: "List styling & reading bar", icon: Layout },
                  { id: "search", label: "Search Preferences", desc: "Behavior & history limit", icon: Search },
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
                        className={`flex items-start gap-2.5 md:gap-3 p-2 md:p-2.5 rounded-lg transition-all duration-200 cursor-pointer w-full text-left ${isAct
                          ? "bg-primary! text-primary-content!"
                          : "text-base-content hover:bg-base-200 bg-transparent"
                          }`}
                      >
                        <IconComponent className={`h-4.5 w-4.5 mt-0.5 shrink-0 transition-colors duration-200 ${isAct ? "text-primary-content" : "text-base-content/70"}`} />
                        <div className="min-w-0 flex-1">
                          <span className="block truncate text-[12.5px] leading-tight font-bold">{tab.label}</span>
                          <span className={`block truncate md:whitespace-normal text-[11px] font-medium leading-normal mt-0.5 ${isAct ? "text-primary-content/90" : "text-base-content/70"}`}>
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

            {/* Active Category Settings Content */}
            <div className="flex-1 p-4 md:p-5 lg:p-6 overflow-y-auto min-h-0 space-y-6 bg-base-100">

            {/* Tab: Appearance */}
            {activeTab === "appearance" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <h4 className="text-[13px] font-bold text-base-content">Interface Settings</h4>
                  <p className="text-[11px] text-base-content/60">Configure theme and the interface font used across the app.</p>
                </div>

                <div className="space-y-4 bg-base-200/40 p-3.5 md:p-4 rounded-xl border border-base-200">
                  {/* Interface Font Style */}
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-base-content block">Interface Font Style</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "sans", label: "Sans-Serif" },
                        { id: "serif", label: "Serif" },
                        { id: "mono", label: "Monospace" }
                      ].map((fontItem) => {
                        const isSel = interfaceFontStyle === fontItem.id;
                        return (
                          <button
                            key={fontItem.id}
                            onClick={() => handleSaveInterfaceFontStyle(fontItem.id)}
                            className={`flex items-center justify-center px-2 md:px-3 py-2 rounded-lg text-[11px] md:text-xs font-semibold border transition-all duration-150 cursor-pointer active:scale-95 ${isSel
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
                            className={`flex items-center justify-center px-2 md:px-3 py-2 rounded-lg text-[11px] md:text-xs font-semibold border transition-all duration-150 cursor-pointer active:scale-95 ${isSel
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
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {WIKI_THEMES.map((t) => {
                        const isSel = theme === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            role="radio"
                            aria-checked={isSel}
                            aria-label={t.label}
                            title={t.label}
                            onClick={() => handleSaveTheme(t.id)}
                            data-theme={t.id}
                            className={`group flex items-center gap-2 rounded-lg border-2 bg-base-100 px-2.5 py-2 transition-transform duration-150 cursor-pointer ${
                              isSel
                                ? "border-primary ring-2 ring-primary ring-offset-1 ring-offset-base-100"
                                : "border-base-300 hover:scale-[1.03]"
                            }`}
                          >
                            <div className="flex shrink-0 gap-0.5">
                              <span className="h-4 w-1.5 rounded-sm bg-primary" />
                              <span className="h-4 w-1.5 rounded-sm bg-secondary" />
                              <span className="h-4 w-1.5 rounded-sm bg-accent" />
                            </div>
                            <span className="truncate text-[11px] font-semibold text-base-content">
                              {t.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Editor Settings */}
            {activeTab === "editor" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <h4 className="text-[13px] font-bold text-base-content">Editor Settings</h4>
                  <p className="text-[11px] text-base-content/60">Configure the editor typography and writing experience. These are independent of the interface font.</p>
                </div>

                <div className="space-y-4 bg-base-200/40 p-3.5 md:p-4 rounded-xl border border-base-200">
                  {/* Editor Font Size */}
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-base-content block">Editor Font Size</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "small", label: "Small" },
                        { id: "normal", label: "Standard" },
                        { id: "large", label: "Large" }
                      ].map((f) => {
                        const isSel = editorFontSize === f.id;
                        return (
                          <button
                            key={f.id}
                            onClick={() => handleSaveEditorFontSize(f.id)}
                            className={`flex items-center justify-center px-2 md:px-3 py-2 rounded-lg text-[11px] md:text-xs font-semibold border transition-all duration-150 cursor-pointer active:scale-95 ${isSel
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

                  {/* Editor Font Style */}
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-base-content block">Editor Font Style</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "sans", label: "Sans-Serif" },
                        { id: "serif", label: "Serif" },
                        { id: "mono", label: "Monospace" }
                      ].map((fontItem) => {
                        const isSel = editorFontStyle === fontItem.id;
                        return (
                          <button
                            key={fontItem.id}
                            onClick={() => handleSaveEditorFontStyle(fontItem.id)}
                            className={`flex items-center justify-center px-2 md:px-3 py-2 rounded-lg text-[11px] md:text-xs font-semibold border transition-all duration-150 cursor-pointer active:scale-95 ${isSel
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

                  <div className="border-t border-base-300/60 my-1" />

                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="font-semibold text-base-content/85 block text-[12px]">Auto-save drafts</span>
                      <span className="text-[10px] text-base-content/50 block">Periodically save your work while editing.</span>
                    </div>
                    <Switch checked={editorAutosave} onChange={handleSaveEditorAutosave} />
                  </div>

                  <div className="border-t border-base-300/60 my-1" />

                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="font-semibold text-base-content/85 block text-[12px]">Spell check</span>
                      <span className="text-[10px] text-base-content/50 block">Highlight misspelled words while typing.</span>
                    </div>
                    <Switch checked={editorSpellCheck} onChange={handleSaveEditorSpellCheck} />
                  </div>

                  <div className="border-t border-base-300/60 my-1" />

                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="font-semibold text-base-content/85 block text-[12px]">Show word count</span>
                      <span className="text-[10px] text-base-content/50 block">Display a live word and character count while editing.</span>
                    </div>
                    <Switch checked={editorWordCount} onChange={handleSaveEditorWordCount} />
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

                <div className="space-y-3 bg-base-200/40 p-3.5 md:p-4 rounded-xl border border-base-200">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="font-semibold text-base-content/85 block text-[12px]">Compact lists view</span>
                      <span className="text-[10px] text-base-content/50 block">Removes card gaps to display more content items.</span>
                    </div>
                    <Switch checked={compactLayout} onChange={handleSaveCompact} />
                  </div>

                  <div className="border-t border-base-300/60 my-1" />

                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="font-semibold text-base-content/85 block text-[12px]">Show article reading progress bar</span>
                      <span className="text-[10px] text-base-content/50 block">Render a thin visual scrolling progress bar on top.</span>
                    </div>
                    <Switch checked={readingProgress} onChange={handleSaveProgress} />
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

                <div className="space-y-3 bg-base-200/40 p-3.5 md:p-4 rounded-xl border border-base-200">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="font-semibold text-base-content/85 block text-[12px]">Auto-focus search box</span>
                      <span className="text-[10px] text-base-content/50 block">Focus search queries automatically on page load.</span>
                    </div>
                    <Switch checked={autoFocusSearch} onChange={handleSaveAutoFocus} />
                  </div>

                  <div className="border-t border-base-300/60 my-1" />

                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="font-semibold text-base-content/85 block text-[12px]">Open links in new tab</span>
                      <span className="text-[10px] text-base-content/50 block">Default click redirection target will use _blank tab.</span>
                    </div>
                    <Switch checked={openInNewTab} onChange={handleSaveNewTab} />
                  </div>

                  <div className="border-t border-base-300/60 my-1" />

                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <span className="font-semibold text-base-content/85 block text-[12px]">Search history limit</span>
                      <span className="text-[10px] text-base-content/50 block">Select local query caching length.</span>
                    </div>
                    <select
                      value={historyLimit}
                      onChange={(e) => handleSaveHistoryLimit(Number(e.target.value))}
                      className="select select-bordered select-xs h-8 px-2 bg-base-100 border-base-300 text-xs font-semibold text-base-content/85 cursor-pointer shrink-0"
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

            {/* Tab: Cache & Offline */}
            {activeTab === "storage" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <h4 className="text-[13px] font-bold text-base-content">Cache & Offline Storage</h4>
                  <p className="text-[11px] text-base-content/50">Clear downloaded content or reset your local preferences.</p>
                </div>

                <div className="space-y-3 bg-base-200/40 p-3.5 md:p-4 rounded-xl border border-base-200">
                  <div className="flex items-center justify-between gap-3 flex-wrap md:flex-nowrap">
                    <div className="min-w-0">
                      <span className="font-semibold text-base-content/85 block text-[12px]">Clear offline content cache</span>
                      <span className="text-[10px] text-base-content/50 block">Remove downloaded articles, bookmarks &amp; cached data. They re-download when next viewed.</span>
                    </div>
                    <button
                      onClick={handleClearCache}
                      className={`btn btn-outline btn-xs font-semibold cursor-pointer shrink-0 ${cacheCleared ? "btn-success" : "btn-error"}`}
                    >
                      {cacheCleared ? (
                        <><Check className="w-3.5 h-3.5" /> Cleared</>
                      ) : (
                        <><Trash2 className="w-3.5 h-3.5" /> Clear Cache</>
                      )}
                    </button>
                  </div>
                  <div className="border-t border-base-300/60 my-1" />
                  <div className="flex items-center justify-between gap-3 flex-wrap md:flex-nowrap">
                    <div className="min-w-0">
                      <span className="font-semibold text-base-content/85 block text-[12px]">Reset all settings</span>
                      <span className="text-[10px] text-base-content/50 block">Restore theme, fonts, layout and every preference to their defaults.</span>
                    </div>
                    <button
                      onClick={handleResetSettings}
                      disabled={settingsReset}
                      className="btn btn-error btn-outline btn-xs font-semibold cursor-pointer shrink-0"
                    >
                      {settingsReset ? (
                        <><Check className="w-3.5 h-3.5" /> Resetting…</>
                      ) : (
                        <><RotateCcw className="w-3.5 h-3.5" /> Reset</>
                      )}
                    </button>
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

                <div className="space-y-3 bg-base-200/40 p-3.5 md:p-4 rounded-xl border border-base-200">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="font-semibold text-base-content/85 block text-[12px]">Enable interface animations</span>
                      <span className="text-[10px] text-base-content/50 block">Turn off transitions and motion effects for a faster, calmer interface.</span>
                    </div>
                    <Switch checked={animationsEnabled} onChange={handleSaveAnimations} />
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

                <div className="space-y-3 bg-base-200/40 p-3.5 md:p-4 rounded-xl border border-base-200">
                  <div className="flex items-center justify-between pb-2 border-b border-base-300/50">
                    <div>
                      <span className="font-semibold text-base-content/85 block text-[12px]">Software Build</span>
                      <span className="text-[10px] text-base-content/50 block">v{APP_VERSION}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-base-300/50">
                    <div>
                      <span className="font-semibold text-base-content/85 block text-[12px]">Application Engine</span>
                      <span className="text-[10px] text-base-content/50 block">Powered by Next.js 15 & Turbopack</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1.5 gap-3 flex-wrap md:flex-nowrap">
                    <div className="min-w-0">
                      <span className="font-semibold text-base-content/85 block text-[12px]">Source & Issues</span>
                      <span className="text-[10px] text-base-content/50 block">View the project repository and report issues.</span>
                    </div>
                    <div className="flex gap-2 flex-wrap shrink-0">
                      <a href={`${REPO_URL}#readme`} target="_blank" rel="noreferrer" className="btn btn-outline btn-xs font-semibold text-primary">Docs</a>
                      <a href={`${REPO_URL}/wiki`} target="_blank" rel="noreferrer" className="btn btn-outline btn-xs font-semibold text-primary">Wiki</a>
                      <a href={`${REPO_URL}/issues`} target="_blank" rel="noreferrer" className="btn btn-outline btn-xs font-semibold text-primary">Issues</a>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>



        </div>

      </div>
      </div>
    </div>
  );
}