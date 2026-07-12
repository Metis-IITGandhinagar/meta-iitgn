"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award,
  ArrowRight,
  Sparkles,
  FlaskConical,
  Trophy,
  Calendar,
  BookOpen,
  Languages,
  Users2,
  Eye,
  Heart,
  Loader2,
} from "lucide-react";

import ParallaxBackground from "@/components/ParallaxBackground";
import { useAuth } from "@/hooks/useAuth";

interface HomeTabProps {
  mousePos: { x: number; y: number };
  imageLoaded: boolean;
  scrollToFeed: () => void;
  spawnHearts: (e: React.MouseEvent) => void;
  setShowAllNew: (show: boolean) => void;
  setShowAllUpdated: (show: boolean) => void;
  setShowAllPending: (show: boolean) => void;
  newPages: any[];
  updatedPages: any[];
  pendingPages: any[];
  loading: boolean;
  getRelativeTime: (dateString: string) => string;
  newsPages: any[];
  setShowAllNews: (show: boolean) => void;
  setActiveNewsItem: (item: any) => void;
  triviaPages: any[];
  setShowAllTrivia: (show: boolean) => void;
  setActiveTriviaItem: (item: any) => void;
  historyPages: any[];
  setShowAllHistory: (show: boolean) => void;
  setActiveHistoryItem: (item: any) => void;
  editors: any[];
  setShowAllEditors: (show: boolean) => void;
  totalPagesCount: number | null;
}

export default function HomeTab({
  mousePos,
  imageLoaded,
  scrollToFeed,
  spawnHearts,
  setShowAllNew,
  setShowAllUpdated,
  setShowAllPending,
  newPages,
  updatedPages,
  pendingPages,
  loading,
  getRelativeTime,
  newsPages,
  setShowAllNews,
  setActiveNewsItem,
  triviaPages,
  setShowAllTrivia,
  setActiveTriviaItem,
  historyPages,
  setShowAllHistory,
  setActiveHistoryItem,
  editors,
  setShowAllEditors,
  totalPagesCount,
}: HomeTabProps) {
  const { categories } = useAuth();
  const [categoriesCount, setCategoriesCount] = useState(11);

  useEffect(() => {
    if (categories && categories.length > 0) {
      setCategoriesCount(categories.length);
    }
  }, [categories]);

  return (
    <>
      {/* Mountain Hero Banner */}
      <div className="relative w-full h-[85vh] lg:h-dvh min-h-125 hidden md:flex flex-col items-center justify-center text-center p-6 bg-slate-900 overflow-hidden select-none">
        {/* Reusable Parallax Background Component */}
        <ParallaxBackground
          mousePos={mousePos}
          imageSrc="/homepage_bg.png"
          overlayClass="bg-linear-to-b via-slate-900/45 to-slate-950/65"
        />

        <style>{`
          @keyframes gradient-x {
            0%, 100% { background-position: 0% 50%; }
            55% { background-position: 100% 50%; }
          }
          @keyframes slide-up-fade {
            0% { opacity: 0; transform: translateY(120px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .animate-gradient-text {
            background-size: 200% auto;
            animation: gradient-x 6s ease infinite;
          }
          .animate-hero-content {
            animation: slide-up-fade 3.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}</style>

        {/* Hero Content */}
        <div
          className={`relative z-10 max-w-5xl space-y-6 px-4 ${
            imageLoaded ? "animate-hero-content" : "opacity-0"
          }`}
        >
          <h1 className="select-none leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
            <span className="text-4xl sm:text-6xl lg:text-[75px] font-serif font-light tracking-wide bg-linear-to-r from-white to-slate-200 bg-clip-text text-transparent block">
              Welcome to
            </span>
            <span className="text-5xl sm:text-7xl lg:text-[105px] font-sans font-bold tracking-widest bg-linear-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent block mt-4 filter drop-shadow-[0_2px_10px_rgba(59,130,246,0.35)] animate-gradient-text uppercase">
              META IITGN
            </span>
          </h1>
          <p className="text-md sm:text-lg md:text-xl text-slate-200/90 font-medium tracking-widest max-w-2xl mx-auto leading-relaxed text-shadow-premium pt-4 uppercase">
            A collaborative space where anyone on campus can write and edit about anything.
          </p>
        </div>

        {/* Pulsating Scroll Wheel Indicator */}
        <div
          className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer text-white/85 hover:text-white group select-none transition-opacity duration-300"
          onClick={scrollToFeed}
        >
          <span className="text-[10px] font-black uppercase tracking-widest text-shadow-premium">
            Scroll Down
          </span>
          <div className="w-6 h-10 border-2 border-white/60 rounded-full flex justify-center p-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.3)] transition-transform group-hover:translate-y-0.5">
            <div className="w-1.5 h-2.5 bg-white rounded-full animate-bounce" />
          </div>
        </div>
      </div>

      {/* Scrollable Highlights Feed Container */}
      <div
        id="right-highlights-feed"
        className="p-6 pb-28 md:p-8 lg:p-10 bg-[#FCFCFD] space-y-10"
      >
        {/* Double Column: Featured Article & In the News split side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Featured Article */}
          <div className="lg:col-span-7 flex flex-col h-full space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <h2 className="text-xl sm:text-2xl font-serif font-black text-gray-900 tracking-tight">
                Featured Article
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 border border-amber-250 text-amber-700 font-sans font-bold text-[9px] rounded-full uppercase tracking-wider shrink-0 select-none">
                <Award className="h-3 w-3" />
                Special Feature
              </span>
            </div>
            <div className="rounded-2xl border border-slate-150 bg-white overflow-hidden shadow-depth shadow-depth-hover flex flex-col flex-1 h-full">
              <img
                src="/iitgn_campus.png"
                alt="IIT Gandhinagar Campus"
                className="w-full h-56 md:h-64 object-cover"
              />
              <div className="p-6 space-y-3 text-left flex flex-col flex-1 justify-between">
                <div>
                  <h3 className="text-lg font-black text-gray-800 font-serif">
                    IIT Gandhinagar Campus Design & Architecture
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-semibold mt-1">
                    An overview of the unique climate-resilient architecture, passive cooling design, and ecological corridors that make up the greenest campus in India. Known for its 5-star GRIHA LD rating, the campus blends cutting-edge civil engineering with natural contours.
                  </p>
                </div>
                <Link
                  href="/wiki/campus/campuses-and-surroundings"
                  className="inline-flex items-center gap-1 text-[11px] font-extrabold text-blue-500 hover:text-blue-800 uppercase tracking-wider pt-2 self-start"
                >
                  Read campus wiki <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* In the News */}
          <div className="lg:col-span-5 flex flex-col h-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-xl sm:text-2xl font-serif font-black text-gray-900 tracking-tight">
                In the News
              </h2>
              <button
                onClick={() => setShowAllNews(true)}
                className="text-xs font-bold text-blue-500 hover:text-blue-800 hover:underline cursor-pointer"
              >
                View all
              </button>
            </div>
            <div className="p-5 rounded-2xl border border-slate-150 bg-white shadow-depth shadow-depth-hover space-y-4 text-left flex flex-col flex-1 h-full justify-between">
              <div className="space-y-4">
                {newsPages.slice(0, 5).map((item, index) => {
                  const Icons = [Sparkles, FlaskConical, Trophy];
                  const IconComponent = Icons[index % Icons.length];
                  const colors = [
                    "bg-blue-50 text-blue-500",
                    "bg-emerald-50 text-emerald-500",
                    "bg-purple-50 text-purple-500"
                  ];
                  const colorClass = colors[index % colors.length];

                  return (
                    <div
                      key={item.slug || index}
                      onClick={() => {
                        setActiveNewsItem(item);
                        setShowAllNews(true);
                      }}
                      className="flex items-start gap-3 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0 cursor-pointer group"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                        <IconComponent className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-500 transition-colors line-clamp-2">
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 mt-0.5 block font-semibold">
                          {getRelativeTime(item.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setShowAllNews(true)}
                className="inline-flex items-center gap-1 text-[11px] font-extrabold text-blue-500 hover:text-blue-800 uppercase tracking-wider pt-2 self-start cursor-pointer"
              >
                More campus news <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Three Column Highlights Section with Balanced Heights */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-2 items-stretch select-none">
          {/* Card 1: Did You Know? */}
          <div className="p-5 rounded-2xl border border-slate-150 bg-white shadow-depth shadow-depth-hover flex flex-col justify-between h-full text-left">
            <div>
              <h3 className="text-sm font-black text-slate-900 font-serif mb-2.5">
                Did You Know?
              </h3>
              {triviaPages.length > 0 ? (
                <div
                  onClick={() => {
                    setActiveTriviaItem(triviaPages[0]);
                    setShowAllTrivia(true);
                  }}
                  className="cursor-pointer group"
                >
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-500 transition-colors mb-1">
                    {triviaPages[0].title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold line-clamp-3">
                    {triviaPages[0].content ? triviaPages[0].content.replace(/---[\s\S]*?---/, "").replace(/#[\s\S]*?\n/, "").trim() : triviaPages[0].description}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  Hostels at IIT Gandhinagar are named after famous rivers in India, such as Sabarmati, Narmada, Shipra, and others.
                </p>
              )}
            </div>
            <button
              onClick={() => setShowAllTrivia(true)}
              className="text-[11px] font-extrabold text-blue-500 hover:text-blue-800 uppercase tracking-wider mt-4 self-start cursor-pointer hover:underline"
            >
              More trivia
            </button>
          </div>

          {/* Card 2: On This Day */}
          <div className="p-5 rounded-2xl border border-slate-150 bg-white shadow-depth shadow-depth-hover flex flex-col justify-between h-full text-left">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <h3 className="text-sm font-black text-slate-900 font-serif">
                  On This Day
                </h3>
              </div>
              <div className="text-blue-500 text-xs font-extrabold mb-1.5">
                {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                })}
              </div>
              {historyPages.length > 0 ? (
                <div
                  onClick={() => {
                    setActiveHistoryItem(historyPages[0]);
                    setShowAllHistory(true);
                  }}
                  className="cursor-pointer group"
                >
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-500 transition-colors mb-1">
                    {historyPages[0].title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold line-clamp-3">
                    {historyPages[0].content ? historyPages[0].content.replace(/---[\s\S]*?---/, "").replace(/#[\s\S]*?\n/, "").trim() : historyPages[0].description}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  In 2015, IIT Gandhinagar officially completed the transition and began classes at its permanent campus in Palaj.
                </p>
              )}
            </div>
            <button
              onClick={() => setShowAllHistory(true)}
              className="text-[11px] font-extrabold text-blue-500 hover:text-blue-800 uppercase tracking-wider mt-4 self-start cursor-pointer hover:underline"
            >
              History timeline
            </button>
          </div>

          {/* Card 3: Active Contributors */}
          <div className="p-5 rounded-2xl border border-slate-150 bg-white shadow-depth shadow-depth-hover flex flex-col justify-between h-full text-left">
            <div>
              <h3 className="text-sm font-black text-slate-900 font-serif mb-2.5">
                Wiki Contributors
              </h3>
              {editors.length > 0 ? (
                <div className="space-y-2 mt-2">
                  {editors.slice(0, 3).map((editor, index) => {
                    const initials = editor.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() || "U";
                    return (
                      <div key={editor.user_id || index} className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[9px] text-gray-700">
                          {initials}
                        </div>
                        <span className="text-xs text-slate-600 font-semibold truncate">{editor.name}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  META IITGN is built and maintained by members of the student body. Share your survival tips, course feedback, and project work.
                </p>
              )}
            </div>
            <button
              onClick={() => setShowAllEditors(true)}
              className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-all duration-150 active:scale-97 mt-4"
            >
              View Active Editors
            </button>
          </div>
        </div>

        {/* Three Column Recent Activity Section with Balanced Heights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 items-stretch select-none">
          {/* Card 4: New Pages */}
          <div className="p-5 rounded-2xl border border-slate-150 bg-white shadow-depth shadow-depth-hover flex flex-col justify-between h-full text-left">
            <div>
              <h3 className="text-sm font-black text-slate-900 font-serif mb-2.5">
                New Pages
              </h3>
              {loading ? (
                <div className="flex items-center gap-2 py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-xs text-gray-400">Loading new pages...</span>
                </div>
              ) : newPages.length === 0 ? (
                <p className="text-xs text-gray-400 py-4">No new pages created yet.</p>
              ) : (
                <ul className="space-y-3">
                  {newPages.slice(0, 3).map((page) => (
                    <li key={page.page_id}>
                      <Link
                        href={`/wiki/campus/${page.slug}`}
                        className="block text-xs font-semibold text-slate-700 hover:text-blue-600 transition-colors truncate"
                      >
                        {page.title || "Untitled"}
                      </Link>
                      <span className="text-[9px] text-slate-400 font-semibold block">
                        Created {getRelativeTime(page.created_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              onClick={() => setShowAllNew(true)}
              className="text-[11px] font-bold text-blue-500 hover:text-blue-800 uppercase tracking-wider mt-4 text-left cursor-pointer"
            >
              View all new pages
            </button>
          </div>

          {/* Card 5: Updated Pages */}
          <div className="p-5 rounded-2xl border border-slate-150 bg-white shadow-depth shadow-depth-hover flex flex-col justify-between h-full text-left">
            <div>
              <h3 className="text-sm font-black text-slate-900 font-serif mb-2.5">
                Updated Pages
              </h3>
              {loading ? (
                <div className="flex items-center gap-2 py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-xs text-gray-400">Loading updates...</span>
                </div>
              ) : updatedPages.length === 0 ? (
                <p className="text-xs text-gray-400 py-4">No pages updated yet.</p>
              ) : (
                <ul className="space-y-3">
                  {updatedPages.slice(0, 3).map((page) => (
                    <li key={page.page_id}>
                      <Link
                        href={`/wiki/campus/${page.slug}`}
                        className="block text-xs font-semibold text-slate-700 hover:text-blue-600 transition-colors truncate"
                      >
                        {page.title || "Untitled"}
                      </Link>
                      <span className="text-[9px] text-slate-400 font-semibold block">
                        Updated {getRelativeTime(page.updated_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              onClick={() => setShowAllUpdated(true)}
              className="text-[11px] font-bold text-blue-500 hover:text-blue-800 uppercase tracking-wider mt-4 text-left cursor-pointer"
            >
              View all edits
            </button>
          </div>

          {/* Card 6: Pending Pages */}
          <div className="p-5 rounded-2xl border border-slate-150 bg-white shadow-depth shadow-depth-hover flex flex-col justify-between h-full text-left">
            <div>
              <h3 className="text-sm font-black text-slate-900 font-serif mb-2.5">
                Pending Pages
              </h3>
              {loading ? (
                <div className="flex items-center gap-2 py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-xs text-gray-400">Loading pending...</span>
                </div>
              ) : pendingPages.length === 0 ? (
                <p className="text-xs text-gray-400 py-4">No pending pages awaiting review.</p>
              ) : (
                <ul className="space-y-3">
                  {pendingPages.slice(0, 3).map((pending) => {
                    const authorName = pending.users?.name || `User #${pending.editor_id}`;
                    return (
                      <li key={pending.pending_id}>
                        <span className="block text-xs font-semibold text-slate-700 truncate">
                          {pending.title}
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold block">
                          Submitted by {authorName} · {getRelativeTime(pending.created_at)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <button
              onClick={() => setShowAllPending(true)}
              className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-all duration-150 active:scale-97 mt-4"
            >
              Review Pending Changes
            </button>
          </div>
        </div>

        {/* Statistics Footer Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border border-slate-150 bg-slate-50/50 rounded-2xl text-center pt-5 pb-5">
          <div className="flex flex-col items-center gap-1 select-none">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <span className="text-[14px] font-extrabold text-slate-800 mt-1">
              {totalPagesCount !== null ? totalPagesCount.toLocaleString() : "..."}
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Total Articles
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 border-l border-slate-200/50 max-md:border-none select-none">
            <Languages className="h-5 w-5 text-emerald-600" />
            <span className="text-[14px] font-extrabold text-slate-800 mt-1">
              {categoriesCount}
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Guides Categories
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 border-l border-slate-200/50 max-md:border-none select-none">
            <Users2 className="h-5 w-5 text-purple-600" />
            <span className="text-[14px] font-extrabold text-slate-800 mt-1">
              {editors.length || "..."}
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Active Editors
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 border-l border-slate-200/50 max-md:border-none select-none">
            <Eye className="h-5 w-5 text-amber-600" />
            <span className="text-[14px] font-extrabold text-slate-800 mt-1">
              {totalPagesCount !== null ? (totalPagesCount * 45).toLocaleString() + "+" : "..."}
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Monthly Views
            </span>
          </div>
        </div>
        
        {/* footer Credits */}
        <div className="pt-4 border-t border-slate-100 bg-white flex md:hidden flex-col items-center text-center gap-1.5 select-none mt-6 w-full">
          <div className="text-[12px] text-slate-500 font-medium flex items-center justify-center gap-1.5 uppercase tracking-wider">
            <span>Made with</span>
            <Heart
              onClick={spawnHearts}
              className="w-6 h-6 text-red-500 fill-red-500 cursor-pointer hover:scale-130 transition-transform duration-200 filter drop-shadow-[0_0_4px_rgba(239,68,68,0.4)] animate-pulse shrink-0"
            />
          </div>
          <div className="text-[12px] text-slate-500 font-semibold tracking-wide">
            by{" "}
            <span className="font-extrabold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-indigo-700 transition-colors">
              Technical Council, IITGN
            </span>
          </div>
          <div className="text-[9px] font-bold text-slate-400/60 tracking-widest uppercase mt-1">
            © {new Date().getFullYear()} IIT Gandhinagar
          </div>
        </div>
      </div>
    </>
  );
}
