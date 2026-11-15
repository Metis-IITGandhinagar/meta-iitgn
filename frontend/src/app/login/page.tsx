"use client";

import React, { useState, useEffect } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { api } from "@/lib/api";
import Image from "next/image";
import { AlertCircle, CheckCircle, ChevronLeft } from "lucide-react";
import { BrandMark } from "@/components/helpers/BrandMark";

export default function LoginPage() {
  useDocumentTitle("Log In");
  const router = useRouter();
  const { auth, checkAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  });


  
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


  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.push("/");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral font-sans text-white">
      <Image
        src="/homepage_bg.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-black/55" aria-hidden />

      <main id="main-content" className="relative min-h-full flex items-center justify-center p-5">
        <div className="w-full max-w-md rounded-3xl bg-base-100 text-base-content p-8 sm:p-10">
          <div className="flex items-center gap-3">
            <BrandMark size={36} />
            <span className="text-[17px] font-semibold tracking-tight" translate="no">Meta IITGN</span>
          </div>

          <h1 className="t-display text-balance text-4xl mt-8">Welcome back.</h1>
          <p className="mt-3 text-[15px] text-base-content/75 leading-relaxed">
            Sign in to edit pages, save articles and read PrepMat.
          </p>

          <div role="status" aria-live="polite">
            {status.type && (
              <div
                className={`mt-6 p-3.5 rounded-xl flex items-start gap-3 border text-[13px] ${
                  status.type === "success"
                    ? "bg-success/10 border-success/40 text-base-content"
                    : "bg-error/10 border-error/40 text-base-content"
                }`}
              >
                {status.type === "success" ? (
                  <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-success" aria-hidden />
                ) : (
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-error" aria-hidden />
                )}
                <p className="leading-relaxed">{status.message}</p>
              </div>
            )}
          </div>

          <button
            onClick={() => handleGoogleLogin()}
            disabled={loading}
            className="mt-7 w-full h-12 flex items-center justify-center gap-3 rounded-full border border-base-300 bg-white text-[#1B1A18] text-[15px] font-medium hover:border-base-content disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer touch-manipulation"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.58c-.28 1.48-1.12 2.74-2.38 3.58v2.98h3.84c2.24-2.06 3.53-5.1 3.53-8.41z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.84-2.98c-1.08.72-2.45 1.16-4.09 1.16-3.15 0-5.81-2.13-6.76-5.01H1.44v3.08C3.42 21.09 7.43 24 12 24z" />
              <path fill="#FBBC05" d="M5.24 14.26c-.24-.72-.38-1.5-.38-2.31s.14-1.59.38-2.31V6.56H1.44C.52 8.4.02 10.46.02 12.63c0 2.17.5 4.23 1.42 6.07l3.8-2.97z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0 7.43 0 3.42 2.91 1.44 6.56l3.8 2.97c.95-2.88 3.61-5.01 6.76-5.01z" />
            </svg>
            {loading ? "Signing in…" : "Continue with Google"}
          </button>

          <button
            onClick={goBack}
            className="mt-4 w-full min-h-11 inline-flex items-center justify-center gap-1.5 rounded-full text-[14px] text-base-content/75 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer touch-manipulation"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden /> Back
          </button>
        </div>
      </main>
    </div>
  );
}
