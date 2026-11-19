"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useCommonStore } from "@/store/useCommonStore";

/**
 * Light/dark switch wired to the app's persisted theme.
 * `icon` sits in the top bar; `row` is a labelled menu item (used on phones).
 */
export function ThemeToggle({
  onPhoto = false,
  variant = "icon",
  className = "",
}: {
  onPhoto?: boolean;
  variant?: "icon" | "row";
  className?: string;
}) {
  const theme = useCommonStore((s) => s.theme);
  const setTheme = useCommonStore((s) => s.setTheme);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const dark = mounted && (theme === "dark" || theme === "meta-dark");
  const label = dark ? "Switch to light mode" : "Switch to dark mode";
  const Icon = dark ? Sun : Moon;

  if (variant === "row") {
    return (
      <button
        type="button"
        onClick={() => setTheme(dark ? "light" : "dark")}
        className={`w-full flex items-center gap-3 rounded-xl px-3 min-h-12 text-left text-[14px] font-medium hover:bg-base-200 transition-colors cursor-pointer touch-manipulation ${className}`}
      >
        <span className="h-9 w-9 rounded-lg border border-base-300 inline-flex items-center justify-center text-primary shrink-0">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        {dark ? "Light mode" : "Dark mode"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={label}
      title={dark ? "Light mode" : "Dark mode"}
      className={`h-11 w-11 shrink-0 ${className.includes("hidden") ? "" : "inline-flex"} items-center justify-center rounded-full cursor-pointer touch-manipulation transition-colors ${
        onPhoto ? "text-white hover:bg-white/15" : "text-base-content hover:bg-base-200"
      } ${className}`}
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden />
    </button>
  );
}
