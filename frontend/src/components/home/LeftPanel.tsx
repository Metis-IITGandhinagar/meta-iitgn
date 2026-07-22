"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { apiService } from "@/api";
import { useAuth } from "@/hooks/useAuth";
import { useHomeStore } from "@/store/useHomeStore";
import { Menu, Heart, Settings, GripHorizontal } from "lucide-react";
import Sidebar from "@/components/navs/Sidebar";
import { CategoryIcon, CATEGORY_COLORS } from "@/lib/categoryIcon";
import { BeautifulSearchBox } from "@/components/helpers/SearchDesign";
import { Responsive as ResponsiveGridLayout, Layout, useContainerWidth } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

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
  const [pageCount, setPageCount] = useState<number | null>(null);
  
  const [isEditingSizes, setIsEditingSizes] = useState(false);
  const [layout, setLayout] = useState<Layout[]>([]);
  const { width, containerRef, mounted } = useContainerWidth();

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

  // Load saved layout or initialize default
  useEffect(() => {
    try {
      const saved = localStorage.getItem("meta_iitgn_portal_layout_v3");
      if (saved) {
        setLayout(JSON.parse(saved));
      } else {
        const defaultPattern = [
          { w: 2, h: 2, x: 0, y: 0 },
          { w: 1, h: 1, x: 2, y: 0 },
          { w: 1, h: 1, x: 2, y: 1 },
          { w: 3, h: 1, x: 0, y: 2 },
          { w: 1, h: 2, x: 0, y: 3 },
          { w: 2, h: 1, x: 1, y: 3 },
          { w: 2, h: 1, x: 1, y: 4 },
        ];
        const defaultLayout = portalsToDisplay.slice(0, 10).map((portal, index) => {
          const p = defaultPattern[index % defaultPattern.length];
          const yOffset = Math.floor(index / 7) * 5;
          return {
            i: portal.slug,
            x: p.x !== undefined ? p.x : (index * 2) % 3,
            y: p.y !== undefined ? p.y + yOffset : index,
            w: p.w,
            h: p.h,
            minW: 1,
            maxW: 3,
            minH: 1,
            maxH: 3,
          };
        });
        setLayout(defaultLayout);
        try {
          localStorage.setItem("meta_iitgn_portal_layout_v3", JSON.stringify(defaultLayout));
        } catch (e) {
          console.error("Failed to save default portal layout:", e);
        }
      }
    } catch (e) {
      console.error("Failed to load portal layout:", e);
      setLayout([]);
    }
  }, [portalsToDisplay, categories]);

  // Enforce lock state dynamically, ignoring whatever was saved in local storage
  const enforcedLayout = useMemo(() => {
    return layout.map(l => ({
      ...l,
      static: !isEditingSizes,
      isDraggable: isEditingSizes,
      isResizable: isEditingSizes
    }));
  }, [layout, isEditingSizes]);

  const handleLayoutChange = (currentLayout: Layout[]) => {
    // Strip the dynamic flags before saving so they don't pollute local storage
    const cleanLayout = currentLayout.map(({ static: _s, isDraggable: _d, isResizable: _r, ...rest }) => rest);
    setLayout(cleanLayout);
    try {
      localStorage.setItem("meta_iitgn_portal_layout_v3", JSON.stringify(cleanLayout));
    } catch (e) {
      console.error("Failed to save portal layout:", e);
    }
  };



  useEffect(() => {
    async function loadStats() {
      try {
        const stats = await apiService.getPageStats();
        if (stats && typeof stats.totalPages === "number") {
          setPageCount(stats.totalPages);
          localStorage.setItem("wiki-total-pages-count", JSON.stringify(stats.totalPages));
        }
      } catch (err) {
        console.error("Failed to load page stats count:", err);
      }
    }
    loadStats();
  }, []);

  const renderPortalIcon = (iconName: string | undefined, color: string, iconClass?: string) => {
    if (iconClass) {
      return (
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconClass}`}>
          <CategoryIcon icon={iconName} size={20} />
        </div>
      );
    }
    return (
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
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
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setIsEditingSizes(!isEditingSizes)}
                className={`text-[10px] font-extrabold tracking-wider uppercase shrink-0 cursor-pointer transition-colors ${isEditingSizes ? 'text-error' : 'text-base-content/50 hover:text-base-content'}`}
              >
                {isEditingSizes ? "Done" : "Resize"}
              </button>
              <h2 className="text-xl font-serif font-bold text-base-content tracking-tight">
                Quick Portals
              </h2>
              {isLoggedIn ? (
                <button
                  onClick={() => setActiveOverlay("categories")}
                  className="text-[10px] font-extrabold text-primary hover:text-blue-700 hover:underline tracking-wider uppercase shrink-0 cursor-pointer"
                >
                  All
                </button>
              ) : (
                <div className="w-12" />
              )}
            </div>

            <div ref={containerRef} className="relative mt-2 w-full">
              <style>{`
                .layout:not(.is-editing) .react-resizable-handle {
                  display: none !important;
                  pointer-events: none !important;
                }
              `}</style>
              {mounted && (
                <ResponsiveGridLayout
                  className={`layout ${isEditingSizes ? 'is-editing' : ''}`}
                  width={width}
                  layouts={{ lg: enforcedLayout }}
                  breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                  cols={{ lg: 3, md: 3, sm: 3, xs: 3, xxs: 3 }}
                  rowHeight={80}
                  margin={[12, 12]}
                  onLayoutChange={handleLayoutChange}
                  isDraggable={isEditingSizes}
                  isResizable={isEditingSizes}
                  compactType="vertical"
                  useCSSTransforms={true}
                  measureBeforeMount={false}
                >
                {portalsToDisplay.slice(0, 10).map((portal, index) => {
                  const defaultPattern = [
                    { w: 2, h: 2, x: 0, y: 0 },
                    { w: 1, h: 1, x: 2, y: 0 },
                    { w: 1, h: 1, x: 2, y: 1 },
                    { w: 3, h: 1, x: 0, y: 2 },
                    { w: 1, h: 2, x: 0, y: 3 },
                    { w: 2, h: 1, x: 1, y: 3 },
                    { w: 2, h: 1, x: 1, y: 4 },
                  ];
                  const p = defaultPattern[index % defaultPattern.length];
                  const yOffset = Math.floor(index / 7) * 5;
                  
                  // Initial layout structure if not in saved state
                  const dataGrid = {
                    x: p.x !== undefined ? p.x : (index * 2) % 3,
                    y: p.y !== undefined ? p.y + yOffset : index,
                    w: p.w,
                    h: p.h,
                    minW: 1,
                    maxW: 3,
                    minH: 1,
                    maxH: 3
                  };

                  const theme = getEmojiCardStyle(portal.color);
                  
                  // Determine spans based on layout state if it exists, otherwise fallback to pattern
                  const savedItem = layout.find(l => l.i === portal.slug);
                  const w = savedItem ? savedItem.w : p.w;
                  const h = savedItem ? savedItem.h : p.h;
                  
                  const isTall = h > 1;
                  const isSquare = w === 1 && h === 1;

                  let layoutClasses = "";
                  if (isTall) {
                    layoutClasses = "flex flex-col justify-between items-start text-left";
                  } else if (isSquare) {
                    layoutClasses = "flex flex-col items-center justify-center text-center";
                  } else {
                    layoutClasses = "flex flex-row items-center gap-3 text-left";
                  }

                  const paddingClass = isTall ? "p-6" : isSquare ? "p-3" : "p-4";
                  
                  const interactingStyles = isEditingSizes 
                    ? 'cursor-grab active:cursor-grabbing hover:brightness-110' 
                    : 'card-hover cursor-pointer shadow-md hover:scale-105 hover:brightness-110';

                  return (
                    <div key={portal.slug} data-grid={dataGrid} className="group">
                      <div
                        className={`rounded-[2rem] overflow-hidden border-0 ${layoutClasses} ${paddingClass} ${theme.cardClass} ${interactingStyles} transition-all duration-100 ease-in-out w-full h-full relative font-inter ${isEditingSizes ? 'ring-2 ring-white/50 ring-dashed border border-white/20 shadow-lg' : ''}`}
                        onClick={(e) => {
                          if (isEditingSizes) {
                            e.preventDefault();
                            e.stopPropagation();
                            return;
                          }
                          setActivePortalCategory(portal.slug);
                          setActiveOverlay("portal");
                        }}
                      >
                        {renderPortalIcon(portal.iconName, portal.color, theme.iconClass)}
                        {isTall ? (
                          <span className={`text-xs font-extrabold ${theme.textClass} block mt-auto leading-tight drop-shadow-sm pointer-events-none`}>
                            {portal.name}
                          </span>
                        ) : isSquare ? (
                          <span className={`text-[10px] font-extrabold ${theme.textClass} mt-1.5 leading-tight break-words drop-shadow-sm pointer-events-none`}>
                            {portal.name}
                          </span>
                        ) : (
                          <span className={`text-xs font-bold ${theme.textClass} leading-tight drop-shadow-sm pointer-events-none`}>
                            {portal.name}
                          </span>
                        )}
                        
                        {isEditingSizes && (
                           <div className="absolute top-3 right-3 text-white/50 opacity-0 group-hover:opacity-100 transition-opacity">
                             <GripHorizontal className="w-4 h-4" />
                           </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </ResponsiveGridLayout>
              )}
            </div>
            {portalsToDisplay.length === 0 && (
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
