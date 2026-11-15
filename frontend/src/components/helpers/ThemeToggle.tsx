"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useCommonStore } from "@/store/useCommonStore";

/** Light/dark switch wired to the app's persisted theme. */
export function ThemeToggle({ onPhoto = false }: { onPhoto?: boolean }) {
  const theme = useCommonStore((s) => s.theme);
  const setTheme = useCommonStore((s) => s.setTheme);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const dark = mounted && (theme === "dark" || theme === "meta-dark");

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className={`h-11 w-11 inline-flex items-center justify-center rounded-full cursor-pointer touch-manipulation transition-colors ${
        onPhoto ? "text-white hover:bg-white/15" : "text-base-content hover:bg-base-200"
      }`}
    >
      {dark ? <Sun className="h-[18px] w-[18px]" aria-hidden /> : <Moon className="h-[18px] w-[18px]" aria-hidden />}
    </button>
  );
}
