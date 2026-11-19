"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  LayoutGrid,
  ChevronDown,
  List,
  Rows3,
  Check,
  FileText,
} from "lucide-react";
import { ViewMode } from "@/hooks/useViewMode";

interface ViewSwitcherProps {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
  /** Hide the text label on the trigger (icon only). */
  iconOnly?: boolean;
  className?: string;
}

const VIEW_LABEL: Record<ViewMode, string> = {
  default: "Default",
  tiles: "Tiles",
  details: "Details",
  "icon-sm": "Icons · Small",
  "icon-md": "Icons · Medium",
  "icon-lg": "Icons · Large",
  "icon-xl": "Icons · X-Large",
};

const ICON_SIZES: Record<string, string> = {
  "icon-sm": "h-3.5 w-3.5",
  "icon-md": "h-4 w-4",
  "icon-lg": "h-5 w-5",
  "icon-xl": "h-6 w-6",
};

// Render the menu in a portal pinned to the viewport so overflow-hidden /
// overflow-y-auto / transformed ancestors (modals, the bookmarks panel, etc.)
// can never clip it. z-index sits above the modals (z-[20000]).
const MENU_WIDTH = 224;
const MENU_Z = 30000;

export default function ViewSwitcher({
  view,
  onChange,
  iconOnly = false,
  className = "",
}: ViewSwitcherProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // Position the portaled menu from the trigger's rect; flip above when there
  // isn't room below, and keep it inside the viewport horizontally.
  useEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const compute = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const menuH = menuRef.current?.offsetHeight ?? 340;
      const spaceBelow = window.innerHeight - r.bottom;
      const placeAbove = spaceBelow < menuH + 12 && r.top > menuH + 12;
      const top = placeAbove ? r.top - menuH - 8 : r.bottom + 8;
      let left = r.right - MENU_WIDTH;
      if (left < 8) left = 8;
      if (left + MENU_WIDTH > window.innerWidth - 8) {
        left = window.innerWidth - MENU_WIDTH - 8;
      }
      setPos({ top, left });
    };
    compute();
    const raf = requestAnimationFrame(compute);
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [open]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const select = (next: ViewMode) => {
    onChange(next);
    setOpen(false);
  };

  const Row = ({
    mode,
    icon,
    label,
  }: {
    mode: ViewMode;
    icon: ReactNode;
    label: string;
  }) => (
    <button
      type="button"
      onClick={() => select(mode)}
      className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-base-content hover:bg-base-200 transition-colors text-left"
    >
      {icon}
      <span className="flex-1">{label}</span>
      {view === mode && <Check className="h-4 w-4 text-primary shrink-0" />}
    </button>
  );

  return (
    <div className={`relative shrink-0 ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn btn-ghost btn-sm font-semibold rounded-xl shadow-sm transition-all duration-200 cursor-pointer active:scale-95 gap-1.5"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <LayoutGrid className="h-4 w-4" />
        {!iconOnly && <span className="hidden sm:inline">{VIEW_LABEL[view]}</span>}
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </button>

      {open &&
        pos &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: MENU_WIDTH,
              zIndex: MENU_Z,
            }}
            className="card card-bordered bg-base-100  py-1 rounded-xl no-scrollbar animate-in fade-in duration-200"
          >
            <Row mode="default" icon={<List className="h-4 w-4 shrink-0" />} label="Default" />
            <Row mode="tiles" icon={<LayoutGrid className="h-4 w-4 shrink-0" />} label="Tiles" />
            <Row mode="details" icon={<Rows3 className="h-4 w-4 shrink-0" />} label="Details" />

            <div className="my-1 border-t border-base-200" />

            <div className="px-3 pt-1.5 pb-1 text-[11px] font-bold uppercase tracking-wider text-base-content/40">
              Icons
            </div>
            {(["icon-sm", "icon-md", "icon-lg", "icon-xl"] as ViewMode[]).map((mode) => (
              <Row
                key={mode}
                mode={mode}
                icon={<FileText className={`${ICON_SIZES[mode]} shrink-0`} />}
                label={VIEW_LABEL[mode].replace("Icons · ", "")}
              />
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
