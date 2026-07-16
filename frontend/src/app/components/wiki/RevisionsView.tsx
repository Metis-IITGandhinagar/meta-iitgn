"use client";

import React from "react";
import { useRouter } from "next/navigation";
import GenericOverlayModal from "@/components/GenericOverlayModal";

interface RevisionsViewProps {
  setShowRevisions: (show: boolean) => void;
}

export default function RevisionsView({ setShowRevisions }: RevisionsViewProps) {
  const router = useRouter();
  const closeModal = () => {
    router.back();
  };

  return (
    <GenericOverlayModal isOpen={true} onClose={closeModal} title="Recent Page Revisions">
      <div className="max-w-3xl mx-auto space-y-6 w-full">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-serif font-black text-base-content tracking-tight">Recent Page Revisions</h2>
          <p className="text-xs text-base-content/50 font-semibold uppercase tracking-wider">Track and restore past edits for this article</p>
        </div>

        <div className="space-y-4 pt-4">
          {[
            {
              rev: 3,
              title: "Added cs curriculum and policies",
              author: "Meta IITGN",
              avatar: "MI",
              time: "4 hours ago",
              badge: "Admin",
              badgeBg: "bg-blue-50 text-primary border border-blue-200",
              details: "Inserted curriculum listings under CS major and updated hostel rules. Added detail on curriculum pathways.",
            },
            {
              rev: 2,
              title: "Updated infobox stats",
              author: "Alex Carter",
              avatar: "AC",
              time: "1 day ago",
              badge: "Gold Contributor",
              badgeBg: "bg-amber-50 text-amber-600 border border-amber-200",
              details: "Modified placement percentages and Amalthea festival dates. Corrected coordinate references.",
            },
            {
              rev: 1,
              title: "Initial page creation",
              author: "System Init",
              avatar: "SY",
              time: "2 days ago",
              badge: "System",
              badgeBg: "bg-gray-50 text-gray-600 border border-gray-200",
              details: "Imported markdown core structure, category hierarchies, and initial infobox configurations.",
            },
          ].map((revision) => (
            <div key={revision.rev} className="p-4 sm:p-5 border border-gray-200 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-150 relative group">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-base-200 border border-base-300 flex items-center justify-center font-bold text-sm text-base-content/80 shrink-0">
                  {revision.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3">
                    <h4 className="text-base font-bold text-base-content truncate leading-snug">{revision.title}</h4>
                    <span className="text-xs text-base-content/50 shrink-0 font-medium">{revision.time}</span>
                  </div>
                  <p className="text-sm text-base-content/60 mt-1.5 leading-relaxed">{revision.details}</p>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-base-200 border-dashed">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-base-content/80">{revision.author}</span>
                      <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${revision.badgeBg}`}>
                        {revision.badge}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        alert(`Restoring Revision #${revision.rev}...`);
                        closeModal();
                      }}
                      className="text-xs font-extrabold text-primary hover:text-blue-700 transition-colors cursor-pointer duration-150"
                    >
                      Restore Version
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GenericOverlayModal>
  );
}
