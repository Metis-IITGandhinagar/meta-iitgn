"use client";

import { Play } from "lucide-react";

// ---------------------------------------------------------------------------
// Placeholder video thumbnails (will be replaced with real embeds)
// ---------------------------------------------------------------------------
const PLACEHOLDER_VIDEOS = [
  "Competitive Programming Introduction",
  "Graph Algorithms Deep Dive",
  "Dynamic Programming Patterns",
  "Binary Search & Its Tricks",
  "Tree Data Structures Masterclass",
  "System Design for Beginners",
];

export default function VideosSection() {
  return (
    <div className="flex flex-col gap-6 min-h-0">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Play className="h-6 w-6 text-primary" />
          Videos
        </h2>
        <p className="text-sm text-base-content/50 mt-1">
          Lecture recordings, tutorials, and CP walkthroughs — coming soon.
        </p>
      </div>

      {/* Coming-soon banner */}
      <div className="card bg-accent/[0.08] border border-base-300">
        <div className="card-body items-center text-center gap-4 py-10">
          <div className="p-4 rounded-2xl bg-secondary/10">
            <Play className="h-8 w-8 text-secondary" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Videos are on their way</h3>
            <p className="text-sm text-base-content/60 mt-1 max-w-sm">
              YouTube embeds, recorded lectures, and curated playlists on competitive programming
              and open source contributions will be added here.
            </p>
          </div>
          <span className="badge badge-outline text-base-content/40 border-base-300">Coming soon</span>
        </div>
      </div>

      {/* Preview skeleton grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PLACEHOLDER_VIDEOS.map((title, i) => (
          <div
            key={i}
            className="card bg-base-100 border border-base-200 opacity-40 cursor-not-allowed select-none overflow-hidden"
          >
            {/* Fake thumbnail */}
            <div className="aspect-video bg-base-300 flex items-center justify-center">
              <div className="p-3 rounded-full bg-base-200">
                <Play className="h-6 w-6 text-base-content/30 fill-base-content/20" />
              </div>
            </div>
            <div className="card-body p-3 gap-1">
              <p className="text-sm font-medium line-clamp-2 leading-snug">{title}</p>
              <p className="text-xs text-base-content/40">IIT Gandhinagar · Meta IITGN</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
