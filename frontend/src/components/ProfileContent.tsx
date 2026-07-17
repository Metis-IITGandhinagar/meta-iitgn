"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import GenericOverlayModal from "@/components/GenericOverlayModal";
import { useSearchParams } from "next/navigation";

import {
  BookOpen,
  CalendarDays,
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
  Bookmark,
  Trash2,
  ArrowRight,
  LogIn,
  LogOut,
  Shuffle,
  Settings,
} from "lucide-react";
import Avatar from "@/components/Avatar";
import { shuffleAvatarSeed } from "@/lib/avatar";
import { useAuth } from "@/hooks/useAuth";
import { apiService } from "@/api";
import { db } from "@/lib/db";
import { useHomeStore } from "@/store/useHomeStore";
import { useRouter } from "next/navigation";
import { useProfile } from "@/context/ProfileContext";
import AdminDashboardOverlay from "@/app/components/home/overlays/AdminDashboardOverlay";

export default function ProfileContent() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { bookmarks, removeBookmark } = useHomeStore();
  const { profileCache, setProfileData } = useProfile();
  const [isSavingReadme,setIsSavingReadme]=useState<boolean>(false);
  const [showDashboard, setShowDashboard] = useState(false);

  // Profile README edit overlay states & handlers
  const [isEditingReadme, setIsEditingReadme] = useState(false);
  const [editReadmeContent, setEditReadmeContent] = useState("");
  const userIdParam = searchParams?.get("userId");
  const targetUserId = userIdParam ? Number(userIdParam) : currentUser?.user_id;
  const isOwnProfile =
    !!currentUser &&
    (!userIdParam || Number(userIdParam) === currentUser.user_id);

  const handleSaveReadme = async () => {
    if (!targetUserId) return;
    setIsSavingReadme(true);
    try {
      const pageSlug = `profile-${targetUserId}`;

      // Try updating the existing README page first. If it doesn't exist yet
      // (404), create it. Relying on `profileReadme === null` to decide is
      // unreliable — an existing page with empty content also reads as null,
      // which would trigger a create against an existing slug and silently
      // produce a duplicate page (`profile-<id>-1`) that never gets read back.
      try {
        await apiService.updatePage(pageSlug, {
          content: editReadmeContent,
        });
      } catch (updateErr: any) {
        const status = updateErr?.response?.status;
        if (status === 404) {
          await apiService.createPage({
            title: pageSlug,
            slug: pageSlug,
            content: editReadmeContent,
            metadata: { category: "profile" },
          } as any);
        } else {
          throw updateErr;
        }
      }

      setProfileReadme(editReadmeContent);

      // Update in-memory context cache
      if (profileCache[targetUserId]) {
        setProfileData(targetUserId, {
          ...profileCache[targetUserId],
          readme: editReadmeContent,
        });
      }

      // Keep the IndexedDB cache in sync so a reload doesn't flash stale README
      try {
        const cacheKey = `profile-data-${targetUserId}`;
        const cached = await db.cachedpages.get(cacheKey);
        if (cached && cached.content) {
          const parsed = JSON.parse(cached.content);
          parsed.readme = editReadmeContent;
          await db.cachedpages.put({ ...cached, content: JSON.stringify(parsed) });
        }
      } catch (cacheErr) {
        console.error("Error updating profile README cache:", cacheErr);
      }

      setIsEditingReadme(false);
    } catch (err) {
      console.error("Failed to save profile README:", err);
      alert("Failed to save profile README. Please try again.");
    } finally {
      setIsSavingReadme(false);
    }
  };

  const [profileUser, setProfileUser] = useState<any>(null);
  const [profileStats, setProfileStats] = useState<any>(null);
  const [profileReadme, setProfileReadme] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "bookmarks">(
    "overview"
  );
  const [targetBookmarks, setTargetBookmarks] = useState<any[]>([]);

  useEffect(() => {
    if (!targetUserId) return;

    // Check memory context cache first!
    if (profileCache[targetUserId]) {
      const cached = profileCache[targetUserId];
      setProfileUser(cached.user);
      setProfileStats(cached.stats);
      setProfileReadme(cached.readme);
      setRecentActivity(cached.activity);
      setTargetBookmarks(cached.bookmarks || []);
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
          setTargetBookmarks(parsedCache.bookmarks || []);
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
          const draftsRes = await apiService.getPendingDrafts(
            targetUserId,
            5,
            1
          );
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

        // Target user's bookmarks (only needed when viewing someone else's profile;
        // your own bookmarks live in the reactive home store).
        let otherBookmarks: any[] = [];
        if (!isOwnProfile) {
          try {
            const bmRes = await apiService.getUserBookmarks(targetUserId);
            if (Array.isArray(bmRes)) {
              otherBookmarks = bmRes;
              setTargetBookmarks(otherBookmarks);
            }
          } catch {
            // Bookmarks simply won't render for this profile if the fetch fails.
          }
        }

        const freshData = {
          user: targetUser,
          stats,
          readme,
          activity,
          bookmarks: otherBookmarks,
        };

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
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-base-300 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-24 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <LogIn className="h-7 w-7" />
        </span>
        <div className="space-y-1">
          <h1 className="font-display text-xl font-black tracking-tight text-base-content">
            You&apos;re not signed in
          </h1>
          <p className="text-sm text-base-content/60">
            Sign in to view your profile, contributions, and bookmarks.
          </p>
        </div>
        <Link href="/login" className="btn btn-primary rounded-xl">
          <LogIn className="h-4 w-4" /> Go to login
        </Link>
      </div>
    );
  }

  const name = profileUser?.name || "Campus Contributor";
  const joined = profileUser?.created_at
    ? new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(
        new Date(profileUser.created_at)
      )
    : "this semester";
  const role = profileUser?.role || "member";
  const tierLabel =
    role === "admin"
      ? "Gold Admin"
      : role === "moderator"
        ? "Silver Moderator"
        : "Bronze Contributor";
  const tierColor =
    role === "admin"
      ? "badge-warning"
      : role === "moderator"
        ? "badge-secondary"
        : "badge-primary";
  const isOwner = targetUserId === currentUser?.user_id;
  const displayBookmarks = isOwnProfile
    ? bookmarks
    : targetBookmarks ?? profileCache[targetUserId!]?.bookmarks ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-28">
      {/* ── Profile Header Card ─────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-base-200 bg-base-100 shadow-sm">
        {/* Banner */}
        <div className="h-24 bg-linear-to-r from-primary/30 via-secondary/20 to-accent/20" />

        <div className="relative px-5 pb-6 sm:px-8">
          {/* Avatar - overlaps banner */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between -mt-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="relative">
                <div className="h-20 w-20 rounded-2xl border-4 border-base-100 bg-base-200 shadow-lg shrink-0 overflow-hidden">
                  {dataLoading ? (
                    <div className="h-full w-full bg-base-300 animate-pulse" />
                  ) : (
                    <Avatar
                      email={profileUser?.email}
                      name={name}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                {isOwnProfile && !dataLoading && (
                  <button
                    type="button"
                    onClick={() => currentUser && shuffleAvatarSeed(currentUser.email)}
                    title="Shuffle avatar"
                    aria-label="Shuffle avatar"
                    className="absolute -bottom-2 -right-2 btn btn-circle btn-xs bg-base-100 border border-base-300 shadow hover:bg-base-200 text-base-content transition-colors cursor-pointer"
                  >
                    <Shuffle className="h-3.5 w-3.5" />
                  </button>
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
                      <h1 className="font-display text-2xl font-black tracking-tight text-base-content">
                        {name}
                      </h1>
                      <span className={`badge badge-sm font-bold ${tierColor}`}>
                        {tierLabel}
                      </span>
                    </div>
                    <p className="text-sm text-base-content/60 font-medium">
                      {role} · since {joined}
                    </p>
                    {profileUser?.email && (
                      <p className="text-xs text-base-content/40 font-mono">
                        {profileUser.email}
                      </p>
                    )}

                    {/* Inline Profile Details */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2.5 mt-2.5 border-t border-base-200/50 text-xs text-base-content/70">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-secondary" />
                        <span>IIT Gandhinagar community</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-accent" />
                        <span>Joined {joined}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Heart className="h-3.5 w-3.5 text-error" />
                        <span>{displayBookmarks.length} bookmarked pages</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            {isOwner && !dataLoading && (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {currentUser?.role === "admin" && (
                  <button
                    onClick={() => setShowDashboard(true)}
                    className="btn btn-outline btn-sm gap-1 text-primary hover:bg-primary/5 cursor-pointer rounded-xl font-bold"
                  >
                    <Settings className="h-4 w-4" /> Admin Panel
                  </button>
                )}
                <button
                  onClick={() => {
                    router.push("/logout");
                  }}
                  className="btn btn-ghost btn-sm gap-1 text-error/80 hover:text-error cursor-pointer"
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
              className={`px-4 py-3 text-xs font-bold tracking-wider border-b-2 transition-colors cursor-pointer capitalize ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-base-content/50 hover:text-base-content"
              }`}
            >
              {tab === "bookmarks" ? `Bookmarks (${displayBookmarks.length})` : tab}
            </button>
          ))}
        </div>
      </section>

      {activeTab === "overview" && (
        <>
          {/* ── Stats Row ───────────────────────────────────────────── */}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                label: "Contribution pts",
                value: profileStats?.points?.toLocaleString(),
                icon: Sparkles,
                tone: "text-primary bg-primary/5 border border-primary/20",
              },
              {
                label: "Articles improved",
                value: profileStats?.articlesImproved?.toString(),
                icon: FileEdit,
                tone: "text-secondary bg-secondary/5 border border-secondary/20",
              },
              {
                label: "Edits this month",
                value: profileStats?.editsThisMonth?.toString(),
                icon: TrendingUp,
                tone: "text-accent bg-accent/5 border border-accent/20",
              },
              {
                label: "Current streak",
                value:
                  profileStats?.streak !== undefined
                    ? `${profileStats.streak}d`
                    : "—",
                icon: Flame,
                tone: "text-warning bg-warning/5 border border-warning/20",
              },
            ].map(({ label, value, icon: Icon, tone }) => (
              <div
                key={label}
                className={`rounded-2xl bg-base-100 p-4 shadow-sm flex flex-col justify-between ${tone}`}
              >
                <Icon className="mb-2 h-5 w-5" />
                {dataLoading || value === undefined ? (
                  <div className="h-7 w-16 bg-base-300 animate-pulse rounded-lg" />
                ) : (
                  <p className="text-xl font-black text-base-content">
                    {value}
                  </p>
                )}
                <p className="mt-1 text-[10px] font-bold text-base-content/55 uppercase tracking-wider">
                  {label}
                </p>
              </div>
            ))}
          </section>

          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            {/* Profile README (takes place of recent activity) */}
            <section className="rounded-3xl border border-base-200 bg-base-100 p-5 shadow-sm sm:p-6 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-black text-base-content">
                  Profile README
                </h2>
                {isOwner && !dataLoading && (
                  <button
                    onClick={() => {
                      setEditReadmeContent(profileReadme || "");
                      setIsEditingReadme(true);
                    }}
                    className="btn btn-ghost btn-xs rounded-xl text-primary cursor-pointer"
                  >
                    <PenLine className="h-3.5 w-3.5" /> Edit
                  </button>
                )}
              </div>
              <div className="prose prose-xs max-w-none text-base-content/75 grow">
                {dataLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-3 bg-base-300 animate-pulse rounded"
                      />
                    ))}
                  </div>
                ) : profileReadme ? (
                  <ReactMarkdown>{profileReadme}</ReactMarkdown>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    <p className="text-xs text-base-content/40 italic">
                      No README yet.
                      {isOwner ? " Introduce yourself to the community!" : ""}
                    </p>
                    {isOwner && (
                      <button
                        onClick={() => {
                          setEditReadmeContent("");
                          setIsEditingReadme(true);
                        }}
                        className="btn btn-xs btn-outline btn-primary rounded-lg self-start mt-1 cursor-pointer"
                      >
                        Add README
                      </button>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Profile aside */}
            <aside className="space-y-5">
              {/* Contribution goal */}
              <section className="rounded-3xl border border-warning/20 bg-warning/5 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="font-black text-base-content text-sm">
                    Contribution goal
                  </h2>
                  <Medal className="h-5 w-5 text-warning" />
                </div>
                <p className="mt-2 text-xs text-base-content/65 leading-relaxed">
                  Make {Math.max(0, 36 - (profileStats?.articlesImproved || 0))}{" "}
                  more improvements to reach the next milestone.
                </p>
                {dataLoading ? (
                  <div className="h-2 w-full bg-base-300 animate-pulse rounded-full mt-3" />
                ) : (
                  <progress
                    className="progress progress-warning mt-3 h-1.5 w-full"
                    value={Math.min(
                      100,
                      ((profileStats?.articlesImproved || 0) / 36) * 100
                    )}
                    max="100"
                  />
                )}
                <div className="mt-1.5 flex justify-between text-[10px] font-semibold text-base-content/50">
                  <span>{profileStats?.articlesImproved || 0} edits</span>
                  <span>36 edits</span>
                </div>
                <Link
                  href="/wiki/categories"
                  className="btn btn-warning btn-sm mt-4 w-full rounded-xl text-warning-content"
                >
                  <BookOpen className="h-4 w-4" /> Find an article
                </Link>
              </section>
            </aside>
          </div>

          {/* Recent Activity - full width below the grid */}
          <section className="rounded-3xl border border-base-200 bg-base-100 p-5 shadow-sm sm:p-6 mt-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-base-content">
                  Recent Activity
                </h2>
                <p className="mt-0.5 text-xs text-base-content/55">
                  Your contributions to META IITGN.
                </p>
              </div>
            </div>
            {dataLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-14 bg-base-300 animate-pulse rounded-xl"
                  />
                ))}
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-1">
                {recentActivity.map((item, idx) => {
                  const Icon = item.type === "created" ? FilePlus2 : FileEdit;
                  const tone =
                    item.type === "created"
                      ? "text-success bg-success/10"
                      : "text-primary bg-primary/10";
                  const relTime = item.time
                    ? new Intl.RelativeTimeFormat("en", {
                        numeric: "auto",
                      }).format(
                        Math.round(
                          (new Date(item.time).getTime() - Date.now()) /
                            86400000
                        ),
                        "day"
                      )
                    : "";
                  return (
                    <div
                      key={idx}
                      className="flex gap-3 rounded-2xl p-3 hover:bg-base-200/70 transition-colors"
                    >
                      <span
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone}`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-base-content">
                          {item.type} — {item.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-base-content/50">
                          {item.status} · {relTime}
                        </span>
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
        </>
      )}

      {activeTab === "bookmarks" && (
        <section className="rounded-3xl border border-base-200 bg-base-100 p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-black text-base-content">
                Saved Pages
              </h2>
              <p className="mt-0.5 text-xs text-base-content/55">
                {displayBookmarks.length} bookmarks
              </p>
            </div>
            <Link
              href="/wiki/categories"
              className="btn btn-ghost btn-xs text-primary gap-1"
            >
              Browse wiki <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {bookmarks.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-base-300 rounded-2xl">
              <Bookmark className="h-10 w-10 mx-auto text-base-content/30 mb-3" />
              <p className="text-sm font-bold text-base-content/60">
                No bookmarks yet
              </p>
              <p className="text-xs text-base-content/40 mt-1">
                Bookmark pages from the wiki to find them here.
              </p>
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
                    <h4 className="text-sm font-semibold text-base-content group-hover:text-primary transition-colors truncate">
                      {item.title}
                    </h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-secondary mt-0.5 block">
                      {item.category}
                    </span>
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
      {/* Edit Profile README Overlay Modal */}
      {isEditingReadme && (
        <GenericOverlayModal
          isOpen={isEditingReadme}
          onClose={() => setIsEditingReadme(false)}
          title="Edit Profile README"
          maxWidthClass="max-w-2xl"
        >
          <div className="space-y-4 flex flex-col h-full min-h-0">
            <div className="flex flex-col gap-1.5 shrink-0">
              <h3 className="text-lg font-bold text-base-content leading-snug">
                Edit Profile README
              </h3>
              <p className="text-xs text-base-content/50 font-medium">
                Write a brief introduction, showcase your contributions, or list
                your academic interests using Markdown.
              </p>
            </div>

            <div className="grow min-h-0 flex flex-col">
              <textarea
                value={editReadmeContent}
                onChange={(e) => setEditReadmeContent(e.target.value)}
                placeholder="e.g. # Hello World! I'm a student at IITGN..."
                className="w-full grow min-h-62.5 border border-base-300 bg-base-100 text-base-content rounded-xl p-4 text-sm focus:outline-none focus:border-primary font-mono leading-relaxed resize-none"
              />
            </div>

            <footer className="pt-4 border-t border-base-200 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setIsEditingReadme(false)}
                disabled={isSavingReadme}
                className="btn btn-ghost btn-sm rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReadme}
                disabled={isSavingReadme}
                className="btn btn-primary btn-sm rounded-xl cursor-pointer"
              >
                {isSavingReadme ? "Saving..." : "Save README"}
              </button>
            </footer>
          </div>
        </GenericOverlayModal>
      )}
      {showDashboard && (
        <AdminDashboardOverlay setShowDashboard={setShowDashboard} />
      )}
    </div>
  );
}
