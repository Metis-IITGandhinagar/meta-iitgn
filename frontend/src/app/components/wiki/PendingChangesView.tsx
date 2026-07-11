"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";

interface PendingChangesViewProps {
  setShowPendingChanges: (show: boolean) => void;
}

export default function PendingChangesView({ setShowPendingChanges }: PendingChangesViewProps) {
  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col h-screen w-screen overflow-hidden select-none animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <header className="h-16 border-b border-gray-200 flex items-center gap-4 px-4 lg:px-6 shrink-0 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] select-none">
        <button
          onClick={() => {
            setShowPendingChanges(false);
            window.dispatchEvent(new CustomEvent("hide-wiki-history"));
          }}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors duration-200 cursor-pointer active:scale-95 flex items-center justify-center animate-in fade-in"
          aria-label="Back to Wiki"
        >
          <ArrowLeft className="h-6 w-6 text-gray-900" />
        </button>
        <span className="text-sm font-bold text-gray-800 uppercase tracking-wider">Changes</span>
      </header>

      {/* Changes Body (Like Search & Bookmarks pages) */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 md:p-8 lg:p-12">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-serif font-black text-gray-900 tracking-tight">Pending Approval</h2>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Review proposed community revisions before publishing</p>
          </div>

          <div className="space-y-4 pt-4">
            {[
              {
                rev: 1,
                title: "Updated CS Major placement statistics for 2025",
                author: "Rohan Sharma",
                avatar: "RS",
                time: "2 hours ago",
                badge: "Student Contributor",
                badgeBg: "bg-emerald-50 text-emerald-600 border border-emerald-200",
                details: "Proposed update to placements: CS average package changed from 22.4 LPA to 23.8 LPA according to official council records."
              },
              {
                rev: 2,
                title: "Palaj Campus hostel guide clarification",
                author: "Aditi Patel",
                avatar: "AP",
                time: "6 hours ago",
                badge: "Guest Editor",
                badgeBg: "bg-gray-50 text-gray-600 border border-gray-200",
                details: "Suggested formatting and detail cleanups under the hostel guide laundry services."
              }
            ].map((pending) => (
              <div key={pending.rev} className="p-4 sm:p-5 border border-gray-200 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-150 relative group">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center font-bold text-sm text-gray-700 shrink-0">
                    {pending.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3">
                      <h4 className="text-base font-bold text-gray-800 truncate leading-snug">{pending.title}</h4>
                      <span className="text-xs text-gray-400 shrink-0 font-medium">{pending.time}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{pending.details}</p>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-100 border-dashed">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-700">{pending.author}</span>
                        <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${pending.badgeBg}`}>
                          {pending.badge}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            alert(`Proposed change approved successfully!`);
                            setShowPendingChanges(false);
                            window.dispatchEvent(new CustomEvent("hide-wiki-history"));
                          }}
                          className="text-xs font-extrabold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer duration-150"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            alert(`Proposed change rejected.`);
                            setShowPendingChanges(false);
                            window.dispatchEvent(new CustomEvent("hide-wiki-history"));
                          }}
                          className="text-xs font-extrabold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer duration-150"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
