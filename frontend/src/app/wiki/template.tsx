"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { TIERS } from "@/lib/constants";

export default function WikiLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTier, setCurrentTier] = useState<keyof typeof TIERS>("gold");
  const [hideNavbar, setHideNavbar] = useState(false);

  const pathname = usePathname();
  const isProfileReadme =
    pathname?.split("/").pop()?.startsWith("profile-") ||
    pathname?.split("/")[2] === "profile";

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
    <div className="relative h-screen w-screen bg-base-100 overflow-hidden font-sans">
      {/* Top Header Bar - Overlayed */}
      {!hideNavbar && (
        <div className="z-[10010] fixed top-0 left-0 right-0 transition-transform duration-300 ease-in-out">
          <Navbar 
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
            currentTier={currentTier}
            onChangeTier={(tier) => setCurrentTier(tier as keyof typeof TIERS)}
          />
        </div>
      )}

      {/* Main Content Workspace - Starts from Top 0 */}
      <div className="flex h-full w-full overflow-hidden relative">
        {/* Left Collapsible Sidebar */}
        {!isProfileReadme && (
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentTier={currentTier}
          onChangeTier={setCurrentTier}
        />
        )}
        <div className={`flex flex-col lg:flex-row flex-1 h-full w-full min-w-full shrink-0 lg:shrink lg:flex-1 overflow-hidden transition-transform duration-300 ease-in-out`}>
          {children}
        </div>
      </div>
    </div>
  );
}
