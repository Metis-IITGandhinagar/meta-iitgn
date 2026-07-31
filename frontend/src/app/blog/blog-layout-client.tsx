"use client";

import React, { useState } from "react";
import Navbar from "@/components/navs/Navbar";
import Sidebar from "@/components/navs/Sidebar";

export default function BlogLayoutClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative h-screen w-screen bg-base-100 overflow-hidden font-sans">
      {/* Top Navbar */}
      <div className="z-[10010] fixed top-0 left-0 right-0 transition-transform duration-300 ease-in-out">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      </div>

      {/* Main Container */}
      <div className="flex h-full w-full overflow-hidden relative">
        {/* Collapsible Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Children content area */}
        <div className="flex flex-col flex-1 h-full w-full min-w-full shrink-0 lg:shrink lg:min-w-0 lg:flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
