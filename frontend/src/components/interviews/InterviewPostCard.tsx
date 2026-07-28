"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import Avatar from "@/components/helpers/Avatar";
import InterviewMediaSlider from "./InterviewMediaSlider";
import InterviewVideoPlayer from "./InterviewVideoPlayer";
import { InterviewPost, toggleLikeInterviewPost, approveInterviewPost, toggleFeatureInterviewPost, deleteInterviewPost } from "@/api/interviews";
import { useAuth } from "@/hooks/useAuth";
import { Heart, Share2, Building2, Briefcase, Clock, CheckCircle2, Star, Trash2 } from "lucide-react";
import { useFeedStore } from "@/store/useFeedStore";

interface InterviewPostCardProps {
  post: InterviewPost;
  onPostUpdated?: (updatedPost?: Partial<InterviewPost>) => void;
  onSelectFeatured?: (post: InterviewPost) => void;
}

export default function InterviewPostCard({ post, onPostUpdated, onSelectFeatured }: InterviewPostCardProps) {
  const { user: currentUser } = useAuth();
  const markAsRead = useFeedStore((state) => state.markAsRead);
  const updatePostLikes = useFeedStore((state) => state.updatePostLikes);
  const cardRef = useRef<HTMLElement | null>(null);

  const [isLiked, setIsLiked] = useState<boolean>(!!post.isLiked);
  const [likesCount, setLikesCount] = useState<number>(post.likes_count || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isApproved, setIsApproved] = useState(post.approved);
  const [isFeatured, setIsFeatured] = useState(post.featured);

  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "moderator";

  useEffect(() => {
    setIsLiked(!!post.isLiked);
    setLikesCount(post.likes_count || 0);
    setIsApproved(post.approved);
    setIsFeatured(post.featured);
  }, [post]);

  useEffect(() => {
    if (!post.post_id) return;

    let timer: NodeJS.Timeout | null = null;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          timer = setTimeout(() => {
            markAsRead(post.post_id);
          }, 2500);
        } else {
          if (timer) {
            clearTimeout(timer);
            timer = null;
          }
        }
      },
      { threshold: 0.5 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [post.post_id, markAsRead]);

  const handleLike = async () => {
    if (!currentUser) {
      toast.error("Please sign in to like posts!");
      return;
    }
    if (isLiking) return;

    // Optimistic UI update
    const previousLiked = isLiked;
    const previousCount = likesCount;
    const newLiked = !previousLiked;
    const newCount = previousLiked ? Math.max(0, previousCount - 1) : previousCount + 1;

    setIsLiked(newLiked);
    setLikesCount(newCount);
    updatePostLikes(post.post_id, newLiked, newCount);
    setIsLiking(true);

    try {
      const res = await toggleLikeInterviewPost(post.post_id);
      if (res && res.success) {
        setIsLiked(res.isLiked);
        setLikesCount(res.likesCount);
        updatePostLikes(post.post_id, res.isLiked, res.likesCount);
      } else {
        // Rollback
        setIsLiked(previousLiked);
        setLikesCount(previousCount);
        updatePostLikes(post.post_id, previousLiked, previousCount);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
      // Rollback
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
      updatePostLikes(post.post_id, previousLiked, previousCount);
      toast.error("Failed to update like status.");
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/interviews?post=${post.post_id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Post link copied to clipboard!");
    } else {
      toast.success("Sharing post link...");
    }
  };

  const handleAdminApprove = async () => {
    try {
      const newStatus = !isApproved;
      await approveInterviewPost(post.post_id, newStatus);
      setIsApproved(newStatus);
      toast.success(newStatus ? "Post approved!" : "Post approval revoked.");
      if (onPostUpdated) onPostUpdated();
    } catch {
      toast.error("Failed to update post approval.");
    }
  };

  const handleAdminFeature = async () => {
    try {
      const newFeatured = !isFeatured;
      await toggleFeatureInterviewPost(post.post_id, newFeatured);
      setIsFeatured(newFeatured);
      toast.success(newFeatured ? "Post featured!" : "Post unfeatured.");
      if (onPostUpdated) onPostUpdated();
    } catch {
      toast.error("Failed to update featured status.");
    }
  };

  const handleAdminDelete = async () => {
    if (!confirm("Are you sure you want to delete this interview post?")) return;
    try {
      await deleteInterviewPost(post.post_id);
      toast.success("Post deleted.");
      if (onPostUpdated) onPostUpdated();
    } catch {
      toast.error("Failed to delete post.");
    }
  };

  const formattedDate = new Date(post.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const isLongContent = post.content.length > 280;
  const displayContent = isExpanded || !isLongContent
    ? post.content
    : post.content.slice(0, 280) + "...";

  return (
    <article ref={cardRef} className="rounded-3xl border border-base-200 bg-base-100 p-0.5 sm:p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col gap-2">
      {/* Top Author Bar */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 p-3">
          <div className="h-11 w-11 rounded-2xl bg-base-200 overflow-hidden shrink-0 border border-base-300">
            <Avatar email={post.owner?.email} name={post.owner?.name || "Student"} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-base-content tracking-tight truncate">
                {post.owner?.name || "Campus Student"}
              </h3>
              {post.owner?.role === "admin" && (
                <span className="badge badge-warning badge-xs font-bold">Admin</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-base-content/60 mt-0.5">
              {post.company && (
                <span className="inline-flex items-center gap-1 font-semibold text-primary">
                  <Building2 className="h-3 w-3" /> {post.company}
                </span>
              )}
              {post.role && (
                <span className="inline-flex items-center gap-1 font-medium text-base-content/70">
                  <Briefcase className="h-3 w-3" /> {post.role}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-base-content/40">
                <Clock className="h-3 w-3" /> {formattedDate}
              </span>
            </div>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-1.5 shrink-0 p-2 m-2">
          {!isApproved && (
            <span className="badge badge-warning gap-1 badge-sm font-bold animate-pulse">
              Pending Approval
            </span>
          )}
          {isFeatured && (
            <span className="badge badge-accent gap-1 badge-sm font-bold p-1">
              <Star className="h-3 w-3 fill-current" /> Featured
            </span>
          )}
        </div>
      </div>

      {/* Main Post Body */}
      <div className="text-sm text-base-content/85 leading-relaxed whitespace-pre-line break-words p-2">
        {displayContent}
        {isLongContent && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-2 font-bold text-primary hover:underline cursor-pointer"
          >
            {isExpanded ? "Show less" : "See more"}
          </button>
        )}
      </div>

      {/* Video Player */}
      {post.video_url && <InterviewVideoPlayer videoUrl={post.video_url} />}

      {/* Horizontal Media Slider */}
      {post.media && post.media.length > 0 && (
        <InterviewMediaSlider media={post.media} />
      )}

      {/* Tags Badges */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {post.tags.map((tag, idx) => (
            <span
              key={idx}
              className="badge badge-outline badge-sm rounded-xl text-xs font-semibold hover:bg-base-200 transition-colors"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions Row */}
      <div className="flex items-center justify-between border-t border-base-200/70 pt-3 mt-1 text-xs">
        <div className="flex items-center gap-4">
          {/* Like Button */}
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold ${
              isLiked
                ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
            }`}
          >
            <Heart
              className={`h-4 w-4 transition-transform ${
                isLiked ? "fill-rose-500 text-rose-500 scale-110" : ""
              }`}
            />
            <span>{likesCount} {likesCount === 1 ? "Like" : "Likes"}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-base-content/70 hover:bg-base-200 hover:text-base-content transition-all cursor-pointer font-bold"
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </button>
        </div>

        {/* Featured details link / Admin actions */}
        <div className="flex items-center gap-2">
          {onSelectFeatured && (
            <button
              onClick={() => onSelectFeatured(post)}
              className="btn btn-ghost btn-xs text-primary font-bold rounded-xl cursor-pointer"
            >
              Full Story
            </button>
          )}

          {isAdmin && (
            <div className="dropdown dropdown-top dropdown-left ">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-xs btn-square text-base-content/50">
                •••
              </div>
              <ul tabIndex={0} className="dropdown-content z-20 menu p-2 shadow bg-base-100 rounded-2xl w-40 border border-base-200 text-xs font-semibold">
                <li>
                  <button onClick={handleAdminApprove} className="gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    {isApproved ? "Revoke Approval" : "Approve Post"}
                  </button>
                </li>
                <li>
                  <button onClick={handleAdminFeature} className="gap-2">
                    <Star className="h-3.5 w-3.5 text-warning" />
                    {isFeatured ? "Unfeature" : "Mark Featured"}
                  </button>
                </li>
                <li className="text-error">
                  <button onClick={handleAdminDelete} className="gap-2">
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Post
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
