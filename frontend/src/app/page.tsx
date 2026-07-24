"use client";

import { useState, useEffect, useRef, Suspense, memo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { parseModalParams, buildQuery } from "@/lib/modalUrl";
import {
  Search,
  Bookmark as BookmarkIcon,
  Home,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useHomeStore } from "@/store/useHomeStore";
import BottomNavbar from "@/components/navs/BottomNavbar";
import AvatarIcon from "@/components/helpers/AvatarIcon";

// Subcomponents
import LeftPanel from "@/components/home/LeftPanel";
import HomeTab from "@/components/home/HomeTab";
import SearchTab from "@/components/home/SearchTab";
import BookmarksTab from "@/components/home/BookmarksTab";
import ProfileTab from "@/components/home/ProfileTab";

// Overlays
import NewPagesOverlay from "@/components/overlays/NewPagesOverlay";
import UpdatedPagesOverlay from "@/components/overlays/UpdatedPagesOverlay";
import PendingPagesOverlay from "@/components/overlays/PendingPagesOverlay";
import NewsOverlay from "@/components/overlays/NewsOverlay";
import TriviaOverlay from "@/components/overlays/TriviaOverlay";
import HistoryOverlay from "@/components/overlays/HistoryOverlay";
import FeaturedEditOverlay from "@/components/overlays/FeaturedEditOverlay";
import PortalOverlay from "@/components/overlays/PortalOverlay";
import CategoriesOverlay from "@/components/overlays/CategoriesOverlay";

// Memoized Components to Prevent Unnecessary Renders
const LeftPanelMemo = memo(LeftPanel);
const HomeTabMemo = memo(HomeTab);
const SearchTabMemo = memo(SearchTab);
const BookmarksTabMemo = memo(BookmarksTab);
const ProfileTabMemo = memo(ProfileTab);

const NewPagesOverlayMemo = memo(NewPagesOverlay);
const UpdatedPagesOverlayMemo = memo(UpdatedPagesOverlay);
const PendingPagesOverlayMemo = memo(PendingPagesOverlay);
const NewsOverlayMemo = memo(NewsOverlay);
const TriviaOverlayMemo = memo(TriviaOverlay);
const HistoryOverlayMemo = memo(HistoryOverlay);
const FeaturedEditOverlayMemo = memo(FeaturedEditOverlay);
const PortalOverlayMemo = memo(PortalOverlay);
const CategoriesOverlayMemo = memo(CategoriesOverlay);

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
    pendingPages,
    newPages,
    updatedPages,
    triviaPages,
    historyPages,
    bookmarks,
    featuredPages,
    popularPages,
    upcomingEvents,
    loading,

    // Overlays
    activeOverlay,
    setActiveOverlay,
    activePortalCategory,

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

  // Title reflects the active home tab; the "home" tab shows the bare site name.
  useDocumentTitle(
    activeTab === "search"
      ? "Search"
      : activeTab === "bookmarks"
        ? "Bookmarks"
        : activeTab === "profile"
          ? "Profile"
          : undefined
  );

  const [imageLoaded, setImageLoaded] = useState(false);
  const [mobileNavHidden, setMobileNavHidden] = useState(false);

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

  // When the user clears the offline cache from Settings, re-fetch everything
  // so the freshly emptied data re-downloads immediately.
  useEffect(() => {
    const handleCacheCleared = () => {
      loadHomeData({ user, setTotalPagesCount, forceRefresh: true });
    };
    window.addEventListener("wiki_cache_cleared", handleCacheCleared);
    return () => {
      window.removeEventListener("wiki_cache_cleared", handleCacheCleared);
    };
  }, [loadHomeData, setTotalPagesCount, user]);

  useEffect(() => {
    if (activeOverlay) {
      window.dispatchEvent(new CustomEvent("wiki_close_settings"));
    }
  }, [activeOverlay]);

  // Stable event handlers
  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/search-results?query=${encodeURIComponent(q)}`);
  }, [searchQuery, router]);

  const spawnHearts = useCallback((e: React.MouseEvent) => {
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
  }, []);

  const scrollToFeed = useCallback(() => {
    const feedElement = document.getElementById("right-highlights-feed");
    if (feedElement) {
      feedElement.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

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
      label: "Profile",
      icon: AvatarIcon,
      onClick: () => setActiveTab("profile"),
    },
  ];
  const mobileTabs = homeTabs.filter((tab) => tab.id !== "search");

  const getRelativeTime = useCallback((dateString: string) => {
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
  }, []);

  useEffect(() => {
    const img = new Image();
    img.src = "/homepage_bg.png";
    img.onload = () => setImageLoaded(true);
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

  // Stable overlay handlers to preserve child memoization
  const handleCloseOverlay = useCallback(() => {
    router.back();
  }, [router]);

  const handleReviewCallback = useCallback((pendingId: number, action: "approve" | "reject") => {
    return handleReview({ pendingId, action, userId: user?.user_id || 0 }).then(
      () => loadHomeData({ user, setTotalPagesCount, forceRefresh: true })
    );
  }, [handleReview, user, setTotalPagesCount, loadHomeData]);

  const handleAddTriviaCallback = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    await handleAddTrivia({
      title: newTriviaTitle,
      content: newTriviaContent,
    });
    await loadHomeData({ user, setTotalPagesCount, forceRefresh: true });
  }, [handleAddTrivia, newTriviaTitle, newTriviaContent, user, setTotalPagesCount, loadHomeData]);

  const handleAddHistoryCallback = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    await handleAddHistory({
      title: newHistoryTitle,
      content: newHistoryContent,
      videoUrl: newHistoryVideoUrl,
    });
    await loadHomeData({ user, setTotalPagesCount, forceRefresh: true });
  }, [handleAddHistory, newHistoryTitle, newHistoryContent, newHistoryVideoUrl, user, setTotalPagesCount, loadHomeData]);

  const setShowAllNew = useCallback((val: boolean) => setActiveOverlay(val ? "new" : null), [setActiveOverlay]);
  const setShowAllUpdated = useCallback((val: boolean) => setActiveOverlay(val ? "updated" : null), [setActiveOverlay]);
  const setShowAllPending = useCallback((val: boolean) => setActiveOverlay(val ? "pending" : null), [setActiveOverlay]);
  const setShowAllNews = useCallback((val: boolean) => setActiveOverlay(val ? "news" : null), [setActiveOverlay]);
  const setShowAllTrivia = useCallback((val: boolean) => setActiveOverlay(val ? "trivia" : null), [setActiveOverlay]);
  const setShowAllHistory = useCallback((val: boolean) => setActiveOverlay(val ? "history" : null), [setActiveOverlay]);
  const setShowEditFeatured = useCallback((val: boolean) => setActiveOverlay(val ? "featured-edit" : null), [setActiveOverlay]);

  if (authLoading || auth === null) return null;

  return (
    <div className="flex flex-col min-h-screen lg:h-screen bg-base-100 overflow-y-auto lg:overflow-hidden font-sans">
      {/* Main Container */}
      <div className="flex flex-col lg:flex-row flex-1 relative overflow-visible lg:overflow-hidden w-full h-auto lg:h-full">
        {/* Left panel & collapsible sidebar */}
        <LeftPanelMemo
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
                const isProfile = tab.id === "profile";

                const buttonStyle = isActive
                  ? "bg-primary text-primary-content border border-transparent shadow-xs"
                  : "text-base-content/70 hover:bg-base-300 hover:text-base-content";

                return (
                  <button
                    key={tab.id}
                    onClick={tab.onClick}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-200 cursor-pointer ${buttonStyle}`}
                  >
                    <Icon className={isProfile ? "h-5 w-5" : "h-3.5 w-3.5"} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {activeTab === "home" ? (
              <HomeTabMemo
                imageLoaded={imageLoaded}
                scrollToFeed={scrollToFeed}
                spawnHearts={spawnHearts}
                setShowAllNew={setShowAllNew}
                setShowAllUpdated={setShowAllUpdated}
                setShowAllPending={setShowAllPending}
                newPages={newPages}
                updatedPages={updatedPages}
                pendingPages={pendingPages}
                loading={loading}
                getRelativeTime={getRelativeTime}
                newsPages={newsPages}
                setShowAllNews={setShowAllNews}
                triviaPages={triviaPages}
                setShowAllTrivia={setShowAllTrivia}
                setActiveTriviaItem={setActiveTriviaItem}
                historyPages={historyPages}
                setShowAllHistory={setShowAllHistory}
                setActiveHistoryItem={setActiveHistoryItem}
                totalPagesCount={totalPagesCount}
                featuredPages={featuredPages}
                popularPages={popularPages}
                upcomingEvents={upcomingEvents}
                setShowEditFeatured={setShowEditFeatured}
              />
            ) : activeTab === "search" ? (
              <SearchTabMemo
                searchTabQuery={searchTabQuery}
                setSearchTabQuery={setSearchTabQuery}
              />
            ) : activeTab === "bookmarks" ? (
              <BookmarksTabMemo
                bookmarks={bookmarks}
                setBookmarks={setBookmarks}
                removeBookmark={removeBookmark}
                setActiveTab={setActiveTab}
              />
            ) : activeTab === "profile" ? (
              <ProfileTabMemo />
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

      <NewPagesOverlayMemo
        isOpen={activeOverlay === "new"}
        onClose={handleCloseOverlay}
        newPages={newPages}
        getRelativeTime={getRelativeTime}
        hasMore={newPagesHasMore}
        onLoadMore={loadMoreNewPages}
      />

      <UpdatedPagesOverlayMemo
        isOpen={activeOverlay === "updated"}
        onClose={handleCloseOverlay}
        updatedPages={updatedPages}
        getRelativeTime={getRelativeTime}
        hasMore={updatedPagesHasMore}
        onLoadMore={loadMoreUpdatedPages}
      />

      <PendingPagesOverlayMemo
        isOpen={activeOverlay === "pending"}
        onClose={handleCloseOverlay}
        pendingPages={pendingPages}
        getRelativeTime={getRelativeTime}
        handleReview={handleReviewCallback}
        hasMore={pendingPagesHasMore}
        onLoadMore={loadMorePendingPages}
      />

      <NewsOverlayMemo
        isOpen={activeOverlay === "news"}
        onClose={handleCloseOverlay}
        getRelativeTime={getRelativeTime}
      />

      <TriviaOverlayMemo
        isOpen={activeOverlay === "trivia"}
        onClose={handleCloseOverlay}
        triviaPages={triviaPages}
        activeTriviaItem={activeTriviaItem}
        setActiveTriviaItem={setActiveTriviaItem}
        showAddTriviaForm={showAddTriviaForm}
        setShowAddTriviaForm={setShowAddTriviaForm}
        newTriviaTitle={newTriviaTitle}
        setNewTriviaTitle={setNewTriviaTitle}
        newTriviaContent={newTriviaContent}
        setNewTriviaContent={setNewTriviaContent}
        isSubmittingTrivia={isSubmittingTrivia}
        handleAddTrivia={handleAddTriviaCallback}
        getRelativeTime={getRelativeTime}
      />

      <HistoryOverlayMemo
        isOpen={activeOverlay === "history"}
        onClose={handleCloseOverlay}
        historyPages={historyPages}
        activeHistoryItem={activeHistoryItem}
        setActiveHistoryItem={setActiveHistoryItem}
        showAddHistoryForm={showAddHistoryForm}
        setShowAddHistoryForm={setShowAddHistoryForm}
        newHistoryTitle={newHistoryTitle}
        setNewHistoryTitle={setNewHistoryTitle}
        newHistoryContent={newHistoryContent}
        setNewHistoryContent={setNewHistoryContent}
        newHistoryVideoUrl={newHistoryVideoUrl}
        setNewHistoryVideoUrl={setNewHistoryVideoUrl}
        isSubmittingHistory={isSubmittingHistory}
        handleAddHistory={handleAddHistoryCallback}
        getRelativeTime={getRelativeTime}
      />

      <FeaturedEditOverlayMemo
        isOpen={activeOverlay === "featured-edit"}
        onClose={handleCloseOverlay}
      />

      <PortalOverlayMemo
        isOpen={activeOverlay === "portal"}
        onClose={handleCloseOverlay}
        categorySlug={activePortalCategory}
      />

      <CategoriesOverlayMemo
        isOpen={activeOverlay === "categories"}
        onClose={handleCloseOverlay}
      />
    </div>
  );
}

/**
 * Keeps the home overlays in sync with the URL. Rendered inside a <Suspense>
 * boundary so reading search params never triggers a full-page reload.
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
