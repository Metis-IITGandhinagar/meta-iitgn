"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, ArrowLeft, Loader2 } from "lucide-react";

export default function LogoutPage() {
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
    <div className="relative min-h-screen flex items-center justify-center bg-radial from-slate-900 via-zinc-950 to-black overflow-hidden font-sans">
      {/* Background blur blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl" />

      {/* Confirmation card */}
      <div className="relative w-full max-w-sm mx-4 p-8 bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl shadow-2xl flex flex-col items-center text-center">
        {/* Warning Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-950/40 border border-rose-800/50 flex items-center justify-center mb-6 shadow-inner text-rose-400">
          <LogOut className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-bold text-white mb-2">
          Confirm Sign Out
        </h1>
        <p className="text-sm text-zinc-400 mb-8 font-medium leading-relaxed">
          Are you sure you want to sign out of your META IITGN account? Any unsaved edits will be discarded.
        </p>

        {/* Buttons */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full h-11 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-800 text-white font-semibold rounded-xl shadow-lg transition-colors cursor-pointer disabled:cursor-not-allowed text-sm"
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
            className="w-full h-11 flex items-center justify-center gap-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white font-semibold rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancel & Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
