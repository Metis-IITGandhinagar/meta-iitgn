"use client";

import React from "react";
import { ArrowLeft, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";

interface HistoryOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  historyPages: any[];
  activeHistoryItem: any | null;
  setActiveHistoryItem: (item: any | null) => void;
  showAddHistoryForm: boolean;
  setShowAddHistoryForm: (show: boolean) => void;
  newHistoryTitle: string;
  setNewHistoryTitle: (title: string) => void;
  newHistoryContent: string;
  setNewHistoryContent: (content: string) => void;
  newHistoryVideoUrl: string;
  setNewHistoryVideoUrl: (url: string) => void;
  isSubmittingHistory: boolean;
  handleAddHistory: (e: React.FormEvent) => Promise<void>;
  getRelativeTime: (dateString: string) => string;
}

export default function HistoryOverlay({
  isOpen,
  onClose,
  historyPages,
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
  handleAddHistory,
  getRelativeTime,
}: HistoryOverlayProps) {
  const router = useRouter();

  const getYouTubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-[99999] flex flex-col h-dvh w-screen overflow-hidden select-none animate-in fade-in duration-200">
      <header className="h-16 border-b border-gray-200 flex items-center justify-between px-6 shrink-0 bg-white shadow-sm select-none">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (activeHistoryItem) {
                setActiveHistoryItem(null);
              } else if (showAddHistoryForm) {
                setShowAddHistoryForm(false);
              } else {
                onClose();
              }
            }}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-center"
          >
            <ArrowLeft className="h-6 w-6 text-gray-900" />
          </button>
          <span className="text-sm font-bold text-blue-400 uppercase tracking-wider ml-2">
            {showAddHistoryForm ? "Add History Event" : activeHistoryItem ? "Read History" : "Campus History"}
          </span>
        </div>
        {activeHistoryItem && !showAddHistoryForm && (
          <button
            onClick={() => {
              router.push(`/wiki/campus/${activeHistoryItem.slug}`);
            }}
            className="p-2.5 hover:bg-gray-105 rounded-lg text-gray-650 transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-center"
            title="Edit Wiki Page"
          >
            <Pencil className="h-5 w-5 text-gray-900" />
          </button>
        )}
        {!activeHistoryItem && !showAddHistoryForm && (
          <button
            onClick={() => setShowAddHistoryForm(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-all duration-150 active:scale-97"
          >
            Add History
          </button>
        )}
      </header>

      <div className={`flex-1 ${activeHistoryItem ? "bg-white overflow-hidden" : "bg-gray-55 overflow-y-auto overscroll-contain"} p-6 flex flex-col`}>
        {showAddHistoryForm ? (
          <form onSubmit={handleAddHistory} className="max-w-xl mx-auto space-y-4 bg-white p-6 border border-gray-200 rounded-2xl shadow-xs text-left">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold uppercase text-black">Event Title</label>
              <input
                type="text"
                required
                value={newHistoryTitle}
                onChange={(e) => setNewHistoryTitle(e.target.value)}
                placeholder="e.g. Inauguration of the Academic Blocks 2016"
                className="w-full border border-gray-200 text-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold uppercase text-black">YouTube Video URL (Optional)</label>
              <input
                type="text"
                value={newHistoryVideoUrl}
                onChange={(e) => setNewHistoryVideoUrl(e.target.value)}
                placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                className="w-full border border-gray-200 text-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold uppercase text-black">Content</label>
              <textarea
                required
                rows={8}
                value={newHistoryContent}
                onChange={(e) => setNewHistoryContent(e.target.value)}
                placeholder="Write the history details here..."
                className="w-full border border-gray-200 text-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 resize-none font-semibold"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmittingHistory}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm rounded-xl cursor-pointer transition-all duration-150 active:scale-97"
            >
              {isSubmittingHistory ? "Submitting..." : "Submit History Page"}
            </button>
          </form>
        ) : activeHistoryItem ? (
          <div className="max-w-2xl w-full mx-auto text-left space-y-4 pt-4 overflow-y-auto overscroll-contain flex-1 pr-2">
            <h3 className="text-2xl font-bold text-gray-900 leading-snug">{activeHistoryItem.title}</h3>
            <span className="text-[10px] text-gray-400 font-semibold block">
              Posted: {getRelativeTime(activeHistoryItem.created_at)}
            </span>
            {activeHistoryItem.video_url && (() => {
              const videoId = getYouTubeId(activeHistoryItem.video_url);
              if (videoId) {
                return (
                  <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-md mt-4 border border-gray-150 relative z-10 pointer-events-auto">
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title="YouTube video player"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                );
              }
              return null;
            })()}
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap pt-4 font-semibold border-t border-gray-100">
              {activeHistoryItem.content ? activeHistoryItem.content.replace(/---[\s\S]*?---/, "").replace(/#[\s\S]*?\n/, "").trim() : activeHistoryItem.description}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {historyPages.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-gray-300 bg-white rounded-2xl">
                <p className="text-gray-500 font-medium">No history pages found.</p>
              </div>
            ) : (
              historyPages.map((item, idx) => (
                <div
                  key={item.slug || idx}
                  onClick={() => setActiveHistoryItem(item)}
                  className="p-5 border border-gray-250/60 bg-white rounded-2xl shadow-xs hover:shadow-md hover:border-blue-400 transition-all duration-150 cursor-pointer text-left animate-in fade-in"
                >
                  <h4 className="text-base font-bold text-gray-855">{item.title}</h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {item.content ? item.content.replace(/---[\s\S]*?---/, "").replace(/#[\s\S]*?\n/, "").trim() : item.description}
                  </p>
                  <span className="text-[9px] text-gray-400 font-semibold block mt-2">
                    Posted: {getRelativeTime(item.created_at)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
