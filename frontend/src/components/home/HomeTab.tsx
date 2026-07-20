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
  CalendarDays,
  Dices,
  MapPinned,
  Newspaper,
  TrendingUp,
  Clock,
  Eye,
  SlidersHorizontal,
  RefreshCw,
  User,
  Pencil,
} from "lucide-react";

import ParallaxBackground from "@/components/helpers/ParallaxBackground";
import { useAuth } from "@/hooks/useAuth";
import EventsOverlay from "@/components/overlays/EventsOverlay";
import HomeCard from "@/components/home/HomeCard";
import HomeMasonryGrid, { MasonryCardConfig } from "@/components/home/HomeMasonryGrid";

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
  setShowEditFeatured: (show: boolean) => void;
}

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
  "photo-of-week": "Photo of the Week",
  events: "Upcoming Events",
  "quick-stats": "Quick Stats",
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
    ids: ["photo-of-week", "events", "quick-stats"],
  },
];

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
  setShowEditFeatured,
}: HomeTabProps) {
  const { categories } = useAuth();
  const router = useRouter();

  // ── Card visibility preferences (local only) ───────────────────────────────
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
  const [showEventsManager, setShowEventsManager] = useState(false);

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

  // Derived / computed states from cached store/Dexie props
  const featuredSlides = (featuredPages && featuredPages.length > 0) ? featuredPages : [];

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
        const cat = (randomItem.metadata as any)?.category || "campus";
        router.push(`/wiki/${cat}/${randomItem.slug}`);
        return;
      }
      if (popularPages.length > 0) {
        const randomPop = popularPages[Math.floor(Math.random() * popularPages.length)];
        const cat = (randomPop.metadata as any)?.category || "campus";
        router.push(`/wiki/${cat}/${randomPop.slug}`);
        return;
      }
      router.push("/wiki/page/campuses-and-surroundings");
    } catch {
      router.push("/wiki/page/campuses-and-surroundings");
    }
  };

  // ── Seamless (cyclic) featured carousel ────────────────────────────────────
  const featuredPausedRef = useRef(false);
  const featuredCount = (featuredPages && featuredPages.length > 0) ? featuredPages.length : 0;
  const hasClones = featuredCount > 1;

  const [featuredIndex, setFeaturedIndex] = useState(1);
  const [featuredAnim, setFeaturedAnim] = useState(true);

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

  const scrollToIndex = (realIndex: number) => {
    setFeaturedAnim(true);
    setFeaturedIndex(hasClones ? realIndex + 1 : realIndex);
  };

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

  useEffect(() => {
    if (!hasClones) return;
    const id = setInterval(() => {
      if (featuredPausedRef.current) return;
      goNext();
    }, 2000);
    return () => clearInterval(id);
  }, [featuredPages, hasClones]);

  const activeFeatured = hasClones
    ? (((featuredIndex - 1) % featuredCount) + featuredCount) % featuredCount
    : featuredIndex;

  const activeSlide = featuredSlides[activeFeatured];
  const activeTarget =
    activeSlide?.slug
      ? `/wiki/page/${activeSlide.slug}`
      : (activeSlide?.href || null);

  // ─── Card definitions ──────────────────────────────────────────────────────
  // Order + spans reproduce the mock: Featured 2x2, Popular/New 1x2,
  // Pending/Quick Stats 2x1, the rest 1x1.
  const CARD_ORDER: Record<string, number> = {
    "featured-article": 0,
    "popular-pages": 1,
    "new-pages": 2,
    "in-the-news": 3,
    events: 4,
    "updated-pages": 5,
    "random-page": 6,
    "pending-pages": 7,
    "quick-stats": 8,
  };

  const cards: MasonryCardConfig[] = [
    // ── 1. Featured Article (full-bleed hero, 2x2) ───────────────────────────
    {
      id: "featured-article",
      colSpan: 2,
      rowSpan: 2,
      content: (
        <div
          onMouseEnter={() => { featuredPausedRef.current = true; }}
          onMouseLeave={() => { featuredPausedRef.current = false; }}
          className="group col-span-1 md:col-span-2 row-span-2 rounded-[2rem] relative overflow-hidden card-hover flex flex-col justify-between p-8 min-h-[460px] h-full font-inter"
        >
          {featuredSlides.length === 0 ? (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-secondary/15 flex items-center justify-center">
              <div className="text-center px-6">
                <Award className="h-8 w-8 mx-auto text-white/70 mb-2" />
                <p className="text-white font-bold">No featured articles yet</p>
              </div>
            </div>
          ) : (
            <div
              className="absolute inset-0 flex"
              style={{
                transform: `translateX(-${featuredIndex * 100}%)`,
                transition: featuredAnim ? "transform 0.5s ease" : "none",
              }}
              onTransitionEnd={handleFeaturedTransitionEnd}
            >
              {(hasClones
                ? [featuredSlides[featuredSlides.length - 1], ...featuredSlides, featuredSlides[0]]
                : featuredSlides
              ).map((slide, index) => (
                <div
                  key={`featured-slide-${index}`}
                  className="relative w-full h-full shrink-0 overflow-hidden"
                >
                  <img
                    src={slide?.image || "/homepage_bg.png"}
                    alt={slide?.title || "Featured"}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                </div>
              ))}
            </div>
          )}

          {/* Top badges */}
          <div className="relative z-10 flex justify-between items-start w-full">
            <div className="flex items-center gap-2 text-white bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold shadow-sm">
              <Award className="w-4 h-4" /> Featured Article
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowEditFeatured(true)}
                aria-label="Edit featured articles"
                className="p-2 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <span className="bg-[#e879f9] text-white text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg shadow-purple-500/30">
                ✨ Special Feature
              </span>
            </div>
          </div>

          {/* Bottom content */}
          <div className="relative z-10 mt-auto">
            <p className="text-blue-300 font-black tracking-widest uppercase text-xs mb-3 flex items-center gap-2">
              <User className="w-3 h-3" />
              {activeSlide?.location || "Campus"}
            </p>
            <h2 className="text-white font-display font-black text-6xl md:text-7xl leading-none tracking-tight mb-6 group-hover:-translate-y-2 transition-transform drop-shadow-lg">
              {activeSlide?.title || "Campus Article"}
            </h2>
            {activeTarget ? (
              <Link
                href={activeTarget}
                className="inline-flex items-center gap-2 text-gray-900 font-black bg-white hover:bg-gray-100 px-6 py-3.5 rounded-full transition-colors shadow-lg"
              >
                Read All <ArrowRight className="w-4 w-4" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setShowEditFeatured(true)}
                className="inline-flex items-center gap-2 text-gray-900 font-black bg-white hover:bg-gray-100 px-6 py-3.5 rounded-full transition-colors shadow-lg cursor-pointer"
              >
                Read All <ArrowRight className="w-4 w-4" />
              </button>
            )}
          </div>

          {/* Slide dots (bottom-right) */}
          {featuredSlides.length > 0 && (
            <div className="absolute bottom-8 right-8 z-10 flex gap-2">
              {featuredSlides.map((_, index) => (
                <button
                  key={`featured-dot-${index}`}
                  type="button"
                  onClick={() => scrollToIndex(index)}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    activeFeatured === index
                      ? "w-6 bg-white"
                      : "w-2.5 bg-white/50 hover:bg-white/80"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      ),
    },

    // ── 2. Popular Pages (1x2, pink gradient) ────────────────────────────────
    {
      id: "popular-pages",
      rowSpan: 2,
      content: (
        <HomeCard
          className="bg-gradient-to-br from-[#fce7f3] to-[#fbcfe8]"
          title="Popular Pages"
          icon={<TrendingUp className="h-5 w-5 text-pink-500" />}
          badge={
            <span className="bg-pink-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm">
              Trending
            </span>
          }
        >
          <div className="flex flex-col gap-3 flex-1">
            {popularPages.length > 0 ? (
              popularPages.slice(0, 5).map((page, i) => (
                <Link
                  key={page.page_id}
                  href={`/wiki/${(page.metadata as any)?.category || "campus"}/${page.slug}`}
                  className="bg-white/70 hover:bg-white p-4 rounded-2xl flex justify-between items-center transition-colors shadow-sm"
                >
                  <span className="font-bold text-gray-800 truncate">{page.title}</span>
                  <span className="flex items-center gap-2 shrink-0 ml-2 text-xs text-gray-500 font-bold">
                    <Eye className="h-3 w-3" />
                    {Number(page.view_count ?? 0).toLocaleString()}
                    <span className="text-pink-400">#{i + 1}</span>
                  </span>
                </Link>
              ))
            ) : (
              <p className="text-xs text-gray-500">Pages will appear here as they get views.</p>
            )}
          </div>
        </HomeCard>
      ),
    },

    // ── 3. New Pages (1x2, blue gradient) ────────────────────────────────────
    {
      id: "new-pages",
      rowSpan: 2,
      content: (
        <HomeCard
          className="bg-gradient-to-br from-[#e0f2fe] to-[#bae6fd] border border-blue-100"
          title="New Pages"
          icon={<Sparkles className="h-5 w-5 text-blue-500" />}
          footer={
            <button
              onClick={() => setShowAllNew(true)}
              className="mt-4 w-full font-black text-blue-700 bg-white hover:bg-blue-50 py-3.5 rounded-xl transition-colors text-sm shadow-sm cursor-pointer"
            >
              VIEW ALL NEW PAGES
            </button>
          }
        >
          <div className="flex flex-col gap-4 flex-1">
            {newPages.length === 0 ? (
              <p className="text-xs text-gray-500 py-3">No new pages created yet.</p>
            ) : (
              newPages.slice(0, 3).map((page) => (
                <Link
                  key={page.page_id}
                  href={`/wiki/${(page.metadata as any)?.category || "campus"}/${page.slug}`}
                  className="group/item bg-white/50 p-4 rounded-2xl hover:bg-white transition-colors block"
                >
                  <h4 className="font-bold text-gray-800 group-hover/item:text-blue-600 transition-colors truncate">
                    {page.title || "Untitled"}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 font-medium">
                    Created {getRelativeTime(page.created_at)}
                  </p>
                </Link>
              ))
            )}
          </div>
        </HomeCard>
      ),
    },

    // ── 4. In the News (1x1, yellow) ─────────────────────────────────────────
    {
      id: "in-the-news",
      content: (
        <HomeCard
          className="bg-[#fef08a] relative overflow-hidden"
          headerClassName="mb-4"
          title="In the News"
          icon={<Newspaper className="h-5 h-5 text-amber-600" />}
          badge={
            <button
              onClick={() => setShowAllNews(true)}
              className="text-xs font-black text-amber-700 hover:text-amber-900 bg-amber-200/50 px-3 py-1 rounded-full cursor-pointer"
            >
              View all
            </button>
          }
          footer={
            <button
              onClick={() => setShowAllNews(true)}
              className="text-xs font-black text-amber-800 uppercase tracking-wider flex items-center gap-1 mt-auto group/link hover:text-amber-900 cursor-pointer"
            >
              MORE CAMPUS NEWS{" "}
              <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
            </button>
          }
        >
          {/* Decorative blur */}
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/40 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex-1 flex items-center justify-center my-4 bg-white/30 rounded-2xl border border-amber-200/50 overflow-hidden">
            {newsPages.length > 0 ? (
              <div className="w-full p-3 space-y-2 max-h-full overflow-y-auto no-scrollbar">
                {newsPages.slice(0, 5).map((item, index) => {
                  const Icons = [Sparkles, FlaskConical, Trophy];
                  const IconComponent = Icons[index % Icons.length];
                  return (
                    <button
                      key={`news-${item.slug || index}`}
                      type="button"
                      onClick={() => setShowAllNews(true)}
                      className="flex items-start gap-3 rounded-xl bg-white/60 hover:bg-white px-3 py-2 transition-colors w-full text-left"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-amber-500/15 text-amber-600">
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-gray-800 line-clamp-2">{item.title}</h4>
                        <span className="text-[10px] text-gray-500 mt-0.5 block font-semibold">
                          {getRelativeTime(item.created_at)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-amber-800/60 text-sm font-bold text-center px-4">
                No news articles yet.
              </p>
            )}
          </div>
        </HomeCard>
      ),
    },

    // ── 5. Upcoming Events (1x1, indigo gradient) ────────────────────────────
    {
      id: "events",
      content: (
        <div className="bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] rounded-[2rem] p-6 flex flex-col card-hover text-white shadow-lg shadow-indigo-200 h-full font-inter">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="font-display font-bold text-xl flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-200" />
              Upcoming Events
            </h3>
            {upcomingEvents.length > 0 && (
              <span className="rounded-full bg-white/20 border border-white/30 px-3.5 py-1 text-[9px] font-bold uppercase tracking-wide">
                {upcomingEvents.length} {upcomingEvents.length === 1 ? "Event" : "Events"}
              </span>
            )}
          </div>

          <div className="flex-1 flex items-center justify-center my-2 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10 overflow-hidden">
            {upcomingEvents && upcomingEvents.length > 0 ? (
              <div className="w-full p-4 space-y-3 overflow-y-auto no-scrollbar">
                {upcomingEvents.slice(0, 3).map((event, i) => {
                  const dateObj = new Date(event.event_date);
                  const day = isNaN(dateObj.getTime()) ? "" : dateObj.toLocaleDateString("en-US", { day: "numeric" });
                  const month = isNaN(dateObj.getTime()) ? "" : dateObj.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
                  return (
                    <div key={event.event_id || i} className="flex gap-3 items-start pb-3 border-b border-white/10 last:border-0 last:pb-0">
                      <div className="flex flex-col items-center justify-center w-10 h-10 shrink-0 rounded-xl bg-white/15 text-white font-black">
                        <span className="text-xs leading-none">{day}</span>
                        <span className="text-[8px] leading-none mt-1 opacity-80">{month}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-black leading-snug line-clamp-1">{event.title}</h4>
                        <p className="text-[10px] text-indigo-100 font-semibold line-clamp-1 flex items-center gap-1 mt-0.5">
                          <MapPinned className="w-3 h-3" /> {event.location}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-indigo-100 text-sm font-bold text-center px-4">
                No upcoming events listed.
              </p>
            )}
          </div>

          <button
            onClick={() => setShowEventsManager(true)}
            className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 py-3.5 text-xs font-black uppercase tracking-wider shadow-md transition-colors cursor-pointer shrink-0"
          >
            <CalendarDays className="w-4 h-4" />
            VIEW ALL EVENTS
          </button>
        </div>
      ),
    },

    // ── 6. Updated Pages (1x1, mint green) ───────────────────────────────────
    {
      id: "updated-pages",
      content: (
        <HomeCard
          className="bg-[#34d399] relative overflow-hidden"
          headerClassName="mb-4"
          title="Updated Pages"
          icon={<RefreshCw className="h-5 h-5 text-emerald-700" />}
          footer={
            <button
              onClick={() => setShowAllUpdated(true)}
              className="mt-4 text-xs font-black text-emerald-900 uppercase tracking-wider text-left hover:text-emerald-950 cursor-pointer"
            >
              VIEW ALL EDITS
            </button>
          }
        >
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-300 rounded-full blur-3xl opacity-50 pointer-events-none" />
          <div className="relative z-10 flex-1 flex flex-col gap-2 bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
            {updatedPages.length === 0 ? (
              <p className="text-xs text-emerald-900/70 py-2">No pages updated yet.</p>
            ) : (
              updatedPages.slice(0, 3).map((page, index) => (
                <React.Fragment key={page.page_id}>
                  <div className="flex justify-between items-center">
                    <Link
                      href={`/wiki/${(page.metadata as any)?.category || "campus"}/${page.slug}`}
                      className="font-bold text-emerald-950 text-sm hover:text-emerald-800 truncate transition-colors"
                    >
                      {page.title || "Untitled"}
                    </Link>
                    <p className="text-[10px] text-emerald-800 font-bold shrink-0 ml-2">
                      {getRelativeTime(page.updated_at)}
                    </p>
                  </div>
                  {index < Math.min(updatedPages.length, 3) - 1 && (
                    <div className="h-px w-full bg-emerald-700/10" />
                  )}
                </React.Fragment>
              ))
            )}
          </div>
        </HomeCard>
      ),
    },

    // ── 7. Random Page (1x1, rainbow ring) ───────────────────────────────────
    {
      id: "random-page",
      content: (
        <div className="bg-gradient-to-tr from-[#7dd3fc] via-[#e879f9] to-[#fde047] rounded-[2rem] p-1.5 card-hover h-full font-inter">
          <div className="bg-white/95 backdrop-blur-xl w-full h-full rounded-[1.6rem] p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-display font-bold text-xl flex items-center gap-2 text-gray-900 mb-3">
                <Dices className="w-6 h-6 text-fuchsia-500" /> Random Page
              </h3>
              <p className="text-sm text-gray-600 font-medium leading-relaxed">
                Jump into a fresh article from the wiki and discover something new around campus.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRandomPage}
              className="mt-4 w-full font-black text-white bg-gray-900 hover:bg-black py-3.5 rounded-xl transition-transform active:scale-95 text-sm shadow-xl shadow-gray-900/20 cursor-pointer"
            >
              Open a random page
            </button>
          </div>
        </div>
      ),
    },

    // ── 8. Pending Review (2x1, grey) ────────────────────────────────────────
    {
      id: "pending-pages",
      colSpan: 2,
      content: (
        <div className="bg-gray-50 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between card-hover border-2 border-gray-100 gap-6 h-full font-inter">
          <div className="flex-1 text-center md:text-left">
            <h3 className="font-display font-bold text-xl flex items-center justify-center md:justify-start gap-2 text-gray-900 mb-2">
              <Clock className="h-5 w-5 text-gray-400" /> Pending Review
            </h3>
            <p className="text-gray-500 text-sm font-medium">
              {pendingPages.length > 0
                ? `${pendingPages.length} page${pendingPages.length === 1 ? "" : "s"} pending your review.`
                : "No pending pages currently require your attention."}
            </p>
          </div>
          <button
            onClick={() => setShowAllPending(true)}
            className="w-full md:w-auto font-black text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 py-3.5 px-8 rounded-xl transition-all active:scale-95 text-sm shadow-sm whitespace-nowrap cursor-pointer"
          >
            Review Pending Changes
          </button>
        </div>
      ),
    },

    // ── 9. Quick Stats (2x1, dark) ───────────────────────────────────────────
    {
      id: "quick-stats",
      colSpan: 2,
      content: (
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-[2rem] p-6 flex items-center justify-between card-hover text-white overflow-hidden relative h-full font-inter">
          <svg viewBox="0 0 200 100" className="absolute inset-0 w-full h-full opacity-10" preserveAspectRatio="none">
            <path d="M0 50 Q 50 10, 100 50 T 200 50" fill="none" stroke="white" strokeWidth="2" />
            <path d="M0 70 Q 50 30, 100 70 T 200 70" fill="none" stroke="white" strokeWidth="1" />
          </svg>

          <div className="relative z-10 flex gap-8 items-center w-full justify-around">
            <div className="text-center">
              <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-1">Total Articles</p>
              <p className="font-display font-black text-4xl text-white">
                {totalPagesCount !== null ? totalPagesCount.toLocaleString() : "…"}
              </p>
            </div>
            <div className="w-px h-12 bg-gray-700" />
            <div className="text-center">
              <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-1">Categories</p>
              <div className="flex items-center justify-center gap-2">
                <p className="font-display font-black text-4xl text-[#34d399]">{categoriesCount}</p>
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34d399] opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#34d399]" />
                </span>
              </div>
            </div>
          </div>
        </div>
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
            background-image: linear-gradient(100deg, rgba(255,255,255,0.97), rgba(255,255,255,0.55), rgba(226,232,240,0.9));
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
                <button type="button" onClick={() => setShowPrefs(false)} className="btn btn-ghost btn-xs">
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
                      <div key={ci} className="space-y-4">
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
                                    key={c.id}
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

      <EventsOverlay isOpen={showEventsManager} onClose={() => setShowEventsManager(false)} />
    </>
  );
}
