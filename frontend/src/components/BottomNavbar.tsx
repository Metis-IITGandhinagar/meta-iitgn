"use client";

import React from "react";

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  badgeCount?: number;
}

interface BottomNavbarProps {
  tabs: TabItem[];
  activeTab?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function BottomNavbar({
  tabs,
  activeTab,
  className = "fixed bottom-6 left-1/2 transform -translate-x-1/2",
  style,
}: BottomNavbarProps) {
  return (
    <div
      style={style}
      className={`z-9999 w-[90%] max-w-lg transition-all  duration-300 ${className}`}
    >
      <div className="bg-white/90 backdrop-blur-md border border-slate-200 shadow-[0_15px_40px_rgba(0,0,0,0.18),0_5px_15px_rgba(0,0,0,0.1)] rounded-full px-4 py-2 flex items-center justify-around select-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={tab.onClick}
              className="flex flex-col items-center gap-1 group cursor-pointer relative py-1 flex-1 transition-all duration-200 active:scale-95 text-slate-900"
            >
              {/* Material Design 3 Pill Backdrop for Active Icon */}
              <div
                className={`flex items-center justify-center px-5 py-1 rounded-full transition-all duration-300 ${
                  isActive
                    ? "bg-slate-200"
                    : "hover:bg-slate-100"
                }`}
              >
                <div className="relative">
                  <Icon className={`h-5 w-5 transition-transform duration-200 ${isActive ? "scale-105" : "group-hover:scale-105"}`} />
                  {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white leading-none shadow-sm">
                      {tab.badgeCount}
                    </span>
                  )}
                </div>
              </div>

              {/* Text Label */}
              <span className="text-[8px] uppercase tracking-wider font-black transition-all duration-200">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
