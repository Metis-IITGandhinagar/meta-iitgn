"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award,
  ArrowRight,
  Sparkles,
  FlaskConical,
  Trophy,
  Calendar,
  BookOpen,
  Languages,
  Users2,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Compass,
  MapPinned,
  UtensilsCrossed,
  Bus,
  Camera,
  Newspaper,
  TrendingUp,
  Zap,
} from "lucide-react";

import ParallaxBackground from "@/components/ParallaxBackground";
import { useAuth } from "@/hooks/useAuth";
import HomeCard from "./HomeCard";
import HomeMasonryGrid, { MasonryCardConfig } from "./HomeMasonryGrid";
import { apiService } from "@/api";

interface HomeTabProps {
  mousePos: { x: number; y: number };
  imageLoaded: boolean;
  scrollToFeed: () => void;
  spawnHearts: (e: React.MouseEvent) => void;
  setShowAllNew: (show: boolean) => void;
  setShowAllUpdated: (show: boolean) => void;
  setShowAllPending: (show: boolean) => void;
  newPages: any[];
  updatedPages: any[];
  pendingPages: any[];
  loading: boolean;
  getRelativeTime: (dateString: string) => string;
  newsPages: any[];
  setShowAllNews: (show: boolean) => void;
  triviaPages: any[];
  setShowAllTrivia: (show: boolean) => void;
  setActiveTriviaItem: (item: any) => void;
  historyPages: any[];
  setShowAllHistory: (show: boolean) => void;
  setActiveHistoryItem: (item: any) => void;
  editors: any[];
  setShowAllEditors: (show: boolean) => void;
  totalPagesCount: number | null;
}

// ── Parse today's mess menu section from weekly markdown ─────────────────────
function parseTodayMessMenu(markdown: string): string[] {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = days[new Date().getDay()];
  const lines = markdown.split("\n");
  const sections: string[] = [];
  let inSection = false;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (inSection) break;
      if (line.includes(today)) inSection = true;
      continue;
    }
    if (inSection && line.trim()) sections.push(line.trim());
  }

  // Return up to 4 meal lines (filter bullets)
  return sections
    .filter((l) => l.startsWith("-") || l.startsWith("**"))
    .map((l) => l.replace(/^-\s*/, "").replace(/\*\*/g, ""))
    .slice(0, 5);
}

// ── Parse transport summary (first route's rows) ──────────────────────────────
function parseTransportSummary(markdown: string): string[] {
  const lines = markdown.split("\n");
  const rows: string[] = [];
  let inTable = false;

  for (const line of lines) {
    if (line.includes("| Departure ") || line.includes("|---")) {
      inTable = true;
      continue;
    }
    if (inTable && line.startsWith("|")) {
      const cols = line.split("|").filter(Boolean).map((c) => c.trim());
      if (cols.length >= 2 && cols[0] !== "---") {
        rows.push(`${cols[0]} → ${cols[cols.length - 1]}`);
      }
    } else if (inTable && line.startsWith("##")) {
      break;
    }
  }
  return rows.slice(0, 4);
}

// ── Format event date ─────────────────────────────────────────────────────────
function formatEventDate(dateStr: string, recur_day?: string | null, recur_time?: string | null): string {
  if (recur_day) return `Every ${recur_day}${recur_time ? " · " + recur_time : ""}`;
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + (recur_time ? " · " + recur_time : "");
}

export default function HomeTab({
  mousePos,
  imageLoaded,
  scrollToFeed,
  spawnHearts,
  setShowAllNew,
  setShowAllUpdated,
  setShowAllPending,
  newPages,
  updatedPages,
  pendingPages,
  loading,
  getRelativeTime,
  newsPages,
  setShowAllNews,
  triviaPages,
  setShowAllTrivia,
  setActiveTriviaItem,
  historyPages,
  setShowAllHistory,
  setActiveHistoryItem,
  editors,
  setShowAllEditors,
  totalPagesCount,
}: HomeTabProps) {
  const { categories } = useAuth();
  const router = useRouter();
  const [categoriesCount, setCategoriesCount] = useState(11);
  const [featuredSlideIndex, setFeaturedSlideIndex] = useState(0);
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic data from API
  const [featuredSlides, setFeaturedSlides] = useState<any[]>([]);
  const [popularPages, setPopularPages] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [messMenuItems, setMessMenuItems] = useState<string[]>([]);
  const [transportItems, setTransportItems] = useState<string[]>([]);
  const [dynamicDataLoading, setDynamicDataLoading] = useState(true);

  // Fallback featured slides in case API returns empty
  const FALLBACK_SLIDES = [
    {
      title: "Campus Design & Architecture",
      image: "/iitgn_campus.png",
      tag: "Featured Story",
      location: "Palaj Campus",
      description: "Explore the climate-responsive architecture, green corridors, and thoughtfully designed spaces that define IITGN.",
      href: "/wiki/campus/campuses-and-surroundings",
    },
    {
      title: "Student Life & Campus Culture",
      image: "/homepage_bg.png",
      tag: "Campus Life",
      location: "Student Experience",
      description: "From clubs and fests to everyday routines, discover the community stories that make the campus feel alive.",
      href: "/wiki/page/mess-menu",
    },
    {
      title: "Facilities & Everyday Guide",
      image: "/homepage_bg.png",
      tag: "Quick Guide",
      location: "Facilities",
      description: "A concise guide to transport, mess, labs, and the places students use most often on campus.",
      href: "/wiki/page/campus-transport",
    },
  ];

  useEffect(() => {
    if (categories && categories.length > 0) {
      setCategoriesCount(categories.length);
    }
  }, [categories]);

  // Load dynamic data
  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setDynamicDataLoading(true);
      try {
        const [featuredRes, popularRes, eventsRes, messRes, transportRes] = await Promise.allSettled([
          apiService.getFeaturedPages(),
          apiService.getPopularPages(6),
          apiService.getEvents(6),
          apiService.getMessMenu(),
          apiService.getCampusTransport(),
        ]);

        if (cancelled) return;

        if (featuredRes.status === 'fulfilled' && featuredRes.value?.data?.length > 0) {
          setFeaturedSlides(featuredRes.value.data);
        } else {
          setFeaturedSlides(FALLBACK_SLIDES);
        }

        if (popularRes.status === 'fulfilled' && popularRes.value?.data?.length > 0) {
          setPopularPages(popularRes.value.data);
        }

        if (eventsRes.status === 'fulfilled' && eventsRes.value?.data?.length > 0) {
          setUpcomingEvents(eventsRes.value.data);
        }

        if (messRes.status === 'fulfilled' && messRes.value?.data?.content) {
          const items = parseTodayMessMenu(messRes.value.data.content);
          setMessMenuItems(items);
        }

        if (transportRes.status === 'fulfilled' && transportRes.value?.data?.content) {
          const rows = parseTransportSummary(transportRes.value.data.content);
          setTransportItems(rows);
        }
      } catch (err) {
        console.error('Error loading dynamic home data:', err);
        if (!cancelled) setFeaturedSlides(FALLBACK_SLIDES);
      } finally {
        if (!cancelled) setDynamicDataLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-advance featured slides every 5s
  useEffect(() => {
    if (featuredSlides.length <= 1) return;
    autoAdvanceRef.current = setInterval(() => {
      setFeaturedSlideIndex((prev) => (prev + 1) % featuredSlides.length);
    }, 5000);
    return () => {
      if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
    };
  }, [featuredSlides.length]);

  const handleFeaturedSlide = (direction: number) => {
    // Reset auto-advance on manual navigation
    if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
    setFeaturedSlideIndex(
      (prev) => (prev + direction + featuredSlides.length) % featuredSlides.length
    );
    autoAdvanceRef.current = setInterval(() => {
      setFeaturedSlideIndex((prev) => (prev + 1) % featuredSlides.length);
    }, 5000);
  };

  const handleRandomPage = async () => {
    try {
      const candidates = [...(newPages || []), ...(updatedPages || [])].filter(Boolean);
      if (candidates.length > 0) {
        const randomItem = candidates[Math.floor(Math.random() * candidates.length)];
        const cat = (randomItem.metadata as any)?.category || 'campus';
        router.push(`/wiki/${cat}/${randomItem.slug}`);
        return;
      }
      // Fallback: pick from popular pages
      if (popularPages.length > 0) {
        const randomPop = popularPages[Math.floor(Math.random() * popularPages.length)];
        const cat = (randomPop.metadata as any)?.category || 'campus';
        router.push(`/wiki/${cat}/${randomPop.slug}`);
        return;
      }
      router.push('/wiki/page/campuses-and-surroundings');
    } catch {
      router.push('/wiki/page/campuses-and-surroundings');
    }
  };

  const activeFeaturedSlide = featuredSlides[featuredSlideIndex] || FALLBACK_SLIDES[0];

  // ─── Card definitions ──────────────────────────────────────────────────────
  const cards: MasonryCardConfig[] = [
    // ── 1. Featured Article (col-span-2) ─────────────────────────────────────
    {
      id: "featured-article",
      featured: true,
      content: (
        <HomeCard
          title="Featured Article"
          icon={<Award className="h-4 w-4" />}
          accentColor="primary"
          badge={
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-primary/10 border border-primary/20 text-primary font-sans font-bold text-[9px] rounded-full uppercase tracking-wider select-none">
              <Sparkles className="h-3 w-3" />
              Special Feature
            </span>
          }
          footer={
            <div className="flex items-center justify-between gap-3 pt-1">
              <Link
                href={activeFeaturedSlide?.href || '/'}
                className="inline-flex items-center gap-1 text-[11px] font-extrabold text-primary hover:text-primary/80 uppercase tracking-wider"
              >
                Read more <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <div className="flex gap-2">
                {featuredSlides.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
                      setFeaturedSlideIndex(index);
                    }}
                    className={`h-2.5 rounded-full transition-all ${
                      featuredSlideIndex === index ? "w-7 bg-primary" : "w-2.5 bg-base-300"
                    }`}
                    aria-label={`Slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          }
        >
          <div className="flex items-center justify-between mb-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {activeFeaturedSlide?.tag || 'Featured'}
            </div>
            <div className="join gap-1">
              <button type="button" onClick={() => handleFeaturedSlide(-1)} className="btn btn-xs btn-circle btn-ghost">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => handleFeaturedSlide(1)} className="btn btn-xs btn-circle btn-ghost">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl">
            <img
              src={activeFeaturedSlide?.image || '/homepage_bg.png'}
              alt={activeFeaturedSlide?.title || 'Featured'}
              className="w-full h-52 object-cover transition-opacity duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none rounded-xl" />
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-base-content/60">
              <MapPinned className="h-3.5 w-3.5" />
              {activeFeaturedSlide?.location || 'Campus'}
            </div>
            <h3 className="text-lg font-black text-base-content font-serif">
              {activeFeaturedSlide?.title || 'Campus Article'}
            </h3>
            <p className="text-xs text-base-content/75 leading-relaxed font-semibold">
              {activeFeaturedSlide?.description || ''}
            </p>
          </div>
        </HomeCard>
      ),
    },

    // ── 2. In the News ────────────────────────────────────────────────────────
    {
      id: "in-the-news",
      content: (
        <HomeCard
          title="In the News"
          icon={<Newspaper className="h-4 w-4" />}
          accentColor="secondary"
          badge={
            <button onClick={() => setShowAllNews(true)} className="btn btn-ghost btn-xs text-primary font-bold cursor-pointer">
              View all
            </button>
          }
          footer={
            <button onClick={() => setShowAllNews(true)} className="btn btn-ghost btn-xs text-primary font-extrabold uppercase tracking-wider gap-1 cursor-pointer">
              More campus news <ArrowRight className="h-3.5 w-3.5" />
            </button>
          }
        >
          <div className="space-y-3">
            {newsPages.slice(0, 5).map((item, index) => {
              const Icons = [Sparkles, FlaskConical, Trophy];
              const IconComponent = Icons[index % Icons.length];
              const colors = ["bg-primary/10 text-primary", "bg-success/10 text-success", "bg-secondary/10 text-secondary"];
              return (
                <button key={`news-${item.slug || index}`} type="button" onClick={() => setShowAllNews(true)} className="flex items-start gap-3 border-b border-base-200 pb-3 last:border-b-0 last:pb-0 cursor-pointer group text-left w-full">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colors[index % colors.length]}`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-base-content group-hover:text-primary transition-colors line-clamp-2">{item.title}</h4>
                    <span className="text-[10px] text-base-content/50 mt-0.5 block font-semibold">{getRelativeTime(item.created_at)}</span>
                  </div>
                </button>
              );
            })}
            {newsPages.length === 0 && <p className="text-xs text-base-content/50">No news articles yet.</p>}
          </div>
        </HomeCard>
      ),
    },

    // ── 3. Did You Know? ──────────────────────────────────────────────────────
    {
      id: "did-you-know",
      content: (
        <HomeCard
          title="Did You Know?"
          accentColor="accent"
          footer={
            <button onClick={() => setShowAllTrivia(true)} className="btn btn-ghost btn-xs text-primary font-extrabold uppercase tracking-wider cursor-pointer">
              More trivia
            </button>
          }
        >
          {triviaPages.length > 0 ? (
            <div onClick={() => { setActiveTriviaItem(triviaPages[0]); setShowAllTrivia(true); }} className="cursor-pointer group">
              <h4 className="text-xs font-bold text-base-content group-hover:text-primary transition-colors mb-1">{triviaPages[0].title}</h4>
              <p className="text-xs text-base-content/60 leading-relaxed font-semibold line-clamp-4">
                {triviaPages[0].content ? triviaPages[0].content.replace(/---[\s\S]*?---/, "").replace(/#[\s\S]*?\n/, "").trim() : triviaPages[0].description}
              </p>
            </div>
          ) : (
            <p className="text-xs text-base-content/60 leading-relaxed font-semibold">
              Hostels at IIT Gandhinagar are named after famous rivers — Sabarmati, Narmada, Shipra, and more.
            </p>
          )}
        </HomeCard>
      ),
    },

    // ── 4. On This Day ────────────────────────────────────────────────────────
    {
      id: "on-this-day",
      content: (
        <HomeCard
          title="On This Day"
          icon={<Calendar className="h-4 w-4" />}
          accentColor="success"
          badge={
            <span className="text-primary text-xs font-extrabold">
              {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}
            </span>
          }
          footer={
            <button onClick={() => setShowAllHistory(true)} className="btn btn-ghost btn-xs text-primary font-extrabold uppercase tracking-wider cursor-pointer">
              History timeline
            </button>
          }
        >
          {historyPages.length > 0 ? (
            <div onClick={() => { setActiveHistoryItem(historyPages[0]); setShowAllHistory(true); }} className="cursor-pointer group">
              <h4 className="text-xs font-bold text-base-content group-hover:text-primary transition-colors mb-1">{historyPages[0].title}</h4>
              <p className="text-xs text-base-content/60 leading-relaxed font-semibold line-clamp-4">
                {historyPages[0].content ? historyPages[0].content.replace(/---[\s\S]*?---/, "").replace(/#[\s\S]*?\n/, "").trim() : historyPages[0].description}
              </p>
            </div>
          ) : (
            <p className="text-xs text-base-content/60 leading-relaxed font-semibold">
              In 2015, IIT Gandhinagar completed the transition to its permanent campus in Palaj.
            </p>
          )}
        </HomeCard>
      ),
    },

    // ── 5. Wiki Contributors ─────────────────────────────────────────────────
    {
      id: "contributors",
      content: (
        <HomeCard
          title="Wiki Contributors"
          icon={<Users2 className="h-4 w-4" />}
          accentColor="info"
          footer={
            <button onClick={() => setShowAllEditors(true)} className="btn btn-primary btn-sm w-full font-bold text-xs rounded-xl shadow-sm cursor-pointer">
              View Active Editors
            </button>
          }
        >
          {editors.length > 0 ? (
            <div className="space-y-2.5">
              {editors.slice(0, 4).map((editor, index) => {
                const initials = editor.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() || "U";
                return (
                  <div key={`editor-${editor.user_id || index}`} className="flex items-center gap-2.5">
                    <div className="avatar avatar-placeholder">
                      <div className="w-7 rounded-full bg-base-200 border border-base-300 text-[10px] font-bold text-base-content">
                        <span>{initials}</span>
                      </div>
                    </div>
                    <span className="text-xs text-base-content/80 font-semibold truncate">{editor.name}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-base-content/60 leading-relaxed font-semibold">
              META IITGN is built by the student body. Share tips, course feedback, and project work.
            </p>
          )}
        </HomeCard>
      ),
    },

    // ── 6. New Pages ──────────────────────────────────────────────────────────
    {
      id: "new-pages",
      content: (
        <HomeCard
          title="New Pages"
          icon={<Sparkles className="h-4 w-4" />}
          accentColor="warning"
          footer={
            <button onClick={() => setShowAllNew(true)} className="btn btn-ghost btn-xs text-primary font-bold uppercase tracking-wider cursor-pointer">
              View all new pages
            </button>
          }
        >
          {loading ? (
            <div className="flex items-center gap-2 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-xs text-base-content/50">Loading…</span>
            </div>
          ) : newPages.length === 0 ? (
            <p className="text-xs text-base-content/50 py-3">No new pages created yet.</p>
          ) : (
            <ul className="space-y-3">
              {newPages.slice(0, 3).map((page, index) => (
                <li key={`new-page-${page.page_id || index}`}>
                  <Link href={`/wiki/${(page.metadata as any)?.category || 'campus'}/${page.slug}`} className="block text-xs font-semibold text-base-content/85 hover:text-primary transition-colors truncate">
                    {page.title || "Untitled"}
                  </Link>
                  <span className="text-[9px] text-base-content/50 font-semibold block">Created {getRelativeTime(page.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </HomeCard>
      ),
    },

    // ── 7. Updated Pages ──────────────────────────────────────────────────────
    {
      id: "updated-pages",
      content: (
        <HomeCard
          title="Updated Pages"
          accentColor="error"
          footer={
            <button onClick={() => setShowAllUpdated(true)} className="btn btn-ghost btn-xs text-primary font-bold uppercase tracking-wider cursor-pointer">
              View all edits
            </button>
          }
        >
          {loading ? (
            <div className="flex items-center gap-2 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-xs text-base-content/50">Loading…</span>
            </div>
          ) : updatedPages.length === 0 ? (
            <p className="text-xs text-base-content/50 py-3">No pages updated yet.</p>
          ) : (
            <ul className="space-y-3">
              {updatedPages.slice(0, 3).map((page, index) => (
                <li key={`updated-page-${page.page_id || index}`}>
                  <Link href={`/wiki/${(page.metadata as any)?.category || 'campus'}/${page.slug}`} className="block text-xs font-semibold text-base-content/85 hover:text-primary transition-colors truncate">
                    {page.title || "Untitled"}
                  </Link>
                  <span className="text-[9px] text-base-content/50 font-semibold block">Updated {getRelativeTime(page.updated_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </HomeCard>
      ),
    },

    // ── 8. Pending Pages ──────────────────────────────────────────────────────
    {
      id: "pending-pages",
      content: (
        <HomeCard
          title="Pending Review"
          accentColor="warning"
          footer={
            <button onClick={() => setShowAllPending(true)} className="btn btn-primary btn-sm w-full font-bold text-xs rounded-xl shadow-sm cursor-pointer">
              Review Pending Changes
            </button>
          }
        >
          {loading ? (
            <div className="flex items-center gap-2 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-xs text-base-content/50">Loading…</span>
            </div>
          ) : pendingPages.length === 0 ? (
            <p className="text-xs text-base-content/50 py-3">No pending pages.</p>
          ) : (
            <ul className="space-y-3">
              {pendingPages.slice(0, 3).map((pending, index) => {
                const authorName = pending.users?.name || `User #${pending.editor_id}`;
                return (
                  <li key={`pending-page-${pending.pending_id || index}`}>
                    <span className="block text-xs font-semibold text-base-content/85 truncate">{pending.title}</span>
                    <span className="text-[9px] text-base-content/50 font-semibold block">by {authorName} · {getRelativeTime(pending.created_at)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </HomeCard>
      ),
    },

    // ── 9. Upcoming Events ────────────────────────────────────────────────────
    {
      id: "upcoming-events",
      content: (
        <HomeCard
          title="Upcoming Events"
          icon={<Calendar className="h-4 w-4" />}
          accentColor="secondary"
          badge={<span className="badge badge-primary badge-sm">This week</span>}
          footer={
            <Link href="/wiki/page/upcoming-events" className="btn btn-ghost btn-xs text-primary font-extrabold uppercase tracking-wider gap-1">
              All events <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {dynamicDataLoading ? (
            <div className="flex items-center gap-2 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-xs text-base-content/50">Loading…</span>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.slice(0, 3).map((event) => (
                <div key={event.event_id || event.slug} className="rounded-xl border border-base-200 bg-base-200/40 p-3">
                  <p className="text-xs font-black text-base-content">{event.title}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-base-content/50 mt-0.5">
                    {formatEventDate(event.event_date, event.recur_day, event.recur_time)}
                  </p>
                  <p className="text-xs text-base-content/60 mt-1 line-clamp-1">{event.location}</p>
                </div>
              ))}
              {upcomingEvents.length === 0 && (
                <p className="text-xs text-base-content/50">No upcoming events. Check back soon!</p>
              )}
            </div>
          )}
        </HomeCard>
      ),
    },

    // ── 10. Popular Pages ─────────────────────────────────────────────────────
    {
      id: "popular-pages",
      content: (
        <HomeCard
          title="Popular Pages"
          icon={<TrendingUp className="h-4 w-4" />}
          accentColor="primary"
          badge={<span className="badge badge-secondary badge-sm">Trending</span>}
        >
          <div className="space-y-3">
            {dynamicDataLoading ? (
              <div className="flex items-center gap-2 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-xs text-base-content/50">Loading…</span>
              </div>
            ) : popularPages.length > 0 ? (
              popularPages.slice(0, 5).map((page, i) => (
                <Link
                  key={page.page_id}
                  href={`/wiki/${(page.metadata as any)?.category || 'campus'}/${page.slug}`}
                  className="flex items-center justify-between rounded-xl border border-base-200 bg-base-200/40 p-3 text-xs font-semibold text-base-content/80 hover:border-primary/40 hover:text-primary transition-colors"
                >
                  <span className="truncate">{page.title}</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-base-content/40 shrink-0 ml-2">#{i + 1}</span>
                </Link>
              ))
            ) : (
              <p className="text-xs text-base-content/50">Pages will appear here as they get views.</p>
            )}
          </div>
        </HomeCard>
      ),
    },

    // ── 11. Random Page ───────────────────────────────────────────────────────
    {
      id: "random-page",
      content: (
        <HomeCard
          title="Random Page"
          icon={<Compass className="h-4 w-4" />}
          accentColor="accent"
          footer={
            <button type="button" onClick={handleRandomPage} className="btn btn-primary btn-sm w-full rounded-xl font-bold">
              Open a random page
            </button>
          }
        >
          <p className="text-xs text-base-content/70 leading-relaxed">
            Jump into a fresh article from the wiki and discover something new around campus.
          </p>
        </HomeCard>
      ),
    },

    // ── 12. Today's Mess Menu ─────────────────────────────────────────────────
    {
      id: "mess-menu",
      content: (
        <HomeCard
          title="Today's Mess Menu"
          icon={<UtensilsCrossed className="h-4 w-4 text-success" />}
          accentColor="success"
          footer={
            <Link href="/wiki/page/mess-menu" className="btn btn-ghost btn-xs text-primary font-extrabold uppercase tracking-wider gap-1">
              Full week menu <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {dynamicDataLoading ? (
            <div className="flex items-center gap-2 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-success" />
              <span className="text-xs text-base-content/50">Loading…</span>
            </div>
          ) : messMenuItems.length > 0 ? (
            <div className="space-y-2">
              {messMenuItems.map((item, i) => (
                <div key={i} className="rounded-lg border border-success/20 bg-success/5 px-3 py-2 text-xs font-semibold text-base-content/80">
                  {item}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-base-content/50">Menu not available yet.</p>
              <Link href="/wiki/page/mess-menu" className="text-xs text-primary font-bold mt-1 block">View full week menu →</Link>
            </div>
          )}
        </HomeCard>
      ),
    },

    // ── 13. Campus Transport ──────────────────────────────────────────────────
    {
      id: "campus-transport",
      content: (
        <HomeCard
          title="Campus Transport"
          icon={<Bus className="h-4 w-4 text-secondary" />}
          accentColor="secondary"
          footer={
            <Link href="/wiki/page/campus-transport" className="btn btn-ghost btn-xs text-primary font-extrabold uppercase tracking-wider gap-1">
              Full schedule <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {dynamicDataLoading ? (
            <div className="flex items-center gap-2 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-secondary" />
              <span className="text-xs text-base-content/50">Loading…</span>
            </div>
          ) : transportItems.length > 0 ? (
            <div className="space-y-2">
              {transportItems.map((item, i) => (
                <div key={i} className="rounded-lg border border-secondary/20 bg-secondary/5 px-3 py-2 text-xs font-semibold text-base-content/80">
                  {item}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-base-content/50">Schedule not available yet.</p>
              <Link href="/wiki/page/campus-transport" className="text-xs text-primary font-bold mt-1 block">View full schedule →</Link>
            </div>
          )}
        </HomeCard>
      ),
    },

    // ── 14. Photo of the Week ─────────────────────────────────────────────────
    {
      id: "photo-of-week",
      content: (
        <HomeCard
          title="Photo of the Week"
          icon={<Camera className="h-4 w-4 text-warning" />}
          accentColor="warning"
        >
          <div className="diff aspect-[16/9] rounded-xl overflow-hidden">
            <div className="diff-item-1">
              <img src="/homepage_bg.png" alt="Campus landscape" className="object-cover w-full h-full" />
            </div>
            <div className="diff-item-2">
              <img src="/iitgn_campus.png" alt="Campus architecture" className="object-cover w-full h-full" />
            </div>
            <div className="diff-resizer" />
          </div>
          <p className="text-xs text-base-content/70 mt-3 leading-relaxed">
            A fresh look at the campus skyline and the calm spaces that make the institute special.
          </p>
        </HomeCard>
      ),
    },
  ];

  return (
    <>
      {/* ── Mountain Hero Banner ───────────────────────────────────────────── */}
      <div className="relative w-full h-[85vh] lg:h-dvh min-h-125 hidden md:flex flex-col items-center justify-center text-center p-6 bg-primary overflow-hidden select-none">
        <ParallaxBackground mousePos={mousePos} imageSrc="/homepage_bg.png" overlayClass="bg-linear-to-b via-slate-900/45 to-slate-950/65" />

        <style>{`
          @keyframes gradient-x { 0%, 100% { background-position: 0% 50%; } 55% { background-position: 100% 50%; } }
          @keyframes slide-up-fade { 0% { opacity: 0; transform: translateY(120px); } 100% { opacity: 1; transform: translateY(0); } }
          .animate-gradient-text { background-size: 200% auto; animation: gradient-x 6s ease infinite; }
          .animate-hero-content { animation: slide-up-fade 3.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        `}</style>

        <div className={`relative z-10 max-w-5xl space-y-6 px-4 ${imageLoaded ? "animate-hero-content" : "opacity-0"} font-style-sensitive`}>
          <h1 className="select-none leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
            <span className="text-4xl sm:text-6xl lg:text-[75px] font-light tracking-wide bg-linear-to-r from-white to-slate-200 bg-clip-text text-transparent block">
              Welcome to
            </span>
            <span className="text-5xl sm:text-7xl lg:text-[105px] font-bold tracking-widest bg-linear-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent block mt-4 filter drop-shadow-[0_2px_10px_rgba(59,130,246,0.35)] animate-gradient-text uppercase">
              META IITGN
            </span>
          </h1>
          <p className="text-md sm:text-lg md:text-xl text-slate-200/90 font-medium tracking-widest max-w-2xl mx-auto leading-relaxed text-shadow-premium pt-4 uppercase">
            A collaborative space where anyone on campus can write and edit about anything.
          </p>
        </div>

        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer text-white/85 hover:text-white group select-none transition-opacity duration-300" onClick={scrollToFeed}>
          <span className="text-[10px] font-black uppercase tracking-widest text-shadow-premium">Scroll Down</span>
          <div className="w-6 h-10 border-2 border-white/60 rounded-full flex justify-center p-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.3)] transition-transform group-hover:translate-y-0.5">
            <div className="w-1.5 h-2.5 bg-white rounded-full animate-bounce" />
          </div>
        </div>
      </div>

      {/* ── Highlights Feed ────────────────────────────────────────────────── */}
      <div id="right-highlights-feed" className="p-4 pb-28 md:p-6 lg:p-8 bg-transparent space-y-6">
        <HomeMasonryGrid cards={cards} />

        {/* ── Statistics Strip ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="stat bg-base-200/60 border border-base-300 rounded-2xl place-items-center py-4">
            <div className="stat-figure text-primary"><BookOpen className="h-5 w-5" /></div>
            <div className="stat-title text-[9px] font-bold uppercase tracking-wider">Total Articles</div>
            <div className="stat-value text-xl">{totalPagesCount !== null ? totalPagesCount.toLocaleString() : "…"}</div>
          </div>
          <div className="stat bg-base-200/60 border border-base-300 rounded-2xl place-items-center py-4">
            <div className="stat-figure text-success"><Languages className="h-5 w-5" /></div>
            <div className="stat-title text-[9px] font-bold uppercase tracking-wider">Categories</div>
            <div className="stat-value text-xl">{categoriesCount}</div>
          </div>
          <div className="stat bg-base-200/60 border border-base-300 rounded-2xl place-items-center py-4">
            <div className="stat-figure text-secondary"><Users2 className="h-5 w-5" /></div>
            <div className="stat-title text-[9px] font-bold uppercase tracking-wider">Editors</div>
            <div className="stat-value text-xl">{editors.length || "…"}</div>
          </div>
          <div className="stat bg-base-200/60 border border-base-300 rounded-2xl place-items-center py-4">
            <div className="stat-figure text-warning"><Zap className="h-5 w-5" /></div>
            <div className="stat-title text-[9px] font-bold uppercase tracking-wider">Events</div>
            <div className="stat-value text-xl">{upcomingEvents.length || "…"}</div>
          </div>
        </div>

        {/* Mobile footer */}
        <div className="pt-4 border-t border-base-200 flex md:hidden flex-col items-center text-center gap-1.5 select-none w-full">
          <div className="text-[12px] text-base-content/50 font-medium flex items-center justify-center gap-1.5 uppercase tracking-wider">
            <span>Made with ❤️</span>
          </div>
          <div className="text-[12px] text-base-content/50 font-semibold tracking-wide">
            by <span className="font-extrabold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Technical Council, IITGN</span>
          </div>
          <div className="text-[9px] font-bold text-base-content/60 tracking-widest uppercase mt-1">
            © {new Date().getFullYear()} IIT Gandhinagar
          </div>
        </div>
      </div>
    </>
  );
}
