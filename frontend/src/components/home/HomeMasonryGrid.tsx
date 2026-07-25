"use client";

import React, { useState, useEffect, useRef } from "react";
import { Responsive as ResponsiveGridLayout, Layout, LayoutItem, ResponsiveLayouts, useContainerWidth } from "react-grid-layout";
import useSWR from "swr";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { GripVertical } from "lucide-react";
import { apiService } from "@/api";

export interface MasonryCardConfig {
  id: string;
  colSpan?: number;
  rowSpan?: number;
  content: React.ReactNode;
}

interface HomeMasonryGridProps {
  cards: MasonryCardConfig[];
  storageKey?: string;
  reorderEnabled?: boolean;
}

const DEFAULT_STORAGE_KEY = "meta_iitgn_home_card_order_v2";

export default function HomeMasonryGrid({
  cards,
  storageKey = DEFAULT_STORAGE_KEY,
  reorderEnabled = false,
}: HomeMasonryGridProps) {
  const { width, containerRef, mounted } = useContainerWidth();
  const [layouts, setLayouts] = useState<ResponsiveLayouts | null>(null);
  const [activeBreakpoint, setActiveBreakpoint] = useState<string>("lg");
  const isUserAction = useRef(false);

  const { data: globalSetting } = useSWR("site_settings_homepage_layout", async () => {
    try {
      const res = await apiService.getSetting("homepage_layout");
      console.log("SWR fetched global setting:", res);
      return res;
    } catch (e) {
      console.error("SWR global setting error:", e);
    }
    return null;
  });

  const buildDefaultLayout = (cols: number) => {
    const occupancy: boolean[][] = [];
    const layout: LayoutItem[] = [];

    const isFree = (x: number, y: number, w: number, h: number) => {
      for (let row = y; row < y + h; row += 1) {
        for (let col = x; col < x + w; col += 1) {
          if ((occupancy[row] ?? [])[col]) return false;
        }
      }
      return true;
    };

    const occupy = (x: number, y: number, w: number, h: number) => {
      for (let row = y; row < y + h; row += 1) {
        if (!occupancy[row]) occupancy[row] = [];
        for (let col = x; col < x + w; col += 1) {
          occupancy[row][col] = true;
        }
      }
    };

    const placeCard = (card: MasonryCardConfig) => {
      const w = Math.max(1, Math.min(card.colSpan ?? 1, cols));
      const h = Math.max(1, card.rowSpan ?? 1);

      for (let y = 0; ; y += 1) {
        for (let x = 0; x <= cols - w; x += 1) {
          if (!isFree(x, y, w, h)) continue;
          occupy(x, y, w, h);
          layout.push({
            i: card.id,
            x,
            y,
            w,
            h,
            minW: 1,
            maxW: cols,
            minH: 1,
            maxH: 4,
          });
          return;
        }
      }
    };

    cards.forEach(placeCard);
    return layout;
  };

  const buildLayoutMap = (baseLayouts?: ResponsiveLayouts) => {
    const lg = baseLayouts?.lg ?? buildDefaultLayout(4);
    return lockLayoutItems({
      lg,
      md: baseLayouts?.md ?? buildDefaultLayout(3),
      sm: baseLayouts?.sm ?? buildDefaultLayout(2),
      xs: baseLayouts?.xs ?? buildDefaultLayout(2),
      xxs: baseLayouts?.xxs ?? buildDefaultLayout(2),
    });
  };

  const lockLayoutItems = (layoutGroups: ResponsiveLayouts) =>
    Object.fromEntries(
      Object.entries(layoutGroups).map(([breakpoint, items]) => [
        breakpoint,
        items?.map((item) => ({
          ...item,
          static: !reorderEnabled,
          isDraggable: reorderEnabled,
          isResizable: reorderEnabled,
        })),
      ])
    ) as ResponsiveLayouts;

  useEffect(() => {
    setLayouts((current) => (current ? lockLayoutItems(current) : current));
    // Keep drag state in sync when the Customize toggle changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reorderEnabled]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      const enforceMax = (layoutArray: LayoutItem[], cols = 4) =>
        layoutArray.map((item) => ({ ...item, maxW: cols, maxH: 4 }));

      if (saved) {
        isUserAction.current = true;
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setLayouts(buildLayoutMap({ lg: enforceMax(parsed) }));
        } else {
          const enforcedParsed: ResponsiveLayouts = {};
          Object.keys(parsed).forEach(key => {
            enforcedParsed[key] = enforceMax(parsed[key], key === "lg" ? 4 : 4);
          });
          setLayouts(buildLayoutMap(enforcedParsed));
        }
      } else if (globalSetting?.data) {
        // Use global setting if user has no local layout
        const parsed = typeof globalSetting.data === 'string' ? JSON.parse(globalSetting.data) : globalSetting.data;
        if (Array.isArray(parsed)) {
          setLayouts(buildLayoutMap({ lg: enforceMax(parsed) }));
        } else {
          const enforcedParsed: ResponsiveLayouts = {};
          Object.keys(parsed).forEach(key => {
            enforcedParsed[key] = enforceMax(parsed[key], key === "lg" ? 4 : 4);
          });
          setLayouts(buildLayoutMap(enforcedParsed));
        }
      } else {
        // Generate default layout if nothing is saved locally or globally
        setLayouts(buildLayoutMap());
      }
    } catch (e) {
      console.error("Failed to load portal layout:", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, globalSetting]);

  const handleLayoutChange = (currentLayout: Layout, allLayouts: ResponsiveLayouts) => {
    let layoutsToSave = { ...allLayouts };
    
    // To ensure changes on larger screens dynamically cascade to smaller screens,
    // we delete the cached layouts of smaller screens whenever a larger screen is edited.
    if (activeBreakpoint === "lg") {
      layoutsToSave = { lg: allLayouts.lg };
    } else if (activeBreakpoint === "md") {
      layoutsToSave = { lg: allLayouts.lg, md: allLayouts.md };
    } else if (activeBreakpoint === "sm") {
      layoutsToSave = { lg: allLayouts.lg, md: allLayouts.md, sm: allLayouts.sm };
    } else if (activeBreakpoint === "xs") {
      layoutsToSave = { lg: allLayouts.lg, md: allLayouts.md, sm: allLayouts.sm, xs: allLayouts.xs };
    }

    setLayouts(buildLayoutMap(layoutsToSave));
    if (isUserAction.current) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(layoutsToSave));
      } catch (e) {
        console.error("Failed to save portal layout:", e);
      }
    }
  };

  let currentCols = 4;
  if (width < 768) currentCols = 2;
  else if (width < 996) currentCols = 2;
  else if (width < 1200) currentCols = 3;
  
  const gap = 24;
  
  let dynamicRowHeight = 250;
  if (width > 0) {
    dynamicRowHeight = (width - gap * (currentCols - 1)) / currentCols;
  }

  return (
    <div ref={containerRef} className="relative mt-2 w-full">
      <style>{`
        .home-layout:not(.is-editing) .react-resizable-handle {
          display: none !important;
          pointer-events: none !important;
        }
      `}</style>
      {mounted && layouts && (
        <ResponsiveGridLayout
          key={`${globalSetting ? "has-global" : "no-global"}-${reorderEnabled ? "edit" : "view"}`}
          className={`home-layout ${reorderEnabled ? 'is-editing' : ''}`}
          width={width}
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 4, md: 3, sm: 2, xs: 2, xxs: 2 }}
          rowHeight={dynamicRowHeight}
          margin={[gap, gap]}
          containerPadding={[0, 0]}
          onLayoutChange={handleLayoutChange}
          onBreakpointChange={(bp) => setActiveBreakpoint(bp)}
          onDragStop={() => (isUserAction.current = true)}
          onResizeStop={() => (isUserAction.current = true)}
        >
          {cards.map((card) => (
            <div key={card.id} className="group relative @container h-full">
              <div className={`w-full h-full overflow-y-auto overflow-x-hidden no-scrollbar transition-all duration-150 ${reorderEnabled ? 'ring-2 ring-primary/30 ring-offset-2 ring-offset-base-100 scale-[0.98] pointer-events-none' : 'card-hover'} rounded-[2rem] bg-white`}>
                {reorderEnabled && (
                  <button
                    className="drag-handle absolute top-3 right-3 z-30 p-1.5 rounded-lg bg-white border border-gray-200 shadow-sm text-gray-900 hover:bg-gray-100 cursor-grab active:cursor-grabbing transition-opacity duration-150"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </button>
                )}
                <div className="w-full h-full flex flex-col [&>div]:h-full">
                  {card.content}
                </div>
              </div>
            </div>
          ))}
        </ResponsiveGridLayout>
      )}
    </div>
  );
}
