"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { TIERS } from "@/lib/constants";

export default function WikiLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTier, setCurrentTier] = useState<keyof typeof TIERS>("gold");

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-50/30 overflow-hidden font-sans">
      {/* Top Header Bar */}
      <Navbar 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        currentTier={currentTier}
        onChangeTier={(tier) => setCurrentTier(tier as keyof typeof TIERS)}
      />

      {/* Main Content Workspace */}
      <div className="flex flex-1 overflow-hidden w-full relative">
        {/* Left Collapsible Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          currentTier={currentTier}
          onChangeTier={setCurrentTier}
        />
        {children}
      </div>
    </div>
  );
}
