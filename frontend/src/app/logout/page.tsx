"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { LogOut, ChevronLeft, Loader2 } from "lucide-react";

export default function LogoutPage() {
  useDocumentTitle("Log Out");
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
    <div className="relative min-h-screen flex items-center justify-center bg-radial from-base-300 via-base-200 to-base-100 overflow-hidden font-sans">
      {/* Background blur blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-error/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl" />

      {/* Confirmation card */}
      <div className="relative w-full max-w-sm mx-4 p-8 bg-base-100/80 backdrop-blur-xl border border-base-300 rounded-2xl shadow-2xl flex flex-col items-center text-center">
        {/* Warning Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-950/40 border border-rose-800/50 flex items-center justify-center mb-6 shadow-inner text-rose-400">
          <LogOut className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-bold text-base-content mb-2">
          Confirm Sign Out
        </h1>
        <p className="text-sm text-base-content/60 mb-8 font-medium leading-relaxed">
          Are you sure you want to sign out of your META IITGN account? Any unsaved edits will be discarded.
        </p>

        {/* Buttons */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full h-11 flex items-center justify-center gap-2 bg-error hover:bg-error/90 disabled:bg-error/80 text-error-content font-semibold rounded-xl shadow-lg transition-colors cursor-pointer disabled:cursor-not-allowed text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing out...
              </>
            ) : (
              "Yes, Sign Out"
            )}
          </button>

          <button
            onClick={() => router.back()}
            disabled={loading}
            className="mx-auto p-1.5 text-base-content/60 hover:text-base-content hover:bg-base-300 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
            aria-label="Go back"
            title="Go back"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
