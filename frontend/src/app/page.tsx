"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users2,
  BookOpen,
  Trophy,
  Tent,
  FlaskConical,
  Sparkles,
  Search,
  Award,
  ArrowRight,
  Heart,
  Languages,
  Eye,
  Calendar,
  MapPin,
  HelpCircle,
  Menu,
  LucideIcon,
  Building2,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { QUICK_PORTALS } from "@/lib/constants";

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Collapsed by default
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const [activeTier, setActiveTier] = useState("gold");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/wiki?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/wiki");
    }
  };

  const spawnHearts = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    for (let i = 0; i < 8; i++) {
      const heart = document.createElement("div");
      heart.innerText = "❤️";
      heart.style.position = "fixed";
      heart.style.left = `${rect.left + rect.width / 2}px`;
      heart.style.top = `${rect.top + rect.height / 2}px`;
      heart.style.pointerEvents = "none";
      heart.style.fontSize = `${Math.random() * 12 + 12}px`;
      heart.style.zIndex = "9999";
      heart.style.transition = "all 0.8s cubic-bezier(0.25, 1, 0.5, 1)";

      const angle = Math.random() * Math.PI - Math.PI; // Upward fountain
      const velocity = Math.random() * 80 + 50;
      const x = Math.cos(angle) * velocity;
      const y = Math.sin(angle) * velocity - 30; // Extra upward float

      document.body.appendChild(heart);
      heart.getBoundingClientRect();

      heart.style.transform = `translate(${x}px, ${y}px) scale(0)`;
      heart.style.opacity = "0";

      setTimeout(() => {
        heart.remove();
      }, 800);
    }
  };

  const scrollToFeed = () => {
    const feedElement = document.getElementById("right-highlights-feed");
    if (feedElement) {
      feedElement.scrollIntoView({ behavior: "smooth" });
    }
  };
  const PORTAL_ICON_MAP: Record<string, LucideIcon> = {
    Building2,
    Users2,
    BookOpen,
    Trophy,
    Tent,
    MapPin,
    FlaskConical,
    Sparkles,
  };

  const renderPortalIcon = (
    iconName: string,
    colorTheme: { bg: string; icon: string }
  ) => {
    const IconComponent = PORTAL_ICON_MAP[iconName] || HelpCircle;

    return (
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorTheme.bg}`}
      >
        <IconComponent className={`h-5 w-5 ${colorTheme.icon}`} />
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50/30 overflow-hidden font-sans">
      {/* Main Container */}
      <div className="flex flex-1 relative overflow-y-auto lg:overflow-hidden w-full h-full">
        {/* Collapsible Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentTier={activeTier}
          onChangeTier={setActiveTier}
        />

        {/* Split Screen Layout */}
        <div className="flex-1 flex flex-col lg:flex-row h-auto lg:h-full w-full bg-white">
          {/* Left Panel: Fixed Dashboard on Desktop */}
          <div className="w-full lg:w-120 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-150 flex flex-col justify-between p-6 bg-white z-20 h-auto lg:h-full lg:overflow-y-auto select-none">
            <div className="space-y-2">
              {/* Header with Hamburger Menu and Profile Dropdown inside Left Panel */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 w-full shrink-0">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-650 transition-colors duration-200 cursor-pointer active:scale-95"
                  aria-label="Toggle Sidebar"
                >
                  <Menu className="h-5.5 w-5.5 text-black" />
                </button>
                <Link
                  href="/"
                  className="flex items-center gap-2 select-none cursor-pointer group"
                >
                  <div className="block">
                    <span className="font-serif text-2xl font-extrabold tracking-tight  text-blue-500">
                      META
                    </span>
                    <span className="ml-1 text-sm font-semibold uppercase tracking-wider text-gray-500">
                      IITGN
                    </span>
                  </div>
                </Link>
              </div>

              {/* Logo / Badge */}
              <div className="flex flex-col items-center text-center mt-1">
                <Link
                  href="/"
                  className="w-18 h-18 sm:w-20 sm:h-20 bg-blue-400 text-white rounded-full flex items-center justify-center font-serif font-black text-2xl sm:text-3xl shadow-md cursor-pointer hover:scale-105 transition-transform duration-300"
                >
                  mI
                </Link>
                <div className="mt-4">
                  <span className="block text-2xl font-serif font-black text-slate-900 tracking-tight">
                    1,248
                  </span>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    Articles & Campus Pages
                  </span>
                </div>
              </div>

              {/* Search Form */}
              <form
                onSubmit={handleSearchSubmit}
                className="relative flex items-center"
              >
                <div className="w-full flex items-center h-11 bg-slate-50 border border-slate-200 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-105 rounded-full px-4 transition-all duration-200">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs text-gray-800 placeholder:text-gray-400 bg-transparent focus:outline-none pr-8 h-full"
                  />
                  <button
                    type="submit"
                    className="text-slate-400 hover:text-blue-600 transition-colors absolute right-4 cursor-pointer"
                    aria-label="Search"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              </form>

              {/* Category Cards (Modern box type redirecting to category sub-pages) */}
              <div className="space-y-2 mt-6 lg:mt-8">
                <h2 className="text-xl font-serif text-center font-bold text-gray-900 tracking-tight">
                  Quick Portals
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  {QUICK_PORTALS.map((portal) => (
                    <Link
                      key={portal.name}
                      href={portal.path}
                      className={`flex items-center gap-2 p-3 rounded-xl border border-gray-150 bg-white hover:border-blue-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group`}
                    >
                      {renderPortalIcon(portal.iconName, portal.colorTheme)}
                      <span className="text-xs font-semibold text-gray-700 group-hover:text-blue-700 transition-colors duration-200">
                        {portal.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Credits Footer */}
            <div className="pt-2 border-t hidden border-slate-100 md:flex flex-col items-center text-center gap-1.5 select-none mt-6">
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
              <div className="text-[9px] text-gray-400 font-medium">
                © {new Date().getFullYear()} meta IITGN · Technical Council
                IITGN
              </div>
            </div>
          </div>

          {/* Right Panel: Scrollable Hero + Highlights Feed */}
          <div
            className="flex-1 h-auto lg:h-full lg:overflow-y-auto scroll-smooth relative"
            id="right-scroll-panel"
          >
            {/* Mountain Hero Banner */}
            <div className="relative w-full h-[85vh] lg:h-full min-h-125 hidden  md:flex flex-col items-center justify-center text-center p-6 bg-slate-900 overflow-hidden select-none">
              {/* Background Image with Dark Gradient Wash */}
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[15s] hover:scale-105"
                style={{ backgroundImage: "url('/mountain_bg.png')" }}
              />
              <div className="absolute inset-0 bg-linear-to-b from-slate-950/65 via-slate-900/45 to-slate-950/75" />

              {/* Hero Content */}
              <div className="relative z-10 max-w-2xl space-y-4 px-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-black text-white leading-tight tracking-tight text-shadow-premium">
                  Welcome to
                  Meta IITGN
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-slate-200/90 font-medium tracking-wide max-w-lg mx-auto leading-relaxed text-shadow-premium pt-2">
                  The collaborative campus encyclopedia that anyone can edit.
                </p>
              </div>

              {/* Pulsating Scroll Wheel Indicator */}
              <div
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer text-white/85 hover:text-white group select-none transition-opacity duration-300"
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
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
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
                  <div className="rounded-2xl border border-slate-150 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
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
                        An overview of the unique climate-resilient
                        architecture, passive cooling design, and ecological
                        corridors that make up the greenest campus in India.
                        Known for its 5-star GRIHA LD rating, the campus blends
                        cutting-edge civil engineering with natural contours.
                      </p>
                      <Link
                        href="/wiki"
                        className="inline-flex items-center gap-1 text-[11px] font-extrabold text-blue-500 hover:text-blue-800 uppercase tracking-wider pt-2"
                      >
                        Read full article <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* In the News */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h2 className="text-xl sm:text-2xl font-serif font-black text-gray-900 tracking-tight">
                      In the News
                    </h2>
                    <Link
                      href="/wiki"
                      className="text-xs font-bold text-blue-500 hover:text-blue-800 hover:underline"
                    >
                      View all
                    </Link>
                  </div>
                  <div className="p-5 rounded-2xl border border-slate-150 bg-white shadow-sm space-y-4 text-left h-94 flex flex-col justify-between">
                    <div className="space-y-4">
                      {/* Item 1 */}
                      <div className="flex items-start gap-3 border-b border-slate-100 pb-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                          <Sparkles className="h-4.5 w-4.5 text-blue-500" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 hover:text-blue-500 transition-colors line-clamp-2 cursor-pointer">
                            Annual Technical Fest Amalthea sets record
                            attendance with winter theme.
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
                            Sustainable Energy & Carbon Neutrality Research Hub
                            inaugurated at Palaj campus.
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
                            Technical Council announces upcoming Winter Campus
                            Hackathon starting next week.
                          </h4>
                          <span className="text-[10px] text-slate-400 mt-0.5 block font-semibold">
                            1 day ago
                          </span>
                        </div>
                      </div>
                    </div>

                    <Link
                      href="/wiki"
                      className="inline-flex items-center gap-1 text-[11px] font-extrabold text-blue-500 hover:text-blue-800 uppercase tracking-wider pt-2"
                    >
                      More campus news <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Three Column Highlights Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                {/* Column 1: Did You Know? */}
                <div className="p-5 rounded-2xl border border-slate-150 bg-white hover:shadow-md transition-shadow duration-200 flex flex-col justify-between h-56 text-left">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 font-serif mb-2.5">
                      Did You Know?
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Hostels at IIT Gandhinagar are named after famous rivers
                      in India, such as Sabarmati, Narmada, Shipra, and others,
                      fostering a strong residential community bond.
                    </p>
                  </div>
                  <Link
                    href="/wiki"
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
                    <div className="text-blue-605 text-xs font-extrabold mb-1.5">
                      {new Date().toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      In 2015, IIT Gandhinagar officially completed the
                      transition and began classes at its permanent campus in
                      Palaj on the banks of the Sabarmati River.
                    </p>
                  </div>
                  <Link
                    href="/wiki"
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
                      META IITGN is built and maintained by members of the
                      student body. Share your survival tips, course feedback,
                      research guidebooks, and project work.
                    </p>
                  </div>
                  <Link
                    href="/wiki"
                    className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-all duration-150 active:scale-97"
                  >
                    Start Contributing
                  </Link>
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
              <div className="pt-2 border-t  border-slate-100 bg-white flex md:hidden flex-col items-center text-center gap-1.5 select-none mt-6">
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
                <div className="text-[9px] text-gray-400 font-medium">
                  © {new Date().getFullYear()} meta IITGN · Technical Council
                  IITGN
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
