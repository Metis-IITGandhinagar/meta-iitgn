"use client";

import React, { Suspense } from "react";
import { AuthProvider } from "@/context/AuthProvider";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ProfileProvider } from "@/context/ProfileContext";
import { Toaster } from "react-hot-toast";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { parseModalParams, buildQuery } from "@/lib/modalUrl";
import { useCommonStore } from "@/store/useCommonStore";

const SettingsModal = dynamic(() => import("@/components/overlays/SettingsModal"), {
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
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function Providers({ children }: { children: React.ReactNode }) {
  // Google OAuth client ID must be provided via NEXT_PUBLIC_GOOGLE_CLIENT_ID.
  const googleClientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "") as string;

  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10 * 60 * 1000, // 10 minutes cache TTL
            gcTime: 15 * 60 * 1000,    // 15 minutes garbage collection (formerly cacheTime)
            refetchOnWindowFocus: false, // avoid unwanted network requests on focus
          },
        },
      })
  );

  const {
    theme,
    interfaceFontStyle,
    zoomLevel,
    animations,
    compactLayout,
  } = useCommonStore();

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    
    if (DARK_THEMES.includes(theme)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    document.documentElement.setAttribute("data-interface-font-size", "normal");
    document.documentElement.setAttribute("data-font-style", interfaceFontStyle);
    document.documentElement.setAttribute("data-reduce-motion", animations ? "false" : "true");
    document.documentElement.setAttribute("data-compact", compactLayout ? "true" : "false");

    if (zoomLevel === "90%") {
      document.documentElement.style.fontSize = "12px";
    } else if (zoomLevel === "110%") {
      document.documentElement.style.fontSize = "20px";
    } else {
      document.documentElement.style.fontSize = "16px";
    }
  }, [theme, interfaceFontStyle, zoomLevel, animations, compactLayout]);

  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={googleClientId}>
        <AuthProvider>
          <ProfileProvider>
            {children}
            <Toaster
              position="top-center"
              containerStyle={{ zIndex: 30000 }}
              toastOptions={{
                className: "!bg-base-100 !text-base-content border !border-base-300 rounded-lg shadow-lg font-sans",
                style: {
                  borderRadius: "8px",
                },
              }}
            />
            <Suspense fallback={null}>
              <SettingsModalTrigger />
            </Suspense>
          </ProfileProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
}
