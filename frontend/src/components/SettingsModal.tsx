"use client";

import React, { useState, useEffect } from "react";
import { X, Eye, Layout, Bell, Settings, ChevronLeft, Search, User, Shield, HelpCircle, HardDrive, Cpu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface SettingsModalProps {
  onClose: () => void;
  initialTab?: TabType;
}

type TabType = "appearance" | "layout" | "search" | "alerts" | "account" | "language" | "storage" | "performance" | "help";

export default function SettingsModal({ onClose, initialTab = "appearance" }: SettingsModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  
  // Mobile view navigation layer state: "list" shows settings categories, "details" shows the setting controls
  const [mobileView, setMobileView] = useState<"list" | "details">("list");
  
  // User settings states (persisted to localStorage)
  const [theme, setTheme] = useState("light");
  const [fontSize, setFontSize] = useState("normal");
  
  const [compactLayout, setCompactLayout] = useState(false);
  const [enableSound, setEnableSound] = useState(true);
  const [readingProgress, setReadingProgress] = useState(true);
  
  const [autoFocusSearch, setAutoFocusSearch] = useState(true);
  const [historyLimit, setHistoryLimit] = useState(10);
  const [openInNewTab, setOpenInNewTab] = useState(false);
  
  const [emailDigest, setEmailDigest] = useState(true);
  const [articleEditsAlert, setArticleEditsAlert] = useState(true);

  useEffect(() => {
    // Load settings from localStorage
    const savedTheme = localStorage.getItem("wiki_theme") || "light";
    const savedFontSize = localStorage.getItem("wiki_font_size") || "normal";
    
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
    }
  }, [initialTab]);

  const handleSaveTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("wiki_theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleSaveFontSize = (size: string) => {
    setFontSize(size);
    localStorage.setItem("wiki_font_size", size);
    const root = document.documentElement;
    root.classList.remove("text-sm-custom", "text-md-custom", "text-lg-custom");
    if (size === "small") root.classList.add("text-sm-custom");
    else if (size === "large") root.classList.add("text-lg-custom");
    else root.classList.add("text-md-custom");
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
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? "bg-blue-600" : "bg-gray-200 dark:bg-slate-800"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );

  return (
    <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-transparent overflow-hidden font-sans p-0 sm:p-4">
      {/* Settings Dialog Card - Exactly matches sidebar height alignment & gray borders */}
      <div className="relative w-full h-full sm:h-[600px] sm:min-h-[600px] sm:max-h-[600px] max-w-4xl bg-white border-0 sm:border border-gray-150 rounded-none sm:rounded-lg shadow-xl flex overflow-hidden animate-in zoom-in-95 duration-200 shrink-0 grow-0">
        
        {/* Left Panel: Navigation Categories list */}
        <div className={`w-full sm:w-[40%] bg-white border-r border-gray-150 p-4 flex flex-col justify-between shrink-0 select-none ${
          mobileView === "details" ? "hidden sm:flex" : "flex"
        }`}>
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex items-center justify-between gap-2 px-3 pb-1 border-b border-gray-100 sm:border-0">
              <div className="flex items-center gap-2">
                {/* Back / Close Button (renders as back chevron Left on mobile and desktop categories header) */}
                <button
                  onClick={onClose}
                  className="p-1 text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer -ml-2"
                  aria-label="Exit settings"
                >
                  <ChevronLeft className="w-6 h-6 shrink-0 text-black" />
                </button>
                <h2 className="text-[10px] font-bold tracking-wider text-black uppercase">
                  Settings
                </h2>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="space-y-0.5 overflow-y-auto pr-1 flex-1">
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
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as TabType);
                      setMobileView("details");
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-lg transition-all duration-200 cursor-pointer ${
                      isAct
                        ? "bg-blue-50 text-blue-700 font-bold"
                        : "text-gray-650 hover:text-gray-900 hover:bg-gray-50 bg-white sm:bg-transparent border sm:border-0 border-gray-100"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <IconComponent className={`h-4.5 w-4.5 mt-0.5 transition-colors duration-200 ${isAct ? "text-blue-600" : "text-gray-700"}`} />
                      <div>
                        <span className="block truncate text-[12.5px] text-gray-700 leading-tight">{tab.label}</span>
                        <span className={`block text-[9.5px] font-normal leading-normal mt-0.5 ${isAct ? "text-blue-600/70" : "text-gray-500"}`}>
                          {tab.desc}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Panel: Detail Configuration View */}
        <div className={`flex-1 flex flex-col justify-between overflow-hidden bg-white ${
          mobileView === "list" ? "hidden sm:flex" : "flex"
        }`}>
          
          {/* Header Action Bar */}
          <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
            <div className="flex items-center gap-1">
              {/* Back to Categories (Mobile Only) */}
              <button
                onClick={() => setMobileView("list")}
                className="p-1.5 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer sm:hidden -ml-2"
                aria-label="Back to settings list"
              >
                <ChevronLeft className="w-6 h-6 shrink-0 text-slate-800 dark:text-slate-200" />
              </button>
            </div>
            
            {/* Empty block replacement to remove the right side cross button */}
            <div className="w-5 h-5 hidden sm:block" />
          </div>

          {/* Active Category Settings Content */}
          <div className="flex-1 p-6 overflow-y-auto min-h-0 space-y-6 bg-white">
            
            {/* Tab: Appearance */}
            {activeTab === "appearance" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <h4 className="text-[13px] font-bold text-gray-800">Appearance Settings</h4>
                  <p className="text-[11px] text-gray-400">Configure visual themes, sizing scaling, and colors.</p>
                </div>
                
                <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-150">
                  {/* Theme Mode */}
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-gray-700 block">Interface Theme</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "light", label: "☀️ Light", class: "bg-white text-gray-700 border-gray-200 hover:bg-gray-50" },
                        { id: "dark", label: "🌙 Dark", class: "bg-gray-900 text-gray-200 border-gray-800 hover:bg-gray-800" },
                        { id: "sepia", label: "🍂 Sepia", class: "bg-amber-50/60 text-amber-950 border-amber-200 hover:bg-amber-100/50" }
                      ].map((t) => {
                        const isSel = theme === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => handleSaveTheme(t.id)}
                            className={`flex items-center justify-center px-3 py-2 rounded-lg text-xs font-semibold border transition-all duration-150 cursor-pointer active:scale-95 ${
                              isSel ? "border-blue-500 bg-blue-50 text-blue-700 font-bold" : "bg-white opacity-85 hover:opacity-100"
                            } ${t.class}`}
                          >
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t border-gray-150/60 my-1" />

                  {/* Font Size */}
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-gray-700 block">Article Font Size</label>
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
                            className={`flex items-center justify-center px-3 py-2 rounded-lg text-xs font-semibold border transition-all duration-150 cursor-pointer active:scale-95 ${
                              isSel 
                                ? "bg-blue-50 border-blue-500 text-blue-700 font-bold" 
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            {f.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t border-gray-150/60 my-1" />

                  {/* Font Style */}
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-gray-700 block">Article Font Style</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "sans", label: "Sans-Serif" },
                        { id: "serif", label: "Serif" },
                        { id: "mono", label: "Monospace" }
                      ].map((fontItem) => {
                        const isSel = localStorage.getItem("wiki_font_style") === fontItem.id || (fontItem.id === "sans" && !localStorage.getItem("wiki_font_style"));
                        return (
                          <button
                            key={fontItem.id}
                            onClick={() => {
                              localStorage.setItem("wiki_font_style", fontItem.id);
                              window.dispatchEvent(new Event("storage"));
                            }}
                            className={`flex items-center justify-center px-3 py-2 rounded-lg text-xs font-semibold border transition-all duration-150 cursor-pointer active:scale-95 ${
                              isSel 
                                ? "bg-blue-50 border-blue-500 text-blue-700 font-bold" 
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            {fontItem.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t border-gray-150/60 my-1" />

                  {/* Accent Color */}
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-gray-700 block">Accent Color</label>
                    <div className="flex flex-wrap gap-2.5 pt-1">
                      {[
                        { id: "blue", bgClass: "bg-blue-600" },
                        { id: "indigo", bgClass: "bg-indigo-600" },
                        { id: "violet", bgClass: "bg-violet-600" },
                        { id: "pink", bgClass: "bg-pink-600" },
                        { id: "rose", bgClass: "bg-rose-600" },
                        { id: "emerald", bgClass: "bg-emerald-600" },
                        { id: "teal", bgClass: "bg-teal-650" },
                        { id: "orange", bgClass: "bg-orange-500" },
                        { id: "amber", bgClass: "bg-amber-600" }
                      ].map((colorItem) => {
                        const isSel = localStorage.getItem("wiki_accent_color") === colorItem.id || (colorItem.id === "blue" && !localStorage.getItem("wiki_accent_color"));
                        return (
                          <button
                            key={colorItem.id}
                            onClick={() => {
                              localStorage.setItem("wiki_accent_color", colorItem.id);
                              window.dispatchEvent(new Event("storage"));
                            }}
                            className={`w-6 h-6 rounded-full cursor-pointer transition-all active:scale-90 ${colorItem.bgClass} ${
                              isSel ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "opacity-80 hover:opacity-100"
                            }`}
                            aria-label={`Accent ${colorItem.id}`}
                          />
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
                  <h4 className="text-[13px] font-bold text-gray-800">Layout Settings</h4>
                  <p className="text-[11px] text-gray-400">Configure presentation structure and micro-interactions.</p>
                </div>
                
                <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-150">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-gray-700 block text-[12px]">Compact lists view</span>
                      <span className="text-[10px] text-gray-400 block">Removes card gaps to display more content items.</span>
                    </div>
                    <Switch checked={compactLayout} onChange={handleSaveCompact} />
                  </div>
                  
                  <div className="border-t border-gray-150/60 my-1" />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-gray-700 block text-[12px]">Show article reading progress bar</span>
                      <span className="text-[10px] text-gray-400 block">Render a thin visual scrolling progress bar on top.</span>
                    </div>
                    <Switch checked={readingProgress} onChange={handleSaveProgress} />
                  </div>
                  
                  <div className="border-t border-gray-150/60 my-1" />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-gray-700 block text-[12px]">Enable micro sound effects</span>
                      <span className="text-[10px] text-gray-400 block">Play subtle mechanical sounds on clicks.</span>
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
                  <h4 className="text-[13px] font-bold text-gray-800">Search Engine Behavior</h4>
                  <p className="text-[11px] text-gray-400">Customize lookup defaults and query indexing preferences.</p>
                </div>
                
                <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-150">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-gray-700 block text-[12px]">Auto-focus search box</span>
                      <span className="text-[10px] text-gray-400 block">Focus search queries automatically on page load.</span>
                    </div>
                    <Switch checked={autoFocusSearch} onChange={handleSaveAutoFocus} />
                  </div>
                  
                  <div className="border-t border-gray-150/60 my-1" />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-gray-700 block text-[12px]">Open links in new tab</span>
                      <span className="text-[10px] text-gray-400 block">Default click redirection target will use _blank tab.</span>
                    </div>
                    <Switch checked={openInNewTab} onChange={handleSaveNewTab} />
                  </div>
                  
                  <div className="border-t border-gray-150/60 my-1" />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-gray-700 block text-[12px]">Search history limit</span>
                      <span className="text-[10px] text-gray-400 block">Select local query caching length.</span>
                    </div>
                    <select
                      value={historyLimit}
                      onChange={(e) => handleSaveHistoryLimit(Number(e.target.value))}
                      className="h-8 px-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
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
                  <h4 className="text-[13px] font-bold text-gray-800">Weekly Summaries & Digests</h4>
                  <p className="text-[11px] text-gray-400">Set up alert schedules for edits on bookmarked articles.</p>
                </div>
                
                <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-150">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-gray-700 block text-[12px]">Weekly highlights email</span>
                      <span className="text-[10px] text-gray-400 block">Weekly edits summary and ranking updates.</span>
                    </div>
                    <Switch checked={emailDigest} onChange={handleSaveDigest} />
                  </div>
                  
                  <div className="border-t border-gray-150/60 my-1" />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-gray-700 block text-[12px]">Bookmarked page edit alerts</span>
                      <span className="text-[10px] text-gray-400 block">Get instant alerts when bookmarked articles are updated.</span>
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
                  <h4 className="text-[13px] font-bold text-gray-800">Account & Security</h4>
                  <p className="text-[11px] text-gray-400">Configure login sessions, API tokens, and access roles.</p>
                </div>
                
                <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-150">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-gray-700 block text-[12px]">Remember active session</span>
                      <span className="text-[10px] text-gray-400 block">Keep you signed in on this browser for 30 days.</span>
                    </div>
                    <Switch checked={true} onChange={() => {}} />
                  </div>
                  <div className="border-t border-gray-150/60 my-1" />
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-gray-700 block text-[12px]">Two-Factor authentication</span>
                      <span className="text-[10px] text-gray-400 block">Request verification codes when logging in.</span>
                    </div>
                    <Switch checked={false} onChange={() => {}} />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Language */}
            {activeTab === "language" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <h4 className="text-[13px] font-bold text-gray-800">Language & Translation</h4>
                  <p className="text-[11px] text-gray-400">Select language preferences for the portal content.</p>
                </div>
                
                <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-150">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-gray-700 block text-[12px]">Default language</span>
                      <span className="text-[10px] text-gray-400 block">Pick language for general interface buttons.</span>
                    </div>
                    <select className="h-8 px-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer">
                      <option value="en">English (US)</option>
                      <option value="hi">Hindi (हिन्दी)</option>
                      <option value="es">Spanish</option>
                    </select>
                  </div>
                  <div className="border-t border-gray-150/60 my-1" />
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-gray-700 block text-[12px]">Auto-translate articles</span>
                      <span className="text-[10px] text-gray-400 block">Translate external resources dynamically.</span>
                    </div>
                    <Switch checked={false} onChange={() => {}} />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Cache & Offline */}
            {activeTab === "storage" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <h4 className="text-[13px] font-bold text-gray-800">Cache & Offline Storage</h4>
                  <p className="text-[11px] text-gray-400">Manage downloaded articles and saved browser cache space.</p>
                </div>
                
                <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-150">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-gray-700 block text-[12px]">Save bookmarked pages offline</span>
                      <span className="text-[10px] text-gray-400 block">Downloads bookmarks for reading without internet.</span>
                    </div>
                    <Switch checked={true} onChange={() => {}} />
                  </div>
                  <div className="border-t border-gray-150/60 my-1" />
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-gray-700 block text-[12px]">Clear browser settings cache</span>
                      <span className="text-[10px] text-gray-400 block">Wipe out configuration settings history.</span>
                    </div>
                    <button className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded text-xs font-semibold hover:bg-red-100 cursor-pointer">Clear Cache</button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Performance */}
            {activeTab === "performance" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <h4 className="text-[13px] font-bold text-gray-800">Performance</h4>
                  <p className="text-[11px] text-gray-400">Manage rendering preferences for maximum system speed.</p>
                </div>
                
                <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-150">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-gray-700 block text-[12px]">Enable interface animations</span>
                      <span className="text-[10px] text-gray-400 block">Disable transitions to boost rendering speed.</span>
                    </div>
                    <Switch checked={true} onChange={() => {}} />
                  </div>
                  <div className="border-t border-gray-150/60 my-1" />
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-gray-700 block text-[12px]">Hardware acceleration</span>
                      <span className="text-[10px] text-gray-400 block">Leverage GPU computing for loading articles.</span>
                    </div>
                    <Switch checked={true} onChange={() => {}} />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Help & About */}
            {activeTab === "help" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <h4 className="text-[13px] font-bold text-gray-800">Help & About</h4>
                  <p className="text-[11px] text-gray-400">View wiki version specifications and licensing references.</p>
                </div>
                
                {/* Centered mI circle logo */}
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="w-16 h-16 bg-blue-400 text-white rounded-full flex items-center justify-center font-serif font-black text-2xl shadow-sm">
                    mI
                  </div>
                  <span className="block text-xs font-bold text-gray-500 mt-2">META IITGN</span>
                </div>

                <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-150">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200/50">
                    <div>
                      <span className="font-semibold text-gray-700 block text-[12px]">Software Build</span>
                      <span className="text-[10px] text-gray-400 block">v1.12.4-stable</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between py-1.5 border-b border-gray-200/50">
                    <div>
                      <span className="font-semibold text-gray-700 block text-[12px]">Application Engine</span>
                      <span className="text-[10px] text-gray-400 block">Powered by Next.js 15 & Turbopack</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1.5">
                    <div>
                      <span className="font-semibold text-gray-700 block text-[12px]">Resources & Licenses</span>
                      <span className="text-[10px] text-gray-400 block">Read system instructions and project code rules.</span>
                    </div>
                    <div className="flex gap-2">
                      <a href="https://github.com" target="_blank" rel="noreferrer" className="px-2.5 py-1 bg-white border border-gray-200 rounded text-[10px] font-semibold text-blue-600 hover:bg-gray-50">Docs</a>
                      <a href="https://github.com" target="_blank" rel="noreferrer" className="px-2.5 py-1 bg-white border border-gray-200 rounded text-[10px] font-semibold text-blue-600 hover:bg-gray-50">License</a>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Bottom Action Footer */}
          <div className="p-4 border-t border-gray-100 flex items-center justify-end shrink-0 bg-white">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs cursor-pointer transition-all duration-150 active:scale-98 text-xs"
            >
              Save Preferences
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
