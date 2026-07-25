"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Award,
  ArrowDown,
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
  Users,
  Pencil,
} from "lucide-react";

import ParallaxBackground from "@/components/helpers/ParallaxBackground";
import { useAuth } from "@/hooks/useAuth";
import EventsOverlay from "@/components/overlays/EventsOverlay";
import HomeCard from "@/components/home/HomeCard";
import HomeMasonryGrid, {
  MasonryCardConfig,
} from "@/components/home/HomeMasonryGrid";
import { useCommonStore } from "@/store/useCommonStore";

interface HomeTabProps {
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
  {
    title: "Discovery",
    ids: ["featured-article", "in-the-news", "popular-pages", "random-page"],
  },
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
  totalPagesCount,
  featuredPages,
  popularPages,
  upcomingEvents,
  setShowEditFeatured,
}: HomeTabProps) {
  const { categories } = useAuth();
  const router = useRouter();
  const { setHomeCardOrder } = useCommonStore();

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
  const featuredSlides =
    featuredPages && featuredPages.length > 0 ? featuredPages : [];

  useEffect(() => {
    if (categories && categories.length > 0) {
      setCategoriesCount(categories.length);
    }
  }, [categories]);

  const handleRandomPage = async () => {
    try {
      const candidates = [...(newPages || []), ...(updatedPages || [])].filter(
        Boolean
      );
      if (candidates.length > 0) {
        const randomItem =
          candidates[Math.floor(Math.random() * candidates.length)];
        const cat = (randomItem.metadata as any)?.category || "campus";
        router.push(`/wiki/${cat}/${randomItem.slug}`);
        return;
      }
      if (popularPages.length > 0) {
        const randomPop =
          popularPages[Math.floor(Math.random() * popularPages.length)];
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
  const featuredCount =
    featuredPages && featuredPages.length > 0 ? featuredPages.length : 0;
  const hasClones = featuredCount > 1;

  const [featuredIndex, setFeaturedIndex] = useState(1);
  const [featuredAnim, setFeaturedAnim] = useState(true);

  useEffect(() => {
    setFeaturedAnim(false);
    setFeaturedIndex(hasClones ? 1 : 0);
  }, [featuredPages, hasClones]);

  const goNext = useCallback(() => {
    if (featuredCount < 2) return;
    setFeaturedAnim(true);
    setFeaturedIndex((i) => i + 1);
  }, [featuredCount]);

  const scrollToIndex = (realIndex: number) => {
    setFeaturedAnim(true);
    setFeaturedIndex(hasClones ? realIndex + 1 : realIndex);
  };

  const handleFeaturedTransitionEnd = (
    e: React.TransitionEvent<HTMLDivElement>
  ) => {
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
  }, [hasClones, goNext]);

  const activeFeatured = hasClones
    ? (((featuredIndex - 1) % featuredCount) + featuredCount) % featuredCount
    : featuredIndex;

  const activeSlide = featuredSlides[activeFeatured];
  const activeTarget = activeSlide?.slug
    ? `/wiki/page/${activeSlide.slug}`
    : activeSlide?.href || null;

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
      colSpan: 3,
      rowSpan: 3,
      content: (
        <div
          onMouseEnter={() => {
            featuredPausedRef.current = true;
          }}
          onMouseLeave={() => {
            featuredPausedRef.current = false;
          }}
          className="group rounded-xl relative overflow-hidden flex flex-col justify-between p-6 @md:p-8 h-full font-inter"
        >
          {featuredSlides.length === 0 ? (
            <div className="absolute inset-0 bg-linear-to-br from-primary/30 via-primary/10 to-secondary/15 flex items-center justify-center">
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
                ? [
                    featuredSlides[featuredSlides.length - 1],
                    ...featuredSlides,
                    featuredSlides[0],
                  ]
                : featuredSlides
              ).map((slide, index) => (
                <div
                  key={`featured-slide-${index}`}
                  className="relative w-full h-full shrink-0 overflow-hidden"
                >
                  <Image
                    src={slide?.image || "/homepage_bg.png"}
                    alt={slide?.title || "Featured"}
                    fill
                    sizes="100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority={index === 0}
                    unoptimized={true}
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-transparent" />
                </div>
              ))}
            </div>
          )}

          {/* Top badges */}
          <div className="relative z-10 flex flex-col @sm:flex-row gap-3 justify-between items-start w-full">
            <div className="badge badge-primary badge-lg gap-2 text-primary-content font-black">
              <Award className="w-4 h-4" /> {activeSlide?.tag || "Featured"}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowEditFeatured(true)}
                aria-label="Edit featured articles"
                className="btn btn-primary btn-circle btn-sm shadow-lg"
              >
                <Pencil className="w-3.5 h-3.5 @md:w-4 @md:h-4" />
              </button>
            </div>
          </div>

          {/* Bottom content */}
          <div className="relative z-10 mt-auto">
            <h2 className="text-white font-display font-black text-3xl @xs:text-4xl @sm:text-5xl @md:text-6xl @lg:text-7xl leading-none tracking-tight mb-4 @md:mb-6 group-hover:-translate-y-2 transition-transform drop-shadow-lg line-clamp-3">
              {activeSlide?.title || "Campus Article"}
            </h2>
            {activeTarget ? (
              <Link
                href={activeTarget}
                className="btn btn-primary btn-sm @md:btn-md shadow-lg rounded-2xl"
              >
                Read <ArrowRight className="w-3 h-3 @md:w-4 @md:h-4" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setShowEditFeatured(true)}
                className="btn btn-primary btn-sm @md:btn-md shadow-lg cursor-pointer"
              >
                Read <ArrowRight className="w-3 h-3 @md:w-4 @md:h-4" />
              </button>
            )}
          </div>

          {/* Slide dots (bottom-right) */}
          {featuredSlides.length > 0 && (
            <div className="hidden @sm:flex absolute bottom-8 right-8 z-10 gap-2">
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

    // ── 2. Popular Pages (1x1, pink gradient) ────────────────────────────────
    {
      id: "popular-pages",
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
          <div className="dynamic-list-container flex flex-col gap-3 flex-1 overflow-hidden">
            {popularPages.length > 0 ? (
              popularPages.slice(0, 5).map((page, i) => (
                <Link
                  key={page.page_id}
                  href={`/wiki/${(page.metadata as any)?.category || "campus"}/${page.slug}`}
                  className={`dyn-flex-${i + 1 > 1 ? i + 1 : 1} bg-white/70 hover:bg-white p-3 @sm:p-4 rounded-2xl flex-col @sm:flex-row justify-between items-start @sm:items-center gap-1.5 @sm:gap-0 transition-colors shadow-sm`}
                >
                  <span className="font-bold text-[#1f2937] text-sm @sm:text-base truncate w-full @sm:w-auto">
                    {page.title}
                  </span>
                  <span className="flex items-center gap-2 shrink-0 text-[10px] @sm:text-xs text-[#6b7280] font-bold">
                    <Eye className="h-3 w-3" />
                    {Number(page.view_count ?? 0).toLocaleString()}
                    <span className="text-pink-400">#{i + 1}</span>
                  </span>
                </Link>
              ))
            ) : (
              <p className="text-xs text-[#6b7280]">
                Pages will appear here as they get views.
              </p>
            )}
          </div>
        </HomeCard>
      ),
    },

    // ── 3. New Pages (1x1, blue gradient) ────────────────────────────────────
    {
      id: "new-pages",
      content: (
        <HomeCard
          className="bg-linear-to-br from-[#e0f2fe] to-[#bae6fd] border border-blue-100"
          title="New Pages"
          icon={<Sparkles className="h-5 w-5 text-blue-500" />}
          footer={
            <button
              onClick={() => setShowAllNew(true)}
              className="mt-3 @sm:mt-4 w-full font-black text-blue-700 bg-white hover:bg-blue-50 py-2.5 @sm:py-3.5 rounded-xl transition-colors text-[10px] @sm:text-sm shadow-sm cursor-pointer"
            >
              VIEW ALL NEW PAGES
            </button>
          }
        >
          <div className="dynamic-list-container flex flex-col gap-4 flex-1 overflow-hidden">
            {newPages.length === 0 ? (
              <p className="text-xs text-[#6b7280] py-3">
                No new pages created yet.
              </p>
            ) : (
              newPages.slice(0, 4).map((page, i) => (
                <Link
                  key={page.page_id}
                  href={`/wiki/${(page.metadata as any)?.category || "campus"}/${page.slug}`}
                  className={`dyn-block-${i + 1 > 1 ? i + 1 : 1} group/item bg-white/50 p-2  rounded-2xl hover:bg-white transition-colors block`}
                >
                  <h4 className="font-bold text-[#1f2937] group-hover/item:text-blue-600 transition-colors truncate text-sm @sm:text-base">
                    {page.title || "Untitled"}
                  </h4>
                  <p className="text-[10px] @sm:text-xs text-[#6b7280] mt-1 font-medium text-right">
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
          icon={<Newspaper className="h-5 w-5 text-amber-600" />}
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
              className="text-[10px] @sm:text-xs font-black text-amber-800 uppercase tracking-wider flex items-center justify-center gap-1  group/link hover:text-amber-900 cursor-pointer text-center mt-2"
            >
              MORE CAMPUS NEWS{" "}
              <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
            </button>
          }
        >
          {/* Decorative blur */}
          <div className="relative z-10 flex-1 flex items-center justify-center bg-white/30 rounded-xl border border-amber-200/50 overflow-hidden">
            {newsPages.length > 0 ? (
              <div className="dynamic-list-container w-full p-1.5 space-y-2 max-h-full overflow-hidden">
                {newsPages.slice(0, 5).map((item, index) => {
                  const Icons = [Sparkles, FlaskConical, Trophy];
                  const IconComponent = Icons[index % Icons.length];
                  return (
                    <button
                      key={`news-${item.slug || index}`}
                      type="button"
                      onClick={() => setShowAllNews(true)}

                      className={`flex flex-col @sm:flex-row items-start gap-2 @sm:gap-3 rounded-xl bg-white/60 hover:bg-white p-2.5 @sm:px-3  transition-colors w-full text-left`}
                    >
                      <div className="flex justify-between w-full">
                        <div className="w-6 h-6 @sm:w-8 @sm:h-8 rounded-lg flex items-center justify-center shrink-0 bg-amber-500/15 text-amber-600">
                          <IconComponent className="h-3 w-3" />
                        </div>
                        <span className="text-[9px] @sm:text-[10px] text-[#6b7280] mt-1 block font-semibold">
                          {getRelativeTime(item.created_at)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-[10px] @sm:text-xs font-bold text-[#1f2937] line-clamp-2 leading-snug">
                          {item.title}
                        </h4>
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
        <div className="bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] rounded-sm p-4 flex flex-col text-white shadow-lg shadow-indigo-200 h-full font-inter">
          <div className="flex justify-between items-center mb-3 @sm:mb-4 shrink-0">
            <h3 className="font-display font-bold text-lg @sm:text-xl flex items-center gap-2">
              <Calendar className="w-4 h-4 @sm:w-5 @sm:h-5 text-indigo-200" />
              Upcoming Events
            </h3>
            {upcomingEvents.length > 0 && (
              <span className="rounded-full bg-white/20 border border-white/30 px-3.5 py-1 text-[9px] font-bold uppercase tracking-wide">
                {upcomingEvents.length}{" "}
                {upcomingEvents.length === 1 ? "Event" : "Events"}
              </span>
            )}
          </div>

          <div className="flex-1 flex items-center justify-center my-2 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10 overflow-hidden">
            {upcomingEvents && upcomingEvents.length > 0 ? (
              <div className="dynamic-list-container w-full p-4 space-y-3 overflow-hidden">
                {upcomingEvents.slice(0, 3).map((event, i) => {
                  const dateObj = new Date(event.event_date);
                  const day = isNaN(dateObj.getTime())
                    ? ""
                    : dateObj.toLocaleDateString("en-US", { day: "numeric" });
                  const month = isNaN(dateObj.getTime())
                    ? ""
                    : dateObj
                        .toLocaleDateString("en-US", { month: "short" })
                        .toUpperCase();
                  return (
                    <div
                      key={event.event_id || i}
                      className={`flex justify-center items-center gap-1  items-start pb-3 border-b border-white/10 last:border-0 last:pb-0`}
                    >
                      <div className="flex flex-col items-center justify-center w-8 h-8 @sm:w-10 @sm:h-10 shrink-0 rounded-xl bg-white/15 text-white font-black">
                        <span className="text-[10px] @sm:text-xs leading-none">
                          {day}
                        </span>
                        <span className="text-[7px] @sm:text-[8px] leading-none mt-1 opacity-80">
                          {month}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-[10px] @sm:text-xs font-black leading-snug line-clamp-1">
                          {event.title}
                        </h4>
                        <p className="text-[9px] @sm:text-[10px] text-indigo-100 font-semibold line-clamp-1 flex items-center gap-1 mt-0.5">
                          <MapPinned className="w-2.5 h-2.5" /> {event.location}
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
            className="mt-3 @sm:mt-4 w-full flex items-center justify-center gap-1.5 @sm:gap-2 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 py-2.5 @sm:py-3.5 text-[10px] @sm:text-xs font-black uppercase tracking-wider shadow-md transition-colors cursor-pointer shrink-0"
          >
            <CalendarDays className="w-3.5 h-3.5 @sm:w-4 @sm:h-4" />
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
              className="mt-3 @sm:mt-4 text-[10px] @sm:text-xs font-black text-emerald-900 uppercase tracking-wider text-center hover:text-emerald-950 cursor-pointer"
            >
              VIEW ALL EDITS
            </button>
          }
        >
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-300 rounded-full blur-3xl opacity-50 pointer-events-none" />
          <div className="dynamic-list-container relative z-10 flex-1 flex flex-col gap-2 bg-white/20 p-4 rounded-2xl backdrop-blur-sm overflow-hidden">
            {updatedPages.length === 0 ? (
              <p className="text-xs text-emerald-900/70 py-2">
                No pages updated yet.
              </p>
            ) : (
              updatedPages.slice(0, 4).map((page, index) => (
                <React.Fragment key={page.page_id}>
                  <div
                    className={`dyn-flex-${index + 1 > 1 ? index + 1 : 1} flex-col @sm:flex-row justify-between items-start @sm:items-center gap-1 @sm:gap-0`}
                  >
                    <Link
                      href={`/wiki/${(page.metadata as any)?.category || "campus"}/${page.slug}`}
                      className="font-bold text-emerald-950 text-xs @sm:text-sm hover:text-emerald-800 truncate transition-colors w-full @sm:w-auto"
                    >
                      {page.title || "Untitled"}
                    </Link>
                    <p className="text-[9px] @sm:text-[10px] text-emerald-800 font-bold shrink-0">
                      {getRelativeTime(page.updated_at)}
                    </p>
                  </div>
                  {index < Math.min(updatedPages.length, 4) - 1 && (
                    <div
                      className={`dyn-block-${index + 1 > 1 ? index + 1 : 1} h-px w-full bg-emerald-700/10`}
                    />
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
        <div className="bg-linear-to-tr from-[#7dd3fc] via-[#e879f9] to-[#fde047]  p-1.5 h-full font-inter text-[#111827]">
          <div className="bg-white/95 backdrop-blur-xl w-full h-full rounded-[1.6rem] p-4 @sm:p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-display font-bold text-lg @sm:text-xl flex items-center gap-2 text-[#111827] mb-2 @sm:mb-3">
                <Dices className="w-5 h-5 @sm:w-6 @sm:h-6 text-fuchsia-500" />{" "}
                Random Page
              </h3>
              <p className="text-[10px] @sm:text-sm text-[#4b5563] font-medium leading-relaxed">
                Jump into a fresh article from the wiki and discover something
                new around campus.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRandomPage}
              className="mt-3 @sm:mt-4 w-full font-black text-white bg-gray-900 hover:bg-white hover:text-black py-2.5 @sm:py-3.5 rounded-xl transition-transform active:scale-95 text-[12px] @sm:text-sm shadow-xl shadow-gray-900/20 cursor-pointer"
            >
              Open a random page
            </button>
          </div>
        </div>
      ),
    },

    // ── 8. Pending Review (full-width horizontal banner) ────────────────────────
    {
      id: "pending-pages",
      colSpan: 2,
      content: (
        <div className="rounded-2xl p-4 @sm:p-6 flex flex-col md:flex-col   items-center justify-between border-2 border-[#f3f4f6] gap-4 @md:gap-6 h-full font-inter ">
          <div className="flex-1 text-center @md:text-left">
            <h3 className="font-display font-bold text-lg @sm:text-xl flex items-center justify-center @md:justify-start gap-2  mb-1.5 @sm:mb-2">
              <Clock className="h-4 w-4 @sm:h-5 @sm:w-5 text-[#9ca3af]" />{" "}
              Pending Review
            </h3>
            <p className="text-[#6b7280] text-[10px] @sm:text-sm font-medium">
              {pendingPages.length > 0
                ? `${pendingPages.length} page${pendingPages.length === 1 ? "" : "s"} pending your review.`
                : "No pending pages currently require your attention."}
            </p>
          </div>
          <button
            onClick={() => setShowAllPending(true)}
            className="w-auto font-black text-[#374151] bg-white hover:bg-[#f3f4f6] border border-[#e5e7eb] py-2.5 @sm:py-3.5 px-6 @sm:px-8 rounded-xl transition-all active:scale-95 text-[10px] @sm:text-sm shadow-sm whitespace-nowrap cursor-pointer"
          >
            Review Pending Changes
          </button>
        </div>
      ),
    },

    // ── 9. Quick Stats (full-width horizontal banner) ────────────────────────
    {
      id: "quick-stats",
      colSpan: 2,
      content: (
        <div className="bg-linear-to-r from-[#111827] to-[#1f2937] rounded-xl p-6 flex items-center justify-between text-white overflow-hidden relative h-full font-inter">
          <svg
            viewBox="0 0 200 100"
            className="absolute inset-0 w-full h-full opacity-10"
            preserveAspectRatio="none"
          >
            <path
              d="M0 50 Q 50 10, 100 50 T 200 50"
              fill="none"
              stroke="white"
              strokeWidth="2"
            />
            <path
              d="M0 70 Q 50 30, 100 70 T 200 70"
              fill="none"
              stroke="white"
              strokeWidth="1"
            />
          </svg>

          <div className="relative z-10 flex  @sm:flex-row gap-4 @sm:gap-8 items-center w-full justify-around">
            <div className="text-center">
              <p className="text-white font-bold text-[10px] @sm:text-xs uppercase tracking-widest mb-1">
                Total Articles
              </p>
              <p className="font-display font-black text-3xl @sm:text-4xl text-white">
                {totalPagesCount !== null
                  ? totalPagesCount.toLocaleString()
                  : "…"}
              </p>
            </div>
            <div className="w-12 h-px @sm:w-px @sm:h-12 bg-[#374151] shrink-0" />
            <div className="text-center">
              <p className="text-white font-bold text-[10px] @sm:text-xs uppercase tracking-widest mb-1">
                Categories
              </p>
              <div className="flex items-center justify-center gap-2">
                <p className="font-display font-black text-3xl @sm:text-4xl text-[#34d399]">
                  {categoriesCount}
                </p>
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
      {/* ── Dynamic Height Queries for Cards ───────────────────────────────── */}
      <style>{`
        .dynamic-list-container {
          container-type: size;
          min-height: 0;
          height: 100%;
        }
        
        /* Flex items */
        .dyn-flex-2 { display: none !important; }
        @container (min-height: 130px) { .dyn-flex-2 { display: flex !important; } }
        .dyn-flex-3 { display: none !important; }
        @container (min-height: 190px) { .dyn-flex-3 { display: flex !important; } }
        .dyn-flex-4 { display: none !important; }
        @container (min-height: 260px) { .dyn-flex-4 { display: flex !important; } }
        .dyn-flex-5 { display: none !important; }
        @container (min-height: 330px) { .dyn-flex-5 { display: flex !important; } }

        /* Block items */
        .dyn-block-2 { display: none !important; }
        @container (min-height: 130px) { .dyn-block-2 { display: block !important; } }
        .dyn-block-3 { display: none !important; }
        @container (min-height: 190px) { .dyn-block-3 { display: block !important; } }
        .dyn-block-4 { display: none !important; }
        @container (min-height: 260px) { .dyn-block-4 { display: block !important; } }
        .dyn-block-5 { display: none !important; }
        @container (min-height: 330px) { .dyn-block-5 { display: block !important; } }
      `}</style>

      {/* ── Mountain Hero Banner ───────────────────────────────────────────── */}
      <div className="relative w-full h-[85vh] lg:h-dvh min-h-125 hidden md:flex flex-col items-center justify-center text-center p-8 bg-primary overflow-hidden select-none">
        {/* Background image (unchanged) */}
        <ParallaxBackground
          imageSrc="/homepage_bg.png"
          overlayClass=""
        />

        {/* Floating Bento Badges */}
        <div className="hidden lg:flex absolute z-20 top-16 left-16 bg-white/20 backdrop-blur-xl border border-white/30 rounded-[1.5rem] p-4 items-center gap-4 animate-[bounce_6s_infinite] shadow-2xl">
          <div className="bg-linear-to-br from-fuchsia-400 to-pink-500 text-white p-3 rounded-[1rem] shadow-inner">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="text-left text-white drop-shadow-md">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-90">
              Total Edits
            </p>
            <p className="font-display font-black text-2xl">
              {totalPagesCount ?? 0}
            </p>
          </div>
        </div>

        <div className="hidden lg:flex absolute z-20 bottom-24 right-16 bg-white/20 backdrop-blur-xl border border-white/30 rounded-[1.5rem] p-4 items-center gap-4 animate-[bounce_7s_infinite_reverse] shadow-2xl">
          <div className="text-right text-white drop-shadow-md">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-90">
              Active Readers
            </p>
            <p className="font-display font-black text-2xl">
              {newPages.length ?? 0}
            </p>
          </div>
          <div className="bg-linear-to-br from-cyan-400 to-blue-500 text-white p-3 rounded-[1rem] shadow-inner">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <style>{`
          @keyframes slide-up-fade { 0% { opacity: 0; transform: translateY(120px); } 100% { opacity: 1; transform: translateY(0); } }
          .animate-hero-content { animation: slide-up-fade 3.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          @keyframes bounce-arrow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(8px); } }
          .animate-bounce-arrow { animation: bounce-arrow 2s infinite ease-in-out; }
        `}</style>

        {/* Hero Main Content */}
        <div
          className={`relative z-20 flex flex-col items-center w-full max-w-4xl ${imageLoaded ? "animate-hero-content" : "opacity-0"}`}
        >
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 text-white px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-8 shadow-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>{" "}
            The Campus Wiki
          </div>

          <h1 className="font-display font-black text-5xl sm:text-7xl md:text-8xl lg:text-[7.5rem] leading-[0.9] text-white tracking-tighter mb-8 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
            Welcome to <br />
            <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              META IITGN
            </span>
          </h1>

          <p className="text-white font-bold text-lg md:text-2xl max-w-2xl leading-relaxed drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)]">
            A collaborative space where anyone on campus can read, write, and
            edit about absolutely anything.
          </p>
        </div>

        {/* Scroll cue */}
        <div
          className="absolute z-20 bottom-20 left-1/2 -translate-x-1/2 flex items-center justify-center cursor-pointer transition-transform duration-300 hover:scale-105"
          onClick={scrollToFeed}
        >
          <div className="relative w-14 h-14 rounded-full bg-white/15 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12)] animate-bounce before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-b before:from-white/30 before:to-transparent before:opacity-50">
            <ArrowDown className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 text-white drop-shadow-md" />
          </div>
        </div>
      </div>

      {/* ── Highlights Feed ────────────────────────────────────────────────── */}
      <div
        id="right-highlights-feed"
        className="p-4 pb-28 md:p-6 lg:p-8 bg-transparent space-y-6 select-none"
      >
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
                <h4 className="text-sm font-black text-base-content">
                  Visible cards
                </h4>
                <button
                  type="button"
                  onClick={() => setShowPrefs(false)}
                  className="btn btn-ghost btn-xs"
                >
                  Done
                </button>
              </div>

              <details className="collapse  bg-base-200/50 mt-4 border border-base-200">
                <summary className="collapse-title text-sm font-semibold text-base-content/80">
                  Hide-Show Cards
                </summary>
                <div className="collapse-content pb-4">
                  {(() => {
                    const visibleGroups = CARD_GROUPS.map((group) => ({
                      ...group,
                      items: cards.filter((c) => group.ids.includes(c.id)),
                    })).filter((group) => group.items.length > 0);

                    const columns: (typeof visibleGroups)[] = [[], [], []];
                    visibleGroups.forEach((group, i) => {
                      columns[i % 3].push(group);
                    });

                    return (
                      <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-3 mt-2">
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
                </div>
              </details>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-base-200">
                {hiddenCards.size > 0 ? (
                  <button
                    type="button"
                    onClick={showAllCards}
                    className="btn btn-ghost btn-xs text-base-content/60"
                  >
                    Show all cards
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem(HOME_HIDDEN_CARDS_KEY);
                      localStorage.removeItem("meta_iitgn_home_card_order_v4");
                      setHomeCardOrder([
                        "popular-pages",
                        "new-pages",
                        "in-the-news",
                        "events",
                        "updated-pages",
                        "random-page",
                      ]);
                      window.location.reload();
                    }}
                    className="btn btn-outline btn-xs"
                  >
                    Reset Layout
                  </button>
                </div>
              </div>
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
            by{" "}
            <span className="font-extrabold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Technical Council, IITGN
            </span>
          </div>
          <div className="text-[9px] font-bold text-base-content/60 tracking-widest uppercase mt-1">
            © {new Date().getFullYear()} Technical Council
          </div>
        </div>
      </div>

      <EventsOverlay
        isOpen={showEventsManager}
        onClose={() => setShowEventsManager(false)}
      />
    </>
  );
}
