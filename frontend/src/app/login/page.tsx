"use client";

import React, { useState, useEffect } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { devBypass } from "@/api/user";
import { BookOpen, AlertCircle, CheckCircle, ShieldAlert, Cpu } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { auth, checkAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  });

  // Dev bypass form state
  const [devEmail, setDevEmail] = useState("admin@meta-iitgn.edu");
  const [devName, setDevName] = useState("Admin User");
  const [showDevBypass, setShowDevBypass] = useState(false);

  // If already authenticated, redirect to home page
  useEffect(() => {
    if (auth) {
      router.replace("/");
    }
  }, [auth, router]);

  const googleAuth = async (tokenResponse: any) => {
    setLoading(true);
    setStatus({ type: null, message: "" });
    try {
      if (tokenResponse.code) {
        const result = await api.get(
          `/user/auth/google?code=${encodeURIComponent(tokenResponse.code)}`,
          { withCredentials: true }
        );

        if (result.data.success) {
          setStatus({ type: "success", message: "Google Login Successful!" });
          await checkAuth();
          router.replace("/");
        } else {
          setStatus({ type: "error", message: result.data.message || "Google auth failed on server." });
        }
      } else {
        setStatus({ type: "error", message: "Failed to obtain authorization code from Google." });
      }
    } catch (error: any) {
      console.error("Google Auth Error:", error);
      setStatus({
        type: "error",
        message: error.response?.data?.error || error.message || "An error occurred during Google sign-in.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: googleAuth,
    onError: (err) => {
      console.error("Google Login Error:", err);
      setStatus({ type: "error", message: "Google authentication failed to initialize." });
    },
    flow: "auth-code",
    scope: "openid email profile",
  });

  const handleDevBypass = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: "" });

    try {
      const response = await devBypass({
        email: devEmail,
        name: devName,
      });

      if (response.success) {
        setStatus({ type: "success", message: "Bypass Login Successful!" });
        await checkAuth();
        router.replace("/");
      } else {
        setStatus({ type: "error", message: response.error || "Bypass failed." });
      }
    } catch (error: any) {
      console.error("Dev Bypass Error:", error);
      setStatus({
        type: "error",
        message: error.response?.data?.error || error.message || "Bypass login failed. Verify backend is in dev mode.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-white/60 overflow-hidden font-sans">
      {/* Abstract background blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />

      {/* Main card */}
      <div className="relative w-full max-w-md mx-4 p-8 bg-white backdrop-blur-xl border border-zinc-800/80 rounded-2xl shadow-2xl flex flex-col items-center">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <BookOpen className="w-5 h-5 text-black" />
          </div>
          <span className="text-2xl font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-black via-zinc-500 to-blue-400">
            META IITGN
          </span>
        </div>
        <p className="text-zinc-400 text-sm text-center mb-8 font-serif italic">
          The Collaborative Campus Wiki
        </p>

        {/* Notifications */}
        {status.type && (
          <div
            className={`w-full mb-6 p-4 rounded-xl flex items-start gap-3 border text-sm transition-all duration-300 ${
              status.type === "success"
                ? "bg-emerald-950/40 border-emerald-800/50 text-emerald-300"
                : "bg-rose-950/40 border-rose-800/50 text-rose-300"
            }`}
          >
            {status.type === "success" ? (
              <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            )}
            <div>
              <p className="font-semibold">{status.type === "success" ? "Success" : "Error"}</p>
              <p className="mt-0.5 opacity-90">{status.message}</p>
            </div>
          </div>
        )}

        {/* Google Login Button */}
        <button
          onClick={() => handleGoogleLogin()}
          disabled={loading}
          className="w-full h-12 flex items-center justify-center gap-3 px-6 bg-white hover:bg-zinc-100 disabled:bg-zinc-300 text-zinc-950 font-semibold rounded-xl shadow-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.58c-.28 1.48-1.12 2.74-2.38 3.58v2.98h3.84c2.24-2.06 3.53-5.1 3.53-8.41z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.84-2.98c-1.08.72-2.45 1.16-4.09 1.16-3.15 0-5.81-2.13-6.76-5.01H1.44v3.08C3.42 21.09 7.43 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.24 14.26c-.24-.72-.38-1.5-.38-2.31s.14-1.59.38-2.31V6.56H1.44C.52 8.4.02 10.46.02 12.63c0 2.17.5 4.23 1.42 6.07l3.8-2.97z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0 7.43 0 3.42 2.91 1.44 6.56l3.8 2.97c.95-2.88 3.61-5.01 6.76-5.01z"
            />
          </svg>
          {loading ? "Signing in..." : "Sign in with Google"}
        </button>

        {/* Divider */}
        <div className="w-full flex items-center my-6">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="px-3 text-xs text-zinc-500 font-mono">OR</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        {/* Dev Bypass Section */}
        <div className="w-full">
          <button
            onClick={() => setShowDevBypass(!showDevBypass)}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-zinc-500 hover:text-zinc-300 text-xs font-mono border border-dashed border-zinc-800 hover:border-zinc-700 rounded-lg transition-colors cursor-pointer"
          >
            <Cpu className="w-4 h-4" />
            {showDevBypass ? "Hide Dev Bypass" : "Show Dev Bypass (Development)"}
          </button>

          {showDevBypass && (
            <form onSubmit={handleDevBypass} className="mt-4 p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/60 flex flex-col gap-3 transition-all duration-300">
              <div className="flex items-center gap-2 text-amber-500 text-xs font-mono mb-1">
                <ShieldAlert className="w-4 h-4" />
                <span>Dev Bypass Login</span>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
                  Mock Email
                </label>
                <input
                  type="email"
                  value={devEmail}
                  onChange={(e) => setDevEmail(e.target.value)}
                  className="w-full h-9 px-3 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-violet-600 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
                  Mock Name
                </label>
                <input
                  type="text"
                  value={devName}
                  onChange={(e) => setDevName(e.target.value)}
                  className="w-full h-9 px-3 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-violet-600 transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-9 mt-1 flex items-center justify-center bg-violet-600 hover:bg-violet-700 disabled:bg-violet-800 text-white text-xs font-semibold rounded-lg shadow-md cursor-pointer transition-colors"
              >
                {loading ? "Logging in..." : "Bypass with Dev Account"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
