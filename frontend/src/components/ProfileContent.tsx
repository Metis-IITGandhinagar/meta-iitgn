"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { useSearchParams } from "next/navigation";
import { useGoogleLogin } from "@react-oauth/google";
import { api } from "@/lib/api";
import { devBypass } from "@/api/user";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  FileEdit,
  FilePlus2,
  Flame,
  Heart,
  MapPin,
  Medal,
  MessageSquare,
  PenLine,
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ShieldAlert,
  Cpu,
  Bookmark,
  Trash2,
  ArrowRight,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiService } from "@/api";
import { db } from "@/lib/db";
import { useHomeStore } from "@/store/useHomeStore";
import { useRouter } from "next/navigation";
import { useProfile } from "@/context/ProfileContext";

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

export default function ProfileContent() {
  const { user: currentUser, loading: authLoading, checkAuth, logout } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { bookmarks, removeBookmark } = useHomeStore();
  const { profileCache, setProfileData } = useProfile();

  const userIdParam = searchParams?.get("userId");
  const targetUserId = userIdParam ? Number(userIdParam) : currentUser?.user_id;

  const [profileUser, setProfileUser] = useState<any>(null);
  const [profileStats, setProfileStats] = useState<any>(null);
  const [profileReadme, setProfileReadme] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "bookmarks">("overview");

  // Login states
  const [loginLoading, setLoginLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  });
  const [devEmail, setDevEmail] = useState(DEV_ACCOUNTS[0].email);
  const [devName, setDevName] = useState("Gold User A");
  const [devRole, setDevRole] = useState(DEV_ACCOUNTS[0].role);
  const [showDevBypass, setShowDevBypass] = useState(false);

  const googleAuth = async (tokenResponse: any) => {
    setLoginLoading(true);
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
        } else {
          setStatus({ type: "error", message: result.data.message || "Google auth failed on server." });
        }
      }
    } catch (error: any) {
      setStatus({
        type: "error",
        message: error.response?.data?.error || error.message || "An error occurred during Google sign-in.",
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: googleAuth,
    onError: () => {
      setStatus({ type: "error", message: "Google authentication failed." });
    },
    flow: "auth-code",
    scope: "openid email profile",
  });

  const handleDevBypass = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setStatus({ type: null, message: "" });
    try {
      const response = await devBypass({
        email: devEmail,
        name: devName,
        role: devRole,
      });
      if (response.success) {
        setStatus({ type: "success", message: "Sandbox Login Successful!" });
        await checkAuth();
      } else {
        setStatus({ type: "error", message: response.error || "Bypass failed." });
      }
    } catch (error: any) {
      setStatus({
        type: "error",
        message: error.response?.data?.error || error.message || "Bypass login failed.",
      });
    } finally {
      setLoginLoading(false);
    }
  };

  useEffect(() => {
    if (!targetUserId) return;

    // Check memory context cache first!
    if (profileCache[targetUserId]) {
      const cached = profileCache[targetUserId];
      setProfileUser(cached.user);
      setProfileStats(cached.stats);
      setProfileReadme(cached.readme);
      setRecentActivity(cached.activity);
      setDataLoading(false);
      return;
    }

    const fetchProfileData = async () => {
      // Try IndexedDB cache second
      try {
        const cacheKey = `profile-data-${targetUserId}`;
        const cached = await db.cachedpages.get(cacheKey);
        if (cached && cached.content) {
          const parsedCache = JSON.parse(cached.content);
          setProfileUser(parsedCache.user);
          setProfileStats(parsedCache.stats);
          setProfileReadme(parsedCache.readme);
          setRecentActivity(parsedCache.activity || []);
          setDataLoading(false);
          // Store it in the memory context cache so next open reads from context immediately
          setProfileData(targetUserId, parsedCache);
        }
      } catch (err) {
        console.error("Error reading profile cache:", err);
      }

      // Fetch fresh data
      try {
        let targetUser = currentUser;
        if (userIdParam && Number(userIdParam) !== currentUser?.user_id) {
          const userRes = await apiService.getUserById(Number(userIdParam));
          targetUser = userRes.user;
        }
        setProfileUser(targetUser);

        let stats = null;
        try {
          const statsRes = await apiService.getUserStats(targetUserId);
          if (statsRes.success) {
            stats = statsRes.data;
            setProfileStats(stats);
          }
        } catch {
          // Stats may not be available
        }

        // Fetch recent activity — use recent pages by this user from drafts/pages
        let activity: any[] = [];
        try {
          const draftsRes = await apiService.getPendingDrafts(targetUserId, 5, 1);
          if (Array.isArray(draftsRes)) {
            activity = draftsRes.slice(0, 4).map((d: any) => ({
              type: d.page_id ? "edited" : "created",
              title: d.title,
              time: d.created_at,
              status: d.status,
            }));
          }
        } catch {
          // ignore
        }
        setRecentActivity(activity);

        // Profile README
        let readme = null;
        try {
          const pageRes = await apiService.getPage(`profile-${targetUserId}`);
          if (pageRes && pageRes.content) {
            readme = pageRes.content;
          }
        } catch {
          // ignore
        }
        setProfileReadme(readme);

        const freshData = { user: targetUser, stats, readme, activity };

        // Save to memory context cache
        setProfileData(targetUserId, freshData);

        // Cache it in IndexedDB for offline support
        try {
          const cacheKey = `profile-data-${targetUserId}`;
          await db.cachedpages.put({
            slug: cacheKey,
            content: JSON.stringify(freshData),
            page_id: targetUserId as number,
            version: 1,
            metadata: {},
          });
        } catch (cacheErr) {
          console.error("Error writing profile cache:", cacheErr);
        }
      } catch (err) {
        console.error("Error fetching profile details:", err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchProfileData();
  }, [targetUserId, currentUser, userIdParam, profileCache, setProfileData]);

  if (authLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 animate-pulse">
        <div className="h-44 w-full bg-base-300 rounded-3xl" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-base-300 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  // Login screen for unauthenticated users
  if (!currentUser) {
    return (
      <div className="mx-auto max-w-md w-full my-12 bg-base-100 border border-base-200 shadow-xl rounded-3xl p-8 flex flex-col items-center">
        <div className="flex items-center gap-2.5 mb-2 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md">
            <BookOpen className="w-4.5 h-4.5 text-primary-content" />
          </div>
          <span className="text-xl font-serif font-black tracking-tight text-base-content">
            META <span className="text-primary">IITGN</span>
          </span>
        </div>
        <p className="text-base-content/50 text-xs text-center mb-8 font-medium tracking-wide uppercase">
          Sign in to view your profile and bookmarks
        </p>

        {status.type && (
          <div className={`w-full mb-5 p-3.5 rounded-2xl flex items-start gap-3 border text-xs ${
            status.type === "success" ? "bg-success/10 border-success/20 text-success" : "bg-error/10 border-error/20 text-error"
          }`}>
            {status.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <div>
              <p className="font-bold">{status.type === "success" ? "Success" : "Error"}</p>
              <p className="mt-0.5 opacity-90 font-medium leading-relaxed">{status.message}</p>
            </div>
          </div>
        )}

        <button
          onClick={() => handleGoogleLogin()}
          disabled={loginLoading}
          className="w-full h-11 flex items-center justify-center gap-3 px-6 bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-content font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer select-none text-sm"
        >
          <svg className="w-4.5 h-4.5 fill-current shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.58c-.28 1.48-1.12 2.74-2.38 3.58v2.98h3.84c2.24-2.06 3.53-5.1 3.53-8.41z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.84-2.98c-1.08.72-2.45 1.16-4.09 1.16-3.15 0-5.81-2.13-6.76-5.01H1.44v3.08C3.42 21.09 7.43 24 12 24z" />
            <path fill="#FBBC05" d="M5.24 14.26c-.24-.72-.38-1.5-.38-2.31s.14-1.59.38-2.31V6.56H1.44C.52 8.4.02 10.46.02 12.63c0 2.17.5 4.23 1.42 6.07l3.8-2.97z" />
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0 7.43 0 3.42 2.91 1.44 6.56l3.8 2.97c.95-2.88 3.61-5.01 6.76-5.01z" />
          </svg>
          {loginLoading ? "Signing in..." : "Continue with Google"}
        </button>

        <div className="w-full flex items-center my-6">
          <div className="flex-1 h-px bg-base-200" />
          <span className="px-3 text-[10px] text-base-content/50 font-bold uppercase tracking-wider">or bypass</span>
          <div className="flex-1 h-px bg-base-200" />
        </div>

        <div className="w-full">
          <button
            onClick={() => setShowDevBypass(!showDevBypass)}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-base-content/50 hover:text-base-content text-xs font-bold border border-dashed border-base-300 hover:border-base-400 rounded-xl transition-all cursor-pointer bg-base-200/50"
          >
            <Cpu className="w-3.5 h-3.5" />
            {showDevBypass ? "Hide Sandbox Bypass" : "Show Sandbox Bypass"}
          </button>

          {showDevBypass && (
            <form onSubmit={handleDevBypass} className="mt-3.5 p-4 rounded-2xl bg-base-200 border border-base-300 flex flex-col gap-3.5 w-full">
              <div className="flex items-center gap-1.5 text-warning text-xs font-bold">
                <ShieldAlert className="w-4 h-4 text-warning shrink-0" />
                <span>Local Sandbox Bypass</span>
              </div>
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
                className="select select-sm w-full border-base-300"
              >
                {DEV_ACCOUNTS.map((acc) => (
                  <option key={acc.email} value={acc.email}>{acc.name}</option>
                ))}
              </select>
              <button type="submit" className="btn btn-primary btn-sm w-full">
                Bypass Sandbox
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  const name = profileUser?.name || "Campus Contributor";
  const initials = name.split(" ").map((part: string) => part[0]).join("").slice(0, 2).toUpperCase();
  const joined = profileUser?.created_at
    ? new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(profileUser.created_at))
    : "this semester";
  const role = profileUser?.role || "member";
  const tierLabel = role === "admin" ? "Gold Admin" : role === "moderator" ? "Silver Moderator" : "Bronze Contributor";
  const tierColor = role === "admin" ? "badge-warning" : role === "moderator" ? "badge-secondary" : "badge-primary";
  const isOwner = targetUserId === currentUser?.user_id;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-28">

      {/* ── Profile Header Card ─────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-base-200 bg-base-100 shadow-sm">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-primary/30 via-secondary/20 to-accent/20" />

        <div className="relative px-5 pb-6 sm:px-8">
          {/* Avatar - overlaps banner */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between -mt-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="h-20 w-20 rounded-2xl border-4 border-base-100 bg-base-200 flex items-center justify-center text-xl font-black text-base-content shadow-lg shrink-0 overflow-hidden">
                {dataLoading ? (
                  <div className="h-full w-full bg-base-300 animate-pulse" />
                ) : profileUser?.avatar_url ? (
                  <img src={profileUser.avatar_url} alt={name} className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>

              <div className="space-y-1 pb-1">
                {dataLoading ? (
                  <div className="space-y-2">
                    <div className="h-6 w-48 bg-base-300 animate-pulse rounded-lg" />
                    <div className="h-4 w-32 bg-base-300 animate-pulse rounded-lg" />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
                      <h1 className="font-display text-2xl font-black tracking-tight text-base-content">{name}</h1>
                      <span className={`badge badge-sm font-bold ${tierColor}`}>{tierLabel}</span>
                    </div>
                    <p className="text-sm text-base-content/60 font-medium">{role} · since {joined}</p>
                    {profileUser?.email && (
                      <p className="text-xs text-base-content/40 font-mono">{profileUser.email}</p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            {isOwner && !dataLoading && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={async () => {
                    await logout();
                    router.push('/');
                  }}
                  className="btn btn-ghost btn-sm gap-1 text-error/80 hover:text-error"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-t border-base-200 px-5 sm:px-8">
          {["overview", "bookmarks"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer capitalize ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-base-content/50 hover:text-base-content"
              }`}
            >
              {tab === "bookmarks" ? `Bookmarks (${bookmarks.length})` : tab}
            </button>
          ))}
        </div>
      </section>

      {activeTab === "overview" && (
        <>
          {/* ── Stats Row ───────────────────────────────────────────── */}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Contribution pts", value: profileStats?.points?.toLocaleString(), icon: Sparkles, tone: "text-primary bg-primary/5 border border-primary/20" },
              { label: "Articles improved", value: profileStats?.articlesImproved?.toString(), icon: FileEdit, tone: "text-secondary bg-secondary/5 border border-secondary/20" },
              { label: "Edits this month", value: profileStats?.editsThisMonth?.toString(), icon: TrendingUp, tone: "text-accent bg-accent/5 border border-accent/20" },
              { label: "Current streak", value: profileStats?.streak !== undefined ? `${profileStats.streak}d` : "—", icon: Flame, tone: "text-warning bg-warning/5 border border-warning/20" },
            ].map(({ label, value, icon: Icon, tone }) => (
              <div key={label} className={`rounded-2xl bg-base-100 p-4 shadow-sm flex flex-col justify-between ${tone}`}>
                <Icon className="mb-2 h-5 w-5" />
                {dataLoading || value === undefined ? (
                  <div className="h-7 w-16 bg-base-300 animate-pulse rounded-lg" />
                ) : (
                  <p className="text-xl font-black text-base-content">{value}</p>
                )}
                <p className="mt-1 text-[10px] font-bold text-base-content/55 uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </section>

          {/* ── Content grid ────────────────────────────────────────── */}
          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">

            {/* Recent activity */}
            <section className="rounded-3xl border border-base-200 bg-base-100 p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-black text-base-content">Recent Activity</h2>
                  <p className="mt-0.5 text-xs text-base-content/55">Your contributions to META IITGN.</p>
                </div>
              </div>
              {dataLoading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-14 bg-base-300 animate-pulse rounded-xl" />)}
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="space-y-1">
                  {recentActivity.map((item, idx) => {
                    const Icon = item.type === "created" ? FilePlus2 : FileEdit;
                    const tone = item.type === "created" ? "text-success bg-success/10" : "text-primary bg-primary/10";
                    const relTime = item.time ? new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
                      Math.round((new Date(item.time).getTime() - Date.now()) / 86400000), "day"
                    ) : "";
                    return (
                      <div key={idx} className="flex gap-3 rounded-2xl p-3 hover:bg-base-200/70 transition-colors">
                        <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-base-content">{item.type} — {item.title}</span>
                          <span className="mt-0.5 block text-xs text-base-content/50">{item.status} · {relTime}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-base-content/50">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No recent activity yet. Start contributing to pages!
                </div>
              )}
            </section>

            {/* Profile aside */}
            <aside className="space-y-5">
              {/* Profile README */}
              <section className="rounded-3xl border border-base-200 bg-base-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-black text-base-content text-sm">Profile README</h2>
                  {isOwner && !dataLoading && (
                    <Link href={`/wiki/page/profile-${targetUserId}`} className="btn btn-ghost btn-xs rounded-xl text-primary">
                      <PenLine className="h-3.5 w-3.5" /> Edit
                    </Link>
                  )}
                </div>
                <div className="prose prose-xs max-w-none text-base-content/75">
                  {dataLoading ? (
                    <div className="space-y-2">
                      {[1,2,3].map(i => <div key={i} className="h-3 bg-base-300 animate-pulse rounded" />)}
                    </div>
                  ) : profileReadme ? (
                    <ReactMarkdown>{profileReadme}</ReactMarkdown>
                  ) : (
                    <p className="text-xs text-base-content/40 italic">
                      No README yet.{isOwner ? " Add one to introduce yourself!" : ""}
                    </p>
                  )}
                </div>
              </section>

              {/* Contribution goal */}
              <section className="rounded-3xl border border-warning/20 bg-warning/5 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="font-black text-base-content text-sm">Contribution goal</h2>
                  <Medal className="h-5 w-5 text-warning" />
                </div>
                <p className="mt-2 text-xs text-base-content/65 leading-relaxed">
                  Make {Math.max(0, 36 - (profileStats?.articlesImproved || 0))} more improvements to reach the next milestone.
                </p>
                {dataLoading ? (
                  <div className="h-2 w-full bg-base-300 animate-pulse rounded-full mt-3" />
                ) : (
                  <progress className="progress progress-warning mt-3 h-1.5 w-full" value={Math.min(100, ((profileStats?.articlesImproved || 0) / 36) * 100)} max="100" />
                )}
                <div className="mt-1.5 flex justify-between text-[10px] font-semibold text-base-content/50">
                  <span>{profileStats?.articlesImproved || 0} edits</span>
                  <span>36 edits</span>
                </div>
                <Link href="/wiki" className="btn btn-warning btn-sm mt-4 w-full rounded-xl text-warning-content">
                  <BookOpen className="h-4 w-4" /> Find an article
                </Link>
              </section>

              {/* Details */}
              <section className="rounded-3xl border border-base-200 bg-base-100 p-5 shadow-sm">
                <h2 className="font-black text-base-content text-sm mb-4">Profile details</h2>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center gap-3 text-base-content/65">
                    <MapPin className="h-4 w-4 text-secondary" /> IIT Gandhinagar community
                  </div>
                  <div className="flex items-center gap-3 text-base-content/65">
                    <CalendarDays className="h-4 w-4 text-accent" /> Joined {joined}
                  </div>
                  <div className="flex items-center gap-3 text-base-content/65">
                    <Heart className="h-4 w-4 text-error" /> {bookmarks.length} bookmarked pages
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </>
      )}

      {activeTab === "bookmarks" && (
        <section className="rounded-3xl border border-base-200 bg-base-100 p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-black text-base-content">Saved Pages</h2>
              <p className="mt-0.5 text-xs text-base-content/55">{bookmarks.length} bookmarks</p>
            </div>
            <Link href="/" className="btn btn-ghost btn-xs text-primary gap-1">
              Browse wiki <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {bookmarks.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-base-300 rounded-2xl">
              <Bookmark className="h-10 w-10 mx-auto text-base-content/30 mb-3" />
              <p className="text-sm font-bold text-base-content/60">No bookmarks yet</p>
              <p className="text-xs text-base-content/40 mt-1">Bookmark pages from the wiki to find them here.</p>
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              {bookmarks.map((item: any) => (
                <div
                  key={item.id || item.bookmark_id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-base-200 hover:border-primary/30 hover:shadow-sm transition-all group cursor-pointer"
                  onClick={() => router.push(`/wiki/page/${item.slug}`)}
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <h4 className="text-sm font-semibold text-base-content group-hover:text-primary transition-colors truncate">{item.title}</h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-secondary mt-0.5 block">{item.category}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeBookmark(item.id || String(item.page_id));
                    }}
                    className="btn btn-ghost btn-xs text-base-content/40 hover:text-error transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                    aria-label="Remove bookmark"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
