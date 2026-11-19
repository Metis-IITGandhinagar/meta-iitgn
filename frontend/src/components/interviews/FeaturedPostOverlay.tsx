"use client";

import React from "react";
import GenericOverlayModal from "@/components/overlays/GenericOverlayModal";
import Avatar from "@/components/helpers/Avatar";
import InterviewMediaSlider from "./InterviewMediaSlider";
import InterviewVideoPlayer from "./InterviewVideoPlayer";
import { InterviewPost } from "@/api/interviews";
import { Building2, Briefcase, Clock, Star, Sparkles } from "lucide-react";

interface FeaturedPostOverlayProps {
  post: InterviewPost | null;
  onClose: () => void;
}

export default function FeaturedPostOverlay({ post, onClose }: FeaturedPostOverlayProps) {
  if (!post) return null;

  const formattedDate = new Date(post.created_at).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <GenericOverlayModal
      isOpen={!!post}
      onClose={onClose}
      title="Featured Experience Story"
      maxWidthClass="max-w-4xl"
    >
      <div className="flex flex-col gap-6 font-sans select-text pb-8">
        {/* Banner header */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-base-200 border border-base-300">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-accent/20 text-accent font-bold">
              <Star className="h-5 w-5 fill-current" />
            </span>
            <div>
              <h2 className="text-sm font-black text-base-content uppercase tracking-wider">Featured Community Story</h2>
              <p className="text-xs text-base-content/60">Selected for exceptional insight & value</p>
            </div>
          </div>
          <span className="badge badge-accent font-bold gap-1 text-xs">
            <Sparkles className="h-3 w-3" /> Spotlight
          </span>
        </div>

        {/* Author Header */}
        <div className="flex items-center gap-4 border-b border-base-200 pb-4">
          <div className="h-12 w-12 rounded-2xl bg-base-200 overflow-hidden border border-base-300 shrink-0">
            <Avatar email={post.owner?.email} name={post.owner?.name || "Student"} className="h-full w-full object-cover" />
          </div>
          <div>
            <h3 className="text-base font-black text-base-content">{post.owner?.name || "Campus Student"}</h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-base-content/60 mt-0.5">
              {post.company && (
                <span className="inline-flex items-center gap-1 font-semibold text-primary">
                  <Building2 className="h-3.5 w-3.5" /> {post.company}
                </span>
              )}
              {post.role && (
                <span className="inline-flex items-center gap-1 font-medium text-base-content/75">
                  <Briefcase className="h-3.5 w-3.5" /> {post.role}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-base-content/40">
                <Clock className="h-3.5 w-3.5" /> {formattedDate}
              </span>
            </div>
          </div>
        </div>

        {/* Full Article Content */}
        <div className="prose prose-sm max-w-none text-base-content/90 leading-relaxed whitespace-pre-line break-words text-sm sm:text-base">
          {post.content}
        </div>

        {/* Video Player */}
        {post.video_url && <InterviewVideoPlayer videoUrl={post.video_url} />}

        {/* Media Slider */}
        {post.media && post.media.length > 0 && (
          <InterviewMediaSlider media={post.media} />
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-base-200">
            {post.tags.map((tag, idx) => (
              <span key={idx} className="badge badge-outline badge-md rounded-xl font-semibold">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </GenericOverlayModal>
  );
}
