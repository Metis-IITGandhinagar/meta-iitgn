"use client";

import React from "react";
import { AuthProvider } from "@/context/AuthProvider";
import { GoogleOAuthProvider } from "@react-oauth/google";

import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/useAuth";

const SettingsModal = dynamic(() => import("@/components/SettingsModal"), {
  ssr: false,
});

function SettingsModalTrigger() {
  const { settingsTab, setSettingsTab } = useAuth();
  
  if (!settingsTab) return null;
  
  return <SettingsModal initialTab={settingsTab} onClose={() => setSettingsTab(null)} />;
}

import { DARK_THEMES } from "@/lib/constants";

export function Providers({ children }: { children: React.ReactNode }) {
  // Use NEXT_PUBLIC_GOOGLE_CLIENT_ID from environment, or a fallback for dev
  const googleClientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "1098254429930-mockclientid.apps.googleusercontent.com") as string;

  React.useEffect(() => {
    const savedTheme = localStorage.getItem("wiki_daisyui_theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    
    if (DARK_THEMES.includes(savedTheme)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    const updateFontSettings = () => {
      const size = localStorage.getItem("wiki_font_size") || "normal";
      const style = localStorage.getItem("wiki_font_style") || "sans";
      const zoom = localStorage.getItem("wiki_zoom_level") || "100%";
      
      document.documentElement.setAttribute("data-font-size", size);
      document.documentElement.setAttribute("data-font-style", style);
      
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
        {children}
        <SettingsModalTrigger />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
