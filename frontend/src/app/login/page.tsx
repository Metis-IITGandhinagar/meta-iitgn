"use client";

import React, { useState, useEffect } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { devBypass } from "@/api/user";
import { BookOpen, AlertCircle, CheckCircle, ShieldAlert, Cpu, X, ChevronLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { auth, checkAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  });

  const DEV_ACCOUNTS = [
    { name: "Gold User A (Gold)", email: "gold1@meta-iitgn.edu", role: "admin" },
    { name: "Gold User B (Gold)", email: "gold2@meta-iitgn.edu", role: "admin" },
    { name: "Gold User C (Gold)", email: "gold3@meta-iitgn.edu", role: "admin" },
    { name: "Silver User A (Silver)", email: "silver1@meta-iitgn.edu", role: "moderator" },
    { name: "Silver User B (Silver)", email: "silver2@meta-iitgn.edu", role: "moderator" },
    { name: "Silver User C (Silver)", email: "silver3@meta-iitgn.edu", role: "moderator" },
    { name: "Bronze User A (Bronze)", email: "bronze1@meta-iitgn.edu", role: "normal" },
    { name: "Bronze User B (Bronze)", email: "bronze2@meta-iitgn.edu", role: "normal" },
    { name: "Bronze User C (Bronze)", email: "bronze3@meta-iitgn.edu", role: "normal" },
  ];

  // Dev bypass form state
  const [devEmail, setDevEmail] = useState(DEV_ACCOUNTS[0].email);
  const [devName, setDevName] = useState("Gold User A");
  const [devRole, setDevRole] = useState(DEV_ACCOUNTS[0].role);
  const [showDevBypass, setShowDevBypass] = useState(false);

  // Cursor-following 3D tilt for the login card (interaction-safe alternative to
  // daisyUI's hover-3d, whose overlay zones would block the close button / form).
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const handleCardTilt = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({ rx: (0.5 - py) * 10, ry: (px - 0.5) * 10 });
  };
  const resetCardTilt = () => setTilt({ rx: 0, ry: 0 });

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
          await new Promise((resolve) => setTimeout(resolve, 2000));
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
        role: devRole,
      });

      if (response.success) {
        setStatus({ type: "success", message: "Bypass Login Successful!" });
        await new Promise((resolve) => setTimeout(resolve, 2000));
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/65 overflow-hidden font-sans p-4">
      {/* Background decoration blobs inside popover */}
      <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Popover container card */}
      <div
        onMouseMove={handleCardTilt}
        onMouseLeave={resetCardTilt}
        style={{
          transform: `perspective(1200px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transition: tilt.rx === 0 && tilt.ry === 0 ? "transform .4s ease-out" : "transform .08s ease-out",
        }}
        className="relative w-full max-w-md bg-base-100 border border-base-300/80 rounded-3xl shadow-[0_30px_70px_rgba(0,0,0,0.25)] p-8 flex flex-col items-center animate-in zoom-in-95 duration-200 will-change-transform"
      >
        {/* Close Button */}
        <button
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push("/");
            }
          }}
          className="absolute top-5 right-5 p-1.5 text-base-content/50 hover:text-base-content/85 hover:bg-base-200 rounded-xl transition-all duration-200 cursor-pointer active:scale-95"
          aria-label="Close Login Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-2 mt-2">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0">
            <BookOpen className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-xl font-serif font-black tracking-tight text-base-content">
            META <span className="text-primary">IITGN</span>
          </span>
        </div>
        <p className="text-base-content/50 text-xs text-center mb-8 font-medium tracking-wide uppercase">
          The Collaborative Campus Wiki
        </p>

        {/* Notifications */}
        {status.type && (
          <div
            className={`w-full mb-5 p-3.5 rounded-2xl flex items-start gap-3 border text-xs transition-all duration-300 ${
              status.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {status.type === "success" ? (
              <CheckCircle className="w-4.5 h-4.5 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4.5 h-4.5 shrink-0 text-rose-600" />
            )}
            <div>
              <p className="font-bold">{status.type === "success" ? "Success" : "Error"}</p>
              <p className="mt-0.5 opacity-90 font-medium leading-relaxed">{status.message}</p>
            </div>
          </div>
        )}

        {/* Google Login Button */}
        <button
          onClick={() => handleGoogleLogin()}
          disabled={loading}
          className="w-full h-11 flex items-center justify-center gap-3 px-6 bg-primary hover:bg-slate-800 disabled:bg-slate-350 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer disabled:cursor-not-allowed select-none active:scale-98 text-sm"
        >
          <svg className="w-4.5 h-4.5 text-white fill-current shrink-0" viewBox="0 0 24 24">
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
          {loading ? "Signing in..." : "Continue with Google"}
        </button>

        {/* Divider */}
        <div className="w-full flex items-center my-6">
          <div className="flex-1 h-px bg-slate-150" />
          <span className="px-3 text-[10px] text-base-content/50 font-bold uppercase tracking-wider">or bypass</span>
          <div className="flex-1 h-px bg-slate-150" />
        </div>

        {/* Dev Bypass Section */}
        <div className="w-full">
          <button
            onClick={() => setShowDevBypass(!showDevBypass)}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-base-content/50 hover:text-base-content text-xs font-bold border border-dashed border-slate-300 hover:border-slate-400 rounded-xl transition-all duration-200 cursor-pointer bg-base-200/50 hover:bg-base-200"
          >
            <Cpu className="w-3.5 h-3.5 text-base-content/50" />
            {showDevBypass ? "Hide Sandbox Bypass" : "Show Sandbox Bypass"}
          </button>

          {showDevBypass && (
            <form onSubmit={handleDevBypass} className="mt-3.5 p-4 rounded-2xl bg-base-200 border border-base-200 flex flex-col gap-3.5 transition-all duration-300">
              <div className="flex items-center gap-1.5 text-amber-600 text-xs font-bold">
                <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Local Sandbox Login Bypass</span>
              </div>

               <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-base-content/50">
                  Select Dev Account (Role/Tier)
                </label>
                <select
                  value={devEmail}
                  onChange={(e) => {
                    const selected = DEV_ACCOUNTS.find(acc => acc.email === e.target.value);
                    if (selected) {
                      setDevEmail(selected.email);
                      setDevName(selected.name.replace(/\s*\(.*\)/, ""));
                      setDevRole(selected.role);
                    }
                  }}
                  className="w-full h-9.5 px-3 bg-base-100 border border-base-300 rounded-xl text-xs font-bold text-base-content/85 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                >
                  {DEV_ACCOUNTS.map((acc) => (
                    <option key={acc.email} value={acc.email}>
                      {acc.name} ({acc.email})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-9 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer transition-colors active:scale-98"
              >
                {loading ? "Logging in..." : "Bypass with Selected Account"}
              </button>
            </form>
          )}
        </div>

        {/* Go Back button */}
        <button
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push("/");
            }
          }}
          className="mt-6 p-1.5 text-base-content/50 hover:text-base-content hover:bg-base-200 rounded-lg cursor-pointer flex items-center justify-center active:scale-95 transition-all select-none"
          aria-label="Go back"
          title="Go back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
