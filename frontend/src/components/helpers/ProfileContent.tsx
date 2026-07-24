"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-hot-toast";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import GenericOverlayModal from "@/components/overlays/GenericOverlayModal";
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
  Settings,
  PlusCircle,
  Calendar,
  FileText,
  ExternalLink,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Link2,
  Code,
  List,
} from "lucide-react";
import Avatar from "@/components/helpers/Avatar";
import UnifiedViewItem from "@/components/helpers/UnifiedViewItem";
import ViewSwitcher from "@/components/helpers/ViewSwitcher";
import { useViewMode } from "@/hooks/useViewMode";
import { getGridClass } from "@/lib/viewModes";
import { useAuth } from "@/hooks/useAuth";
import { apiService } from "@/api";
import { db } from "@/lib/db";
import { useHomeStore } from "@/store/useHomeStore";
import { useRouter } from "next/navigation";
import { useProfile } from "@/context/ProfileContext";
import AdminDashboardOverlay from "@/components/overlays/AdminDashboardOverlay";
import ConfirmationModal from "@/components/overlays/ConfirmationModal";
import type { Paper } from "@/lib/types";
import InterviewPostCard from "@/components/interviews/InterviewPostCard";
import type { InterviewPost } from "@/api/interviews";

const formatBlogDate = (dateString: string) => {
  try {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  } catch {
    return "Unknown Date";
  }
};

export default function ProfileContent() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { bookmarks, removeBookmark, setActiveOverlay } = useHomeStore();
  const { profileCache, setProfileData } = useProfile();
  const [isSavingReadme, setIsSavingReadme] = useState<boolean>(false);
  const [showDashboard, setShowDashboard] = useState(false);

  // Profile README edit overlay states & handlers
  const [isEditingReadme, setIsEditingReadme] = useState(false);
  const [editReadmeContent, setEditReadmeContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = (syntax: string, placeholder = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const selectedText = text.substring(start, end) || placeholder;

    let replacement = "";
    if (syntax === "bold") {
      replacement = `**${selectedText}**`;
    } else if (syntax === "italic") {
      replacement = `*${selectedText}*`;
    } else if (syntax === "h1") {
      replacement = `\n# ${selectedText || "Heading 1"}\n`;
    } else if (syntax === "h2") {
      replacement = `\n## ${selectedText || "Heading 2"}\n`;
    } else if (syntax === "link") {
      replacement = `[${selectedText || "Link Title"}](https://)`;
    } else if (syntax === "image") {
      replacement = `![${selectedText || "Image Description"}](https://)`;
    } else if (syntax === "code") {
      replacement = `\n\`\`\`\n${selectedText || "code here"}\n\`\`\`\n`;
    } else if (syntax === "list") {
      replacement = `\n- ${selectedText || "List item"}\n`;
    }

    const newContent =
      text.substring(0, start) + replacement + text.substring(end);
    setEditReadmeContent(newContent);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + replacement.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };
  const userIdParam = searchParams?.get("userId");
  const targetUserId = userIdParam ? Number(userIdParam) : currentUser?.user_id;
  const isOwnProfile =
    !!currentUser &&
    (!userIdParam || Number(userIdParam) === currentUser.user_id);

  const handleSaveReadme = async () => {
    if (!targetUserId) return;
    setIsSavingReadme(true);
    try {
      await apiService.saveUserReadme(editReadmeContent);
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
          await db.cachedpages.put({
            ...cached,
            content: JSON.stringify(parsed),
          });
        }
      } catch (cacheErr) {
        console.error("Error updating profile README cache:", cacheErr);
      }

      setIsEditingReadme(false);
      toast.success("Profile README saved successfully!");
    } catch (err) {
      console.error("Failed to save profile README:", err);
      toast.error("Failed to save profile README. Please try again.");
    } finally {
      setIsSavingReadme(false);
    }
  };

  const [profileUser, setProfileUser] = useState<any>(null);
  const [profileStats, setProfileStats] = useState<any>(null);
  const [profileReadme, setProfileReadme] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "bookmarks" | "blogs" | "interviews" | "papers"
  >("overview");
  const [targetBookmarks, setTargetBookmarks] = useState<any[]>([]);

  // Blogs tab state (lazy-loaded when the tab is opened)
  const [userBlogs, setUserBlogs] = useState<any[]>([]);
  const [blogsLoading, setBlogsLoading] = useState(false);
  const [blogsLoaded, setBlogsLoaded] = useState(false);
  const [blogView, setBlogView] = useViewMode("meta_iitgn_profile_blogs_view");

  // Papers tab state (lazy-loaded when the tab is opened)
  const [userPapers, setUserPapers] = useState<Paper[]>([]);
  const [papersLoading, setPapersLoading] = useState(false);
  const [papersLoaded, setPapersLoaded] = useState(false);
  const [deletingPaperId, setDeletingPaperId] = useState<number | null>(null);
  const [paperToDelete, setPaperToDelete] = useState<Paper | null>(null);

  // Interviews tab state (lazy-loaded when opened)
  const [userInterviews, setUserInterviews] = useState<InterviewPost[]>([]);
  const [interviewsLoading, setInterviewsLoading] = useState(false);
  const [interviewsLoaded, setInterviewsLoaded] = useState(false);

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
          const res = await apiService.getUserReadme(targetUserId);
          if (res && res.success && res.data) {
            readme = res.data.content;
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
  }, [targetUserId, currentUser, userIdParam, profileCache, setProfileData, isOwnProfile]);

  // Lazy-load authored blogs when the Blogs tab is first opened
  const loadUserBlogs = useCallback(async () => {
    if (!targetUserId) return;
    setBlogsLoading(true);
    try {
      const res = await apiService.getBlogs({
        author_id: targetUserId,
        limit: 50,
      });
      if (res && res.success) {
        setUserBlogs(res.blogs || []);
      }
    } catch (err) {
      console.error("Error loading user blogs:", err);
    } finally {
      setBlogsLoading(false);
      setBlogsLoaded(true);
    }
  }, [targetUserId]);

  useEffect(() => {
    if (
      activeTab === "blogs" &&
      !blogsLoaded &&
      !blogsLoading &&
      targetUserId
    ) {
      loadUserBlogs();
    }
  }, [activeTab, targetUserId, blogsLoaded, blogsLoading, loadUserBlogs]);

  // Lazy-load uploaded papers when the Papers tab is first opened
  const loadUserPapers = useCallback(async () => {
    if (!targetUserId) return;
    setPapersLoading(true);
    try {
      const res = await apiService.getUserPapers();
      if (res && res.success) {
        setUserPapers(res.data.papers || []);
      }
    } catch (err) {
      console.error("Error loading user papers:", err);
    } finally {
      setPapersLoading(false);
      setPapersLoaded(true);
    }
  }, [targetUserId]);

  useEffect(() => {
    if (
      activeTab === "papers" &&
      !papersLoaded &&
      !papersLoading &&
      targetUserId
    ) {
      loadUserPapers();
    }
  }, [activeTab, targetUserId, papersLoaded, papersLoading, loadUserPapers]);

  // Lazy-load interview posts when tab opened
  const loadUserInterviews = useCallback(async () => {
    if (!targetUserId) return;
    setInterviewsLoading(true);
    try {
      const res = isOwnProfile
        ? await apiService.getMyInterviews()
        : await apiService.getInterviews({ limit: 50 });
      if (res && res.success) {
        setUserInterviews(res.posts || []);
      }
    } catch (err) {
      console.error("Error loading user interview posts:", err);
    } finally {
      setInterviewsLoading(false);
      setInterviewsLoaded(true);
    }
  }, [targetUserId, isOwnProfile]);

  useEffect(() => {
    if (
      activeTab === "interviews" &&
      !interviewsLoaded &&
      !interviewsLoading &&
      targetUserId
    ) {
      loadUserInterviews();
    }
  }, [activeTab, targetUserId, interviewsLoaded, interviewsLoading, loadUserInterviews]);

  const handleDeletePaper = async (paperId: number) => {
    try {
      setDeletingPaperId(paperId);
      const res = await apiService.deletePaper(paperId);
      if (res && res.success) {
        setUserPapers((prev) => prev.filter((p) => p.paper_id !== paperId));
        toast.success("Paper deleted successfully!");
      }
    } catch (err: any) {
      console.error("Error deleting paper:", err);
      toast.error(
        err.response?.data?.error?.message || "Failed to delete paper."
      );
    } finally {
      setDeletingPaperId(null);
      setPaperToDelete(null);
    }
  };

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
    : (targetBookmarks ?? profileCache[targetUserId!]?.bookmarks ?? []);

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-28 scrollbar-none">
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
                    className="btn"
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
        <div className="flex border-t border-base-200 px-5 sm:px-8 overflow-x-auto">
          {[
            "overview",
            "bookmarks",
            "blogs",
            "interviews",
            isOwnProfile ? "papers" : null,
          ]
            .filter(Boolean)
            .map((tab) => (
              <button
                key={tab as string}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-3 text-xs font-bold tracking-wider border-b-2 transition-colors cursor-pointer capitalize whitespace-nowrap ${
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-base-content/50 hover:text-base-content"
                }`}
              >
                {tab === "bookmarks"
                  ? `Bookmarks (${displayBookmarks.length})`
                  : tab === "blogs"
                    ? "Blogs"
                    : tab === "interviews"
                      ? `Interview Feed ${interviewsLoaded ? `(${userInterviews.length})` : ""}`
                      : tab === "papers"
                        ? `Uploaded Papers ${papersLoaded ? `(${userPapers.length})` : ""}`
                        : tab}
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
            {/* Recent Activity - full width below the grid */}
            <section className="rounded-3xl border border-base-200 bg-base-100 p-5 shadow-sm ">
              <div className="mb-4 flex items-center justify-between gap-3">
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

            {/* Recent aside */}
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
                <button
                  type="button"
                  onClick={() => setActiveOverlay("categories")}
                  className="btn btn-warning btn-sm mt-4 w-full rounded-xl text-warning-content cursor-pointer"
                >
                  <BookOpen className="h-4 w-4" /> Find an article
                </button>
              </section>
            </aside>
          </div>

          {/* Profile README (takes place of recent activity) */}
          <section className="rounded-3xl border border-base-200 bg-base-100 p-5 shadow-sm sm:p-6 flex flex-col h-[50dvh]">
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
            <button
              type="button"
              onClick={() => setActiveOverlay("categories")}
              className="btn btn-ghost btn-xs text-primary gap-1 cursor-pointer"
            >
              Browse wiki <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {displayBookmarks.length === 0 ? (
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
              {displayBookmarks.map((item: any) => (
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
                  {isOwnProfile && (
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
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "interviews" && (
        <section className="rounded-3xl border border-base-200 bg-base-100 p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-base font-black text-base-content">
                Interview Feed Experiences
              </h2>
              <p className="mt-0.5 text-xs text-base-content/55">
                {interviewsLoaded
                  ? `${userInterviews.length} posts`
                  : "Interview experiences submitted by this user"}
              </p>
            </div>
          </div>

          {interviewsLoading ? (
            <div className="space-y-4">
              <div className="h-32 bg-base-300 animate-pulse rounded-2xl" />
              <div className="h-32 bg-base-300 animate-pulse rounded-2xl" />
            </div>
          ) : userInterviews.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-base-300 rounded-2xl">
              <MessageSquare className="h-10 w-10 mx-auto text-base-content/30 mb-3" />
              <p className="text-sm font-bold text-base-content/60">
                No interview posts submitted yet
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {userInterviews.map((post) => (
                <InterviewPostCard
                  key={post.post_id}
                  post={post}
                  onPostUpdated={loadUserInterviews}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "blogs" && (
        <section className="rounded-3xl border border-base-200 bg-base-100 p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-base font-black text-base-content">
                Written Blogs
              </h2>
              <p className="mt-0.5 text-xs text-base-content/55">
                {blogsLoaded
                  ? `${userBlogs.length} published ${userBlogs.length === 1 ? "post" : "posts"}`
                  : "Blog posts by this author"}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <ViewSwitcher view={blogView} onChange={setBlogView} />
              {isOwner && (
                <Link
                  href="/blog/new/edit"
                  className="btn btn-primary btn-sm font-bold rounded-xl shadow-md transition-all duration-200 cursor-pointer text-primary-content"
                >
                  <PlusCircle className="h-4 w-4" />
                  Write a Blog
                </Link>
              )}
            </div>
          </div>

          {blogsLoading ? (
            <div className={getGridClass(blogView)}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="card card-compact card-bordered w-full h-32 bg-base-100 border-base-200 shadow-xs animate-pulse"
                />
              ))}
            </div>
          ) : userBlogs.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-base-300 rounded-2xl">
              <BookOpen className="h-10 w-10 mx-auto text-base-content/30 mb-3" />
              <p className="text-sm font-bold text-base-content/60">
                No blogs yet
              </p>
              <p className="text-xs text-base-content/40 mt-1">
                {isOwner
                  ? "Share your first story with the community."
                  : "This user hasn't published any blogs."}
              </p>
              {isOwner && (
                <Link
                  href="/blog/new/edit"
                  className="btn btn-primary btn-sm mt-4 rounded-xl text-primary-content cursor-pointer"
                >
                  <PlusCircle className="h-4 w-4" /> Write a Blog
                </Link>
              )}
            </div>
          ) : (
            <div className={getGridClass(blogView)}>
              {userBlogs.map((blog: any) => {
                const href = `/blog/${blog.slug}`;
                const metaContent = (
                  <div className="flex items-center justify-between text-[10px] text-base-content/40 uppercase font-black tracking-wider">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatBlogDate(blog.created_at)}
                    </span>
                    <span>{blog.view_count} views</span>
                  </div>
                );

                const actionContent = (
                  <>
                    <div className="flex items-center gap-2">
                      <Avatar
                        seed={String(
                          blog.original_author?.user_id ?? targetUserId
                        )}
                        name={blog.original_author?.name ?? name}
                        className="h-6 w-6 rounded-full object-cover border border-base-300"
                      />
                      <span className="text-[11px] font-bold text-base-content/70 truncate max-w-[120px]">
                        {blog.original_author?.name ?? name}
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-1 text-[10px] font-black text-primary hover:underline transition-colors uppercase tracking-wider cursor-pointer">
                      <span>Read Blog</span>
                      <ArrowRight className="h-3 w-3 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </>
                );

                const authorAvatar = (
                  <Avatar
                    seed={String(blog.original_author?.user_id ?? targetUserId)}
                    name={blog.original_author?.name ?? name}
                    className="h-full w-full object-cover rounded-md"
                  />
                );

                return (
                  <UnifiedViewItem
                    key={blog.blog_id}
                    view={blogView}
                    href={href}
                    title={blog.title}
                    description={blog.description}
                    avatar={authorAvatar}
                    meta={blogView === "tiles" ? metaContent : undefined}
                    subtitle={
                      blogView === "details" || blogView === "default" ? (
                        <span className="flex items-center gap-2 text-[10px] text-base-content/40 uppercase font-black tracking-wider mt-1 flex-wrap">
                          <span>By {blog.original_author?.name ?? name}</span>
                          <span>•</span>
                          <span>{formatBlogDate(blog.created_at)}</span>
                          <span>•</span>
                          <span>{blog.view_count} views</span>
                        </span>
                      ) : undefined
                    }
                    action={blogView === "tiles" ? actionContent : undefined}
                  />
                );
              })}
            </div>
          )}
        </section>
      )}

      {activeTab === "papers" && (
        <section className="rounded-3xl border border-base-200 bg-base-100 p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-base font-black text-base-content">
                Uploaded Papers
              </h2>
              <p className="mt-0.5 text-xs text-base-content/55">
                {papersLoaded
                  ? `${userPapers.length} uploaded ${userPapers.length === 1 ? "paper" : "papers"}`
                  : "Question papers uploaded by you"}
              </p>
            </div>
            <Link
              href="/paper/upload"
              className="btn btn-primary btn-sm font-bold rounded-xl shadow-md transition-all duration-200 cursor-pointer text-primary-content shrink-0"
            >
              <PlusCircle className="h-4 w-4" />
              Upload Paper
            </Link>
          </div>

          {papersLoading ? (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-28 bg-base-300 animate-pulse rounded-2xl"
                />
              ))}
            </div>
          ) : userPapers.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-base-300 rounded-2xl">
              <FileText className="h-10 w-10 mx-auto text-base-content/30 mb-3" />
              <p className="text-sm font-bold text-base-content/60">
                No papers uploaded yet
              </p>
              <p className="text-xs text-base-content/40 mt-1">
                Upload previous semester exam papers to help your peers.
              </p>
              <Link
                href="/paper/upload"
                className="btn btn-primary btn-sm mt-4 rounded-xl text-primary-content cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" /> Upload a Paper
              </Link>
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              {userPapers.map((paper) => (
                <div
                  key={paper.paper_id}
                  className="flex flex-col justify-between p-4 rounded-2xl border border-base-200 hover:border-primary/30 hover:shadow-sm transition-all group bg-base-100"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                          {paper.course_code}
                        </span>
                        <span className="badge badge-sm badge-ghost font-semibold">
                          {paper.exam_type}
                        </span>
                        <span className="badge badge-sm badge-outline font-semibold">
                          {paper.year}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-base-content mt-1.5 line-clamp-1">
                        {paper.course_name}
                      </h4>
                      <p className="text-[11px] text-base-content/50 mt-0.5">
                        Sem {paper.semester} • {paper.department}
                      </p>
                    </div>
                    {isOwnProfile && (
                      <button
                        onClick={() => setPaperToDelete(paper)}
                        className="btn btn-ghost btn-xs text-base-content/40 hover:text-error transition-colors shrink-0 p-1"
                        title="Delete paper"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-base-200/60 mt-2 text-xs text-base-content/60">
                    <span className="text-[11px] text-base-content/50 font-mono truncate max-w-[160px]">
                      {paper.file_size || paper.file_name} • {paper.downloads}{" "}
                      downloads
                    </span>
                    <a
                      href={paper.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-xs btn-outline btn-primary rounded-lg gap-1"
                    >
                      <ExternalLink className="h-3 w-3" /> View PDF
                    </a>
                  </div>
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
          maxWidthClass="max-w-4xl lg:max-w-5xl"
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

            <div className="grow min-h-0 flex flex-col border border-base-300 rounded-xl bg-base-100 overflow-hidden">
              {/* Markdown Editing Toolbar */}
              <div className="flex gap-1 p-2 bg-base-200 border-b border-base-300 flex-wrap items-center">
                <button
                  type="button"
                  onClick={() => insertMarkdown("bold", "bold text")}
                  className="p-1.5 rounded-lg hover:bg-base-300 text-base-content/75 hover:text-base-content transition-colors cursor-pointer"
                  title="Bold"
                >
                  <Bold className="w-4.5 h-4.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("italic", "italic text")}
                  className="p-1.5 rounded-lg hover:bg-base-300 text-base-content/75 hover:text-base-content transition-colors cursor-pointer"
                  title="Italic"
                >
                  <Italic className="w-4.5 h-4.5" />
                </button>
                <span className="h-4 w-px bg-base-300 mx-1" />
                <button
                  type="button"
                  onClick={() => insertMarkdown("h1", "Heading 1")}
                  className="p-1.5 rounded-lg hover:bg-base-300 text-base-content/75 hover:text-base-content transition-colors cursor-pointer font-bold"
                  title="Heading 1"
                >
                  <Heading1 className="w-4.5 h-4.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("h2", "Heading 2")}
                  className="p-1.5 rounded-lg hover:bg-base-300 text-base-content/75 hover:text-base-content transition-colors cursor-pointer font-bold"
                  title="Heading 2"
                >
                  <Heading2 className="w-4.5 h-4.5" />
                </button>
                <span className="h-4 w-px bg-base-300 mx-1" />
                <button
                  type="button"
                  onClick={() => insertMarkdown("link", "Link Title")}
                  className="p-1.5 rounded-lg hover:bg-base-300 text-base-content/75 hover:text-base-content transition-colors cursor-pointer"
                  title="Link"
                >
                  <Link2 className="w-4.5 h-4.5" />
                </button>
                <span className="h-4 w-px bg-base-300 mx-1" />
                <button
                  type="button"
                  onClick={() => insertMarkdown("code", "code")}
                  className="p-1.5 rounded-lg hover:bg-base-300 text-base-content/75 hover:text-base-content transition-colors cursor-pointer font-mono"
                  title="Code Block"
                >
                  <Code className="w-4.5 h-4.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("list", "List item")}
                  className="p-1.5 rounded-lg hover:bg-base-300 text-base-content/75 hover:text-base-content transition-colors cursor-pointer"
                  title="List"
                >
                  <List className="w-4.5 h-4.5" />
                </button>
              </div>
              <textarea
                ref={textareaRef}
                value={editReadmeContent}
                onChange={(e) => setEditReadmeContent(e.target.value)}
                placeholder="e.g. # Hello World! I'm a student at IITGN..."
                className="w-full grow min-h-80 md:h-[450px] border-0 bg-base-100 text-base-content p-4 text-sm focus:outline-none focus:ring-0 font-mono leading-relaxed resize-none"
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
      {/* Confirmation Modal for deleting paper */}
      <ConfirmationModal
        isOpen={!!paperToDelete}
        onClose={() => setPaperToDelete(null)}
        onConfirm={() =>
          paperToDelete && handleDeletePaper(paperToDelete.paper_id)
        }
        title="Delete Paper"
        message={`Are you sure you want to delete "${paperToDelete?.course_code} - ${paperToDelete?.exam_type} (${paperToDelete?.year})"? This action cannot be undone.`}
        confirmText={deletingPaperId ? "Deleting..." : "Delete Paper"}
        cancelText="Cancel"
        type="danger"
      />

      {showDashboard && (
        <AdminDashboardOverlay setShowDashboard={setShowDashboard} />
      )}
    </div>
  );
}
