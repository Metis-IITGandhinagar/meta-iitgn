"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { getGithubRepos, type GitHubRepo } from "@/api/competition";
import {
  Star,
  GitFork,
  Eye,
  Search,
  ExternalLink,
  ChevronRight,
  Loader2,
  AlertCircle,
  GitBranch,
  Filter,
  X,
  Folder,
  Type,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Filter definitions (mirrors backend allowed values)
// ---------------------------------------------------------------------------

interface CategoryDef {
  id:    string;
  label: string;
}

interface LevelDef {
  id:    string;
  label: string;
}

const CATEGORIES: CategoryDef[] = [
  { id: "web-dev",    label: "Web Dev"          },
  { id: "devops",     label: "DevOps"           },
  { id: "ml",         label: "Machine Learning" },
  { id: "robotics",   label: "Robotics"         },
  { id: "os",         label: "Operating Systems"},
  { id: "mobile",     label: "Mobile Dev"       },
  { id: "gamedev",    label: "Game Dev"         },
  { id: "security",   label: "Cybersecurity"    },
  { id: "data",       label: "Data Science"     },
  { id: "blockchain", label: "Blockchain"       },
];

const LEVELS: LevelDef[] = [
  { id: "all",          label: "All levels"   },
  { id: "beginner",     label: "Beginner"     },
  { id: "intermediate", label: "Intermediate" },
  { id: "expert",       label: "Expert"       },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const days   = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days < 1)  return "today";
  if (days === 1) return "1 day ago";
  if (days < 30)  return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mo ago`;
  return `${Math.floor(months / 12)} yr ago`;
}

// ---------------------------------------------------------------------------
// Level badge (DaisyUI theme-aware)
// ---------------------------------------------------------------------------

const LEVEL_BADGE_CLASS: Record<string, string> = {
  all:          "badge-neutral",
  beginner:     "badge-success",
  intermediate: "badge-warning",
  expert:       "badge-error",
};

const LevelBadge: React.FC<{ level: string }> = ({ level }) => (
  <span className={`badge badge-sm ${LEVEL_BADGE_CLASS[level] ?? "badge-neutral"} capitalize`}>
    {level}
  </span>
);

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function RepoCardSkeleton() {
  return (
    <div className="card bg-base-100 border border-base-200 animate-pulse">
      <div className="card-body p-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-base-300 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 rounded bg-base-300" />
            <div className="h-3 w-1/4 rounded bg-base-300" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-base-300" />
          <div className="h-3 w-4/5 rounded bg-base-300" />
        </div>
        <div className="flex gap-3">
          <div className="h-3 w-16 rounded bg-base-300" />
          <div className="h-3 w-12 rounded bg-base-300" />
        </div>
      </div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-2.5 p-2 animate-pulse">
          <div className="h-9 w-9 rounded-full bg-base-300 shrink-0" />
          <div className="flex-1 space-y-2 py-0.5">
            <div className="h-3 w-2/3 rounded bg-base-300" />
            <div className="h-2.5 w-1/2 rounded bg-base-300" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Repo card (main view)
// ---------------------------------------------------------------------------

interface RepoCardProps {
  repo:     GitHubRepo;
  featured: boolean;
}

function RepoCard({ repo, featured }: RepoCardProps) {
  return (
    <a
      href={repo.html_url}
      target="_blank"
      rel="noreferrer"
      className={`group card bg-base-100 border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
        featured
          ? "border-primary/40 ring-1 ring-primary/20"
          : "border-base-200 hover:border-base-300"
      }`}
    >
      <div className="card-body p-4 gap-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Image
            src={repo.owner.avatar_url}
            alt={repo.owner.login}
            width={40}
            height={40}
            className="rounded-lg shrink-0 object-cover ring-1 ring-base-300"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                {repo.name}
              </h3>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-base-content/30 group-hover:text-base-content/60 transition-colors" />
            </div>
            <p className="text-xs text-base-content/50 truncate">{repo.full_name}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-base-content/70 line-clamp-2 leading-relaxed">
          {repo.description ?? "No description provided."}
        </p>

        {/* Topics */}
        {repo.topics && repo.topics.length > 0 && (
          <div className="md:flex hidden flex-wrap gap-1">
            {repo.topics.slice(0, 4).map((t) => (
              <span key={t} className="badge badge-ghost badge-xs">{t}</span>
            ))}
          </div>
        )}

        {/* Stats footer */}
        <div className="flex items-center gap-4 text-xs text-base-content/50 pt-1 border-t border-base-200">
          {repo.language && (
            <span className="flex items-center gap-1 font-medium text-base-content/70">
              <span className="h-2 w-2 rounded-full bg-primary inline-block" />
              {repo.language}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            {formatCount(repo.stargazers_count)}
          </span>
          <span className="flex items-center gap-1">
            <GitFork className="h-3 w-3" />
            {formatCount(repo.forks_count)}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {formatCount(repo.watchers_count)}
          </span>
          <span className="ml-auto hidden md:flex text-[11px]">Updated {timeAgo(repo.updated_at)}</span>
        </div>
      </div>
    </a>
  );
}

// ---------------------------------------------------------------------------
// Sidebar repo row
// ---------------------------------------------------------------------------

interface SidebarRowProps {
  repo: GitHubRepo;
}

function SidebarRow({ repo }: SidebarRowProps) {
  return (
    <a
      href={repo.html_url}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center gap-2.5 p-2 rounded-lg hover:bg-base-200/60 transition-colors"
    >
      <Image
        src={repo.owner.avatar_url}
        alt={repo.owner.login}
        width={36}
        height={36}
        className="rounded-full shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
          {repo.name}
        </p>
        <p className="text-xs text-base-content/50 truncate">
          {repo.description ?? repo.full_name}
        </p>
      </div>
      <span className="text-xs text-base-content/40 shrink-0 flex items-center gap-0.5">
        <Star className="h-3 w-3" />
        {formatCount(repo.stargazers_count)}
      </span>
    </a>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function GitHubExplorer() {
  const [category,    setCategory]    = useState<CategoryDef>(CATEGORIES[0]);
  const [level,       setLevel]       = useState<LevelDef>(LEVELS[0]);
  const [searchDraft, setSearchDraft] = useState("");
  const [search,      setSearch]      = useState("");

  const [repos,       setRepos]       = useState<GitHubRepo[]>([]);
  const [totalCount,  setTotalCount]  = useState(0);
  const [page,        setPage]        = useState(1);
  const [hasMore,     setHasMore]     = useState(true);

  const [loading,     setLoading]     = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  // ---------------------------------------------------------------------------
  // Initial / filter-change load
  // ---------------------------------------------------------------------------
  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);
    setPage(1);

    getGithubRepos(category.id, level.id, 1)
      .then(({ repos: items, total_count }) => {
        // Client-side search filter (backend doesn't accept freetext; filter here)
        const filtered = search.trim()
          ? items.filter(
              (r) =>
                r.name.toLowerCase().includes(search.toLowerCase()) ||
                (r.description ?? "").toLowerCase().includes(search.toLowerCase())
            )
          : items;
        setRepos(filtered);
        setTotalCount(total_count);
        setHasMore(items.length >= 15);
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") {
          setError(err.message);
          setRepos([]);
        }
      })
      .finally(() => setLoading(false));

    return () => abortRef.current?.abort();
     
  }, [category, level, search]);

  // ---------------------------------------------------------------------------
  // Load more
  // ---------------------------------------------------------------------------
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setError(null);
    const nextPage = page + 1;
    try {
      const { repos: items } = await getGithubRepos(category.id, level.id, nextPage);
      setRepos((prev) => {
        const existingIds = new Set(prev.map((r) => r.id));
        return [...prev, ...items.filter((r) => !existingIds.has(r.id))];
      });
      setPage(nextPage);
      setHasMore(items.length >= 15);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingMore(false);
    }
  }, [category, level, page, hasMore, loadingMore]);

  // ---------------------------------------------------------------------------
  // Search submit
  // ---------------------------------------------------------------------------
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchDraft);
  };

  // ---------------------------------------------------------------------------
  // Derived
  // ---------------------------------------------------------------------------
  const [featured, ...rest] = repos;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col gap-5 min-h-0">
      {/* ── Header bar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <GitBranch className="h-6 w-6 text-primary" />
            Open Source Explorer
          </h2>
          {!loading && !error && (
            <p className="text-xs text-base-content/50 mt-0.5">
              {formatCount(totalCount)} repositories
              · live from GitHub
            </p>
          )}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
          <label className="input input-bordered input-sm flex items-center gap-2 grow sm:w-64 rounded-2xl">
            <Search className="h-3.5 w-3.5 opacity-50 shrink-0" />
            <input
              type="text"
              placeholder="Filter by name…"
              className="grow min-w-0"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
            />
            {searchDraft && (
              <button
                type="button"
                onClick={() => { setSearchDraft(""); setSearch(""); }}
                className="opacity-40 hover:opacity-70"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </label>
          <button type="submit" className="btn btn-sm btn-primary rounded-2xl">
            Go
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline lg:hidden"
            onClick={() => setFiltersOpen((v) => !v)}
          >
            <Filter className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>

      {/* ── Filters ── */}
      <div className={`${filtersOpen ? "block" : "hidden"} lg:block`}>
        <div className="card bg-base-100 border border-base-200">
          <div className="card-body p-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end flex-wrap">
              {/* Level */}
              <div className="form-control w-full sm:w-48">
                <label className="label py-1">
                  <span className="label-text text-[11px] font-semibold uppercase tracking-widest text-base-content/50 flex">
                    <Folder className="h-3.5 w-3.5 mr-2"/> Level
                  </span>
                </label>
                <select
                  className="select select-bordered select-sm px-2"
                  value={level.id}
                  onChange={(e) => {
                    const next = LEVELS.find((l) => l.id === e.target.value);
                    if (next) setLevel(next);
                  }}
                >
                  {LEVELS.map((l) => (
                    <option key={l.id} value={l.id}>{l.label}</option>
                  ))}
                </select>
              </div>              
              {/* Category */}
              <div className="form-control w-full sm:w-60">
                <label className="label py-1">
                  <span className="label-text text-[11px] font-semibold uppercase tracking-widest text-base-content/50 flex">
                    <Type className="h-3.5 w-3.5 mr-2"/> Category
                  </span>
                </label>
                <select
                  className="select select-bordered select-sm px-2"
                  value={category.id}
                  onChange={(e) => {
                    const next = CATEGORIES.find((c) => c.id === e.target.value);
                    if (next) setCategory(next);
                  }}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Active badges */}
              <div className="flex flex-wrap gap-1.5 sm:ml-auto items-center">
                <LevelBadge level={level.id} />
                <span className="badge badge-outline badge-sm">{category.label}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="alert alert-error">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Main grid: LEFT list + RIGHT sidebar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_340px] gap-5 min-h-0">
        {/* LEFT: main repo list */}
        <div className="flex flex-col gap-3 min-w-0">
          {loading ? (
            <>
              <RepoCardSkeleton />
              <RepoCardSkeleton />
              <RepoCardSkeleton />
            </>
          ) : repos.length > 0 ? (
            <>
              {featured && (
                <RepoCard repo={featured} featured />
              )}
              {rest.map((repo) => (
                <RepoCard key={repo.id} repo={repo} featured={false} />
              ))}
              {hasMore && (
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="btn btn-outline btn-sm w-full"
                >
                  {loadingMore ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Load more <ChevronRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              )}
            </>
          ) : (
            !error && (
              <div className="flex flex-col items-center gap-3 py-16 text-base-content/40">
                <GitBranch className="h-10 w-10 opacity-30" />
                <p className="text-sm">No repositories found for this combination.</p>
                <p className="text-xs">Try a different category or level.</p>
              </div>
            )
          )}
        </div>

        {/* RIGHT: sidebar list + CTA */}
        <div className="flex flex-col gap-4 min-w-0">
          {/* Sidebar repo list */}
          <div className="card bg-base-100 border border-base-200">
            <div className="card-body p-4 gap-2">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-sm">
                  {category.label}
                  <span className="text-base-content/40 font-normal"> · {level.label}</span>
                </h3>
              </div>

              {loading ? (
                <SidebarSkeleton />
              ) : repos.length > 0 ? (
                <div className="flex flex-col max-h-[520px] overflow-y-auto pr-0.5">
                  {repos.map((repo) => (
                    <SidebarRow key={repo.id} repo={repo} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-base-content/40 py-4 text-center">Nothing to show yet.</p>
              )}
            </div>
          </div>

          {/* CTA card */}
          <div className="card bg-gradient-to-br from-primary to-secondary text-primary-content">
            <div className="card-body p-5 gap-3">
              <span className="badge badge-sm bg-primary-content/20 border-none text-primary-content">
                New to open source?
              </span>
              <h3 className="font-bold text-base">Start with a good first issue</h3>
              <p className="text-sm opacity-90 leading-relaxed">
                Switch to Beginner level to find welcoming, well-documented projects that are perfect
                for first-time contributors.
              </p>
              <div className="card-actions mt-1">
                <button
                  onClick={() => setLevel(LEVELS[1])}
                  className="btn btn-sm bg-primary-content/10 border-primary-content/30 hover:bg-primary-content/20 text-primary-content"
                >
                  Browse beginner repos
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}