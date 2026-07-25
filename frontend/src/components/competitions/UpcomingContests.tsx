"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { db } from "@/lib/db";
import {
  Trophy,
  ExternalLink,
  Clock,
  Calendar,
  RefreshCw,
  ChevronRight,
  AlertCircle,
  BookOpen,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Contest {
  title:     string;
  url:       string;
  startTime: string;
  duration:  string;
  platform:  string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** 4-hour cache TTL for contest data */
const CONTESTS_CACHE_TTL_MS = 4 * 60 * 60 * 1000;
const CONTESTS_CACHE_KEY    = "all_contests";

// ---------------------------------------------------------------------------
// Curated resource links shown in the right sidebar
// ---------------------------------------------------------------------------

interface ResourceLink {
  name: string;
  url:  string;
  tag:  "Important" | "Medium";
}

const RESOURCES: ResourceLink[] = [
  {
    name: "DSA pdf Notes",
    url:  "https://github.com/Deeksha2501/Data-Structures-and-Algorithms-Notes",
    tag:  "Important",
  },
  {
    name: "NeetCode-150",
    url:  "https://neetcode.io/practice/practice/neetcode150",
    tag:  "Important",
  },
  {
    name: "Awesome Repo",
    url:  "https://github.com/sindresorhus/awesome",
    tag:  "Medium",
  },
  {
    name: "TakeUForward",
    url:  "https://takeuforward.org",
    tag:  "Important",
  },
];

// Per-platform styling (DaisyUI badge colours + accent)
const PLATFORM_STYLES: Record<string, { badge: string; accent: string; dot: string }> = {
  codeforces:  { badge: "badge-error",   accent: "text-error",   dot: "bg-error"   },
  atcoder:     { badge: "badge-info",    accent: "text-info",    dot: "bg-info"    },
  leetcode:    { badge: "badge-warning", accent: "text-warning", dot: "bg-warning" },
  codechef:    { badge: "badge-success", accent: "text-success", dot: "bg-success" },
  hackerearth: { badge: "badge-primary", accent: "text-primary", dot: "bg-primary" },
  hackerrank:  { badge: "badge-success", accent: "text-success", dot: "bg-success" },
  default:     { badge: "badge-neutral", accent: "text-base-content", dot: "bg-neutral" },
};

function platformStyle(platform: string) {
  return PLATFORM_STYLES[platform.toLowerCase()] ?? PLATFORM_STYLES.default;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatStartTime(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString(undefined, {
      month:  "short",
      day:    "numeric",
      hour:   "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

function formatDuration(raw: string): string {
  if (!raw) return "—";
  // Some APIs return seconds as a number/string
  const secs = parseInt(raw, 10);
  if (!isNaN(secs)) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  }
  return raw;
}

function getCountdown(isoString: string): { label: string; urgent: boolean } {
  const diff = new Date(isoString).getTime() - Date.now();
  if (diff < 0) return { label: "Started", urgent: false };
  const hours   = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const days    = Math.floor(hours / 24);
  if (days > 0)        return { label: `in ${days}d ${hours % 24}h`, urgent: false };
  if (hours > 0)       return { label: `in ${hours}h ${minutes}m`,   urgent: hours < 3  };
  return               { label: `in ${minutes}m`,                    urgent: true       };
}

// ---------------------------------------------------------------------------
// IndexedDB helpers
// ---------------------------------------------------------------------------

async function getCachedContests(): Promise<Contest[] | null> {
  try {
    const cached = await db.competitions_contests.get(CONTESTS_CACHE_KEY);
    if (cached && Date.now() - cached.cached_at < CONTESTS_CACHE_TTL_MS) {
      return cached.contests as Contest[];
    }
    return null;
  } catch {
    return null;
  }
}

async function cacheContests(contests: Contest[]): Promise<void> {
  try {
    await db.competitions_contests.put({
      cache_key: CONTESTS_CACHE_KEY,
      contests,
      cached_at: Date.now(),
    });
  } catch {
    // Ignore storage errors
  }
}

async function clearContestsCache(): Promise<void> {
  try {
    await db.competitions_contests.delete(CONTESTS_CACHE_KEY);
  } catch {
    // Ignore
  }
}

// ---------------------------------------------------------------------------
// Fetch contests from contest-hive
// ---------------------------------------------------------------------------

async function fetchContestsFromNetwork(): Promise<Contest[]> {
  const res = await axios.get("https://contest-hive.vercel.app/api/all", {
    withCredentials: false,
  });

  const platformData = res.data?.data ?? res.data?.contests?.data;
  if (!platformData || typeof platformData !== "object") return [];

  const list: Contest[] = [];
  Object.keys(platformData).forEach((platformName) => {
    const contests = platformData[platformName];
    if (!Array.isArray(contests)) return;
    contests.forEach((c: any) => {
      list.push({
        title:     c.title,
        url:       c.url,
        startTime: c.startTime ?? c.start_time ?? c.start ?? "",
        duration:  c.duration ?? "",
        platform:  platformName,
      });
    });
  });

  list.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  return list;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function ContestSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="card bg-base-100 border border-base-200 animate-pulse">
          <div className="card-body p-4 gap-3">
            <div className="flex items-center gap-3">
              <div className="h-5 w-20 rounded-full bg-base-300" />
              <div className="h-4 w-40 rounded bg-base-300" />
            </div>
            <div className="flex gap-4">
              <div className="h-3 w-28 rounded bg-base-300" />
              <div className="h-3 w-16 rounded bg-base-300" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single contest card
// ---------------------------------------------------------------------------

interface ContestCardProps {
  contest: Contest;
  isFirst: boolean;
}

function ContestCard({ contest, isFirst }: ContestCardProps) {
  const style    = platformStyle(contest.platform);
  const countdown = getCountdown(contest.startTime);

  return (
    <a
      href={contest.url}
      target="_blank"
      rel="noreferrer"
      className={`group card bg-base-100 border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${
        isFirst
          ? "border-primary/40 ring-1 ring-primary/20"
          : "border-base-200 hover:border-base-300"
      }`}
    >
      <div className="card-body p-4 gap-2">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className={`badge badge-sm font-bold uppercase tracking-wider ${style.badge}`}>
              {contest.platform}
            </span>
            {isFirst && (
              <span className="badge badge-sm badge-outline text-primary border-primary/50 animate-pulse">
                ⚡ Next up
              </span>
            )}
          </div>
          <ExternalLink
            className="h-3.5 w-3.5 shrink-0 text-base-content/30 group-hover:text-base-content/60 transition-colors mt-0.5"
          />
        </div>

        {/* Title */}
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {contest.title}
        </h3>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-base-content/50">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatStartTime(contest.startTime)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDuration(contest.duration)}
          </span>
          <span
            className={`ml-auto font-semibold text-[11px] ${
              countdown.urgent ? "text-error animate-pulse" : "text-base-content/60"
            }`}
          >
            {countdown.label}
          </span>
        </div>
      </div>
    </a>
  );
}

// ---------------------------------------------------------------------------
// Platform filter pill
// ---------------------------------------------------------------------------

interface PlatformPillProps {
  label:    string;
  active:   boolean;
  onClick:  () => void;
  dotClass: string;
}

function PlatformPill({ label, active, onClick, dotClass }: PlatformPillProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
        active
          ? "bg-primary text-primary-content shadow-sm"
          : "bg-base-200 text-base-content/70 hover:bg-base-300 hover:text-base-content"
      }`}
    >
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${active ? "bg-primary-content" : dotClass}`} />
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function UpcomingContests() {
  const [contests,       setContests]       = useState<Contest[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState("all");
  const [showCount,      setShowCount]      = useState(20);

  const loadContests = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      if (!forceRefresh) {
        const cached = await getCachedContests();
        if (cached) {
          setContests(cached);
          setLoading(false);
          return;
        }
      }

      const fresh = await fetchContestsFromNetwork();
      await cacheContests(fresh);
      setContests(fresh);
    } catch (err) {
      setError("Failed to fetch contests. Please try again.");
      console.error("[UpcomingContests]", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContests();
  }, [loadContests]);

  // Derive platform list from fetched data
  const platforms = ["all", ...Array.from(new Set(contests.map((c) => c.platform.toLowerCase())))];

  const filtered =
    activePlatform === "all"
      ? contests
      : contests.filter((c) => c.platform.toLowerCase() === activePlatform);

  const visible = filtered.slice(0, showCount);
  const hasMore = filtered.length > showCount;

  const handleRefresh = async () => {
    await clearContestsCache();
    await loadContests(true);
  };

  // ---------------------------------------------------------------------------
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px] gap-5 min-h-0">
      {/* ── LEFT: Contest list ── */}
      <div className="flex flex-col gap-4 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              Upcoming Contests
            </h2>
            {!loading && !error && (
              <p className="text-xs text-base-content/50 mt-0.5">
                {filtered.length} contest{filtered.length !== 1 ? "s" : ""}
                 · live
              </p>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="btn btn-sm btn-ghost gap-1.5"
            title="Refresh contests"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Platform filter chips */}
        {!loading && contests.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {platforms.map((p) => {
              const style = p === "all" ? { dot: "bg-base-content/40" } : platformStyle(p);
              return (
                <PlatformPill
                  key={p}
                  label={p === "all" ? "All" : p.charAt(0).toUpperCase() + p.slice(1)}
                  active={activePlatform === p}
                  onClick={() => { setActivePlatform(p); setShowCount(20); }}
                  dotClass={style.dot}
                />
              );
            })}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="alert alert-error">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* List */}
        {loading ? (
          <ContestSkeleton />
        ) : visible.length > 0 ? (
          <>
            <div className="flex flex-col gap-2.5">
              {visible.map((contest, idx) => (
                <ContestCard key={`${contest.platform}-${idx}`} contest={contest} isFirst={idx === 0 && activePlatform === "all"} />
              ))}
            </div>
            {hasMore && (
              <button
                onClick={() => setShowCount((n) => n + 20)}
                className="btn btn-outline btn-sm w-full mt-1"
              >
                Load {Math.min(20, filtered.length - showCount)} more
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </>
        ) : (
          !error && (
            <div className="flex flex-col items-center gap-3 py-16 text-base-content/40">
              <Trophy className="h-10 w-10 opacity-30" />
              <p className="text-sm">No contests found for this filter.</p>
            </div>
          )
        )}
      </div>

      {/* ── RIGHT: Resources sidebar ── */}
      <div className="flex flex-col gap-4 min-w-0">
        <div className="card bg-base-100 border border-base-200">
          <div className="card-body p-5 gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-base">Resources</h3>
            </div>

            {/* Real resource links */}
            <div className="flex flex-col gap-2 mt-1">
              {RESOURCES.map((res) => (
                <div
                  key={res.url}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-base-200/50 hover:bg-base-200 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{res.name}</p>
                    <span
                      className={`badge badge-xs mt-1 ${
                        res.tag === "Important"
                          ? "badge-error text-white"
                          : "badge-warning text-warning-content"
                      }`}
                    >
                      {res.tag}
                    </span>
                  </div>
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-xs btn-primary shrink-0 rounded-2xl"
                  >
                    Open
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>


        {/* Stats card */}
        {!loading && contests.length > 0 && (
          <div className="card bg-gradient-to-br from-primary/10 via-base-100 to-secondary/10 border border-primary/20">
            <div className="card-body p-5 gap-3">
              <h3 className="font-semibold text-sm text-base-content/70 uppercase tracking-wider">
                Quick stats
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-base-100 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{contests.length}</p>
                  <p className="text-[11px] text-base-content/50 mt-0.5">Total contests</p>
                </div>
                <div className="bg-base-100 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-secondary">{platforms.length - 1}</p>
                  <p className="text-[11px] text-base-content/50 mt-0.5">Platforms</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}