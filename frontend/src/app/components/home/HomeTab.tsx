"use client";

import React from "react";
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
} from "lucide-react";

interface HomeTabProps {
  mousePos: { x: number; y: number };
  imageLoaded: boolean;
  scrollToFeed: () => void;
  spawnHearts: (e: React.MouseEvent) => void;
}

export default function HomeTab({
  mousePos,
  imageLoaded,
  scrollToFeed,
  spawnHearts,
}: HomeTabProps) {
  const router = useRouter();

  return (
    <>
      {/* Mountain Hero Banner */}
      <div className="relative w-full h-[85vh] lg:h-dvh min-h-125 hidden md:flex flex-col items-center justify-center text-center p-6 bg-slate-900 overflow-hidden select-none">
        {/* Background Image with Dark Gradient Wash */}
        <div
          className="absolute top-0 inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/homepage_bg.png')",
            transform: `translate(${mousePos.x}px, ${mousePos.y}px) scale(1.15)`,
            transition: "transform 0.15s cubic-bezier(0.25, 1, 0.5, 1)",
          }}
        />
        <div className="absolute inset-0 bg-linear-to-b via-slate-900/45 to-slate-950/65" />

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
        className="p-6 md:p-8 lg:p-10 bg-[#FCFCFD] space-y-10"
      >
        {/* Double Column: Featured Article & In the News */}
        <div className="grid grid-cols-1 gap-8">
          {/* Featured Article */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <h2 className="text-xl sm:text-2xl font-serif font-black text-gray-900 tracking-tight">
                Featured Article
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 border border-amber-250 text-amber-700 font-sans font-bold text-[9px] rounded-full uppercase tracking-wider shrink-0 select-none">
                <Award className="h-3 w-3" />
                Special Feature
              </span>
            </div>
            <div className="rounded-2xl border border-slate-150 bg-white overflow-hidden shadow-depth shadow-depth-hover">
              <img
                src="/iitgn_campus.png"
                alt="IIT Gandhinagar Campus"
                className="w-full h-56 md:h-64 object-cover"
              />
              <div className="p-6 space-y-3 text-left">
                <h3 className="text-lg font-black text-gray-800 font-serif">
                  IIT Gandhinagar Campus Design & Architecture
                </h3>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-semibold">
                  An overview of the unique climate-resilient architecture, passive cooling design, and ecological corridors that make up the greenest campus in India. Known for its 5-star GRIHA LD rating, the campus blends cutting-edge civil engineering with natural contours.
                </p>
                <Link
                  href="/wiki/page/1"
                  className="inline-flex items-center gap-1 text-[11px] font-extrabold text-blue-500 hover:text-blue-800 uppercase tracking-wider pt-2"
                >
                  Read full article <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* In the News */}
          <div className="lg:col-span-8 space-y-4 flex flex-col justify-center">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-xl sm:text-2xl font-serif font-black text-gray-900 tracking-tight">
                In the News
              </h2>
              <Link
                href="/wiki/page/1"
                className="text-xs font-bold text-blue-500 hover:text-blue-800 hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="p-5 rounded-2xl border border-slate-150 bg-white shadow-depth space-y-4 text-left h-94 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Item 1 */}
                <div className="flex items-start gap-3 border-b border-slate-100 pb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Sparkles className="h-4.5 w-4.5 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 hover:text-blue-500 transition-colors line-clamp-2 cursor-pointer">
                      Annual Technical Fest Amalthea sets record attendance with winter theme.
                    </h4>
                    <span className="text-[10px] text-slate-400 mt-0.5 block font-semibold">
                      2 hours ago
                    </span>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="flex items-start gap-3 border-b border-slate-100 pb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <FlaskConical className="h-4.5 w-4.5 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 hover:text-emerald-650 transition-colors line-clamp-2 cursor-pointer">
                      Sustainable Energy & Carbon Neutrality Research Hub inaugurated at Palaj campus.
                    </h4>
                    <span className="text-[10px] text-slate-400 mt-0.5 block font-semibold">
                      5 hours ago
                    </span>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                    <Trophy className="h-4.5 w-4.5 text-purple-500" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 hover:text-purple-650 transition-colors line-clamp-2 cursor-pointer">
                      Technical Council announces upcoming Winter Campus Hackathon starting next week.
                    </h4>
                    <span className="text-[10px] text-slate-400 mt-0.5 block font-semibold">
                      1 day ago
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href="/wiki/page/1"
                className="inline-flex items-center gap-1 text-[11px] font-extrabold text-blue-500 hover:text-blue-800 uppercase tracking-wider pt-2"
              >
                More campus news <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Three Column Highlights Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-2">
          {/* Column 1: Did You Know? */}
          <div className="p-5 rounded-2xl border border-slate-150 bg-white shadow-depth shadow-depth-hover flex flex-col justify-between h-56 text-left">
            <div>
              <h3 className="text-sm font-black text-slate-900 font-serif mb-2.5">
                Did You Know?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Hostels at IIT Gandhinagar are named after famous rivers in India, such as Sabarmati, Narmada, Shipra, and others, fostering a strong residential community bond.
              </p>
            </div>
            <Link
              href="/wiki/page/1"
              className="text-[11px] font-bold text-blue-500 hover:text-blue-800 uppercase tracking-wider mt-4"
            >
              More trivia
            </Link>
          </div>

          {/* Column 2: On This Day */}
          <div className="p-5 rounded-2xl border border-slate-150 bg-white hover:shadow-md transition-shadow duration-200 flex flex-col justify-between h-56 text-left">
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
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                In 2015, IIT Gandhinagar officially completed the transition and began classes at its permanent campus in Palaj on the banks of the Sabarmati River.
              </p>
            </div>
            <Link
              href="/wiki/page/1"
              className="text-[11px] font-bold text-blue-500 hover:text-blue-800 uppercase tracking-wider mt-4"
            >
              History timeline
            </Link>
          </div>

          {/* Column 3: Get Involved */}
          <div className="p-5 rounded-2xl border border-slate-150 bg-white hover:shadow-md transition-shadow duration-200 flex flex-col justify-between h-56 text-left">
            <div>
              <h3 className="text-sm font-black text-slate-900 font-serif mb-2.5">
                Get Involved
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                META IITGN is built and maintained by members of the student body. Share your survival tips, course feedback, research guidebooks, and project work.
              </p>
            </div>
            <Link
              href="/wiki/page/1"
              className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-all duration-150 active:scale-97"
            >
              Start Contributing
            </Link>
          </div>
        </div>

        {/* Three Column Recent Activity Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Column 1: New Pages */}
          <div className="p-5 rounded-2xl border border-slate-150 bg-white hover:shadow-md transition-shadow duration-200 flex flex-col justify-between h-64 text-left">
            <div>
              <h3 className="text-sm font-black text-slate-900 font-serif mb-2.5">
                New Pages
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/wiki/campus/hostels"
                    className="block text-xs font-semibold text-slate-700 hover:text-blue-600 transition-colors"
                  >
                    CS 2026 Curriculum Guide
                  </Link>
                  <span className="text-[9px] text-slate-400 font-semibold block">
                    Created 3 hours ago
                  </span>
                </li>
                <li>
                  <Link
                    href="/wiki/campus/hostels"
                    className="block text-xs font-semibold text-slate-700 hover:text-blue-600 transition-colors"
                  >
                    Hall of Residence - Sabarmati
                  </Link>
                  <span className="text-[9px] text-slate-400 font-semibold block">
                    Created 1 day ago
                  </span>
                </li>
              </ul>
            </div>
            <Link
              href="/wiki/page/1"
              className="text-[11px] font-bold text-blue-500 hover:text-blue-800 uppercase tracking-wider mt-4"
            >
              View all new pages
            </Link>
          </div>

          {/* Column 2: Updated Pages */}
          <div className="p-5 rounded-2xl border border-slate-150 bg-white hover:shadow-md transition-shadow duration-200 flex flex-col justify-between h-64 text-left">
            <div>
              <h3 className="text-sm font-black text-slate-900 font-serif mb-2.5">
                Updated Pages
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/wiki/campus/hostels"
                    className="block text-xs font-semibold text-slate-700 hover:text-blue-600 transition-colors"
                  >
                    Placement Statistics 2025
                  </Link>
                  <span className="text-[9px] text-slate-400 font-semibold block">
                    Updated 4 hours ago
                  </span>
                </li>
                <li>
                  <Link
                    href="/wiki/campus/hostels"
                    className="block text-xs font-semibold text-slate-700 hover:text-blue-600 transition-colors"
                  >
                    Amalthea Winter Theme FAQ
                  </Link>
                  <span className="text-[9px] text-slate-400 font-semibold block">
                    Updated 12 hours ago
                  </span>
                </li>
              </ul>
            </div>
            <Link
              href="/wiki/page/1"
              className="text-[11px] font-bold text-blue-500 hover:text-blue-800 uppercase tracking-wider mt-4"
            >
              View all edits
            </Link>
          </div>

          {/* Column 3: Pending Pages */}
          <div className="p-5 rounded-2xl border border-slate-150 bg-white hover:shadow-md transition-shadow duration-200 flex flex-col justify-between h-64 text-left">
            <div>
              <h3 className="text-sm font-black text-slate-900 font-serif mb-2.5">
                Pending Pages
              </h3>
              <ul className="space-y-3">
                <li>
                  <span className="block text-xs font-semibold text-slate-700">
                    CS placement stats update
                  </span>
                  <span className="text-[9px] text-slate-400 font-semibold block">
                    Submitted by Rohan Sharma · 2 hours ago
                  </span>
                </li>
                <li>
                  <span className="block text-xs font-semibold text-slate-700">
                    Palaj hostel laundry guide
                  </span>
                  <span className="text-[9px] text-slate-400 font-semibold block">
                    Submitted by Aditi Patel · 6 hours ago
                  </span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => {
                router.push("/wiki/campus/hostels");
                setTimeout(() => {
                  window.dispatchEvent(
                    new CustomEvent("show-wiki-pending")
                  );
                }, 250);
              }}
              className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-all duration-150 active:scale-97"
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
              1,248
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Total Articles
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 border-l border-slate-200/50 max-md:border-none select-none">
            <Languages className="h-5 w-5 text-emerald-600" />
            <span className="text-[14px] font-extrabold text-slate-800 mt-1">
              12+
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Guides Categories
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 border-l border-slate-200/50 max-md:border-none select-none">
            <Users2 className="h-5 w-5 text-purple-600" />
            <span className="text-[14px] font-extrabold text-slate-800 mt-1">
              184
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Active Editors
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 border-l border-slate-200/50 max-md:border-none select-none">
            <Eye className="h-5 w-5 text-amber-600" />
            <span className="text-[14px] font-extrabold text-slate-800 mt-1">
              54K+
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Monthly Views
            </span>
          </div>
        </div>
        
        {/* footer Credits */}
        <div className="pt-2 border-t border-slate-100 bg-white flex md:hidden flex-col items-center text-center gap-1.5 select-none mt-6">
          <div className="text-[10px] text-gray-400 font-medium flex items-center gap-1.5">
            <span>Made with</span>
            <Heart
              onClick={spawnHearts}
              className="w-4 h-4 text-red-500 fill-red-500 cursor-pointer hover:scale-130 transition-transform duration-200 animate-pulse"
            />
            <span>
              by{" "}
              <span className="font-semibold text-gray-600">
                Technical Council, IITGN
              </span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
