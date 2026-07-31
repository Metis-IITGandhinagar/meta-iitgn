"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import Avatar from "@/components/helpers/Avatar";
import { useAuth } from "@/hooks/useAuth";
import { InterviewPost } from "@/api/interviews";
import InterviewPostCard from "@/components/interviews/InterviewPostCard";
import UserStatsCard from "@/components/interviews/UserStatsCard";
import CreateInterviewModal from "@/components/interviews/CreateInterviewModal";
import FeaturedPostOverlay from "@/components/interviews/FeaturedPostOverlay";
import { useFeedStore } from "@/store/useFeedStore";
import {
  Plus,
  Search,
  Briefcase,
  Star,
  Loader2,
  MessageSquare,
  Award,
  Heart,
  ArrowUpRight,
} from "lucide-react";

const FILTER_TAGS = [
  "All",
  "advice",
  "google",
  "apple",
  "amazon",
  "microsoft",
  "interview-prep",
  "off-campus",
  "resume",
  "system-design",
  "dsa",
];

export default function InterviewFeedPage() {
  const { user: currentUser } = useAuth();

  // Zustand Store selectors
  const posts = useFeedStore((state) => state.posts);
  const featuredPosts = useFeedStore((state) => state.featuredPosts);
  const selectedTag = useFeedStore((state) => state.selectedTag);
  const searchQuery = useFeedStore((state) => state.searchQuery);
  const hasMore = useFeedStore((state) => state.hasMore);
  const loadingFeed = useFeedStore((state) => state.loadingFeed);
  const loadingMore = useFeedStore((state) => state.loadingMore);
  const loadingFeatured = useFeedStore((state) => state.loadingFeatured);

  const setSelectedTag = useFeedStore((state) => state.setSelectedTag);
  const setSearchQuery = useFeedStore((state) => state.setSearchQuery);
  const loadFeed = useFeedStore((state) => state.loadFeed);
  const loadMore = useFeedStore((state) => state.loadMore);
  const loadFeatured = useFeedStore((state) => state.loadFeatured);
  const loadUserStats = useFeedStore((state) => state.loadUserStats);

  // Local Search state for input text (allows debounced updates to the store)
  const [searchVal, setSearchVal] = useState(searchQuery);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedFeaturedPost, setSelectedFeaturedPost] = useState<InterviewPost | null>(null);
  const [statsRefreshTrigger, setStatsRefreshTrigger] = useState(0);

  // IntersectionObserver Sentinel Ref
  const observerRef = useRef<HTMLDivElement | null>(null);

  // Initial loads on mount
  useEffect(() => {
    loadFeed();
    loadFeatured();
  }, [loadFeed, loadFeatured]);

  // Debounced Search Handler
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchVal);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchVal, setSearchQuery]);

  // Observer Setup for Prefetching Infinite Scroll (triggers when reaching 10th post from bottom)
  useEffect(() => {
    const sentinel = observerRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loadingFeed) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "300px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadingFeed, loadMore, posts.length]);

  const handlePostCreated = () => {
    setStatsRefreshTrigger((prev) => prev + 1);
    loadFeed(true);
    loadUserStats(true);
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-base-200/30 pt-14 pb-20 px-2 sm:px-4 mt-5">
      <div className="mx-auto max-w-8xl md:px-5">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: User Profile & Stats Widget (Desktop `lg` only) */}
          <aside className="hidden lg:block lg:col-span-3 space-y-6">
            <UserStatsCard
              onOpenCreateModal={() => {
                if (!currentUser) {
                  toast.error("Please sign in to create a post!");
                  return;
                }
                setIsCreateModalOpen(true);
              }}
              refreshTrigger={statsRefreshTrigger}
            />

            {/* Quick Community Guidelines */}
            <div className="rounded-3xl border border-base-200 bg-base-100 p-5 shadow-sm space-y-3 text-xs">
              <h4 className="font-black text-base-content flex items-center gap-1.5">
                <Award className="h-4 w-4 text-warning" /> Feed Guidelines
              </h4>
              <ul className="space-y-2 text-base-content/70 leading-relaxed list-disc pl-4">
                <li>Share authentic interview experiences & questions.</li>
                <li>Keep content respectful and constructive.</li>
                <li>All posts are reviewed by campus admins before going live.</li>
              </ul>
            </div>
          </aside>

          {/* Center Column: Main Feed */}
          <main className="lg:col-span-6 space-y-5">
            <h1 className="sr-only">Placement & Internship Interviews Feed</h1>
            {/* Create Post Bar (Mobile & Desktop Top) */}
            <div className="rounded-3xl border border-base-200 bg-base-100 p-4 shadow-sm flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-base-200 border border-base-300 overflow-hidden shrink-0">
                <Avatar email={currentUser?.email} name={currentUser?.name || "User"} className="h-full w-full object-cover" />
              </div>
              <button
                onClick={() => {
                  if (!currentUser) {
                    toast.error("Please sign in to create a post!");
                    return;
                  }
                  setIsCreateModalOpen(true);
                }}
                className="flex-1 text-left px-4 py-2.5 rounded-2xl bg-base-200/60 hover:bg-base-200 text-xs text-base-content/60 font-medium transition-colors cursor-pointer border border-base-300/40"
              >
                Share your interview experience or advice...
              </button>
              <button
                onClick={() => {
                  if (!currentUser) {
                    toast.error("Please sign in to create a post!");
                    return;
                  }
                  setIsCreateModalOpen(true);
                }}
                className="btn btn-primary btn-sm rounded-xl font-bold shadow-xs gap-1 cursor-pointer shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Post</span>
              </button>
            </div>

             {/* Search & Tag Filter Bar */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Search by company, role, or keywords..."
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  className="input input-sm input-bordered w-full pl-10 rounded-2xl text-xs bg-base-100"
                />
              </div>

              {/* Tag Pills horizontal scroll */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {FILTER_TAGS.map((tag) => {
                  const isActive = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        isActive
                          ? "bg-primary text-primary-content shadow-xs"
                          : "bg-base-100 border border-base-200 text-base-content/70 hover:bg-base-200"
                      }`}
                    >
                      {tag === "All" ? "🔥 All Stories" : `#${tag}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Feed Posts List */}
            {loadingFeed ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-44 w-full bg-base-100 rounded-3xl animate-pulse border border-base-200" />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-base-300 rounded-3xl bg-base-100 p-6 space-y-3">
                <MessageSquare className="h-12 w-12 mx-auto text-base-content/30" />
                <h3 className="text-base font-black text-base-content">No Interview Stories Found</h3>
                <p className="text-xs text-base-content/60 max-w-sm mx-auto">
                  Be the first student to share your interview experience for this tag or company!
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="btn btn-primary btn-sm rounded-xl font-bold mt-2"
                >
                  <Plus className="h-4 w-4" /> Create First Post
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post, index) => {
                  const isPrefetchSentinel = index === posts.length - 10;
                  return (
                    <div key={post.post_id} className="relative">
                      <InterviewPostCard
                        post={post}
                        onPostUpdated={() => loadFeed(true)}
                        onSelectFeatured={(p) => setSelectedFeaturedPost(p)}
                      />
                      {isPrefetchSentinel && (
                        <div
                          ref={observerRef}
                          className="absolute bottom-0 left-0 h-10 w-full pointer-events-none"
                        />
                      )}
                    </div>
                  );
                })}

                {/* Sentinel / Loading Indicators */}
                <div className="py-4 text-center">
                  {loadingMore && (
                    <div className="flex items-center justify-center gap-2 text-xs font-bold text-base-content/60">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading more experiences...
                    </div>
                  )}
                  {!hasMore && posts.length > 0 && (
                    <p className="text-xs text-base-content/40 font-medium">You&apos;ve reached the end of the feed!</p>
                  )}
                </div>
              </div>
            )}
          </main>

          {/* Right Column: Featured Posts Showcase (Desktop `lg` only) */}
          <aside className="hidden lg:block lg:col-span-3 space-y-2">
            <div className="rounded-3xl border border-accent/25 bg-base-100 p-3 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black uppercase text-base-content tracking-wider flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-accent fill-accent" /> Top Featured Stories
                </h3>
                <span className="badge badge-accent badge-xs font-bold px-2 py-0.5">Top 5</span>
              </div>

              {loadingFeatured ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-base-200 animate-pulse rounded-2xl" />
                  ))}
                </div>
              ) : featuredPosts.length === 0 ? (
                <p className="text-xs text-base-content/50 italic py-4 text-center">
                  No featured stories yet. Check back soon!
                </p>
              ) : (
                <div className="space-y-3">
                  {featuredPosts.map((post) => (
                    <div
                      key={post.post_id}
                      onClick={() => setSelectedFeaturedPost(post)}
                      className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br from-base-100 via-base-200/40 to-base-100 border border-base-200/80 hover:border-accent/50 hover:shadow-md transition-all duration-200 cursor-pointer group relative overflow-hidden flex flex-col gap-2.5"
                    >
                      {/* Author Header */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-xl bg-base-200 border border-base-300 overflow-hidden shrink-0">
                          <Avatar
                            email={post.owner?.email}
                            name={post.owner?.name || "Student"}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-bold text-base-content group-hover:text-primary transition-colors truncate">
                              {post.owner?.name || "Campus Student"}
                            </h4>
                            {post.company && (
                              <span className="badge badge-accent badge-outline badge-xs text-[10px] font-bold shrink-0">
                                {post.company}
                              </span>
                            )}
                          </div>
                          {post.role && (
                            <p className="text-[10px] font-medium text-base-content/60 truncate flex items-center gap-1">
                              <Briefcase className="h-2.5 w-2.5 text-base-content/40" /> {post.role}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Content Snippet */}
                      <p className="text-xs text-base-content/85 line-clamp-3 leading-relaxed font-normal">
                        {post.content}
                      </p>

                      {/* Card Footer */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-base-200/60 text-[10px] text-base-content/60 font-semibold">
                        <div className="flex items-center gap-1.5">
                          {post.tags && post.tags.length > 0 && (
                            <span className="badge badge-ghost badge-xs text-[10px] font-medium">
                              #{post.tags[0]}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-rose-500 font-bold">
                            <Heart className="h-3 w-3 fill-rose-500" /> {post.likes_count}
                          </span>
                        </div>
                        <span className="flex items-center gap-0.5 text-primary group-hover:translate-x-0.5 transition-transform font-bold">
                          Read Story <ArrowUpRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Create Post Overlay Modal */}
      <CreateInterviewModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPostCreated={handlePostCreated}
      />

      {/* Featured Post Full Story Overlay Modal */}
      <FeaturedPostOverlay
        post={selectedFeaturedPost}
        onClose={() => setSelectedFeaturedPost(null)}
      />
    </div>
  );
}