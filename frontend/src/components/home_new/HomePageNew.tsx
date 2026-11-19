"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  CalendarDays,
  Compass,
  Library,
  ClipboardCheck,
  Shuffle,
  Sparkles,
  Bookmark,
  UserRound,
  MessageSquare,
  PenLine,
  Search,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import Navbar from "@/components/navs/Navbar";
import { useAuth } from "@/hooks/useAuth";

type Tab = "home" | "search" | "bookmarks" | "profile";

interface PageLike {
  page_id?: number | string;
  slug: string;
  title: string;
  created_at?: string;
  updated_at?: string;
  metadata?: unknown;
}

interface HomePageNewProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  newPages?: PageLike[];
  updatedPages?: PageLike[];
  pendingPages?: PageLike[];
  newsPages?: PageLike[];
  popularPages?: PageLike[];
  upcomingEvents?: unknown[];
  getRelativeTime?: (dateString: string) => string;
  onOpenPortal?: (slug: string) => void;
  onOpenAllCategories?: () => void;
  onOpenNewPages?: () => void;
  onOpenUpdatedPages?: () => void;
  onOpenPendingPages?: () => void;
  onOpenEvents?: () => void;
  onOpenNews?: () => void;
  onRandomPage?: () => void;
  searchComponent: React.ReactNode;
  bookmarksComponent: React.ReactNode;
  profileComponent: React.ReactNode;
}

const JUMP: { title: string; href: string; icon: LucideIcon }[] = [
  { title: "New on campus", href: "/wiki/student-life", icon: Compass },
  { title: "Placement prep", href: "/prepmat", icon: Briefcase },
  { title: "Clubs and fests", href: "/wiki/clubs", icon: Users },
  { title: "Off-campus", href: "/wiki/off-campus", icon: CalendarDays },
  { title: "Blogs", href: "/blog", icon: BookOpen },
  { title: "Stories", href: "/interviews", icon: MessageSquare },
  { title: "Contests", href: "/competitions", icon: Trophy },
  { title: "All categories", href: "/wiki/categories", icon: Library },
];

const toolBtn =
  "min-h-11 inline-flex items-center gap-2 rounded-lg border border-base-300 px-3.5 text-[14px] font-medium hover:border-base-content/40 hover:bg-base-200/60 transition-colors cursor-pointer touch-manipulation";

const QUICK_SEARCHES = ["Hostel", "Mess menu", "Placements", "Clubs", "Courses"];

function pageHref(p: PageLike) {
  const meta = p.metadata as { category?: string } | undefined;
  return `/wiki/${meta?.category || "campus"}/${p.slug}`;
}

function List({
  title,
  items,
  empty,
  onSeeAll,
}: {
  title: string;
  items: { key: string; label: string; href: string; time: string }[];
  empty: React.ReactNode;
  onSeeAll?: () => void;
}) {
  const id = title.toLowerCase().replace(/\s+/g, "-");
  return (
    <section aria-labelledby={`${id}-h`} className="min-w-0">
      <div className="flex items-center justify-between border-b border-base-300">
        <h2 id={`${id}-h`} className="text-[13px] font-medium text-base-content/65 py-2">
          {title}
        </h2>
        {onSeeAll && (
          <button
            type="button"
            onClick={onSeeAll}
            className="min-h-9 px-2 -mr-2 inline-flex items-center gap-1 rounded-md text-[13px] font-medium text-primary hover:bg-base-200 cursor-pointer touch-manipulation"
          >
            See all <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="py-5 text-[14px] text-base-content/70">{empty}</p>
      ) : (
        <ul className="max-h-[220px] overflow-y-auto" tabIndex={0} aria-label={title}>
          {items.map((it) => (
            <li key={it.key} className="border-b border-base-300/70">
              <Link href={it.href} className="group flex items-center justify-between gap-4 min-h-11 py-2 text-[14px]">
                <span className="truncate group-hover:text-primary transition-colors">{it.label}</span>
                <span className="text-[12px] text-base-content/60 shrink-0">{it.time}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function HomePageNew({
  activeTab,
  setActiveTab,
  newPages = [],
  updatedPages = [],
  newsPages = [],
  pendingPages = [],
  upcomingEvents = [],
  getRelativeTime = (d) => d,
  onOpenNewPages,
  onOpenUpdatedPages,
  onOpenPendingPages,
  onOpenEvents,
  onOpenNews,
  onRandomPage,
  bookmarksComponent,
  profileComponent,
}: HomePageNewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  // UI affordance only; the API enforces who can actually review.
  const canReview = ["admin", "moderator"].includes((user?.role || "").toLowerCase());

  const go = (q: string) => {
    const t = q.trim();
    if (t) router.push(`/search-results?query=${encodeURIComponent(t)}`);
  };

  const recent = [...updatedPages, ...newPages].filter(
    (p, i, a) => a.findIndex((x) => x.slug === p.slug) === i
  );

  const onHome = activeTab === "home" || activeTab === "search";

  if (!onHome) {
    return (
      <div className="w-full min-h-dvh lg:h-dvh lg:overflow-hidden bg-base-100 text-base-content font-sans flex flex-col">
        <Navbar />
        <main id="main-content" tabIndex={-1} className="flex-1 min-h-0 overflow-y-auto outline-none">
          <div className="max-w-5xl mx-auto px-5 py-8">
            <button
              onClick={() => setActiveTab("home")}
              className="min-h-11 inline-flex items-center gap-2 text-[14px] text-base-content/70 hover:text-base-content cursor-pointer touch-manipulation"
            >
              <ArrowRight className="h-4 w-4 rotate-180" aria-hidden /> Back
            </button>
            <h1 className="text-[28px] font-semibold tracking-[-0.03em] mt-1 mb-6">{activeTab === "bookmarks" ? "Saved pages" : "You"}</h1>
            {activeTab === "bookmarks" ? bookmarksComponent : profileComponent}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="w-full min-h-dvh lg:h-dvh lg:overflow-hidden bg-base-100 text-base-content font-sans flex flex-col">
      <Navbar />

      <main id="main-content" tabIndex={-1} className="flex-1 min-h-0 lg:overflow-y-auto outline-none">
        <div className="max-w-6xl mx-auto px-5 lg:px-8 pt-10 pb-12">
          <h1 className="text-[30px] sm:text-[40px] font-semibold tracking-[-0.035em] leading-[1.05] text-balance">
            What do you want to <span className="text-primary">know?</span>
          </h1>
          <p className="mt-3 text-[15px] text-base-content/70">
            The student-written knowledge base for IIT Gandhinagar.
          </p>

          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              go(query);
            }}
            className="mt-6 max-w-2xl"
          >
            <label htmlFor="home-search" className="sr-only">
              Search the wiki
            </label>
            <div className="flex items-center gap-3 h-14 px-4 rounded-xl border border-base-300 bg-base-100 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition">
              <Search className="h-[18px] w-[18px] text-base-content/55" aria-hidden />
              <input
                id="home-search"
                name="query"
                type="search"
                spellCheck={false}
                enterKeyHint="search"
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search hostels, courses, clubs…"
                className="flex-1 bg-transparent text-[16px] outline-none placeholder:text-base-content/50"
              />
              <button
                type="submit"
                className="h-9 px-4 rounded-lg bg-primary text-primary-content text-[13px] font-medium cursor-pointer touch-manipulation hover:opacity-90"
              >
                Search
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_SEARCHES.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => go(q)}
                  className="min-h-9 px-3 rounded-full border border-base-300 text-[13px] text-base-content/75 hover:border-base-content/40 hover:text-base-content transition-colors cursor-pointer touch-manipulation"
                >
                  {q}
                </button>
              ))}
            </div>
          </form>

          <h2 className="mt-10 text-[13px] font-medium text-base-content/65 pb-2 border-b border-base-300">Jump to</h2>
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-base-300 border border-base-300 rounded-xl overflow-hidden mt-4">
            {JUMP.map((j) => {
              const Icon = j.icon;
              return (
                <li key={j.href} className="bg-base-100">
                  <Link href={j.href} className="flex flex-col gap-3 p-4 min-h-[84px] text-[14px] hover:bg-base-200 transition-colors">
                    <Icon className="h-[18px] w-[18px] text-primary" aria-hidden />
                    <span className="font-medium">{j.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <h2 className="mt-10 text-[13px] font-medium text-base-content/65 pb-2 border-b border-base-300">Tools</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {canReview && onOpenPendingPages && (
              <button type="button" onClick={onOpenPendingPages} className={`${toolBtn} border-primary/40 bg-primary/10 text-primary`}>
                <ClipboardCheck className="h-4 w-4" aria-hidden /> Review pending
                {pendingPages.length > 0 && (
                  <span className="ml-1 rounded-full bg-primary px-1.5 text-[12px] leading-5 text-primary-content">{pendingPages.length}</span>
                )}
              </button>
            )}
            {onRandomPage && (
              <button type="button" onClick={onRandomPage} className={toolBtn}>
                <Shuffle className="h-4 w-4" aria-hidden /> Random page
              </button>
            )}
            {onOpenNewPages && (
              <button type="button" onClick={onOpenNewPages} className={toolBtn}>
                <Sparkles className="h-4 w-4" aria-hidden /> New pages
              </button>
            )}
            {onOpenEvents && (
              <button type="button" onClick={onOpenEvents} className={toolBtn}>
                <CalendarDays className="h-4 w-4" aria-hidden /> Events
                {upcomingEvents.length > 0 && <span className="text-[12px] text-base-content/60">{upcomingEvents.length}</span>}
              </button>
            )}
            <button type="button" onClick={() => setActiveTab("bookmarks")} className={toolBtn}>
              <Bookmark className="h-4 w-4" aria-hidden /> Saved pages
            </button>
            {user && (
              <button type="button" onClick={() => setActiveTab("profile")} className={toolBtn}>
                <UserRound className="h-4 w-4" aria-hidden /> Your profile
              </button>
            )}
          </div>

          <div className="mt-10 grid sm:grid-cols-2 gap-x-12 gap-y-10">
            <List
              title="Recent changes"
              onSeeAll={onOpenUpdatedPages}
              items={recent.map((p) => ({
                key: p.slug,
                label: p.title,
                href: pageHref(p),
                time: getRelativeTime(p.updated_at || p.created_at || ""),
              }))}
              empty={
                <>
                  Nothing yet.{" "}
                  <Link href="/wiki/categories" className="text-primary hover:underline">
                    Write the first page
                  </Link>
                  .
                </>
              }
            />
            <List
              title="Campus news"
              onSeeAll={onOpenNews}
              items={newsPages.map((n) => ({
                key: n.slug,
                label: n.title,
                href: `/wiki/news/${n.slug}`,
                time: getRelativeTime(n.created_at || ""),
              }))}
              empty="No news right now."
            />
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-5 rounded-xl border border-base-300 bg-accent/[0.08] p-5">
            <Image src="/brand/landmark-arch.svg" alt="" width={72} height={54} unoptimized className="rounded-md border border-base-300 hidden sm:block shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium">Know something the next batch should?</p>
              <p className="text-[14px] text-base-content/70">Anyone at IITGN can write or fix a page.</p>
            </div>
            <Link
              href={user ? "/wiki/categories" : "/login"}
              className="min-h-11 inline-flex items-center gap-2 rounded-lg bg-primary px-4 text-[14px] font-medium text-primary-content hover:opacity-90"
            >
              <PenLine className="h-4 w-4" aria-hidden /> {user ? "Write a page" : "Sign in to contribute"}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
