"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { TIERS } from "@/lib/constants";

export default function WikiLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTier, setCurrentTier] = useState<keyof typeof TIERS>("gold");
  const [hideNavbar, setHideNavbar] = useState(false);

  useEffect(() => {
    // Sync state if window is available
    if (typeof window !== "undefined") {
      const showHistory = () => setHideNavbar(true);
      const hideHistory = () => setHideNavbar(false);
      window.addEventListener("show-wiki-history", showHistory);
      window.addEventListener("show-wiki-revisions", showHistory);
      window.addEventListener("show-wiki-pending", showHistory);
      window.addEventListener("hide-wiki-history", hideHistory);
      return () => {
        window.removeEventListener("show-wiki-history", showHistory);
        window.removeEventListener("show-wiki-revisions", showHistory);
        window.removeEventListener("show-wiki-pending", showHistory);
        window.removeEventListener("hide-wiki-history", hideHistory);
      };
    }
  });

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-50/30 overflow-hidden font-sans">
      {/* Top Header Bar */}
      {!hideNavbar && (
        <div className={`z-45 relative transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-80 lg:translate-x-0" : "translate-x-0"
        }`}>
          <Navbar 
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
            currentTier={currentTier}
            onChangeTier={(tier) => setCurrentTier(tier as keyof typeof TIERS)}
          />
        </div>
      )}

      {/* Main Content Workspace */}
      <div className="flex flex-1 overflow-hidden w-full relative">
        {/* Left Collapsible Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          currentTier={currentTier}
          onChangeTier={setCurrentTier}
        />
        <div className={`flex flex-col lg:flex-row flex-1 h-full w-full min-w-full shrink-0 lg:shrink lg:flex-1 overflow-hidden transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-80 lg:translate-x-0" : "translate-x-0"
        }`}>
          {children}
        </div>
      </div>
    </div>
  );
}
