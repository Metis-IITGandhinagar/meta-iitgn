import { create } from "zustand";
import { db } from "../lib/db";
import {
  getInterviews,
  getFeaturedInterviews,
  getUserInterviewStats,
  getFeedSyncCheck,
  InterviewPost,
  InterviewUserStats,
  FeedSyncCheckData
} from "../api/interviews";

// ---------------------------------------------------------------------------
// Helpers for Seeded Random & Shuffling
// ---------------------------------------------------------------------------

function seedRandom(seedStr: string) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function deterministicShuffle<T>(array: T[], seed: string): T[] {
  const result = [...array];
  const rng = seedRandom(seed);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function getFeedPageKey(tag: string, search: string, page: number): string {
  const normalizedTag = (tag || "all").toLowerCase().trim();
  const normalizedSearch = (search || "").toLowerCase().trim();
  return `feed:${normalizedTag}:${normalizedSearch ? normalizedSearch + ":" : ""}page${page}`;
}

// ---------------------------------------------------------------------------
// Store Interface
// ---------------------------------------------------------------------------

export interface FeedState {
  // State variables
  selectedTag: string;
  searchQuery: string;
  pages: Record<string, {
    posts: InterviewPost[];
    cursor?: number;
    hasMore: boolean;
    cachedAt: number;
    filter: string;
    search: string;
    version: string;
  } | undefined>;
  loadingFeed: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  syncVersion: string | null;
  currentPage: number;
  posts: InterviewPost[]; // Chronologically loaded, then smart shuffled

  featuredPosts: InterviewPost[];
  loadingFeatured: boolean;
  stats: InterviewUserStats | null;
  loadingStats: boolean;

  // Actions
  setSelectedTag: (tag: string) => Promise<void>;
  setSearchQuery: (search: string) => Promise<void>;
  loadFeed: (forceRefresh?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  loadFeatured: (forceRefresh?: boolean) => Promise<void>;
  loadUserStats: (forceRefresh?: boolean) => Promise<void>;
  markAsRead: (postId: number) => Promise<void>;
  applyFeedShuffle: (chronoPosts: InterviewPost[]) => Promise<InterviewPost[]>;
  updatePostLikes: (postId: number, isLiked: boolean, likesCount: number) => Promise<void>;
  clearLocalCache: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Zustand Store Implementation
// ---------------------------------------------------------------------------

export const useFeedStore = create<FeedState>((set, get) => ({
  // Initial state
  selectedTag: "All",
  searchQuery: "",
  pages: {},
  loadingFeed: false,
  loadingMore: false,
  hasMore: true,
  syncVersion: null,
  currentPage: 1,
  posts: [],

  featuredPosts: [],
  loadingFeatured: false,
  stats: null,
  loadingStats: false,

  // Set selected tag and reload feed
  setSelectedTag: async (tag: string) => {
    if (get().selectedTag === tag) return;
    set({ selectedTag: tag, currentPage: 1, posts: [], hasMore: true });
    await get().loadFeed();
  },

  // Set search query and reload feed
  setSearchQuery: async (search: string) => {
    if (get().searchQuery === search) return;
    set({ searchQuery: search, currentPage: 1, posts: [], hasMore: true });
    await get().loadFeed();
  },

  // Mark a post as read in Dexie
  markAsRead: async (postId: number) => {
    try {
      const alreadyRead = await db.read_posts.get(postId);
      if (!alreadyRead) {
        await db.read_posts.put({ postId, viewedAt: Date.now() });
        // After marking as read, apply feed shuffle to reorder visible posts (excluding top 6)
        const currentPosts = get().posts;
        if (currentPosts.length > 6) {
          const shuffled = await get().applyFeedShuffle(currentPosts);
          set({ posts: shuffled });
        }
      }
    } catch (e) {
      console.error("Failed to mark post as read:", e);
    }
  },

  // Apply deterministic daily smart shuffle to read posts (excluding top 6 newest posts)
  applyFeedShuffle: async (chronoPosts: InterviewPost[]): Promise<InterviewPost[]> => {
    if (chronoPosts.length <= 6) return chronoPosts;

    try {
      const readPostRecords = await db.read_posts.toArray();
      const readPostIds = new Set(readPostRecords.map((r) => r.postId));

      const topN = chronoPosts.slice(0, 6);
      const remaining = chronoPosts.slice(6);

      const unread: InterviewPost[] = [];
      const read: InterviewPost[] = [];

      for (const post of remaining) {
        if (readPostIds.has(post.post_id)) {
          read.push(post);
        } else {
          unread.push(post);
        }
      }

      // Daily seed e.g. "2026-07-22"
      const todaySeed = new Date().toISOString().split("T")[0];
      const shuffledRead = deterministicShuffle(read, todaySeed);

      return [...topN, ...unread, ...shuffledRead];
    } catch (e) {
      console.error("Error applying smart shuffle:", e);
      return chronoPosts;
    }
  },

  // Main Feed Load/Refresh Orchestration
  loadFeed: async (forceRefresh = false) => {
    const { selectedTag, searchQuery } = get();
    set({ loadingFeed: true });

    try {
      // 1. Fetch Sync Check or read from cache (5 mins sync check TTL)
      let serverMeta: FeedSyncCheckData | null = null;
      let shouldFetchSync = true;

      try {
        const cachedSync = await db.meta.get("last_sync_check");
        if (cachedSync && Date.now() - cachedSync.cachedAt < 5 * 60 * 1000) {
          serverMeta = cachedSync.data;
          shouldFetchSync = false;
        }
      } catch (err) {
        console.error("Failed to read last_sync_check from Dexie:", err);
      }

      if (shouldFetchSync || forceRefresh) {
        try {
          const syncRes = await getFeedSyncCheck();
          if (syncRes && syncRes.success) {
            const data = syncRes.data || syncRes;
            serverMeta = {
              version: data.version,
              latestPostId: data.latestPostId,
              totalPosts: data.totalPosts,
              updatedAt: data.updatedAt
            };
            await db.meta.put({
              key: "last_sync_check",
              cachedAt: Date.now(),
              data: serverMeta
            });
          }
        } catch (err) {
          console.error("Failed to call sync check API:", err);
        }
      }

      const currentVersion = serverMeta?.version || String(Date.now());
      set({ syncVersion: currentVersion });

      // 2. Resolve Page 1 Key
      const page1Key = getFeedPageKey(selectedTag, searchQuery, 1);
      let page1Data = get().pages[page1Key];

      // 3. Flow: Check Zustand -> Check Dexie -> Call API
      let loadedFromCache = false;

      if (!page1Data) {
        try {
          const cachedPage = await db.feed_pages.get(page1Key);
          if (cachedPage) {
            const isSearch = !!searchQuery;
            const ttl = isSearch ? 10 * 60 * 1000 : 24 * 60 * 60 * 1000;
            const isExpired = Date.now() - cachedPage.cachedAt > ttl;

            // Page 1 is valid if not expired AND matches sync-check version
            if (!isExpired && cachedPage.version === currentVersion && !forceRefresh) {
              page1Data = cachedPage;
              loadedFromCache = true;
            }
          }
        } catch (err) {
          console.error("Failed to get Page 1 from Dexie:", err);
        }
      } else {
        // If loaded in Zustand, verify it matches version and is not expired
        const isSearch = !!searchQuery;
        const ttl = isSearch ? 10 * 60 * 1000 : 24 * 60 * 60 * 1000;
        const isExpired = Date.now() - page1Data.cachedAt > ttl;
        if (!isExpired && page1Data.version === currentVersion && !forceRefresh) {
          loadedFromCache = true;
        }
      }

      if (loadedFromCache && page1Data) {
        // Use Cached Page 1
        const shuffledPosts = await get().applyFeedShuffle(page1Data.posts);
        set((state) => ({
          pages: { ...state.pages, [page1Key]: page1Data },
          posts: shuffledPosts,
          hasMore: page1Data.hasMore,
          currentPage: 1,
          loadingFeed: false
        }));
        return;
      }

      // Otherwise: Call API to download only Page 1
      const apiRes = await getInterviews({
        page: 1,
        limit: 12,
        tag: selectedTag !== "All" ? selectedTag : undefined,
        search: searchQuery || undefined
      });

      if (apiRes && apiRes.success) {
        const posts = apiRes.posts || [];
        const hasMore = apiRes.hasMore;
        const cursor = apiRes.cursor;

        const newPage1 = {
          posts,
          cursor,
          hasMore,
          cachedAt: Date.now(),
          filter: selectedTag,
          search: searchQuery,
          version: currentVersion
        };

        // Cache Page 1 to Dexie
        try {
          await db.feed_pages.put({
            key: page1Key,
            ...newPage1
          });
        } catch (err) {
          console.error("Failed to cache Page 1 to Dexie:", err);
        }

        const shuffledPosts = await get().applyFeedShuffle(posts);
        set((state) => ({
          pages: { ...state.pages, [page1Key]: newPage1 },
          posts: shuffledPosts,
          hasMore,
          currentPage: 1,
          loadingFeed: false
        }));
      }
    } catch (err) {
      console.error("Error in loadFeed store action:", err);
      set({ loadingFeed: false });
    }
  },

  // Infinite Scroll Page Loading (Cursor-based)
  loadMore: async () => {
    const { currentPage, hasMore, loadingMore, loadingFeed, selectedTag, searchQuery, pages, syncVersion } = get();
    if (loadingMore || !hasMore || loadingFeed) return;

    set({ loadingMore: true });
    const nextPageNum = currentPage + 1;
    const nextPageKey = getFeedPageKey(selectedTag, searchQuery, nextPageNum);

    try {
      const currentVersion = syncVersion || String(Date.now());
      let nextPageData = pages[nextPageKey];

      // Check Dexie first
      let loadedFromCache = false;
      if (!nextPageData) {
        try {
          const cachedPage = await db.feed_pages.get(nextPageKey);
          if (cachedPage) {
            const isSearch = !!searchQuery;
            const ttl = isSearch ? 10 * 60 * 1000 : 24 * 60 * 60 * 1000;
            const isExpired = Date.now() - cachedPage.cachedAt > ttl;

            // Keep Page 2+ even if version changed (they rarely change), only reject if expired
            if (!isExpired) {
              nextPageData = cachedPage;
              loadedFromCache = true;
            }
          }
        } catch (err) {
          console.error("Failed to read next page from Dexie:", err);
        }
      } else {
        loadedFromCache = true;
      }

      if (loadedFromCache && nextPageData) {
        // Use Cached Page
        const allChronoPosts = [...get().posts, ...nextPageData.posts];
        // Remove duplicates if any
        const uniquePosts = allChronoPosts.filter(
          (post, index, self) => self.findIndex((p) => p.post_id === post.post_id) === index
        );
        const shuffled = await get().applyFeedShuffle(uniquePosts);

        set((state) => ({
          pages: { ...state.pages, [nextPageKey]: nextPageData },
          posts: shuffled,
          hasMore: nextPageData.hasMore,
          currentPage: nextPageNum,
          loadingMore: false
        }));
        return;
      }

      // Fetch next page from API using the last page's cursor
      const prevPageKey = getFeedPageKey(selectedTag, searchQuery, currentPage);
      const prevPage = pages[prevPageKey];
      const cursor = prevPage?.cursor;

      const apiRes = await getInterviews({
        page: nextPageNum,
        limit: 6,
        tag: selectedTag !== "All" ? selectedTag : undefined,
        search: searchQuery || undefined,
        cursor: cursor
      });

      if (apiRes && apiRes.success) {
        const posts = apiRes.posts || [];
        const nextHasMore = apiRes.hasMore;
        const nextCursor = apiRes.cursor;

        const newPageData = {
          posts,
          cursor: nextCursor,
          hasMore: nextHasMore,
          cachedAt: Date.now(),
          filter: selectedTag,
          search: searchQuery,
          version: currentVersion
        };

        // Cache to Dexie
        try {
          await db.feed_pages.put({
            key: nextPageKey,
            ...newPageData
          });
        } catch (err) {
          console.error("Failed to cache next page to Dexie:", err);
        }

        const allChronoPosts = [...get().posts, ...posts];
        const uniquePosts = allChronoPosts.filter(
          (post, index, self) => self.findIndex((p) => p.post_id === post.post_id) === index
        );
        const shuffled = await get().applyFeedShuffle(uniquePosts);

        set((state) => ({
          pages: { ...state.pages, [nextPageKey]: newPageData },
          posts: shuffled,
          hasMore: nextHasMore,
          currentPage: nextPageNum,
          loadingMore: false
        }));
      }
    } catch (err) {
      console.error("Failed to load more posts:", err);
      set({ loadingMore: false });
    }
  },

  // Load Featured Posts (2 hours cache duration)
  loadFeatured: async (forceRefresh = false) => {
    set({ loadingFeatured: true });
    try {
      let cachedFeatured = null;
      try {
        cachedFeatured = await db.meta.get("featured_posts");
      } catch (err) {
        console.error("Failed to read featured from Dexie:", err);
      }

      if (cachedFeatured && !forceRefresh) {
        const isExpired = Date.now() - cachedFeatured.cachedAt > 2 * 60 * 60 * 1000;
        if (!isExpired) {
          set({ featuredPosts: cachedFeatured.data, loadingFeatured: false });
          return;
        }
      }

      const res = await getFeaturedInterviews();
      if (res && res.success) {
        const posts = res.posts || [];
        try {
          await db.meta.put({
            key: "featured_posts",
            cachedAt: Date.now(),
            data: posts
          });
        } catch (err) {
          console.error("Failed to cache featured posts to Dexie:", err);
        }
        set({ featuredPosts: posts });
      }
    } catch (err) {
      console.error("Error loading featured posts:", err);
    } finally {
      set({ loadingFeatured: false });
    }
  },

  // Load User Stats (24 hours cache duration)
  loadUserStats: async (forceRefresh = false) => {
    set({ loadingStats: true });
    try {
      let cachedStats = null;
      try {
        cachedStats = await db.meta.get("user_interview_stats");
      } catch (err) {
        console.error("Failed to read stats from Dexie:", err);
      }

      if (cachedStats && !forceRefresh) {
        const isExpired = Date.now() - cachedStats.cachedAt > 24 * 60 * 60 * 1000;
        if (!isExpired) {
          set({ stats: cachedStats.data, loadingStats: false });
          return;
        }
      }

      const res = await getUserInterviewStats();
      if (res && res.success) {
        const stats = res.stats;
        try {
          await db.meta.put({
            key: "user_interview_stats",
            cachedAt: Date.now(),
            data: stats
          });
        } catch (err) {
          console.error("Failed to cache user stats to Dexie:", err);
        }
        set({ stats });
      }
    } catch (err) {
      console.error("Error loading user stats:", err);
    } finally {
      set({ loadingStats: false });
    }
  },

  // Update likes and likes count of a post across state and local caches (Zustand & Dexie)
  updatePostLikes: async (postId: number, isLiked: boolean, likesCount: number) => {
    const { posts, featuredPosts, pages } = get();

    // 1. Update the posts list in state
    const updatedPosts = posts.map((post) =>
      post.post_id === postId
        ? { ...post, isLiked, likes_count: likesCount }
        : post
    );

    // 2. Update the featured posts list in state
    const updatedFeaturedPosts = featuredPosts.map((post) =>
      post.post_id === postId
        ? { ...post, isLiked, likes_count: likesCount }
        : post
    );

    // 3. Update the pages cache in state and Dexie
    const updatedPages = { ...pages };
    for (const key of Object.keys(updatedPages)) {
      const pageData = updatedPages[key];
      if (pageData) {
        let postFound = false;
        const updatedPagePosts = pageData.posts.map((post) => {
          if (post.post_id === postId) {
            postFound = true;
            return { ...post, isLiked, likes_count: likesCount };
          }
          return post;
        });

        if (postFound) {
          updatedPages[key] = {
            ...pageData,
            posts: updatedPagePosts,
          };
          // Write updated page to Dexie cache
          try {
            await db.feed_pages.put({
              key,
              ...updatedPages[key],
            });
          } catch (err) {
            console.error(`Failed to update page cache for ${key} in Dexie:`, err);
          }
        }
      }
    }

    // 4. Update the featured posts in Dexie cache if modified
    const isFeaturedModified = featuredPosts.some((post) => post.post_id === postId);
    if (isFeaturedModified) {
      try {
        const cachedFeatured = await db.meta.get("featured_posts");
        if (cachedFeatured) {
          const updatedCachedFeatured = cachedFeatured.data.map((post: any) =>
            post.post_id === postId
              ? { ...post, isLiked, likes_count: likesCount }
              : post
          );
          await db.meta.put({
            key: "featured_posts",
            cachedAt: cachedFeatured.cachedAt,
            data: updatedCachedFeatured,
          });
        }
      } catch (err) {
        console.error("Failed to update featured posts cache in Dexie:", err);
      }
    }

    set({
      posts: updatedPosts,
      featuredPosts: updatedFeaturedPosts,
      pages: updatedPages,
    });
  },

  // Helper to clear local feed caches on demand (e.g. settings clear)
  clearLocalCache: async () => {
    try {
      await db.feed_pages.clear();
      await db.meta.delete("featured_posts");
      await db.meta.delete("user_interview_stats");
      await db.meta.delete("last_sync_check");
      set({ pages: {}, posts: [], currentPage: 1, hasMore: true });
    } catch (err) {
      console.error("Failed to clear local cache:", err);
    }
  }
}));
