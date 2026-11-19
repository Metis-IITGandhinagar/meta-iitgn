"use client";

import { createRoot } from "react-dom/client";
import ConfirmationModal from "@/components/overlays/ConfirmationModal";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
}

/** In-app replacement for window.confirm(): resolves true on confirm, false on cancel. */
export function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    let settled = false;
    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      resolve(value);
      // Unmount after the click handler finishes.
      setTimeout(() => {
        root.unmount();
        host.remove();
      }, 0);
    };
    root.render(
      <ConfirmationModal isOpen onConfirm={() => finish(true)} onClose={() => finish(false)} {...opts} />
    );
  });
}
