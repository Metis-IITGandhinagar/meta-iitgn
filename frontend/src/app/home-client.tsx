"use client";

import { useState, useEffect, useRef, Suspense, memo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { parseModalParams, buildQuery } from "@/lib/modalUrl";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useHomeStore } from "@/store/useHomeStore";

// Subcomponents
import SearchTab from "@/components/home/SearchTab";
import BookmarksTab from "@/components/home/BookmarksTab";
import ProfileTab from "@/components/home/ProfileTab";
import HomePageNew from "@/components/home_new/HomePageNew";

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
import EventsOverlay from "@/components/overlays/EventsOverlay";

// Memoized Components to Prevent Unnecessary Renders
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

export default function HomeClient() {
  const {
    user,
    auth,
    loading: authLoading,
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
    popularPages,
    upcomingEvents,

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

  const [showEventsManager, setShowEventsManager] = useState(false);
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

  // Load cached home data immediately on mount (offline-first SWR)
  useEffect(() => {
    loadHomeData({ user: null, setTotalPagesCount });
  }, [loadHomeData, setTotalPagesCount]);

  // Guests land on the welcome page; signed-in users get the wiki home.
  useEffect(() => {
    if (!authLoading && auth === false && !user) router.replace("/welcome");
  }, [authLoading, auth, user, router]);

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

  const handleRandomPage = useCallback(() => {
    try {
      const candidates = [...(newPages || []), ...(updatedPages || [])].filter(Boolean);
      if (candidates.length > 0) {
        const randomItem = candidates[Math.floor(Math.random() * candidates.length)];
        const cat = (randomItem.metadata as any)?.category || "campus";
        router.push(`/wiki/${cat}/${randomItem.slug}`);
        return;
      }
      if (popularPages && popularPages.length > 0) {
        const randomPop = popularPages[Math.floor(Math.random() * popularPages.length)];
        const cat = (randomPop.metadata as any)?.category || "campus";
        router.push(`/wiki/${cat}/${randomPop.slug}`);
        return;
      }
      router.push("/wiki/page/campuses-and-surroundings");
    } catch {
      router.push("/wiki/page/campuses-and-surroundings");
    }
  }, [newPages, updatedPages, popularPages, router]);

  if (authLoading || auth === null) return null;

  if (!authLoading && auth === false && !user) return null;

  return (
    <>
      <HomePageNew
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        newPages={newPages}
        updatedPages={updatedPages}
        pendingPages={pendingPages}
        newsPages={newsPages}
        popularPages={popularPages}
        upcomingEvents={upcomingEvents}
        getRelativeTime={getRelativeTime}
        onOpenPortal={(slug) => {
          setActivePortalCategory(slug);
          setActiveOverlay("portal");
        }}
        onOpenAllCategories={() => setActiveOverlay("categories")}
        onOpenNewPages={() => setActiveOverlay("new")}
        onOpenUpdatedPages={() => setActiveOverlay("updated")}
        onOpenPendingPages={() => setActiveOverlay("pending")}
        onOpenEvents={() => setShowEventsManager(true)}
        onOpenNews={() => setActiveOverlay("news")}
        onRandomPage={handleRandomPage}
        searchComponent={
          <SearchTabMemo
            searchTabQuery={searchTabQuery}
            setSearchTabQuery={setSearchTabQuery}
          />
        }
        bookmarksComponent={
          <BookmarksTabMemo
            bookmarks={bookmarks}
            setBookmarks={setBookmarks}
            removeBookmark={removeBookmark}
            setActiveTab={setActiveTab}
          />
        }
        profileComponent={<ProfileTabMemo />}
      />

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

      <EventsOverlay
        isOpen={showEventsManager}
        onClose={() => setShowEventsManager(false)}
      />
    </>
  );
}

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
