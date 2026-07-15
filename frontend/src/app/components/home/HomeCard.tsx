"use client";

import React from "react";

interface HomeCardProps {
  /** Card title shown in the header */
  title: string;
  /** Optional icon rendered next to the title */
  icon?: React.ReactNode;
  /** Optional badge/pill rendered on the right side of the header */
  badge?: React.ReactNode;
  /** Card body content */
  children: React.ReactNode;
  /** Optional footer content (e.g. CTA button) */
  footer?: React.ReactNode;
  /** When provided, the whole card becomes clickable (e.g. opens a modal). */
  onClick?: () => void;
  /** Extra classes on the outer card element */
  className?: string;
  /** ID for accessibility */
  id?: string;
  /** Kept for interface compatibility but ignored visually */
  accentColor?: string;
}

/**
 * Shared daisyUI card used throughout the home masonry grid.
 * Keeps padding, typography, border and shadow consistent.
 */
export default function HomeCard({
  title,
  icon,
  badge,
  children,
  footer,
  onClick,
  className = "",
  id,
}: HomeCardProps) {
  return (
    <div
      id={id}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`card card-bordered bg-base-100 border-base-200 shadow-depth shadow-depth-hover flex flex-col text-left w-full h-full ${onClick ? "cursor-pointer transition-colors hover:border-secondary/50" : ""} ${className}`}
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
        <div className="flex items-center gap-2">
          {icon && <span className="shrink-0 text-primary">{icon}</span>}
          <h3 className="text-sm font-black text-base-content font-serif leading-tight">
            {title}
          </h3>
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>

      {/* Divider */}
      <div className="border-t border-base-200 mx-5 shrink-0" />

      {/* Card body */}
      <div className="px-5 py-4 flex-1 min-h-0">{children}</div>

      {/* Card footer */}
      {footer && (
        <div className="px-5 pb-5 shrink-0">
          {footer}
        </div>
      )}
    </div>
  );
}
