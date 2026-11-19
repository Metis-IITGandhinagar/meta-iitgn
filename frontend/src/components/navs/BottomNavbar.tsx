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
  className = "fixed bottom-5 left-1/2 transform -translate-x-1/2",
  style,
  hidden = false,
  mobileAction,
}: BottomNavbarProps) {
  return (
    <>
      <div
        style={style}
        className={`z-9999 w-[min(92vw,42rem)] transition-all duration-300 ${hidden ? "pointer-events-none translate-y-24 opacity-0" : "translate-y-0 opacity-100"} ${className}`}
      >
      <div className="relative flex items-center gap-3">
        <nav aria-label="Sections" className="relative flex min-w-0 flex-1 items-center overflow-hidden bg-base-100 border border-base-300 rounded-2xl p-1 gap-1 select-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            const isProfile = tab.id === "profile";

            return (
              <button
                key={tab.id}
                onClick={tab.onClick}
                aria-current={isActive ? "page" : undefined}
                className={`relative z-10 flex flex-1 flex-col items-center justify-center gap-0.5 min-h-12 rounded-xl px-2 py-1.5 transition-colors duration-200 group touch-manipulation ${
                  isActive
                    ? `${tab.colorClass ?? "bg-primary/10 text-primary"}`
                    : `${tab.colorClass ?? "text-base-content/70 hover:bg-base-200 hover:text-base-content"}`
                }`}
              >
                <span className="relative flex items-center justify-center">
                  <Icon
                    className={isProfile ? "h-5 w-5" : "h-[18px] w-[18px]"}
                  />
                  {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-error text-[11px] font-semibold text-error-content leading-none">
                      {tab.badgeCount}
                    </span>
                  )}
                </span>
                <span className="text-[11px] font-medium leading-none whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {mobileAction && (
          <button
            type="button"
            onClick={mobileAction.onClick}
            aria-label={mobileAction.label}
            className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border transition-colors duration-200 ${
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
