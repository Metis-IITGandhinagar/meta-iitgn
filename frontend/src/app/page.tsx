"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { parseModalParams, buildQuery } from "@/lib/modalUrl";
import {
  Search,
  Bookmark as BookmarkIcon,
  Home,
  User,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useHomeStore } from "@/store/useHomeStore";
import BottomNavbar from "@/components/BottomNavbar";
import Loading from "./loading";

// Subcomponents
import LeftPanel from "./components/home/LeftPanel";
import HomeTab from "./components/home/HomeTab";
import SearchTab from "./components/home/SearchTab";
import BookmarksTab from "./components/home/BookmarksTab";
import ProfileTab from "./components/home/ProfileTab";

import NewPagesOverlay from "./components/home/overlays/NewPagesOverlay";
import UpdatedPagesOverlay from "./components/home/overlays/UpdatedPagesOverlay";
import PendingPagesOverlay from "./components/home/overlays/PendingPagesOverlay";
import NewsOverlay from "./components/home/overlays/NewsOverlay";
import TriviaOverlay from "./components/home/overlays/TriviaOverlay";
import HistoryOverlay from "./components/home/overlays/HistoryOverlay";
import EditorsOverlay from "./components/home/overlays/EditorsOverlay";
import MessMenuOverlay from "./components/home/overlays/MessMenuOverlay";
import TransportOverlay from "./components/home/overlays/TransportOverlay";
import FeaturedEditOverlay from "./components/home/overlays/FeaturedEditOverlay";
import PortalOverlay from "./components/home/overlays/PortalOverlay";

let initialLoadDone = false;

export default function HomePage() {
  const {
    user,
    auth,
    loading: authLoading,
    totalPagesCount,
    setTotalPagesCount,
  } = useAuth();

  const {
    // Data collections
    newsPages,
    editors,
    pendingPages,
    newPages,
    updatedPages,
    triviaPages,
    historyPages,
    bookmarks,
    featuredPages,
    popularPages,
    upcomingEvents,
    messMenu,
    campusTransport,
    loading,

    // Overlays
    activeOverlay,
    setActiveOverlay,
    activePortalCategory,
    setActivePortalCategory,

    // Pagination states
    newPagesHasMore,
    updatedPagesHasMore,
    pendingPagesHasMore,

    // Active overlay items/form states
    activeTriviaItem,
    setActiveTriviaItem,
    showAddTriviaForm,
    setShowAddTriviaForm,
    newTriviaTitle,
    setNewTriviaTitle,
    newTriviaContent,
    setNewTriviaContent,
    isSubmittingTrivia,

    activeHistoryItem,
    setActiveHistoryItem,
    showAddHistoryForm,
    setShowAddHistoryForm,
    newHistoryTitle,
    setNewHistoryTitle,
    newHistoryContent,
    setNewHistoryContent,
    newHistoryVideoUrl,
    setNewHistoryVideoUrl,
    isSubmittingHistory,

    // Tab/UI state
    activeTab,
    setActiveTab,
    isScrolled,
    setIsScrolled,
    searchTabQuery,
    setSearchTabQuery,

    // Actions
    loadHomeData,
    loadMoreNewPages,
    loadMoreUpdatedPages,
    loadMorePendingPages,
    handleReview,
    handleAddTrivia,
    handleAddHistory,
    removeBookmark,
    setBookmarks,
  } = useHomeStore();

  const [sidebarOpen, setSidebarOpen] = useState(false); // Collapsed by default
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [mobileNavHidden, setMobileNavHidden] = useState(false);
  const [initialDelay, setInitialDelay] = useState(!initialLoadDone);

  useEffect(() => {
    if (initialLoadDone) return;
    const timer = setTimeout(() => {
      initialLoadDone = true;
      setInitialDelay(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Load cached home data immediately on mount (offline-first SWR)
  useEffect(() => {
    loadHomeData({ user: null, setTotalPagesCount });
  }, [loadHomeData, setTotalPagesCount]);

  const lastUserRef = useRef<string | null>("guest");
  useEffect(() => {
    if (authLoading || auth === null) return;

    const currentUserId = user ? String(user.user_id) : "guest";
    if (lastUserRef.current !== currentUserId) {
      lastUserRef.current = currentUserId;
      loadHomeData({ user, setTotalPagesCount });
    }
  }, [user, user?.user_id, auth, authLoading, loadHomeData, setTotalPagesCount]);

  useEffect(() => {
    const handleCloseOverlays = () => {
      setActiveOverlay(null);
    };
    window.addEventListener("wiki_open_settings", handleCloseOverlays);
    return () => {
      window.removeEventListener("wiki_open_settings", handleCloseOverlays);
    };
  }, [setActiveOverlay]);

  useEffect(() => {
    if (activeOverlay) {
      window.dispatchEvent(new CustomEvent("wiki_close_settings"));
    }
  }, [activeOverlay]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      return;
    }
    router.push(`/search-results?query=${encodeURIComponent(q)}`);
  };

  const spawnHearts = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    for (let i = 0; i < 8; i++) {
      const heart = document.createElement("div");
      heart.innerText = "❤️";
      heart.style.position = "fixed";
      heart.style.left = `${rect.left + rect.width / 2}px`;
      heart.style.top = `${rect.top + rect.height / 2}px`;
      heart.style.pointerEvents = "none";
      heart.style.fontSize = `${Math.random() * 12 + 12}px`;
      heart.style.zIndex = "9999";
      heart.style.transition = "all 0.8s cubic-bezier(0.25, 1, 0.5, 1)";

      const angle = Math.random() * Math.PI - Math.PI; // Upward fountain
      const velocity = Math.random() * 80 + 50;
      const x = Math.cos(angle) * velocity;
      const y = Math.sin(angle) * velocity - 30; // Extra upward float

      document.body.appendChild(heart);
      heart.getBoundingClientRect();

      heart.style.transform = `translate(${x}px, ${y}px) scale(0)`;
      heart.style.opacity = "0";

      setTimeout(() => {
        heart.remove();
      }, 800);
    }
  };

  const scrollToFeed = () => {
    const feedElement = document.getElementById("right-highlights-feed");
    if (feedElement) {
      feedElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const homeTabs = [
    {
      id: "home",
      label: "Home",
      icon: Home,
      onClick: () => setActiveTab("home"),
    },
    {
      id: "search",
      label: "Search",
      icon: Search,
      onClick: () => setActiveTab("search"),
    },
    {
      id: "bookmarks",
      label: "Bookmarks",
      icon: BookmarkIcon,
      onClick: () => setActiveTab("bookmarks"),
    },
    {
      id: "profile",
      label: "User",
      icon: User,
      onClick: () => setActiveTab("profile"),
    },
  ];
  const mobileTabs = homeTabs.filter((tab) => tab.id !== "search");

  function getRelativeTime(dateString: string) {
    if (!dateString) return "some time ago";
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  }

  useEffect(() => {
    const img = new Image();
    img.src = "/homepage_bg.png";
    img.onload = () => setImageLoaded(true);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 45,
        y: (e.clientY / window.innerHeight - 0.5) * 45,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const threshold = 8;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;

      if (currentScrollY < 10) {
        setMobileNavHidden(false);
      } else if (delta > threshold) {
        setMobileNavHidden(true);
      } else if (delta < -threshold) {
        setMobileNavHidden(false);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [activeTier, setActiveTier] = useState("gold");

  // Overlay configuration mapping
  const OVERLAYS = {
    new: {
      Component: NewPagesOverlay,
      props: {
        isOpen: activeOverlay === "new",
        onClose: () => router.back(),
        newPages,
        getRelativeTime,
        hasMore: newPagesHasMore,
        onLoadMore: loadMoreNewPages,
      },
    },
    updated: {
      Component: UpdatedPagesOverlay,
      props: {
        isOpen: activeOverlay === "updated",
        onClose: () => router.back(),
        updatedPages,
        getRelativeTime,
        hasMore: updatedPagesHasMore,
        onLoadMore: loadMoreUpdatedPages,
      },
    },
    pending: {
      Component: PendingPagesOverlay,
      props: {
        isOpen: activeOverlay === "pending",
        onClose: () => router.back(),
        pendingPages,
        getRelativeTime,
        handleReview: (pendingId: number, action: "approve" | "reject") =>
          handleReview({ pendingId, action, userId: user?.user_id || 0 }).then(
            () => loadHomeData({ user, setTotalPagesCount, forceRefresh: true })
          ),
        hasMore: pendingPagesHasMore,
        onLoadMore: loadMorePendingPages,
      },
    },
    news: {
      Component: NewsOverlay,
      props: {
        isOpen: activeOverlay === "news",
        onClose: () => router.back(),
        getRelativeTime,
      },
    },
    trivia: {
      Component: TriviaOverlay,
      props: {
        isOpen: activeOverlay === "trivia",
        onClose: () => router.back(),
        triviaPages,
        activeTriviaItem,
        setActiveTriviaItem,
        showAddTriviaForm,
        setShowAddTriviaForm,
        newTriviaTitle,
        setNewTriviaTitle,
        newTriviaContent,
        setNewTriviaContent,
        isSubmittingTrivia,
        handleAddTrivia: (e: React.FormEvent) => {
          e.preventDefault();
          handleAddTrivia({
            title: newTriviaTitle,
            content: newTriviaContent,
          }).then(() =>
            loadHomeData({ user, setTotalPagesCount, forceRefresh: true })
          );
        },
        getRelativeTime,
      },
    },
    history: {
      Component: HistoryOverlay,
      props: {
        isOpen: activeOverlay === "history",
        onClose: () => router.back(),
        historyPages,
        activeHistoryItem,
        setActiveHistoryItem,
        showAddHistoryForm,
        setShowAddHistoryForm,
        newHistoryTitle,
        setNewHistoryTitle,
        newHistoryContent,
        setNewHistoryContent,
        newHistoryVideoUrl,
        setNewHistoryVideoUrl,
        isSubmittingHistory,
        handleAddHistory: (e: React.FormEvent) => {
          e.preventDefault();
          handleAddHistory({
            title: newHistoryTitle,
            content: newHistoryContent,
            videoUrl: newHistoryVideoUrl,
          }).then(() =>
            loadHomeData({ user, setTotalPagesCount, forceRefresh: true })
          );
        },
        getRelativeTime,
      },
    },
    editors: {
      Component: EditorsOverlay,
      props: {
        isOpen: activeOverlay === "editors",
        onClose: () => router.back(),
        editors,
      },
    },
    mess: {
      Component: MessMenuOverlay,
      props: {
        isOpen: activeOverlay === "mess",
        onClose: () => router.back(),
        messMenu,
        onSaved: () => loadHomeData({ user, setTotalPagesCount, forceRefresh: true }),
      },
    },
    "featured-edit": {
      Component: FeaturedEditOverlay,
      props: {
        isOpen: activeOverlay === "featured-edit",
        onClose: () => router.back(),
      },
    },
    transport: {
      Component: TransportOverlay,
      props: {
        isOpen: activeOverlay === "transport",
        onClose: () => router.back(),
        transport: campusTransport,
      },
    },
    portal: {
      Component: PortalOverlay,
      props: {
        isOpen: activeOverlay === "portal",
        onClose: () => router.back(),
        categorySlug: activePortalCategory,
      },
    },
  };

  if (initialDelay || authLoading || auth === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen lg:h-screen bg-base-100 overflow-y-auto lg:overflow-hidden font-sans">
      {/* Main Container */}
      <div className="flex flex-col lg:flex-row flex-1 relative overflow-visible lg:overflow-hidden w-full h-auto lg:h-full">
        {/* Left panel & collapsible sidebar */}
        <LeftPanel
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeTier={activeTier}
          setActiveTier={setActiveTier}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSearchSubmit={handleSearchSubmit}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          spawnHearts={spawnHearts}
        />

        {/* Split Screen Layout */}
        <div className="flex-1 flex flex-col lg:flex-row h-auto lg:h-full w-full bg-base-100 relative min-w-full shrink-0 lg:min-w-0 lg:shrink transition-transform duration-300 ease-in-out">
          {/* Right Panel: Scrollable Hero + Highlights Feed */}
          <div
            className="flex-1 h-auto lg:h-full overflow-y-visible lg:overflow-y-auto scroll-smooth relative"
            id="right-scroll-panel"
            onScroll={(e) => {
              const threshold =
                activeTab === "home" ? (window?.innerHeight || 700) - 80 : 50;
              const scrolled = e.currentTarget.scrollTop > threshold;
              if (scrolled !== isScrolled) {
                setIsScrolled(scrolled);
              }
            }}
          >
            {/* Slim navigation bar for desktop only */}
            <div className="hidden lg:flex sticky mx-auto w-fit top-3 z-30 items-center gap-1 transition-all duration-300 px-4 py-1.5 rounded-full select-none -mb-11 bg-base-200/80 backdrop-blur-xl border border-base-300 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)]">
              {homeTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                const buttonStyle = isActive
                  ? "bg-primary text-primary-content border border-transparent shadow-xs"
                  : "text-base-content/70 hover:bg-base-300 hover:text-base-content";

                return (
                  <button
                    key={tab.id}
                    onClick={tab.onClick}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-200 cursor-pointer ${buttonStyle}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {activeTab === "home" ? (
              <HomeTab
                mousePos={mousePos}
                imageLoaded={imageLoaded}
                scrollToFeed={scrollToFeed}
                spawnHearts={spawnHearts}
                setShowAllNew={(val) => setActiveOverlay(val ? "new" : null)}
                setShowAllUpdated={(val) =>
                  setActiveOverlay(val ? "updated" : null)
                }
                setShowAllPending={(val) =>
                  setActiveOverlay(val ? "pending" : null)
                }
                newPages={newPages}
                updatedPages={updatedPages}
                pendingPages={pendingPages}
                loading={loading}
                getRelativeTime={getRelativeTime}
                newsPages={newsPages}
                setShowAllNews={(val) => setActiveOverlay(val ? "news" : null)}
                triviaPages={triviaPages}
                setShowAllTrivia={(val) =>
                  setActiveOverlay(val ? "trivia" : null)
                }
                setActiveTriviaItem={setActiveTriviaItem}
                historyPages={historyPages}
                setShowAllHistory={(val) =>
                  setActiveOverlay(val ? "history" : null)
                }
                setActiveHistoryItem={setActiveHistoryItem}
                editors={editors}
                setShowAllEditors={(val) =>
                  setActiveOverlay(val ? "editors" : null)
                }
                totalPagesCount={totalPagesCount}
                featuredPages={featuredPages}
                popularPages={popularPages}
                upcomingEvents={upcomingEvents}
                messMenu={messMenu}
                setShowMessMenu={(val) => setActiveOverlay(val ? "mess" : null)}
                setShowEditFeatured={(val) =>
                  setActiveOverlay(val ? "featured-edit" : null)
                }
                setShowTransport={(val) =>
                  setActiveOverlay(val ? "transport" : null)
                }
                campusTransport={campusTransport}
              />
            ) : activeTab === "search" ? (
              <SearchTab
                searchTabQuery={searchTabQuery}
                setSearchTabQuery={setSearchTabQuery}
                mousePos={mousePos}
              />
            ) : activeTab === "bookmarks" ? (
              <BookmarksTab
                bookmarks={bookmarks}
                setBookmarks={setBookmarks}
                removeBookmark={removeBookmark}
                setActiveTab={setActiveTab}
                mousePos={mousePos}
              />
            ) : activeTab === "profile" ? (
              <ProfileTab />
            ) : null}
          </div>
        </div>
        {/* Floating Bottom Navbar on Mobile/Tablet */}
        {!sidebarOpen && (
          <BottomNavbar
            tabs={mobileTabs}
            activeTab={activeTab}
            hidden={mobileNavHidden}
            mobileAction={{
              icon: Search,
              onClick: () => setActiveTab("search"),
              label: "Search",
              active: activeTab === "search",
            }}
            className="fixed lg:hidden bottom-6 left-1/2 transform -translate-x-1/2 lg:left-[calc(50vw+15rem)] z-9999"
          />
        )}
      </div>
      {/* Dynamic Overlays */}
      <Suspense fallback={null}>
        <HomeModalUrlSync />
      </Suspense>
      <NewPagesOverlay {...(OVERLAYS.new.props as any)} />
      <UpdatedPagesOverlay {...(OVERLAYS.updated.props as any)} />
      <PendingPagesOverlay {...(OVERLAYS.pending.props as any)} />
      <NewsOverlay {...(OVERLAYS.news.props as any)} />
      <TriviaOverlay {...(OVERLAYS.trivia.props as any)} />
      <HistoryOverlay {...(OVERLAYS.history.props as any)} />
      <EditorsOverlay {...(OVERLAYS.editors.props as any)} />
      <MessMenuOverlay {...(OVERLAYS.mess.props as any)} />
      <TransportOverlay {...(OVERLAYS.transport.props as any)} />
      <FeaturedEditOverlay {...(OVERLAYS["featured-edit"].props as any)} />
      <PortalOverlay {...(OVERLAYS.portal.props as any)} />
    </div>
  );
}

/**
 * Keeps the home overlays in sync with the URL. Rendered inside a <Suspense>
 * boundary so reading search params never triggers a full-page reload (which
 * is what caused the modal to "blink" on open/close).
 *
 * - URL -> store: deep-link opens + browser back/forward.
 * - store -> URL: pushes ONE new history entry when an overlay opens, so the
 *   browser back button closes it. A ref guards against re-pushing the same
 *   URL, and the effect only pushes on open (close is handled by router.back()).
 *   Opening an overlay also clears the settings/wmodal params so the two
 *   modal systems don't leave each other's params dangling in the address bar.
 */
function HomeModalUrlSync() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const {
    activeOverlay,
    setActiveOverlay,
    activePortalCategory,
    setActivePortalCategory,
  } = useHomeStore();

  const lastPushed = useRef<string | null>(null);
  if (lastPushed.current === null && typeof window !== "undefined") {
    lastPushed.current = window.location.search.replace(/^\?/, "");
  }

  // URL -> store
  useEffect(() => {
    const { overlay, category } = parseModalParams(searchParams);
    if ((activeOverlay ?? null) !== (overlay ?? null)) {
      setActiveOverlay(overlay as Parameters<typeof setActiveOverlay>[0]);
    }
    if ((activePortalCategory ?? null) !== (category ?? null)) {
      setActivePortalCategory(category);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // store -> URL (open only)
  useEffect(() => {
    if (!activeOverlay) {
      lastPushed.current = "";
      return;
    }
    const desired = buildQuery(window.location.search.slice(1), {
      overlay: activeOverlay,
      category: activeOverlay === "portal" ? activePortalCategory : null,
      settings: null,
      wmodal: null,
    });
    if (desired !== lastPushed.current) {
      lastPushed.current = desired;
      router.push(desired ? `/?${desired}` : "/", { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOverlay, activePortalCategory]);

  return null;
}
