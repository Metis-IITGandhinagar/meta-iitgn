"use client";

import { BookOpen, FileText, Link2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Placeholder resource items (will be replaced with real data)
// ---------------------------------------------------------------------------
const PLACEHOLDER_RESOURCES = [
  { icon: FileText, label: "CP Handbook (PDF)",          tag: "PDF"     },
  { icon: Link2,    label: "Codeforces Problem Archive", tag: "Link"    },
  { icon: FileText, label: "IITGN DSA Notes",            tag: "PDF"     },
  { icon: Link2,    label: "LeetCode Curated Lists",     tag: "Link"    },
  { icon: FileText, label: "Graph Theory Cheatsheet",    tag: "PDF"     },
  { icon: Link2,    label: "CP Algorithms",              tag: "Link"    },
];

export default function ResourcesSection() {
  return (
    <div className="flex flex-col gap-6 min-h-0">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Resources
        </h2>
        <p className="text-sm text-base-content/50 mt-1">
          Curated study material, PDFs, and useful links — coming soon.
        </p>
      </div>

      {/* Coming-soon banner */}
      <div className="card bg-accent/[0.08] border border-base-300">
        <div className="card-body items-center text-center gap-4 py-10">
          <div className="p-4 rounded-2xl bg-primary/10">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Resources are being curated</h3>
            <p className="text-sm text-base-content/60 mt-1 max-w-sm">
              PDF guides, problem sheets, editorial links, and IITGN-specific study material will
              appear here once they&apos;re ready.
            </p>
          </div>
          <span className="badge badge-outline text-base-content/40 border-base-300">Coming soon</span>
        </div>
      </div>

      {/* Preview skeleton grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {PLACEHOLDER_RESOURCES.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className="card bg-base-100 border border-base-200 opacity-40 cursor-not-allowed select-none"
            >
              <div className="card-body p-4 flex-row items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{item.label}</p>
                  <span className="badge badge-xs badge-ghost mt-1">{item.tag}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
