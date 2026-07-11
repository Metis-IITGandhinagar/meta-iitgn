"use client";

import { useState, useEffect } from "react";
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
  Home as HomeIcon,
  Bookmark as BookmarkIcon,
  PlusCircle,
  Trash2,
  CheckCircle2,
  Shield,
  Home,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import BottomNavbar from "@/components/BottomNavbar";
import { QUICK_PORTALS } from "@/lib/constants";

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Collapsed by default
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = "/homepage_bg.png";
    img.onload = () => setImageLoaded(true);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 45,
        y: (e.clientY / window.innerHeight - 0.5) * 45,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const [activeTier, setActiveTier] = useState("gold");
  const [activeTab, setActiveTab] = useState<"home" | "search" | "bookmarks">(
    "home"
  );

  // Search tab states
  const [searchTabQuery, setSearchTabQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("All");

  // Bookmarks states
  const [bookmarks, setBookmarks] = useState<
    Array<{ id: string; title: string; category: string; description: string }>
  >([]);

  // Create page states
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageCategory, setNewPageCategory] = useState("Campus");
  const [newPageContent, setNewPageContent] = useState("");
  const [createSuccess, setCreateSuccess] = useState(false);

  // Load bookmarks on mount
  useEffect(() => {
    const saved = localStorage.getItem("wiki-bookmarks");
    if (saved) {
      try {
        setBookmarks(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    } else {
      const defaultBookmarks = [
        {
          id: "1",
          title: "IIT Gandhinagar Campus & Architecture",
          category: "Campus",
          description:
            "Overview of the greenest campus in India and its GRIHA LD rating.",
        },
        {
          id: "2",
          title: "Amalthea Technical Summit",
          category: "Fests",
          description:
            "The annual student-run technical festival of IIT Gandhinagar.",
        },
        {
          id: "3",
          title: "Academic Courses Directory",
          category: "Academics",
          description: "Directory of undergraduate and postgraduate courses.",
        },
      ];
      setBookmarks(defaultBookmarks);
      localStorage.setItem("wiki-bookmarks", JSON.stringify(defaultBookmarks));
    }
  }, []);

  const removeBookmark = (id: string) => {
    const updated = bookmarks.filter((b) => b.id !== id);
    setBookmarks(updated);
    localStorage.setItem("wiki-bookmarks", JSON.stringify(updated));
  };

  const handleCreatePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageTitle.trim() || !newPageContent.trim()) return;

    // Simulate backend creation by adding to bookmarks or alert
    const newPage = {
      id: Date.now().toString(),
      title: newPageTitle.trim(),
      category: newPageCategory,
      description:
        newPageContent.trim().substring(0, 100) +
        (newPageContent.length > 100 ? "..." : ""),
    };

    const updatedBookmarks = [newPage, ...bookmarks];
    setBookmarks(updatedBookmarks);
    localStorage.setItem("wiki-bookmarks", JSON.stringify(updatedBookmarks));

    setCreateSuccess(true);
    setNewPageTitle("");
    setNewPageContent("");

    setTimeout(() => {
      setCreateSuccess(false);
      setActiveTab("bookmarks"); // Redirect to bookmarks/saved list to show the new page
    }, 1500);
  };

  const allSearchableItems = [
    {
      title: "IIT Gandhinagar Campus & Architecture",
      category: "Campus",
      path: "/wiki/page/1",
      description:
        "Information about Palaj campus facilities, design, architecture, and construction.",
    },
    {
      title: "Amalthea Technical Summit",
      category: "Fests",
      path: "/wiki/page/1",
      description: "The student-organized technical summit of IIT Gandhinagar.",
    },
    {
      title: "Hostels and Student Life",
      category: "Campus",
      path: "/wiki/page/1",
      description:
        "Everything about hostels, Mess dining, and student council rules.",
    },
    {
      title: "Technical Council & Clubs",
      category: "Clubs",
      path: "/wiki/page/1",
      description:
        "Explore robotics, coding, animanga, astronomy, and developer clubs.",
    },
    {
      title: "Computer Science Curriculum",
      category: "Academics",
      path: "/wiki/page/1",
      description: "Undergraduate curriculum and course plans for CS major.",
    },
    {
      title: "Research Labs & Facilities",
      category: "Research",
      path: "/wiki/page/1",
      description:
        "Directory of advanced research instrumentation and centers.",
    },
  ];

  const filteredSearchItems = allSearchableItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTabQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTabQuery.toLowerCase());
    const matchesCategory =
      searchCategory === "All" || item.category === searchCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(
        `/wiki/page/1?search=${encodeURIComponent(searchQuery.trim())}`
      );
    } else {
      router.push("/wiki/page/1");
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

  const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
    Campus: Building2,
    Academics: BookOpen,
    Clubs: Users2,
    Fests: Trophy,
    Research: FlaskConical,
    Policies: Shield,
    All: Sparkles,
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return <span>{text}</span>;
    const parts = text.split(
      new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")})`, "gi")
    );
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark
              key={i}
              className="bg-yellow-150 text-blue-900 rounded-sm px-0.5 font-bold"
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const homeTabs = [
    {
      id: "home",
      label: "Home",
      icon: HomeIcon,
      onClick: () => setActiveTab("home"),
    },
    {
      id: "search",
      label: "Search",
      icon: Search,
      onClick: () => setActiveTab("search"),
    },
    {
      id: "bookmarks",
      label: "Bookmarks",
      icon: BookmarkIcon,
      onClick: () => setActiveTab("bookmarks"),
    },
  ];

  return (
    <div className="flex flex-col min-h-screen lg:h-screen bg-gray-50/30 overflow-y-auto lg:overflow-hidden font-sans">
      {/* Main Container */}
      <div className="flex flex-1 relative overflow-visible lg:overflow-hidden w-full h-auto lg:h-full">
        {/* Collapsible Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentTier={activeTier}
          onChangeTier={setActiveTier}
        />

        {/* Split Screen Layout */}
        <div
          className={`flex-1 flex flex-col lg:flex-row h-auto lg:h-full w-full bg-white relative min-w-full shrink-0 lg:min-w-0 lg:shrink transition-transform duration-300 ease-in-out`}
        >
          {/* Left Panel: Fixed Dashboard on Desktop */}
          <div
            className={`w-full lg:w-120 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-150 flex flex-col justify-between p-4 bg-white z-20 h-auto lg:h-full mb-10 md:mb-0 overflow-y-visible lg:overflow-hidden select-none pb-0 lg:pb-6 ${
              activeTab !== "home" ? "hidden lg:flex" : "flex"
            }`}
          >
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
                  onClick={() => setActiveTab("home")}
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
                <div
                  className="w-full flex items-center h-11 bg-slate-50 border border-slate-200 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-105 rounded-full px-4 transition-all duration-200"
                  onClick={() => setActiveTab("search")}
                >
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
                      className={`flex items-center gap-2 p-3 rounded-xl border border-gray-150 bg-white shadow-xs hover:scale-105 transition-all duration-100 ease-in-out cursor-pointer group`}
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
            <div className="pt-4 border-t hidden lg:flex border-slate-100  flex-col items-center text-center gap-1.5 select-none mt-6">
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
              <div className="text-[10px] font-semibold text-gray-400 mt-0.5">
                © {new Date().getFullYear()} IIT Gandhinagar
              </div>
            </div>
          </div>

          {/* Right Panel: Scrollable Hero + Highlights Feed */}
          <div
            className="flex-1 h-auto lg:h-full overflow-y-visible lg:overflow-y-auto  scroll-smooth relative"
            id="right-scroll-panel"
          >
            {/* slimnav bar for desktop only with bookmark , serach and newpage  */}
            <div className="hidden lg:flex sticky w-full justify-end top-0 z-30 items-center gap-1  bg-white/20  border-b border-white/10 shadow-[0_1px_12px_rgba(0,0,0,0.06)] px-6 py-1.5 select-none">
              {[
                { id: "home", label: "Home", icon: Home },
                { id: "search", label: "Search", icon: Search },
                { id: "bookmarks", label: "Bookmarks", icon: BookmarkIcon },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() =>
                      setActiveTab(tab.id as "home" | "search" | "bookmarks")
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors duration-150 cursor-pointer ${
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
            {activeTab === "home" ? (
              <>
                {/* Mountain Hero Banner */}
                <div className="relative w-full h-[85vh] lg:h-dvh min-h-125 hidden  md:flex flex-col items-center justify-center text-center p-6 bg-slate-900 overflow-hidden select-none">
                  {/* Background Image with Dark Gradient Wash */}
                  <div
                    className="absolute top-0 inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                      backgroundImage: "url('/homepage_bg.png')",
                      transform: `translate(${mousePos.x}px, ${mousePos.y}px) scale(1.15)`,
                      transition:
                        "transform 0.15s cubic-bezier(0.25, 1, 0.5, 1)",
                    }}
                  />
                  <div className="absolute inset-0 bg-linear-to-b  via-slate-900/45 to-slate-950/65" />

                  <style>{`
                @keyframes gradient-x {
                  0%, 100% { background-position: 0% 50%; }
                  50% { background-position: 100% 50%; }
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
                      A collaborative space where anyone on campus can write and
                      edit about anything.
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
                            An overview of the unique climate-resilient
                            architecture, passive cooling design, and ecological
                            corridors that make up the greenest campus in India.
                            Known for its 5-star GRIHA LD rating, the campus
                            blends cutting-edge civil engineering with natural
                            contours.
                          </p>
                          <Link
                            href="/wiki/page/1"
                            className="inline-flex items-center gap-1 text-[11px] font-extrabold text-blue-500 hover:text-blue-800 uppercase tracking-wider pt-2"
                          >
                            Read full article{" "}
                            <ArrowRight className="h-3.5 w-3.5" />
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
                                Sustainable Energy & Carbon Neutrality Research
                                Hub inaugurated at Palaj campus.
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
                                Technical Council announces upcoming Winter
                                Campus Hackathon starting next week.
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
                          More campus news{" "}
                          <ArrowRight className="h-3.5 w-3.5" />
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
                          Hostels at IIT Gandhinagar are named after famous
                          rivers in India, such as Sabarmati, Narmada, Shipra,
                          and others, fostering a strong residential community
                          bond.
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
                          In 2015, IIT Gandhinagar officially completed the
                          transition and began classes at its permanent campus
                          in Palaj on the banks of the Sabarmati River.
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
                          META IITGN is built and maintained by members of the
                          student body. Share your survival tips, course
                          feedback, research guidebooks, and project work.
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
                  </div>
                </div>
              </>
            ) : activeTab === "search" ? (
              <div className="h-full flex flex-col overflow-hidden bg-[#FCFCFD]">
                {/* Sticky App Header */}
                <div className="sticky top-0 z-20 bg-white border-b border-slate-100 p-6 md:p-8 shrink-0 select-none space-y-4">
                  <div className="text-center md:text-left flex">
                    <div>
                      <h1 className="text-2xl font-serif font-black text-slate-900 tracking-tight">
                        Search
                      </h1>
                      <p className="text-xs text-slate-500 font-semibold">
                        Explore student guides, course details, and campus
                        resources.
                      </p>
                    </div>
                    
                  </div>

                  {/* Sticky Search bar */}
                  <div className="relative w-full flex items-center h-11 bg-slate-50 border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-105 rounded-xl px-4 transition-all duration-200 shadow-sm">
                    <Search className="h-4 w-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search articles, guides, policies..."
                      value={searchTabQuery}
                      onChange={(e) => setSearchTabQuery(e.target.value)}
                      className="w-full text-xs text-slate-800 placeholder:text-gray-400 bg-transparent focus:outline-none px-3 h-full"
                      autoFocus
                    />
                    {searchTabQuery && (
                      <button
                        onClick={() => setSearchTabQuery("")}
                        className="text-slate-400 hover:text-slate-655 text-[10px] font-bold px-2 py-0.5 bg-slate-200 rounded-md cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Sticky Category Pills */}
                  <div className="flex flex-wrap gap-1.5 justify-start select-none">
                    {[
                      "All",
                      "Campus",
                      "Academics",
                      "Clubs",
                      "Fests",
                      "Research",
                    ].map((cat) => {
                      const Icon = CATEGORY_ICON_MAP[cat] || HelpCircle;
                      return (
                        <button
                          key={cat}
                          onClick={() => setSearchCategory(cat)}
                          className={`px-3.5 py-1 rounded-lg text-[10px] font-extrabold border transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                            searchCategory === cat
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                              : "bg-white text-slate-600 border-gray-400 hover:border-slate-350 hover:bg-slate-55"
                          }`}
                        >
                          <Icon className="h-3 w-3 shrink-0" />
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Scrollable Results Viewport */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 no-scrollbar">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest select-none">
                    Search Results ({filteredSearchItems.length})
                  </h3>

                  {filteredSearchItems.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {filteredSearchItems.map((item) => {
                        const Icon =
                          CATEGORY_ICON_MAP[item.category] || HelpCircle;
                        return (
                          <Link
                            key={item.title}
                            href={item.path}
                            className="p-4 rounded-xl border border-slate-150 bg-white hover:border-blue-200 hover:shadow-md transition-all duration-200 flex flex-col gap-2 group text-left cursor-pointer shadow-depth shadow-depth-hover"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] uppercase font-black tracking-wider text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Icon className="w-2.5 h-2.5" />
                                {item.category}
                              </span>
                              <span className="text-[9px] font-bold text-gray-400">
                                3 min read
                              </span>
                            </div>
                            <h4 className="text-sm text-black  font-bold group-hover:text-blue-600 transition-colors font-serif">
                              {highlightText(item.title, searchTabQuery)}
                            </h4>
                            <p className="text-xs text-slate-500  leading-relaxed">
                              {highlightText(item.description, searchTabQuery)}
                            </p>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200/80">
                      <HelpCircle className="h-8 w-8 text-slate-300 mx-auto mb-2 animate-pulse" />
                      <p className="text-xs text-slate-500 font-bold">
                        No matching articles found
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === "bookmarks" ? (
              <div className="h-full flex flex-col overflow-hidden bg-[#FCFCFD] pb-24">
                <div className="max-w-2xl mx-auto w-full animate-hero-content">
                  {/* Sticky App Header */}
                  <div className="p-6  border-b border-slate-100 bg-white shrink-0 select-none flex items-center justify-between">
                    <div className="sticky">
                      <h1 className="text-2xl font-serif font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <BookmarkIcon className="h-6 w-6 text-blue-500 fill-blue-500" />
                        Bookmarks
                      </h1>
                      <p className="text-xs text-slate-500 font-semibold">
                        Your saved guides and pages.
                      </p>
                    </div>

                    {bookmarks.length > 0 && (
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              "Are you sure you want to clear all bookmarks?"
                            )
                          ) {
                            setBookmarks([]);
                            localStorage.removeItem("wiki-bookmarks");
                          }
                        }}
                        className="text-[10px] font-extrabold text-rose-500 hover:text-rose-700 transition-colors uppercase tracking-wider cursor-pointer px-3 py-1.5 hover:bg-rose-55 rounded-lg border border-red-400"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {/* Scrollable Viewport */}
                  <div className="flex-1 overflow-y-auto p-6 md:p-8 pb-28 space-y-4 no-scrollbar">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest select-none">
                      Saved Pages ({bookmarks.length})
                    </h3>

                    {bookmarks.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {bookmarks.map((item) => {
                          const Icon =
                            CATEGORY_ICON_MAP[item.category] || HelpCircle;
                          const pagePath = `/wiki/${item.category.toLowerCase()}/${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
                          return (
                            <div
                              key={item.id}
                              className="p-4 rounded-xl border border-slate-150 bg-white hover:border-blue-200 hover:shadow-md transition-all duration-200 flex flex-col gap-2.5 text-left shadow-depth shadow-depth-hover"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] uppercase font-black tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Icon className="w-2.5 h-2.5" />
                                  {item.category}
                                </span>
                                <button
                                  onClick={() => removeBookmark(item.id)}
                                  className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-55 rounded-lg transition-colors cursor-pointer"
                                  title="Remove Bookmark"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <Link href={pagePath} className="group">
                                <h4 className="text-sm font-black text-slate-800 group-hover:text-blue-600 transition-colors font-serif">
                                  {item.title}
                                </h4>
                              </Link>
                              <p className="text-xs text-slate-500  leading-relaxed">
                                {item.description}
                              </p>
                              <Link
                                href={pagePath}
                                className="inline-flex items-center gap-1 text-[9px] font-extrabold text-blue-500 hover:text-blue-800 uppercase tracking-wider self-start pt-0.5"
                              >
                                Read Article <ArrowRight className="h-3 w-3" />
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200/80">
                        <BookmarkIcon className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-slate-500 font-bold">
                          Your reading list is empty
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Bookmark wiki pages to save them here for offline
                          access.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <></>
            )}
          </div>
        </div>
        {/* Floating Bottom Navbar on Mobile/Tablet */}
        {!sidebarOpen && (
          <BottomNavbar
            tabs={homeTabs}
            activeTab={activeTab}
            className="fixed lg:hidden bottom-6 left-1/2 transform -translate-x-1/2 lg:left-[calc(50vw+15rem)] z-9999"
          />
        )}
      </div>
    </div>
  );
}
