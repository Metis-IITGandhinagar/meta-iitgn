import { create } from "zustand";
import { db } from "../lib/db";
import { apiService } from "../api";
import { loadCachedCollection } from "../lib/cache";

export interface HomeState {
  // Data collections
  newsPages: any[];
  editors: any[];
  pendingPages: any[];
  newPages: any[];
  updatedPages: any[];
  triviaPages: any[];
  historyPages: any[];
  bookmarks: any[];
  featuredPages: any[];
  popularPages: any[];
  upcomingEvents: any[];
  messMenu: any | null;
  campusTransport: any | null;
  loading: boolean;

  // Active overlay (new, updated, pending, news, trivia, history, editors, mess, featured-edit, transport, portal, null)
  activeOverlay: "new" | "updated" | "pending" | "news" | "trivia" | "history" | "editors" | "mess" | "featured-edit" | "transport" | "portal" | null;

  // Slug of the category shown by the "portal" overlay (opened from Quick Portals)
  activePortalCategory: string | null;

  // Pagination states
  newPageNumber: number;
  newPagesHasMore: boolean;
  updatedPageNumber: number;
  updatedPagesHasMore: boolean;
  pendingPageNumber: number;
  pendingPagesHasMore: boolean;

  // Active overlay items
  activeNewsItem: any | null;
  activeTriviaItem: any | null;
  showAddTriviaForm: boolean;
  newTriviaTitle: string;
  newTriviaContent: string;
  isSubmittingTrivia: boolean;

  activeHistoryItem: any | null;
  showAddHistoryForm: boolean;
  newHistoryTitle: string;
  newHistoryContent: string;
  newHistoryVideoUrl: string;
  isSubmittingHistory: boolean;

  // Tab & UI state
  activeTab: "home" | "search" | "bookmarks" | "profile";
  isScrolled: boolean;
  searchTabQuery: string;

  // Setters
  setNewsPages: (newsPages: any[]) => void;
  setEditors: (editors: any[]) => void;
  setPendingPages: (pendingPages: any[]) => void;
  setNewPages: (newPages: any[]) => void;
  setUpdatedPages: (updatedPages: any[]) => void;
  setTriviaPages: (triviaPages: any[]) => void;
  setHistoryPages: (historyPages: any[]) => void;
  setBookmarks: (bookmarks: any[]) => void;
  setFeaturedPages: (pages: any[]) => void;
  setPopularPages: (pages: any[]) => void;
  setUpcomingEvents: (events: any[]) => void;
  setMessMenu: (menu: any | null) => void;
  setCampusTransport: (transport: any | null) => void;
  setLoading: (loading: boolean) => void;
  setActiveOverlay: (overlay: "new" | "updated" | "pending" | "news" | "trivia" | "history" | "editors" | "mess" | "featured-edit" | "transport" | "portal" | null) => void;
  setActivePortalCategory: (slug: string | null) => void;

  setNewPageNumber: (num: number) => void;
  setNewPagesHasMore: (hasMore: boolean) => void;
  setUpdatedPageNumber: (num: number) => void;
  setUpdatedPagesHasMore: (hasMore: boolean) => void;
  setPendingPageNumber: (num: number) => void;
  setPendingPagesHasMore: (hasMore: boolean) => void;

  setActiveNewsItem: (item: any | null) => void;
  setActiveTriviaItem: (item: any | null) => void;
  setShowAddTriviaForm: (show: boolean) => void;
  setNewTriviaTitle: (title: string) => void;
  setNewTriviaContent: (content: string) => void;
  setIsSubmittingTrivia: (val: boolean) => void;

  setActiveHistoryItem: (item: any | null) => void;
  setShowAddHistoryForm: (show: boolean) => void;
  setNewHistoryTitle: (title: string) => void;
  setNewHistoryContent: (content: string) => void;
  setNewHistoryVideoUrl: (url: string) => void;
  setIsSubmittingHistory: (val: boolean) => void;

  setActiveTab: (tab: "home" | "search" | "bookmarks" | "profile") => void;
  setIsScrolled: (scrolled: boolean) => void;
  setSearchTabQuery: (query: string) => void;

  // Actions
  loadHomeData: (args: { user: any; setTotalPagesCount: (val: any) => void; forceRefresh?: boolean }) => Promise<void>;
  loadMoreNewPages: () => Promise<void>;
  loadMoreUpdatedPages: () => Promise<void>;
  loadMorePendingPages: () => Promise<void>;
  handleReview: (args: { pendingId: number; action: "approve" | "reject"; userId: number }) => Promise<void>;
  handleAddTrivia: (args: { title: string; content: string }) => Promise<void>;
  handleAddHistory: (args: { title: string; content: string; videoUrl: string }) => Promise<void>;
  removeBookmark: (id: string) => Promise<void>;
}

let activeHomeDataPromise: Promise<void> | null = null;
let activeHomeDataPromiseIsForce = false;
let activeHomeDataUserId: string | null = null;
let publicDataLoaded = false;

export const useHomeStore = create<HomeState>((set, get) => ({
  // Data collections initial state
  newsPages: [],
  editors: [],
  pendingPages: [],
  newPages: [],
  updatedPages: [],
  triviaPages: [],
  historyPages: [],
  bookmarks: [],
  featuredPages: [],
  popularPages: [],
  upcomingEvents: [],
  messMenu: null,
  campusTransport: null,
  loading: true,

  // Overlays initial state
  activeOverlay: null,
  activePortalCategory: null,

  // Pagination initial state
  newPageNumber: 1,
  newPagesHasMore: true,
  updatedPageNumber: 1,
  updatedPagesHasMore: true,
  pendingPageNumber: 1,
  pendingPagesHasMore: true,

  // Form states initial state
  activeNewsItem: null,
  activeTriviaItem: null,
  showAddTriviaForm: false,
  newTriviaTitle: "",
  newTriviaContent: "",
  isSubmittingTrivia: false,

  activeHistoryItem: null,
  showAddHistoryForm: false,
  newHistoryTitle: "",
  newHistoryContent: "",
  newHistoryVideoUrl: "",
  isSubmittingHistory: false,

  // Tabs / UI initial state
  activeTab: "home",
  isScrolled: false,
  searchTabQuery: "",

  // Setters
  setNewsPages: (newsPages) => set({ newsPages }),
  setEditors: (editors) => set({ editors }),
  setPendingPages: (pendingPages) => set({ pendingPages }),
  setNewPages: (newPages) => set({ newPages }),
  setUpdatedPages: (updatedPages) => set({ updatedPages }),
  setTriviaPages: (triviaPages) => set({ triviaPages }),
  setHistoryPages: (historyPages) => set({ historyPages }),
  setBookmarks: (bookmarks) => set({ bookmarks }),
  setFeaturedPages: (featuredPages) => set({ featuredPages }),
  setPopularPages: (popularPages) => set({ popularPages }),
  setUpcomingEvents: (upcomingEvents) => set({ upcomingEvents }),
  setMessMenu: (messMenu) => set({ messMenu }),
  setCampusTransport: (campusTransport) => set({ campusTransport }),
  setLoading: (loading) => set({ loading }),
  setActiveOverlay: (activeOverlay) => set({ activeOverlay }),
  setActivePortalCategory: (activePortalCategory) => set({ activePortalCategory }),

  setNewPageNumber: (newPageNumber) => set({ newPageNumber }),
  setNewPagesHasMore: (newPagesHasMore) => set({ newPagesHasMore }),
  setUpdatedPageNumber: (updatedPageNumber) => set({ updatedPageNumber }),
  setUpdatedPagesHasMore: (updatedPagesHasMore) => set({ updatedPagesHasMore }),
  setPendingPageNumber: (pendingPageNumber) => set({ pendingPageNumber }),
  setPendingPagesHasMore: (pendingPagesHasMore) => set({ pendingPagesHasMore }),

  setActiveNewsItem: (activeNewsItem) => set({ activeNewsItem }),
  setActiveTriviaItem: (activeTriviaItem) => set({ activeTriviaItem }),
  setShowAddTriviaForm: (showAddTriviaForm) => set({ showAddTriviaForm }),
  setNewTriviaTitle: (newTriviaTitle) => set({ newTriviaTitle }),
  setNewTriviaContent: (newTriviaContent) => set({ newTriviaContent }),
  setIsSubmittingTrivia: (isSubmittingTrivia) => set({ isSubmittingTrivia }),

  setActiveHistoryItem: (activeHistoryItem) => set({ activeHistoryItem }),
  setShowAddHistoryForm: (showAddHistoryForm) => set({ showAddHistoryForm }),
  setNewHistoryTitle: (newHistoryTitle) => set({ newHistoryTitle }),
  setNewHistoryContent: (newHistoryContent) => set({ newHistoryContent }),
  setNewHistoryVideoUrl: (newHistoryVideoUrl) => set({ newHistoryVideoUrl }),
  setIsSubmittingHistory: (isSubmittingHistory) => set({ isSubmittingHistory }),

  setActiveTab: (activeTab) => set({ activeTab }),
  setIsScrolled: (isScrolled) => set({ isScrolled }),
  setSearchTabQuery: (searchTabQuery) => set({ searchTabQuery }),

  // Actions
  loadHomeData: async ({ user, setTotalPagesCount, forceRefresh = false }) => {
    const force = forceRefresh;
    const currentUserId = user ? String(user.user_id) : "guest";

    if (activeHomeDataPromise) {
      if (activeHomeDataUserId === currentUserId) {
        if (force && !activeHomeDataPromiseIsForce) {
          await activeHomeDataPromise;
        } else {
          return activeHomeDataPromise;
        }
      }
    }

    // Helper to safely read from a Dexie table
    const safeToArray = async (table: any) => {
      try {
        return await table.toArray();
      } catch (e) {
        console.error(`Failed to read from table "${table?.name}":`, e);
        return [];
      }
    };

    // Determine if we only need to sync bookmarks (transition from guest -> user)
    const isTransitionFromGuestToUser = activeHomeDataUserId === "guest" && currentUserId !== "guest";
    const bookmarksOnly = publicDataLoaded && isTransitionFromGuestToUser && !force;

    if (bookmarksOnly) {
      activeHomeDataPromiseIsForce = false;
      activeHomeDataUserId = currentUserId;
      activeHomeDataPromise = (async () => {
        try {
          // 1. Read ONLY bookmarks and pendingpages from Dexie immediately
          const [cachedBookmarks, cachedPending] = await Promise.all([
            safeToArray(db.bookmarks),
            safeToArray(db.pendingpages),
          ]);
          set({
            bookmarks: cachedBookmarks,
            pendingPages: cachedPending.slice(0, 4),
            pendingPagesHasMore: cachedPending.length > 4,
            loading: false,
          });

          // 2. Background sync ONLY bookmarks and pendingpages
          let syncInfo: any = null;
          try {
            syncInfo = await apiService.getSyncCheck();
          } catch (err) {
            console.error("Bookmarks sync check failed:", err);
          }

          if (syncInfo) {
            const privatePromises: Promise<any>[] = [];
            if (syncInfo.bookmarks) {
              privatePromises.push(
                loadCachedCollection({
                  key: "bookmarks",
                  table: db.bookmarks,
                  serverInfo: syncInfo.bookmarks,
                  fetcher: () => apiService.getBookmarksList(),
                  onDataLoaded: (data) => {
                    set({ bookmarks: data });
                  },
                  forceRefresh: false,
                  preloadedData: cachedBookmarks,
                })
              );
            }
            if (syncInfo.pendingpages) {
              privatePromises.push(
                loadCachedCollection({
                  key: "pendingpages",
                  table: db.pendingpages,
                  serverInfo: syncInfo.pendingpages,
                  fetcher: () => apiService.getPendingDrafts(undefined, 10, 1),
                  mapper: (drafts: any[]) =>
                    drafts
                      .filter((d: any) => d.status === "in_review")
                      .map((item: any) => ({ ...item, id: String(item.pending_id) })),
                  onDataLoaded: (data) => {
                    set({
                      pendingPages: data.slice(0, 4),
                      pendingPagesHasMore: data.length > 4,
                    });
                  },
                  forceRefresh: false,
                  preloadedData: cachedPending,
                })
              );
            }
            await Promise.allSettled(privatePromises);
          }
        } catch (err) {
          console.error("Error loading user bookmarks/pending:", err);
        } finally {
          if (activeHomeDataUserId === currentUserId) {
            activeHomeDataPromise = null;
          }
        }
      })();

      return activeHomeDataPromise;
    }

    activeHomeDataPromiseIsForce = force;
    activeHomeDataUserId = currentUserId;
    activeHomeDataPromise = (async () => {
      try {
        publicDataLoaded = false; // reset flag on full sync load
        set({
          newPageNumber: 1,
          updatedPageNumber: 1,
          pendingPageNumber: 1,
        });


        // 1. Load from Dexie immediately for Stale-While-Revalidate instant render
        const [
          cachedNews,
          cachedEditors,
          cachedPending,
          cachedUpdated,
          cachedBookmarks,
          cachedFeatured,
          cachedPopular,
          cachedEvents,
          cachedMessMenu,
          cachedTransport,
        ] = await Promise.all([
          safeToArray(db.news),
          safeToArray(db.contributors),
          safeToArray(db.pendingpages),
          safeToArray(db.updatedpages),
          safeToArray(db.bookmarks),
          safeToArray(db.featured),
          safeToArray(db.popular),
          safeToArray(db.events),
          safeToArray(db.messmenu),
          safeToArray(db.transport),
        ]);
        
        

        set({
          newsPages: cachedNews.slice(0, 5),
          editors: cachedEditors,
          pendingPages: cachedPending.slice(0, 4),
          pendingPagesHasMore: cachedPending.length > 4,
          featuredPages: cachedFeatured,
          popularPages: cachedPopular,
          upcomingEvents: cachedEvents,
          messMenu: cachedMessMenu[0] || null,
          campusTransport: cachedTransport[0] || null,
        });

        const cachedNewPages = cachedUpdated.filter((p: any) => p._type === "new");
        const cachedUpdatedPages = cachedUpdated.filter((p: any) => p._type === "updated");

        set({
          newPages: cachedNewPages.slice(0, 4),
          newPagesHasMore: cachedNewPages.length > 4,
          updatedPages: cachedUpdatedPages.slice(0, 4),
          updatedPagesHasMore: cachedUpdatedPages.length > 4,
        });

        // Merge and filter trivia & history from cached pages
        const cachedMerged = [...cachedNewPages, ...cachedUpdatedPages];
        const cachedUniquePagesMap = new Map();
        for (const page of cachedMerged) {
          cachedUniquePagesMap.set(page.slug || page.page_id, page);
        }
        const cachedUniquePages = Array.from(cachedUniquePagesMap.values());

        const cachedTrivia = cachedUniquePages
          .filter((p: any) => {
            return (
              p.metadata &&
              typeof p.metadata === "object" &&
              (p.metadata as any).category?.toLowerCase() === "trivia"
            );
          })
          .sort((a: any, b: any) => {
            const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
            const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
            return dateB - dateA;
          });
        set({ triviaPages: cachedTrivia });

        const cachedHistory = cachedUniquePages
          .filter((p: any) => {
            return (
              p.metadata &&
              typeof p.metadata === "object" &&
              (p.metadata as any).category?.toLowerCase() === "history"
            );
          })
          .sort((a: any, b: any) => {
            const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
            const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
            return dateB - dateA;
          });
        set({ historyPages: cachedHistory });

        const finalBookmarks = cachedBookmarks;
        // Guests and non-authenticated users get no bookmarks
        set({ bookmarks: finalBookmarks });

        const metaInfo = await db.meta.get("updatedpages");
        if (metaInfo && typeof metaInfo.count === "number") {
          setTotalPagesCount(metaInfo.count);
        }

        // Set loading to false early if we have any cached data to show
        const hasAnyCachedData =
          cachedNews.length > 0 ||
          cachedFeatured.length > 0 ||
          cachedEvents.length > 0 ||
          cachedPopular.length > 0 ||
          cachedNewPages.length > 0 ||
          cachedUpdatedPages.length > 0;

        if (hasAnyCachedData) {
          set({ loading: false });
        }
        publicDataLoaded = true;

        // 2. Fetch or reuse sync check
        const TWELVE_HOURS = 12 * 60 * 60 * 1000;
        let syncInfo: any = null;
        let cacheValid = false;
        const cachedSyncStr = localStorage.getItem("syncCheck");
        const hasCachedData = cachedNews.length > 0 && cachedFeatured.length > 0;

        if (cachedSyncStr && !force) {
          try {
            const parsed = JSON.parse(cachedSyncStr);
            const cachedUserId = parsed.user_id;
            const currentUserId = user?.user_id || null;
            if (
              cachedUserId === currentUserId &&
              Date.now() - parsed.timestamp < TWELVE_HOURS &&
              hasCachedData
            ) {
              syncInfo = parsed.data;
              cacheValid = true;
            }
          } catch (e) {
            console.error("Failed to parse cached syncCheck:", e);
          }
        }

        if (cacheValid) {
          set({ loading: false });
          return;
        }

        try {
          syncInfo = await apiService.getSyncCheck();
          localStorage.setItem(
            "syncCheck",
            JSON.stringify({
              timestamp: Date.now(),
              user_id: user?.user_id || null,
              data: syncInfo,
            })
          );
        } catch (err) {
          console.error("Sync check failed:", err);
          if (cachedSyncStr) {
            try {
              syncInfo = JSON.parse(cachedSyncStr).data;
            } catch {
              // ignore
            }
          }
        }

        if (!syncInfo) {
          set({ loading: false });
          return;
        }

        // 3. Sync each collection using the reusable loadCachedCollection helper
        const syncPromises: Promise<any>[] = [
          loadCachedCollection({
            key: "news",
            table: db.news,
            serverInfo: syncInfo.news,
            fetcher: () => apiService.getNewsList({ page: 1, limit: 10 }),
            mapper: (res: any) =>
              res.news.map((item: any) => ({ ...item, id: String(item.page_id) })),
            onDataLoaded: (data) => {
              set({ newsPages: data.slice(0, 5) });
            },
            forceRefresh: force,
            preloadedData: cachedNews,
          }),

          loadCachedCollection({
            key: "contributors",
            table: db.contributors,
            serverInfo: syncInfo.contributors,
            fetcher: () => apiService.getUsers(),
            mapper: (data: any[]) =>
              data.map((item: any) => ({ ...item, id: String(item.user_id) })),
            onDataLoaded: (data) => {
              set({ editors: data });
            },
            forceRefresh: force,
            preloadedData: cachedEditors,
          }),

          loadCachedCollection({
            key: "updatedpages",
            table: db.updatedpages,
            serverInfo: syncInfo.updatedpages,
            fetcher: async () => {
              const [recentNew, recentUpdated] = await Promise.all([
                apiService.getRecentNewPages(5, 1),
                apiService.getRecentUpdatedPages(5, 1),
              ]);
              return { recentNew, recentUpdated };
            },
            mapper: (data: { recentNew: any[]; recentUpdated: any[] }) => [
              ...data.recentNew.map((p: any) => ({
                ...p,
                id: `new-${p.page_id}`,
                _type: "new",
              })),
              ...data.recentUpdated.map((p: any) => ({
                ...p,
                id: `updated-${p.page_id}`,
                _type: "updated",
              })),
            ],
            onDataLoaded: (data) => {
              const finalNewPages = data.filter((p: any) => p._type === "new");
              const finalUpdatedPages = data.filter((p: any) => p._type === "updated");

              set({
                newPages: finalNewPages.slice(0, 4),
                newPagesHasMore: finalNewPages.length > 4,
                updatedPages: finalUpdatedPages.slice(0, 4),
                updatedPagesHasMore: finalUpdatedPages.length > 4,
              });

              const merged = [...finalNewPages, ...finalUpdatedPages];
              const uniquePagesMap = new Map();
              for (const page of merged) {
                uniquePagesMap.set(page.slug || page.page_id, page);
              }
              const uniquePages = Array.from(uniquePagesMap.values());

              const filteredTrivia = uniquePages
                .filter((p: any) => {
                  return (
                    p.metadata &&
                    typeof p.metadata === "object" &&
                    (p.metadata as any).category?.toLowerCase() === "trivia"
                  );
                })
                .sort((a: any, b: any) => {
                  const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
                  const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
                  return dateB - dateA;
                });
              set({ triviaPages: filteredTrivia });

              const filteredHistory = uniquePages
                .filter((p: any) => {
                  return (
                    p.metadata &&
                    typeof p.metadata === "object" &&
                    (p.metadata as any).category?.toLowerCase() === "history"
                  );
                })
                .sort((a: any, b: any) => {
                  const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
                  const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
                  return dateB - dateA;
                });
              set({ historyPages: filteredHistory });
            },
            forceRefresh: force,
            preloadedData: cachedUpdated,
          }),

          loadCachedCollection({
            key: "featured",
            table: db.featured,
            serverInfo: syncInfo.featured,
            fetcher: () => apiService.getFeaturedPages(),
            mapper: (res: any) =>
              (res.data || []).map((item: any) => ({ ...item, id: String(item.featured_id) })),
            onDataLoaded: (data) => {
              set({ featuredPages: data });
            },
            forceRefresh: force,
            preloadedData: cachedFeatured,
          }),

          loadCachedCollection({
            key: "popular",
            table: db.popular,
            serverInfo: syncInfo.popular,
            fetcher: () => apiService.getPopularPages(6),
            mapper: (res: any) =>
              (res.data || []).map((item: any) => ({ ...item, id: String(item.page_id) })),
            onDataLoaded: (data) => {
              set({ popularPages: data });
            },
            forceRefresh: force,
            preloadedData: cachedPopular,
          }),

          loadCachedCollection({
            key: "events",
            table: db.events,
            serverInfo: syncInfo.events,
            fetcher: () => apiService.getEvents(6),
            mapper: (res: any) =>
              (res.data || []).map((item: any) => ({ ...item, id: String(item.event_id) })),
            onDataLoaded: (data) => {
              set({ upcomingEvents: data });
            },
            forceRefresh: force,
            preloadedData: cachedEvents,
          }),

          loadCachedCollection({
            key: "messmenu",
            table: db.messmenu,
            serverInfo: syncInfo.messmenu,
            fetcher: () => apiService.getMessMenu(),
            mapper: (res: any) =>
              res.data ? [{ ...res.data, id: "mess-menu" }] : [],
            onDataLoaded: (data) => {
              set({ messMenu: data[0] || null });
            },
            forceRefresh: force,
            preloadedData: cachedMessMenu,
          }),

          loadCachedCollection({
            key: "transport",
            table: db.transport,
            serverInfo: syncInfo.transport,
            fetcher: () => apiService.getCampusTransport(),
            mapper: (res: any) =>
              res.data ? [{ ...res.data, id: "campus-transport" }] : [],
            onDataLoaded: (data) => {
              set({ campusTransport: data[0] || null });
            },
            forceRefresh: force,
            preloadedData: cachedTransport,
          }),
        ];

        if (user) {
          syncPromises.push(
            loadCachedCollection({
              key: "pendingpages",
              table: db.pendingpages,
              serverInfo: syncInfo.pendingpages,
              fetcher: () => apiService.getPendingDrafts(undefined, 10, 1),
              mapper: (drafts: any[]) =>
                drafts
                  .filter((d: any) => d.status === "in_review")
                  .map((item: any) => ({ ...item, id: String(item.pending_id) })),
              onDataLoaded: (data) => {
                set({
                  pendingPages: data.slice(0, 4),
                  pendingPagesHasMore: data.length > 4,
                });
              },
              forceRefresh: force,
              preloadedData: cachedPending,
            })
          );
          syncPromises.push(
            loadCachedCollection({
              key: "bookmarks",
              table: db.bookmarks,
              serverInfo: syncInfo.bookmarks,
              fetcher: () => apiService.getBookmarksList(),
              onDataLoaded: (data) => {
                set({ bookmarks: data });
              },
              forceRefresh: force,
              preloadedData: cachedBookmarks,
            })
          );
        }

        await Promise.allSettled(syncPromises);

        if (syncInfo.updatedpages?.count !== undefined) {
          setTotalPagesCount(syncInfo.updatedpages.count);
        }
      } catch (err) {
        console.error("Error loading home page activity lists:", err);
      } finally {
        set({ loading: false });
        if (activeHomeDataUserId === currentUserId) {
          activeHomeDataPromise = null;
          activeHomeDataUserId = null;
        }
      }
    })();

    return activeHomeDataPromise;
  },

  loadMoreNewPages: async () => {
    const { newPageNumber, newPages } = get();
    try {
      const nextPage = newPageNumber + 1;
      const recentNew = await apiService.getRecentNewPages(4, nextPage);
      set({
        newPages: [...newPages, ...recentNew],
        newPagesHasMore: recentNew.length === 4,
        newPageNumber: nextPage,
      });
    } catch (err) {
      console.error("Error loading more new pages:", err);
    }
  },

  loadMoreUpdatedPages: async () => {
    const { updatedPageNumber, updatedPages } = get();
    try {
      const nextPage = updatedPageNumber + 1;
      const recentUpdated = await apiService.getRecentUpdatedPages(4, nextPage);
      set({
        updatedPages: [...updatedPages, ...recentUpdated],
        updatedPagesHasMore: recentUpdated.length === 4,
        updatedPageNumber: nextPage,
      });
    } catch (err) {
      console.error("Error loading more updated pages:", err);
    }
  },

  loadMorePendingPages: async () => {
    const { pendingPageNumber, pendingPages } = get();
    try {
      const nextPage = pendingPageNumber + 1;
      const pending = await apiService.getPendingDrafts(undefined, 4, nextPage);
      const filtered = pending.filter((d: any) => d.status === "in_review");
      set({
        pendingPages: [...pendingPages, ...filtered],
        pendingPagesHasMore: filtered.length === 4,
        pendingPageNumber: nextPage,
      });
    } catch (err) {
      console.error("Error loading more pending pages:", err);
    }
  },

  handleReview: async ({ pendingId, action, userId }) => {
    try {
      await apiService.reviewDraft(pendingId, {
        reviewer_id: userId,
        action: action,
        rejection_reason:
          action === "reject" ? "Rejected by reviewer/moderator." : undefined,
      });
      alert(
        `Draft ${action === "approve" ? "approved and published" : "rejected"} successfully!`
      );
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message || "Failed to process review"}`);
      throw err;
    }
  },

  handleAddTrivia: async ({ title, content }) => {
    set({ isSubmittingTrivia: true });
    try {
      const slug =
        "trivia-" +
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
      const payload = {
        page_id: null,
        title: title,
        content: `---
image: https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600
imageAlt: Trivia Article
rows:
  - label: Category
    value: Trivia
    type: text
---

# ${title}

${content}`,
        metadata: { category: "trivia", slug },
        editor_id: 0,
        base_version: null,
      };

      await apiService.submitDraft(payload);
      alert("Trivia page submitted for review!");
      set({
        newTriviaTitle: "",
        newTriviaContent: "",
        showAddTriviaForm: false,
      });
    } catch (err: any) {
      console.error(err);
      alert(`Error submitting trivia: ${err.message || "Failed to submit"}`);
      throw err;
    } finally {
      set({ isSubmittingTrivia: false });
    }
  },

  handleAddHistory: async ({ title, content, videoUrl }) => {
    set({ isSubmittingHistory: true });
    try {
      const slug =
        "history-" +
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
      const payload = {
        page_id: null,
        title: title,
        content: `---
image: https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600
imageAlt: History Article
rows:
  - label: Category
    value: History
    type: text
---

# ${title}

${content}`,
        metadata: { category: "history", slug },
        video_url: videoUrl.trim() || null,
        editor_id: 0,
        base_version: null,
      };

      await apiService.submitDraft(payload);
      alert("History page submitted for review!");
      set({
        newHistoryTitle: "",
        newHistoryContent: "",
        newHistoryVideoUrl: "",
        showAddHistoryForm: false,
      });
    } catch (err: any) {
      console.error(err);
      alert(`Error submitting history: ${err.message || "Failed to submit"}`);
      throw err;
    } finally {
      set({ isSubmittingHistory: false });
    }
  },

  removeBookmark: async (id) => {
    const { bookmarks } = get();
    try {
      const bObj = bookmarks.find((b) => b.id === id);
      await db.bookmarks.delete(id);

      const toDeleteId = bObj?.bookmark_id || Number(id);
      if (toDeleteId && !isNaN(toDeleteId)) {
        await apiService.removeBookmark(toDeleteId).catch((err) => {
          console.error("Failed to delete bookmark on server:", err);
        });
      }
      set({ bookmarks: bookmarks.filter((b) => b.id !== id) });
    } catch (err) {
      console.error(err);
    }
  },
}));
