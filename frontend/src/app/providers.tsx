"use client";

import React, { Suspense } from "react";
import { AuthProvider } from "@/context/AuthProvider";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ProfileProvider } from "@/context/ProfileContext";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { parseModalParams, buildQuery } from "@/lib/modalUrl";

const SettingsModal = dynamic(() => import("@/components/SettingsModal"), {
  ssr: false,
});

function SettingsModalTrigger() {
  const { settingsTab, setSettingsTab } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lastPushed = React.useRef<string | null>(null);
  if (lastPushed.current === null && typeof window !== "undefined") {
    lastPushed.current = window.location.search.replace(/^\?/, "");
  }

  React.useEffect(() => {
    const handleOpenSettings = (e: Event) => {
      const customEvent = e as CustomEvent;
      const tab = customEvent.detail?.tab || "appearance";
      if (setSettingsTab) {
        setSettingsTab(tab);
      }
    };
    const handleCloseSettings = () => {
      if (setSettingsTab) {
        setSettingsTab(null);
      }
    };
    window.addEventListener("wiki_open_settings", handleOpenSettings);
    window.addEventListener("wiki_close_settings", handleCloseSettings);
    return () => {
      window.removeEventListener("wiki_open_settings", handleOpenSettings);
      window.removeEventListener("wiki_close_settings", handleCloseSettings);
    };
  }, [setSettingsTab]);

  // URL -> store: open the settings modal on deep-link load / back-forward.
  React.useEffect(() => {
    const { settings } = parseModalParams(searchParams);
    if ((settingsTab ?? null) !== (settings ?? null)) {
      setSettingsTab(settings as Parameters<typeof setSettingsTab>[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // store -> URL (open only): push one entry when settings opens, clearing the
  // overlay/wmodal params so the two modal systems don't fight over the URL.
  React.useEffect(() => {
    if (!settingsTab) {
      lastPushed.current = "";
      return;
    }
    const desired = buildQuery(window.location.search.slice(1), {
      settings: settingsTab,
      overlay: null,
      wmodal: null,
    });
    if (desired !== lastPushed.current) {
      lastPushed.current = desired;
      router.push(
        desired ? `?${desired}` : window.location.pathname,
        { scroll: false }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsTab]);

  if (!settingsTab) return null;

  return <SettingsModal initialTab={settingsTab} onClose={() => router.back()} />;
}

import { DARK_THEMES } from "@/lib/constants";

export function Providers({ children }: { children: React.ReactNode }) {
  // Google OAuth client ID must be provided via NEXT_PUBLIC_GOOGLE_CLIENT_ID.
  const googleClientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "") as string;

  React.useEffect(() => {
    const savedTheme = localStorage.getItem("wiki_daisyui_theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    
    if (DARK_THEMES.includes(savedTheme)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    const updateFontSettings = () => {
      const size = localStorage.getItem("wiki_interface_font_size") || "normal";
      const style = localStorage.getItem("wiki_interface_font_style") || "sans";
      const zoom = localStorage.getItem("wiki_zoom_level") || "100%";
      const animations = localStorage.getItem("wiki_animations") !== "false";
      const compact = localStorage.getItem("wiki_compact_layout") === "true";

      document.documentElement.setAttribute("data-interface-font-size", size);
      document.documentElement.setAttribute("data-font-style", style);
      document.documentElement.setAttribute("data-reduce-motion", animations ? "false" : "true");
      document.documentElement.setAttribute("data-compact", compact ? "true" : "false");

      if (zoom === "90%") {
        document.documentElement.style.fontSize = "12px";
      } else if (zoom === "110%") {
        document.documentElement.style.fontSize = "20px";
      } else {
        document.documentElement.style.fontSize = "16px";
      }
    };
    
    updateFontSettings();
    window.addEventListener("storage", updateFontSettings);
    window.addEventListener("wiki_settings_changed", updateFontSettings);

    return () => {
      window.removeEventListener("storage", updateFontSettings);
      window.removeEventListener("wiki_settings_changed", updateFontSettings);
    };
  }, []);

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <ProfileProvider>
          {children}
          <Suspense fallback={null}>
            <SettingsModalTrigger />
          </Suspense>
        </ProfileProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
