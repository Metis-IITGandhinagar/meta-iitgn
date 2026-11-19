"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Settings as SettingsIcon } from "lucide-react";
import Navbar from "@/components/navs/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { PageMessage, pagePrimaryAction } from "@/components/helpers/PageMessage";

export default function SettingsPage() {
  const { setSettingsTab } = useAuth();
  const router = useRouter();

  // Settings live in a panel driven by the ?settings= URL param; open it straight away.
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).get("settings")) {
      router.replace("/user/settings?settings=appearance");
    }
  }, [router]);

  return (
    <div className="min-h-dvh bg-base-100 font-sans">
      <Navbar />
      <main id="main-content">
        <PageMessage
          icon={<SettingsIcon className="h-5 w-5" aria-hidden />}
          title="Settings"
          actions={
            <button type="button" onClick={() => setSettingsTab?.("appearance")} className={`${pagePrimaryAction} cursor-pointer`}>
              Open settings
            </button>
          }
        >
          Appearance, reading, editor and search preferences.
        </PageMessage>
      </main>
    </div>
  );
}
