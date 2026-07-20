"use client";

import React, { ReactNode, CSSProperties } from "react";
import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";
import { ViewMode } from "@/hooks/useViewMode";
import { getIconBoxClass } from "@/lib/viewModes";

export interface UnifiedViewItemProps {
  view: ViewMode;
  href?: string;
  onClick?: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  iconBoxStyle?: CSSProperties;
  iconBoxClassName?: string;
  action?: ReactNode; // Footer actions for tiles, or right-side action for details/default
  topRightAction?: ReactNode; // Absolute overlay action for tiles/icons
  avatar?: ReactNode;
  meta?: ReactNode; // Top-header metadata (e.g. view count/dates in tiles view)
  noIcon?: boolean; // Suppress rendering of the icon box in tiles/details/default layouts
  className?: string;
}

// Fallback icon-box styling used when a caller doesn't supply its own
// `iconBoxClassName`. Deliberately neutral (base surface + base content
// colour) so the glyph stays visible in every DaisyUI theme — the old
// hardcoded `bg-primary/10 text-primary` vanished on themes whose
// `primary` is light. Callers pass `iconBoxClassName` for per-category
// colour, which now overrides this in every view branch.
const DEFAULT_ICON_BOX = "bg-base-200 border-base-300 text-base-content";

export default function UnifiedViewItem({
  view,
  href,
  onClick,
  title,
  subtitle,
  description,
  icon,
  iconBoxStyle,
  iconBoxClassName = "",
  action,
  topRightAction,
  avatar,
  meta,
  noIcon = false,
  className = "",
}: UnifiedViewItemProps) {
  const Wrapper = (href ? Link : "button") as any;
  const wrapperProps = href
    ? { href }
    : { type: "button" as const, onClick };

  const baseButtonReset = href ? "" : "w-full text-left bg-transparent border-0 p-0 font-inherit cursor-pointer focus:outline-none";

  // Icon views (icon-sm, icon-md, icon-lg, icon-xl)
  if (view.startsWith("icon-")) {
    const iconSizeClass = getIconBoxClass(view);
    return (
      <Wrapper
        {...wrapperProps}
        className={`group relative flex flex-col items-center justify-center gap-2 p-2 rounded-xl hover:bg-primary/5 hover:border hover:border-primary transition-all duration-200 text-center ${baseButtonReset} ${className}`}
      >
        <div
          className={`${iconSizeClass} rounded-xl border flex items-center justify-center shrink-0 transition-all duration-300 ${
            iconBoxClassName || DEFAULT_ICON_BOX
          }`}
          style={iconBoxStyle}
        >
          {avatar || icon || <FileText className={iconSizeClass} />}
        </div>
        <span className="text-xs font-medium text-base-content/80 group-hover:text-primary transition-colors duration-200 max-w-full break-words text-center line-clamp-2">
          {title}
        </span>
        {topRightAction && (
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            {topRightAction}
          </div>
        )}
      </Wrapper>
    );
  }

  // Tiles view
  if (view === "tiles") {
    return (
      <Wrapper
        {...wrapperProps}
        className={`card card-compact card-border flex flex-col justify-between p-4 md:p-5 bg-base-100 border-base-200 shadow-[0_2px_10px_rgba(0,0,0,0.01)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98] transition-all duration-300 group cursor-pointer w-full h-full relative ${baseButtonReset} ${className}`}
      >
        {topRightAction && (
          <div className="absolute top-2 right-2 z-10">
            {topRightAction}
          </div>
        )}
        <div className="w-full space-y-3 flex-1 flex flex-col">
          {meta && <div className="w-full">{meta}</div>}
          {!meta && !noIcon && (
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-xs transition-all duration-300 ${iconBoxClassName || DEFAULT_ICON_BOX}`}
              style={iconBoxStyle}
            >
              {avatar || icon || <FileText className="h-[50%] w-[50%]" />}
            </div>
          )}
          <div className="space-y-1.5 flex-1 flex flex-col justify-center w-full">
            <h3 className="text-sm md:text-base font-bold text-base-content font-serif group-hover:text-primary transition-colors duration-300 line-clamp-2">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-base-content/60 leading-relaxed line-clamp-3 w-full font-sans">
                {description}
              </p>
            )}
            {subtitle && (
              <div className="text-[10px] text-base-content/50 font-semibold mt-auto w-full">
                {subtitle}
              </div>
            )}
          </div>
        </div>
        {action && (
          <div className="mt-4 pt-4 border-t border-base-200 w-full flex items-center justify-between">
            {action}
          </div>
        )}
      </Wrapper>
    );
  }

  // Details view
  if (view === "details") {
    return (
      <Wrapper
        {...wrapperProps}
        className={`card card-compact card-border w-full flex flex-row items-center gap-3 p-3 md:p-4 bg-base-100 border-base-200 shadow-[0_2px_10px_rgba(0,0,0,0.01)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98] transition-all duration-300 group cursor-pointer ${baseButtonReset} ${className}`}
      >
        {!noIcon && (
          <div
            className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 shadow-xs transition-all duration-300 ${iconBoxClassName || DEFAULT_ICON_BOX}`}
            style={iconBoxStyle}
          >
            {avatar || icon || <FileText className="h-[50%] w-[50%]" />}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm md:text-base font-bold text-base-content font-serif group-hover:text-primary transition-colors duration-300 truncate">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-base-content/60 leading-relaxed line-clamp-1 mt-0.5 w-full font-sans">
              {description}
            </p>
          )}
          {subtitle && (
            <div className="text-xs text-base-content/50 truncate mt-0.5 w-full">
              {subtitle}
            </div>
          )}
        </div>
        <div className="shrink-0 flex items-center">
          {action ? (
            action
          ) : (
            <ChevronRight className="h-4 w-4 text-base-content/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-300" />
          )}
        </div>
      </Wrapper>
    );
  }

  // Default view
  return (
    <Wrapper
      {...wrapperProps}
      className={`card card-compact card-border w-full flex flex-row items-center gap-3 p-4 md:p-5 bg-base-100 border-base-200 shadow-[0_2px_10px_rgba(0,0,0,0.01)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98] transition-all duration-300 group cursor-pointer ${baseButtonReset} ${className}`}
    >
      {!noIcon && (
        <div
          className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 shadow-xs transition-all duration-300 ${iconBoxClassName || DEFAULT_ICON_BOX}`}
          style={iconBoxStyle}
        >
          {avatar || icon || <FileText className="h-[50%] w-[50%]" />}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm md:text-base font-bold text-base-content font-serif group-hover:text-primary transition-colors duration-300 truncate">
          {title}
        </h3>
        {subtitle && (
          <div className="text-xs text-base-content/50 truncate mt-0.5 w-full">
            {subtitle}
          </div>
        )}
      </div>
      <div className="shrink-0 flex items-center">
        {action ? (
          action
        ) : (
          <ChevronRight className="h-4.5 w-4.5 text-base-content/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-300" />
        )}
      </div>
    </Wrapper>
  );
}
