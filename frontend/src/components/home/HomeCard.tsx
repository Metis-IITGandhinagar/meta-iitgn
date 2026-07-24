"use client";

import React from "react";

interface HomeCardProps {
  /** Card title shown in the header (icon renders inside the heading, like the mock). */
  title?: string;
  /** Optional icon rendered inside the title heading, next to the text. */
  icon?: React.ReactNode;
  /** Optional badge/pill rendered on the right side of the header. */
  badge?: React.ReactNode;
  /** Card body content (sits directly on the gradient, like the mock). */
  children: React.ReactNode;
  /** Optional footer content (e.g. CTA button) placed after the body. */
  footer?: React.ReactNode;
  /** When provided, the whole card becomes clickable (e.g. opens a modal). */
  onClick?: () => void;
  /** Extra classes on the outer card element (gradient + sizing). */
  className?: string;
  /** ID for accessibility */
  id?: string;
  /** Margin under the header (mock uses mb-6 for most, mb-4 for a few). */
  headerClassName?: string;
}

/**
 * Shared home card that mirrors the mock 1:1: a bold gradient frame with big
 * rounded corners, a gentle hover-lift, and content that sits DIRECTLY on the
 * gradient (no inner white panel). The gradient + sizing are passed via
 * `className` so each card uses the mock's exact literal utility classes.
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
  headerClassName = "mb-6",
}: HomeCardProps) {
  const showHeader = title || icon || badge;

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
      className={` overflow-hidden flex flex-col p-2.5  h-full font-inter text-[#111827] ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      {showHeader && (
        <div className={`flex justify-between items-center ${headerClassName} p-1`}>
          <h3 className="font-display font-bold text-xl flex items-center gap-2 text-[#111827]">
            {icon && <span className="shrink-0 text-[#111827]">{icon}</span>}
            {title}
          </h3>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0 font-inter">{children}</div>

      {footer}
    </div>
  );
}
