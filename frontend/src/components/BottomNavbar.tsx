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
  hidden?: boolean;
  mobileAction?: {
    icon: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    label: string;
    active?: boolean;
  };
}

export default function BottomNavbar({
  tabs,
  activeTab,
  className = "fixed bottom-6 left-1/2 transform -translate-x-1/2",
  style,
  hidden = false,
  mobileAction,
}: BottomNavbarProps) {
  return (
    <>
      {/* Bottom gradient scrim (mobile/tablet): fades page content into the theme colour behind the navbar */}
      <div
        aria-hidden
        className={`fixed inset-x-0 bottom-0 h-40 bg-gradient-to-t from-base-100 via-base-100/60 to-transparent lg:hidden pointer-events-none transition-opacity duration-300 z-[9998] ${hidden ? "opacity-0" : "opacity-100"}`}
      />
      <div
        style={style}
        className={`z-9999 w-[min(92vw,42rem)] transition-all duration-300 ${hidden ? "pointer-events-none translate-y-24 opacity-0" : "translate-y-0 opacity-100"} ${className}`}
      >
      <div className="relative flex items-center gap-3">
        <div className="relative flex min-w-0 flex-1 items-center overflow-hidden bg-base-100 border-2 border-base-300 shadow-[0_18px_44px_rgba(0,0,0,0.22)] rounded-full px-2 py-1 gap-1 select-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={tab.onClick}
                aria-label={tab.label}
                className={`relative z-10 flex flex-1 items-center justify-center rounded-full px-3 py-2.5 transition-all duration-200 group active:scale-95 ${
                  isActive
                    ? `${tab.colorClass ?? "bg-primary text-primary-content"} shadow-sm`
                    : `${tab.colorClass ?? "text-base-content/70 hover:bg-base-200 hover:text-base-content"}`
                }`}
              >
                <span className="relative flex items-center justify-center">
                  <Icon
                    className={`h-5 w-5 transition-transform duration-200 ${isActive ? "scale-105" : "group-hover:scale-105"}`}
                  />
                  {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white leading-none shadow-sm">
                      {tab.badgeCount}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {mobileAction && (
          <button
            type="button"
            onClick={mobileAction.onClick}
            aria-label={mobileAction.label}
            className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all duration-200 active:scale-95 ${
              mobileAction.active
                ? "bg-primary text-primary-content border-primary"
                : "bg-base-100 border-base-300 text-base-content/80 hover:bg-base-200 hover:text-base-content"
            }`}
          >
            {(() => {
              const ActionIcon = mobileAction.icon;
              return <ActionIcon className="relative z-10 h-6 w-6" />;
            })()}
          </button>
        )}
      </div>
    </div>
    </>
  );
}
