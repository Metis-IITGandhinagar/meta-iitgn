"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Trophy, GitBranch, BookOpen, Play } from "lucide-react";
import BottomNavbar from "@/components/navs/BottomNavbar";

// ---------------------------------------------------------------------------
// Lazy-load heavy section components to keep initial bundle small
// ---------------------------------------------------------------------------
const UpcomingContests = dynamic(() => import("@/components/competitions/UpcomingContests"), { ssr: false });
const GitHubExplorer   = dynamic(() => import("@/components/competitions/OpenSources"),      { ssr: false });
const ResourcesSection = dynamic(() => import("@/components/competitions/ResourcesSection"), { ssr: false });
const VideosSection    = dynamic(() => import("@/components/competitions/VideosSection"),    { ssr: false });

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SectionId = "contests" | "opensource" | "resources" | "videos";

interface Tab {
  id:    SectionId;
  label: string;
  icon:  React.ComponentType<{ className?: string }>;
}

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const TABS: Tab[] = [
  { id: "contests",   label: "Contests",    icon: Trophy    },
  { id: "opensource", label: "Open Source", icon: GitBranch },
  { id: "resources",  label: "Resources",   icon: BookOpen  },
  { id: "videos",     label: "Videos",      icon: Play      },
];

// ---------------------------------------------------------------------------
// Scroll-hide threshold (matches home page)
// ---------------------------------------------------------------------------
const SCROLL_THRESHOLD = 8;

// ---------------------------------------------------------------------------
// Competitions page
// ---------------------------------------------------------------------------

export default function CompetitionsPage() {
  const [activeSection,   setActiveSection]   = useState<SectionId>("contests");
  const [mobileNavHidden, setMobileNavHidden] = useState(false);

  // Ref for the scrollable content div (scroll listener lives here, not window)
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  // ---------------------------------------------------------------------------
  // Scroll-hide logic — mirrors home page but on the inner div instead of window
  // ---------------------------------------------------------------------------
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const currentScrollY = el.scrollTop;
    const delta = currentScrollY - lastScrollY.current;

    if (currentScrollY < 10) {
      // Near the top — always show nav
      setMobileNavHidden(false);
    } else if (delta > SCROLL_THRESHOLD) {
      // Scrolling down — hide nav
      setMobileNavHidden(true);
    } else if (delta < -SCROLL_THRESHOLD) {
      // Scrolling up — show nav
      setMobileNavHidden(false);
    }

    lastScrollY.current = currentScrollY;
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Reset: show nav whenever the user switches tabs (new section starts at top)
  const handleTabChange = useCallback((id: SectionId) => {
    setActiveSection(id);
    setMobileNavHidden(false);
    // Scroll content back to top so the new section starts fresh
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    lastScrollY.current = 0;
  }, []);

  // ---------------------------------------------------------------------------
  // BottomNavbar tab map
  // ---------------------------------------------------------------------------
  const bottomTabs = TABS.map((tab) => ({
    id:      tab.id,
    label:   tab.label,
    icon:    tab.icon,
    onClick: () => handleTabChange(tab.id),
  }));

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <main className="h-dvh flex flex-col overflow-hidden w-dvw mt-16">
      {/* ── Desktop top pill-nav ── */}
      <div className="hidden lg:flex sticky mx-auto w-fit top-3 z-30 items-center gap-1 transition-all duration-300 px-4 py-1.5 rounded-full select-none -mb-11 bg-base-200/80 backdrop-blur-xl border border-base-300 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)]">
        {TABS.map((tab) => {
          const Icon     = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-primary text-primary-content border border-transparent shadow-xs"
                  : "text-base-content/70 hover:bg-base-300 hover:text-base-content"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>


      {/* ── Scrollable content area (scroll listener attached here) ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 py-5 pb-32 lg:pb-8">
          {/* Desktop: extra top padding to clear the floating pill nav */}
          <div className="hidden lg:block h-8" />

          {activeSection === "contests"   && <UpcomingContests />}
          {activeSection === "opensource" && <GitHubExplorer   />}
          {activeSection === "resources"  && <ResourcesSection />}
          {activeSection === "videos"     && <VideosSection     />}
        </div>
      </div>

      {/* ── Mobile bottom navbar (hidden prop drives the slide-out animation) ── */}
      <BottomNavbar
        tabs={bottomTabs}
        activeTab={activeSection}
        hidden={mobileNavHidden}
        className="fixed lg:hidden bottom-6 left-1/2 -translate-x-1/2 z-[9999]"
      />
    </main>
  );
}
