"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Renders children at <body>. Needed for full-screen overlays opened from inside
 * the top bar: its backdrop-filter makes it the containing block for
 * `position: fixed`, which would otherwise clip the overlay to the bar.
 */
export function Portal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? createPortal(children, document.body) : null;
}
