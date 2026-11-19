"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { LogOut, Loader2 } from "lucide-react";
import Navbar from "@/components/navs/Navbar";
import { PageMessage, pageSecondaryAction } from "@/components/helpers/PageMessage";

export default function LogoutPage() {
  useDocumentTitle("Sign out");
  const router = useRouter();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-base-100 font-sans">
      <Navbar hideSearch />
      <main id="main-content">
        <PageMessage
          icon={<LogOut className="h-5 w-5" aria-hidden />}
          title="Sign out?"
          actions={
            <>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="h-11 px-5 inline-flex items-center justify-center gap-2 rounded-lg bg-error text-error-content text-[14px] font-medium hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Signing out…
                  </>
                ) : (
                  "Sign out"
                )}
              </button>
              <button onClick={() => router.back()} disabled={loading} className={`${pageSecondaryAction} cursor-pointer`}>
                Stay signed in
              </button>
            </>
          }
        >
          Any unsaved edits will be lost.
        </PageMessage>
      </main>
    </div>
  );
}
