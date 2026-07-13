"use client";

import React from "react";

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  badgeCount?: number;
  colorClass?: string;
}

interface BottomNavbarProps {
  tabs: TabItem[];
  activeTab?: string;
  className?: string;
  style?: React.CSSProperties;
  showLabels?: boolean;
}

export default function BottomNavbar({
  tabs,
  activeTab,
  className = "fixed bottom-6 left-1/2 transform -translate-x-1/2",
  style,
  showLabels = true,
}: BottomNavbarProps) {
  return (
    <div
      style={style}
      className={`z-9999 w-[90%] max-w-lg transition-all duration-300 ${className}`}
    >
      <div className="bg-base-100/80 backdrop-blur-lg border border-base-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.12),0_10px_30px_rgba(0,0,0,0.06)] rounded-full px-3 py-2 flex items-center justify-around select-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={tab.onClick}
              className={`flex flex-col items-center gap-1 group cursor-pointer relative py-1 flex-1 transition-all duration-200 active:scale-95 ${
                isActive 
                  ? "text-primary font-extrabold" 
                  : tab.colorClass 
                    ? "text-base-content" 
                    : "text-base-content/50 hover:text-base-content/85"
              }`}
            >
              {/* Pill Backdrop for Active Icon */}
              <div
                className={`flex items-center justify-center px-5 py-1.5 rounded-full transition-all duration-300 ${
                  isActive
                    ? "bg-primary text-primary-content shadow-md shadow-primary/10 scale-105"
                    : tab.colorClass
                      ? tab.colorClass
                      : "hover:bg-base-200 text-base-content/70 hover:text-base-content"
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
              {showLabels && (
                <span className={`text-[8px] uppercase tracking-wider font-extrabold transition-all duration-200 ${
                  isActive 
                    ? "text-primary" 
                    : tab.colorClass 
                      ? "text-base-content/80 font-bold" 
                      : "text-base-content/40 group-hover:text-base-content/70"
                }`}>
                  {tab.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
