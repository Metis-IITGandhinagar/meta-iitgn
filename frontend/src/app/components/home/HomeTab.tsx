"use client";

import React, { useState, useEffect, useId, useRef } from "react";
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
  ChevronLeft,
  ChevronRight,
  Compass,
  MapPinned,
  Bus,
  Camera,
  Newspaper,
  CalendarDays,
  TrendingUp,
  Zap,
  Clock,
  Eye,
  SlidersHorizontal,
} from "lucide-react";

import ParallaxBackground from "@/components/ParallaxBackground";
import { useAuth } from "@/hooks/useAuth";
import HomeCard from "./HomeCard";
import HomeMasonryGrid, { MasonryCardConfig } from "./HomeMasonryGrid";
import { getTimeOfDay, MESS_THEME } from "@/lib/messMenu";
import { parseTransport, tripTimeToMinutes, TransportTrip } from "@/lib/transport";

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
  totalPagesCount: number | null;
  featuredPages: any[];
  popularPages: any[];
  upcomingEvents: any[];
  messMenu: any | null;
  setShowMessMenu: (show: boolean) => void;
  setShowEditFeatured: (show: boolean) => void;
  campusTransport: any | null;
  setShowTransport: (show: boolean) => void;
}

// ── Mess menu types & parsers ────────────────────────────────────────────────
interface MessMeal {
  name: string;
  time?: string;
  items: string[];
}

interface MessDay {
  day: string;
  meals: MessMeal[];
}

const WEEK_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// localStorage key for the set of card ids the user has hidden via preferences.
const HOME_HIDDEN_CARDS_KEY = "meta_iitgn_home_hidden_cards";

// Human-readable labels for every card, used by the "Customize cards" panel.
const CARD_LABELS: Record<string, string> = {
  "featured-article": "Featured Article",
  "in-the-news": "In the News",
  "new-pages": "New Pages",
  "updated-pages": "Updated Pages",
  "pending-pages": "Pending Review",
  "popular-pages": "Popular Pages",
  "random-page": "Random Page",
  "mess-menu": "Today's Mess Menu",
  "campus-transport": "Campus Transport",
  "photo-of-week": "Photo of the Week",
  events: "Upcoming Events",
};

// Logical groupings for the "Customize cards" panel.
const CARD_GROUPS: { title: string; ids: string[] }[] = [
  { title: "Discovery", ids: ["featured-article", "in-the-news", "popular-pages", "random-page"] },
  {
    title: "Wiki Activity",
    ids: ["new-pages", "updated-pages", "pending-pages"],
  },
  {
    title: "Community",
    ids: ["photo-of-week", "events"],
  },
  { title: "Campus Services", ids: ["mess-menu", "campus-transport"] },
];

// Parse the whole weekly menu into one entry per day.
function parseWeeklyMessMenu(markdown: string): MessDay[] {
  const lines = markdown.split("\n");
  const days: MessDay[] = [];
  let currentDay: MessDay | null = null;
  let currentMeal: MessMeal | null = null;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      const dayName = line.replace("##", "").trim();
      if (WEEK_DAYS.includes(dayName)) {
        currentDay = { day: dayName, meals: [] };
        days.push(currentDay);
        currentMeal = null;
      }
      continue;
    }
    if (!currentDay) continue;

    const mealMatch = line.match(/^\*\*(.+?)\*\*(?:\s*\((.+?)\))?/);
    if (mealMatch) {
      currentMeal = { name: mealMatch[1].trim(), time: mealMatch[2]?.trim(), items: [] };
      currentDay.meals.push(currentMeal);
      continue;
    }
    if (line.startsWith("-") && currentMeal) {
      currentMeal.items.push(line.replace(/^-\s*/, "").trim());
    }
  }
  return days;
}

// Parse today's mess menu section from weekly markdown.
function parseTodayMessMenu(markdown: string): MessDay | null {
  const today = WEEK_DAYS[new Date().getDay()];
  return parseWeeklyMessMenu(markdown).find((d) => d.day === today) ?? null;
}

// ── Format event date ─────────────────────────────────────────────────────────
// Next upcoming trip from a flat list of trips, given minutes-since-midnight.
// Wraps to the first trip of the day if none remain today.
function nextTrip(trips: TransportTrip[], nowMinutes: number): TransportTrip | null {
  if (trips.length === 0) return null;
  const withMin = trips
    .map((t) => ({ t, m: tripTimeToMinutes(t.time) }))
    .filter((x) => x.m !== null) as { t: TransportTrip; m: number }[];
  if (withMin.length === 0) return trips[0];
  const sorted = [...withMin].sort((a, b) => a.m - b.m);
  const upcoming = sorted.filter((x) => x.m >= nowMinutes);
  return (upcoming[0] ?? sorted[0]).t;
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
  getRelativeTime,
  newsPages,
  setShowAllNews,
  triviaPages,
  setShowAllTrivia,
  setActiveTriviaItem,
  historyPages,
  setShowAllHistory,
  totalPagesCount,
  featuredPages,
  popularPages,
  upcomingEvents,
  messMenu,
  setShowMessMenu,
  setShowEditFeatured,
  campusTransport,
  setShowTransport,
}: HomeTabProps) {
  const { categories } = useAuth();
  const router = useRouter();

  // ── Card visibility preferences (local only) ───────────────────────────────
  // Start empty so the first client render matches the server render (the server
  // has no localStorage). Reading it in the initializer would cause a hydration
  // mismatch, which makes React regenerate the tree and races the home-data
  // load. We hydrate the persisted set in an effect right after mount instead.
  const [hiddenCards, setHiddenCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HOME_HIDDEN_CARDS_KEY);
      if (raw) setHiddenCards(new Set(JSON.parse(raw)));
    } catch {
      /* ignore */
    }
  }, []);
  const [showPrefs, setShowPrefs] = useState(false);

  const toggleCard = (id: string) => {
    setHiddenCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(HOME_HIDDEN_CARDS_KEY, JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const showAllCards = () => {
    setHiddenCards(new Set());
    try {
      localStorage.removeItem(HOME_HIDDEN_CARDS_KEY);
    } catch {
      /* ignore */
    }
  };
  const [categoriesCount, setCategoriesCount] = useState(11);
  const carouselBase = `featured-${useId().replace(/:/g, "")}`;
  const carouselRef = useRef<HTMLDivElement>(null);

  // Derived / computed states from cached store/Dexie props
  const featuredSlides = (featuredPages && featuredPages.length > 0) ? featuredPages : [];
  const messMenuData = messMenu?.content ? parseTodayMessMenu(messMenu.content) : null;
  const transportData = campusTransport?.content ? parseTransport(campusTransport.content) : [];
  const nowMinutes = (() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  })();
  const transportNext = transportData
    .map((line, i) => ({
      line,
      index: i,
      trip: nextTrip(line.slots.flatMap((s) => s.trips), nowMinutes),
    }))
    .filter((x) => x.trip);
  // Flattened, time-sorted view of every trip to find the single next departure.
  const transportFlat = transportData
    .flatMap((line, index) =>
      line.slots.flatMap((s) => s.trips).map((trip) => ({ line, index, trip }))
    )
    .map((x) => ({ ...x, m: tripTimeToMinutes(x.trip.time) }))
    .filter((x) => x.m !== null) as Array<{
    line: (typeof transportData)[number];
    index: number;
    trip: TransportTrip;
    m: number;
  }>;
  // Globally time-sorted upcoming departures — top 3 overall. The soonest is
  // shown as a hero block; the next two as a smaller list below.
  const topTrips = (() => {
    if (transportFlat.length === 0) return [];
    const upcoming = transportFlat
      .filter((x) => x.m >= nowMinutes)
      .sort((a, b) => a.m - b.m);
    const sorted = upcoming.length > 0 ? upcoming : [...transportFlat].sort((a, b) => a.m - b.m);
    return sorted.slice(0, 3);
  })();
  const nextDeparture = topTrips[0] ?? null;
  const moreTrips = topTrips.slice(1, 3);

  useEffect(() => {
    if (categories && categories.length > 0) {
      setCategoriesCount(categories.length);
    }
  }, [categories]);

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

  // ── Seamless (cyclic) featured carousel ────────────────────────────────────
  // Transform-based infinite carousel. The track renders
  // [clone(last), ...realSlides, clone(first)] and is shifted with translateX by
  // `featuredIndex` (a DOM index into that track). Real slide r sits at index r+1.
  // Moving past either clone lets the animation finish, then jumps instantly
  // (transition off) to the identical real slide — so it always continues in the
  // same direction with no visible rewind. `featuredIndex` also drives the dots.
  const featuredPausedRef = useRef(false);
  const featuredCount = (featuredPages && featuredPages.length > 0) ? featuredPages.length : 0;
  const hasClones = featuredCount > 1;

  const [featuredIndex, setFeaturedIndex] = useState(1);
  const [featuredAnim, setFeaturedAnim] = useState(true);

  // Reset to the first real slide whenever the data set changes.
  useEffect(() => {
    setFeaturedAnim(false);
    setFeaturedIndex(hasClones ? 1 : 0);
  }, [featuredPages, hasClones]);

  const goNext = () => {
    if (featuredCount < 2) return;
    setFeaturedAnim(true);
    setFeaturedIndex((i) => i + 1);
  };

  const goPrev = () => {
    if (featuredCount < 2) return;
    setFeaturedAnim(true);
    setFeaturedIndex((i) => i - 1);
  };

  // Jump to a real slide (used by the dot indicators).
  const scrollToIndex = (realIndex: number) => {
    setFeaturedAnim(true);
    setFeaturedIndex(hasClones ? realIndex + 1 : realIndex);
  };

  // When a slide animation ends on a clone, snap instantly to its real twin.
  const handleFeaturedTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (!hasClones) return;
    if (e.target !== e.currentTarget || e.propertyName !== "transform") return;
    if (featuredIndex >= featuredCount + 1) {
      setFeaturedAnim(false);
      setFeaturedIndex(1);
    } else if (featuredIndex <= 0) {
      setFeaturedAnim(false);
      setFeaturedIndex(featuredCount);
    }
  };

  // Auto-advance every 2s. Pauses while the pointer is over the card (checked via
  // a ref so hovering never tears the timer down). Stops when there's <2 slides.
  useEffect(() => {
    if (!hasClones) return;
    const id = setInterval(() => {
      if (featuredPausedRef.current) return;
      goNext();
    }, 2000);
    return () => clearInterval(id);
  }, [featuredPages, hasClones]);

  // Active real slide for the dot indicators, derived from the track index.
  const activeFeatured = hasClones
    ? (((featuredIndex - 1) % featuredCount) + featuredCount) % featuredCount
    : featuredIndex;

  // ─── Card definitions ──────────────────────────────────────────────────────
  // Display order for the home feed. Mess first, Featured second, the activity
  // cards (new / updated / pending) last.
  const CARD_ORDER: Record<string, number> = {
    "mess-menu": 1,
    "campus-transport": 2,
    "featured-article": 3,
    "in-the-news": 4,
    "popular-pages": 8,
    events: 9,
    "random-page": 10,
    "photo-of-week": 11,
    "new-pages": 16,
    "updated-pages": 17,
    "pending-pages": 18,
  };

  const cards: MasonryCardConfig[] = [
    // ── 1. Featured Article (DaisyUI carousel with next/prev buttons) ──────────
    {
      id: "featured-article",
      featured: true,
      content: (
        <div
          onMouseEnter={() => { featuredPausedRef.current = true; }}
          onMouseLeave={() => { featuredPausedRef.current = false; }}
        >
        <HomeCard
          title="Featured Article"
          icon={<Award className="h-4 w-4" />}
          accentColor="primary"
          badge={
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-primary/10 border border-primary/20 text-primary font-sans font-bold text-[9px] rounded-full uppercase tracking-wider select-none">
                <Sparkles className="h-3 w-3" />
                Special Feature
              </span>
            </div>
          }
          footer={
            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowEditFeatured(true)}
                className="inline-flex items-center gap-1 text-[11px] font-extrabold text-primary hover:text-primary/80 uppercase tracking-wider cursor-pointer"
              >
                Read all <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <div className="flex gap-2">
                {featuredSlides.map((_, index) => (
                  <button
                    key={`featured-dot-${index}`}
                    type="button"
                    onClick={() => scrollToIndex(index)}
                    className={`h-2.5 rounded-full transition-all cursor-pointer ${
                      activeFeatured === index
                        ? "w-6 bg-primary"
                        : "w-2.5 bg-base-300 hover:bg-primary/60"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          }
        >
          {featuredSlides.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-base-300 bg-base-200/40 px-4 py-12 text-center">
              <Award className="h-6 w-6 text-base-content/30" />
              <p className="text-sm font-bold text-base-content/60">No featured articles yet</p>
              <p className="text-xs text-base-content/40">Featured articles will appear here once they&rsquo;re added.</p>
            </div>
          ) : (
          <div className="w-full overflow-hidden">
          <div
            ref={carouselRef}
            className="flex w-full"
            style={{
              transform: `translateX(-${featuredIndex * 100}%)`,
              transition: featuredAnim ? "transform 0.5s ease" : "none",
            }}
            onTransitionEnd={handleFeaturedTransitionEnd}
          >
            {(hasClones
              ? [featuredSlides[featuredSlides.length - 1], ...featuredSlides, featuredSlides[0]]
              : featuredSlides
            ).map((slide, index) => {
              const targetUrl = slide?.slug
                ? `/wiki/page/${slide.slug}`
                : slide?.href || null;
              return (
                <div
                  key={`featured-slide-${index}`}
                  id={`${carouselBase}-${index + 1}`}
                  className="w-full shrink-0"
                >
                  <div className="w-full">
                    <div className="relative overflow-hidden rounded-xl">
                      {targetUrl ? (
                        <Link href={targetUrl} className="block cursor-pointer">
                          <img
                            src={slide?.image || '/homepage_bg.png'}
                            alt={slide?.title || 'Featured'}
                            className="w-full h-52 object-cover"
                          />
                        </Link>
                      ) : (
                        <img
                          src={slide?.image || '/homepage_bg.png'}
                          alt={slide?.title || 'Featured'}
                          className="w-full h-52 object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none rounded-xl" />

                      {/* DaisyUI next/prev buttons */}
                      <div className="absolute left-3 right-3 top-1/2 flex -translate-y-1/2 transform justify-between z-10">
                        <button type="button" onClick={goPrev} className="btn btn-circle btn-sm bg-base-100/80 border-0 shadow-sm hover:bg-base-100 cursor-pointer">
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={goNext} className="btn btn-circle btn-sm bg-base-100/80 border-0 shadow-sm hover:bg-base-100 cursor-pointer">
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-base-content/60">
                        <MapPinned className="h-3.5 w-3.5" />
                        {slide?.location || 'Campus'}
                      </div>
                      <h3 className="text-lg font-black text-base-content font-serif">
                        {targetUrl ? (
                          <Link href={targetUrl} className="hover:text-primary transition-colors cursor-pointer">
                            {slide?.title || 'Campus Article'}
                          </Link>
                        ) : (
                          slide?.title || 'Campus Article'
                        )}
                      </h3>
                      <p className="text-xs text-base-content/75 leading-relaxed font-semibold">
                        {slide?.description || ''}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          </div>
          )}
        </HomeCard>
        </div>
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
                <button key={`news-${item.slug || index+Math.random()}`} type="button" onClick={() => setShowAllNews(true)} className="flex items-start gap-3 border-b border-base-200 pb-3 last:border-b-0 last:pb-0 cursor-pointer group text-left w-full">
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

    // ── 5. Upcoming Events ─────────────────────────────────────────────────
    {
      id: "events",
      content: (
        <div className="flex flex-col rounded-2xl border border-base-200 bg-base-100 p-6 shadow-depth shadow-depth-hover sm:p-7">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-primary">
                <Calendar className="h-5 w-5 stroke-[2.5]" />
              </span>
              <h3 className="text-[18px] font-extrabold tracking-tight text-base-content">
                Upcoming Events
              </h3>
            </div>
            {upcomingEvents.length > 0 && (
              <span className="rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1 text-[9px] font-bold uppercase tracking-wide text-primary">
                {upcomingEvents.length} {upcomingEvents.length === 1 ? "Event" : "Events"}
              </span>
            )}
          </div>

          {/* Event items */}
          {upcomingEvents && upcomingEvents.length > 0 ? (
            <div className="space-y-4">
              {upcomingEvents.slice(0, 3).map((event, i) => {
                const dateObj = new Date(event.event_date);
                const day = isNaN(dateObj.getTime()) ? "" : dateObj.toLocaleDateString("en-US", { day: "numeric" });
                const month = isNaN(dateObj.getTime()) ? "" : dateObj.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
                
                return (
                  <div key={event.event_id || i} className="flex gap-4 items-start pb-3 border-b border-base-200 last:border-0 last:pb-0">
                    {/* Date Block */}
                    <div className="flex flex-col items-center justify-center w-12 h-12 shrink-0 rounded-xl bg-primary/5 border border-primary/10 text-primary">
                      <span className="text-xs font-black leading-none">{day}</span>
                      <span className="text-[9px] font-bold tracking-wider leading-none mt-1">{month}</span>
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <h4 className="text-xs font-black text-base-content leading-snug line-clamp-1">
                        {event.title}
                      </h4>
                      <p className="text-[11px] text-base-content/60 font-semibold line-clamp-2">
                        {event.description}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-3 pt-0.5 text-[10px] text-base-content/40 font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <MapPinned className="h-3.5 w-3.5" />
                          {event.location}
                        </span>
                        {event.is_recurring ? (
                          <span className="rounded bg-secondary/10 px-1.5 py-0.5 text-secondary text-[9px] font-black tracking-widest">
                            RECURRING
                          </span>
                        ) : (
                          event.recur_time || event.recur_day ? null : (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {new Date(event.event_date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                            </span>
                          )
                        )}
                        {event.is_recurring && event.recur_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {event.recur_time}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-xs text-base-content/50">No upcoming events listed.</p>
            </div>
          )}

          {/* Action button */}
          <Link
            href="/wiki/page/upcoming-events"
            className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl bg-primary py-4 text-[14px] font-bold tracking-wide text-primary-content shadow-lg shadow-primary/30 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-primary/40"
          >
            <CalendarDays className="h-[18px] w-[18px]" />
            VIEW ALL EVENTS
          </Link>
        </div>
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
          {newPages.length === 0 ? (
            <p className="text-xs text-base-content/50 py-3">No new pages created yet.</p>
          ) : (
            <ul className="space-y-3">
              {newPages.slice(0, 3).map((page, index) => (
                <li key={`new-page-${page.page_id || index+Math.random()}`}>
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
          {updatedPages.length === 0 ? (
            <p className="text-xs text-base-content/50 py-3">No pages updated yet.</p>
          ) : (
            <ul className="space-y-3">
              {updatedPages.slice(0, 3).map((page, index) => (
                <li key={`updated-page-${page.page_id || index+Math.random()}`}>
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
          {pendingPages.length === 0 ? (
            <p className="text-xs text-base-content/50 py-3">No pending pages.</p>
          ) : (
            <ul className="space-y-3">
              {pendingPages.slice(0, 3).map((pending, index) => {
                return (
                  <li key={`pending-page-${pending.pending_id || index+1}`}>
                    <span className="block text-xs font-semibold text-base-content/85 truncate">{pending.title}</span>
                  </li>
                );
              })}
            </ul>
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
          badge={<span className="badge badge-secondary badge-sm rounded-2xl">Trending</span>}
        >
          <div className="space-y-3">
            {popularPages.length > 0 ? (
              popularPages.slice(0, 5).map((page, i) => (
                <Link
                  key={page.page_id+Math.random()}
                  href={`/wiki/${(page.metadata as any)?.category || 'campus'}/${page.slug}`}
                  className="flex items-center justify-between rounded-xl border border-base-200 bg-base-200/40 p-3 text-xs font-semibold text-base-content/80 hover:border-primary/40 hover:text-primary transition-colors"
                >
                  <span className="truncate">{page.title}</span>
                  <span className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-base-content/50">
                      <Eye className="h-3 w-3" />
                      {Number(page.view_count ?? 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-base-content/40">
                      #{i + 1}
                    </span>
                  </span>
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

    // ── 12. Today's Mess Menu (driven by the wiki mess-menu page content) ─────
    {
      id: "mess-menu",
      content: (
        <div className="flex flex-col rounded-2xl border border-base-200 bg-base-100 p-6 shadow-depth shadow-depth-hover sm:p-7">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-success">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
                  <path d="M7 2v20" />
                  <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
                </svg>
              </span>
              <h3 className="text-[18px] font-extrabold tracking-tight text-base-content">
                Today&rsquo;s Mess Menu
              </h3>
            </div>
            {messMenuData && (
              <span className="rounded-full bg-success px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-success-content">
                {messMenuData.day}
              </span>
            )}
          </div>

          {/* Meal sections */}
          {messMenuData && messMenuData.meals.length > 0 ? (
            <div className="space-y-5">
              {messMenuData.meals.map((meal, i) => {
                const theme = MESS_THEME[getTimeOfDay(meal)];
                return (
                  <div key={i+Math.random()}>
                    <div className="mb-2.5 flex items-center justify-between gap-2">
                      <span
                        className={`text-[13px] font-extrabold uppercase tracking-[0.8px] ${theme.mealName}`}
                      >
                        {meal.name}
                      </span>
                      {meal.time && (
                        <span
                          className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold ${theme.timeBadge}`}
                        >
                          <Clock className="h-3.5 w-3.5" />
                          {meal.time}
                        </span>
                      )}
                    </div>
                    {meal.items.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {meal.items.map((item, j) => (
                          <span
                            key={j}
                            className="rounded-lg border border-base-300 bg-base-100 px-4 py-1.5 text-[13px] font-medium text-base-content/70"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs font-medium italic text-base-content/40">
                        No items listed
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-xs text-base-content/50">Menu not available yet.</p>
              <button
                onClick={() => setShowMessMenu(true)}
                className="mt-1 block text-xs font-bold text-success"
              >
                View full week menu →
              </button>
            </div>
          )}

          {/* Action button */}
          <button
            onClick={() => setShowMessMenu(true)}
            className="mt-8 flex w-full items-center justify-center gap-2.5 rounded-xl bg-success py-4 text-[14px] font-bold tracking-wide text-success-content shadow-lg shadow-success/30 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-success/40"
          >
            <CalendarDays className="h-[18px] w-[18px]" />
            OPEN FULL MENU
          </button>
        </div>
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
          onClick={() => setShowTransport(true)}
          badge={
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowTransport(true);
              }}
              className="btn btn-ghost btn-xs text-primary font-bold cursor-pointer"
            >
              View schedule
            </button>
          }
          footer={
            <button
              type="button"
              onClick={() => setShowTransport(true)}
              className="btn btn-ghost btn-xs text-primary font-extrabold uppercase tracking-wider gap-1 cursor-pointer"
            >
              Full schedule <ArrowRight className="h-3.5 w-3.5" />
            </button>
          }
        >
          {nextDeparture ? (
            <div className="space-y-3">
              {/* Next departure highlight */}
              <div className="relative overflow-hidden rounded-2xl border border-secondary/20 bg-secondary/10 p-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                    <Bus className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-secondary/70">
                      Next departure
                    </p>
                    <p className="truncate text-[15px] font-black leading-tight text-base-content">
                      {nextDeparture.trip.from}
                      <ArrowRight className="mx-1 inline h-3.5 w-3.5 text-base-content/40" />
                      {nextDeparture.trip.to ?? "—"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Clock className="h-4 w-4 text-base-content/70" />
                    <span className="text-lg font-black tracking-tight text-base-content">
                      {nextDeparture.trip.time}
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional upcoming departures */}
              {moreTrips.length > 0 && (
                <>
                  <p className="px-1 text-[10px] font-black uppercase tracking-[0.18em] text-base-content/40">
                    Also departing
                  </p>
                  <div className="space-y-2">
                    {moreTrips.map(({ trip }, mi) => (
                      <div
                        key={mi}
                        className="flex items-center justify-between gap-2 rounded-xl border border-base-200 bg-base-100 px-2.5 py-2"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <span className="badge badge-ghost gap-1 shrink-0 font-bold">
                            <Clock className="h-3 w-3" />
                            {trip!.time}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-xs font-semibold text-base-content/80">
                            {trip!.from}
                            <ArrowRight className="mx-1 inline h-3 w-3 text-base-content/40" />
                            {trip!.to ?? "—"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-base-content/50">Schedule not available yet.</p>
              <button
                type="button"
                onClick={() => setShowTransport(true)}
                className="text-xs text-primary font-bold mt-1 block cursor-pointer"
              >
                View full schedule →
              </button>
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

  // Sort the feed by the explicit display order above.
  cards.sort((a, b) => (CARD_ORDER[a.id] ?? 999) - (CARD_ORDER[b.id] ?? 999));

  return (
    <>
      {/* ── Mountain Hero Banner ───────────────────────────────────────────── */}
      <div className="relative w-full h-[85vh] lg:h-dvh min-h-125 hidden md:flex flex-col items-center justify-center text-center p-6 bg-primary overflow-hidden select-none">
        <ParallaxBackground mousePos={mousePos} imageSrc="/homepage_bg.png" overlayClass="" />

        <style>{`
          @keyframes gradient-x { 0%, 100% { background-position: 0% 50%; } 55% { background-position: 100% 50%; } }
          @keyframes slide-up-fade { 0% { opacity: 0; transform: translateY(120px); } 100% { opacity: 1; transform: translateY(0); } }
          .animate-gradient-text { background-size: 200% auto; animation: gradient-x 6s ease infinite; }
          .hero-gradient-text {
            background-image: linear-gradient(100deg, var(--color-primary), var(--color-secondary));
            background-size: 300% 100%;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            color: transparent;
          }
          .animate-hero-content { animation: slide-up-fade 3.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        `}</style>

        <div className={`relative z-10 max-w-5xl space-y-6 px-4 ${imageLoaded ? "animate-hero-content" : "opacity-0"} font-style-sensitive`}>
          <h1 className="select-none leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
            <span className="text-4xl sm:text-6xl lg:text-[75px] font-light tracking-wide bg-linear-to-r from-white to-slate-200 bg-clip-text text-transparent block">
              Welcome to
            </span>
            <span className="text-5xl sm:text-7xl lg:text-[105px] font-bold tracking-widest hero-gradient-text block mt-4 animate-gradient-text uppercase">
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
        {/* ── Card visibility preferences ──────────────────────────────────── */}
        <div>
          <button
            type="button"
            onClick={() => setShowPrefs((v) => !v)}
            className="btn btn-ghost btn-sm gap-2 text-base-content/70 hover:text-base-content"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Customize cards and reorder
          </button>

          {showPrefs && (
            <div className="mt-3 space-y-4 rounded-2xl border border-base-200 bg-base-100 p-4 shadow-depth">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-base-content">Visible cards</h4>
                <button
                  type="button"
                  onClick={() => setShowPrefs(false)}
                  className="btn btn-ghost btn-xs"
                >
                  Done
                </button>
              </div>

              {(() => {
                const visibleGroups = CARD_GROUPS.map((group) => ({
                  ...group,
                  items: cards.filter((c) => group.ids.includes(c.id)),
                })).filter((group) => group.items.length > 0);

                const columns: typeof visibleGroups[] = [[], [], []];
                visibleGroups.forEach((group, i) => {
                  columns[i % 3].push(group);
                });

                return (
                  <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-3">
                    {columns.map((col, ci) => (
                      <div key={ci+Math.random()} className="space-y-4">
                        {col.map((group) => (
                          <div key={group.title}>
                            <div className="mb-3.5 flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <span className="h-4 w-1.5 rounded-full bg-primary" />
                                <h5 className="text-xs font-bold uppercase tracking-widest text-base-content/50">
                                  {group.title}
                                </h5>
                              </div>
                              <span className="rounded-full bg-base-200 px-2 py-0.5 text-xs font-semibold text-base-content/60">
                                {group.items.length}
                              </span>
                            </div>
                            <div className="divide-y divide-base-200 overflow-hidden rounded-xl border border-base-200 bg-base-100 shadow-sm">
                              {group.items.map((c) => {
                                const visible = !hiddenCards.has(c.id);
                                return (
                                  <label
                                    key={c.id+1}
                                    className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-base-200/60"
                                  >
                                    <span className="text-sm font-medium text-base-content/80">
                                      {CARD_LABELS[c.id] ?? c.id}
                                    </span>
                                    <input
                                      type="checkbox"
                                      className="toggle toggle-sm toggle-primary"
                                      checked={visible}
                                      onChange={() => toggleCard(c.id)}
                                    />
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })()}

              {hiddenCards.size > 0 && (
                <button
                  type="button"
                  onClick={showAllCards}
                  className="btn btn-ghost btn-xs text-base-content/60"
                >
                  Show all cards
                </button>
              )}
            </div>
          )}
        </div>

        <HomeMasonryGrid
          cards={cards.filter((c) => !hiddenCards.has(c.id))}
          reorderEnabled={showPrefs}
        />

        {/* ── Statistics Strip ────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 mt-4">
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
            <div className="stat-figure text-warning"><Zap className="h-5 w-5" /></div>
            <div className="stat-title text-[9px] font-bold uppercase tracking-wider">Events</div>
            <div className="stat-value text-xl">{upcomingEvents.length || "…"}</div>
          </div>
        </div>

        {/* Mobile footer */}
        <div className="pt-4 border-t border-base-200 flex md:hidden flex-col items-center text-center gap-1.5 select-none w-full">
          <div className="text-[12px] text-base-content/50 font-medium flex items-center justify-center gap-1.5 uppercase tracking-wider">
            <span>Made with</span>
            <button
              type="button"
              onClick={spawnHearts}
              aria-label="Send hearts"
              className="text-red-500 cursor-pointer hover:scale-130 active:scale-90 transition-transform duration-200"
            >
              ❤️
            </button>
          </div>
          <div className="text-[12px] text-base-content/50 font-semibold tracking-wide">
            by <span className="font-extrabold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Technical Council, IITGN</span>
          </div>
          <div className="text-[9px] font-bold text-base-content/60 tracking-widest uppercase mt-1">
            © {new Date().getFullYear()} Technical Council
          </div>
        </div>
      </div>
    </>
  );
}
