"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Bookmark as BookmarkIcon,
  Home,
} from "lucide-react";
import BottomNavbar from "@/components/BottomNavbar";

// Subcomponents
import LeftPanel from "./components/home/LeftPanel";
import HomeTab from "./components/home/HomeTab";
import SearchTab from "./components/home/SearchTab";
import BookmarksTab from "./components/home/BookmarksTab";

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
  const [isScrolled, setIsScrolled] = useState(false);

  // Search tab states
  const [searchTabQuery, setSearchTabQuery] = useState("");

  // Bookmarks states
  const [bookmarks, setBookmarks] = useState<
    Array<{ id: string; title: string; category: string; description: string }>
  >([]);

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
          title: "Computer Science & Engineering",
          category: "departments",
          slug: "computer-science",
          description:
            "A leading department focused on AI, machine learning, systems, theory, and cryptography.",
        },
        {
          id: "2",
          title: "Amalthea",
          category: "fests",
          slug: "amalthea",
          description:
            "IITGN's annual technical summit showcasing innovations, technical contests, and guest lectures.",
        },
        {
          id: "3",
          title: "CS 101: Introduction to Computing",
          category: "courses",
          slug: "cs-101",
          description: "A foundational course introducing algorithms, Python programming, and computational thinking.",
        },
        {
          id: "4",
          title: "The Coding Club",
          category: "clubs",
          slug: "coding-club",
          description: "The premier student tech hub for developers, competitive programmers, and designers.",
        },
        {
          id: "5",
          title: "Cognitive Science Laboratory",
          category: "research",
          slug: "cognitive-science-lab",
          description: "Interdisciplinary research combining neuroscience, psychology, and artificial intelligence.",
        },
        {
          id: "6",
          title: "Grading Policy",
          category: "policies",
          slug: "grading-policy",
          description: "Details on letter grades, cumulative performance indices (CPI), and minimum passing scores.",
        },
      ];
      setBookmarks(defaultBookmarks);
      localStorage.setItem("wiki-bookmarks", JSON.stringify(defaultBookmarks));
    }
  }, []);

  // Scroll to top and reset scroll state on tab change
  useEffect(() => {
    const panel = document.getElementById("right-scroll-panel");
    if (panel) {
      panel.scrollTop = 0;
    }
    setIsScrolled(false);
  }, [activeTab]);

  const removeBookmark = (id: string) => {
    const updated = bookmarks.filter((b) => b.id !== id);
    setBookmarks(updated);
    localStorage.setItem("wiki-bookmarks", JSON.stringify(updated));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(
        `/search-results?query=${encodeURIComponent(searchQuery.trim())}`
      );
    } else {
      router.push("/search-results");
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

  const homeTabs = [
    {
      id: "home",
      label: "Home",
      icon: Home,
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
    <div className="flex flex-col min-h-screen lg:h-screen bg-white overflow-y-auto lg:overflow-hidden font-sans">
      {/* Main Container */}
      <div className="flex flex-col lg:flex-row flex-1 relative overflow-visible lg:overflow-hidden w-full h-auto lg:h-full">
        {/* Left panel & collapsible sidebar */}
        <LeftPanel
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeTier={activeTier}
          setActiveTier={setActiveTier}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSearchSubmit={handleSearchSubmit}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          spawnHearts={spawnHearts}
        />

        {/* Split Screen Layout */}
        <div
          className="flex-1 flex flex-col lg:flex-row h-auto lg:h-full w-full bg-white relative min-w-full shrink-0 lg:min-w-0 lg:shrink transition-transform duration-300 ease-in-out"
        >
          {/* Right Panel: Scrollable Hero + Highlights Feed */}
          <div
            className="flex-1 h-auto lg:h-full overflow-y-visible lg:overflow-y-auto scroll-smooth relative"
            id="right-scroll-panel"
            onScroll={(e) => {
              const threshold = activeTab === "home" ? (window?.innerHeight || 700) - 80 : 50;
              const scrolled = e.currentTarget.scrollTop > threshold;
              if (scrolled !== isScrolled) {
                setIsScrolled(scrolled);
              }
            }}
          >
            {/* Slim navigation bar for desktop only */}
            <div className={`hidden lg:flex sticky mx-auto w-fit top-3 z-30 items-center gap-1 transition-all duration-300 px-4 py-1.5 rounded-full select-none -mb-11 ${
              activeTab === "home" && !isScrolled
                ? "bg-white/10 backdrop-blur-md border border-white/10 shadow-none"
                : "bg-white/25 backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)]"
            }`}>
              {[
                { id: "home", label: "Home", icon: Home },
                { id: "search", label: "Search", icon: Search },
                { id: "bookmarks", label: "Bookmarks", icon: BookmarkIcon },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                let buttonStyle = "";
                if (activeTab === "home" && !isScrolled) {
                  buttonStyle = isActive
                    ? "bg-white/20 text-white border border-white/25 shadow-xs"
                    : "text-white/70 hover:bg-white/10 hover:text-white";
                } else {
                  buttonStyle = isActive
                    ? "bg-blue-500/15 text-blue-700 border border-blue-500/20 shadow-xs"
                    : "text-slate-700 hover:bg-slate-900/5 hover:text-slate-900";
                }

                return (
                  <button
                    key={tab.id}
                    onClick={() =>
                      setActiveTab(tab.id as "home" | "search" | "bookmarks")
                    }
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-200 cursor-pointer ${buttonStyle}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {activeTab === "home" ? (
              <HomeTab
                mousePos={mousePos}
                imageLoaded={imageLoaded}
                scrollToFeed={scrollToFeed}
                spawnHearts={spawnHearts}
              />
            ) : activeTab === "search" ? (
              <SearchTab
                searchTabQuery={searchTabQuery}
                setSearchTabQuery={setSearchTabQuery}
                mousePos={mousePos}
              />
            ) : activeTab === "bookmarks" ? (
              <BookmarksTab
                bookmarks={bookmarks}
                setBookmarks={setBookmarks}
                removeBookmark={removeBookmark}
                setActiveTab={setActiveTab}
                mousePos={mousePos}
              />
            ) : null}
          </div>
        </div>
        {/* Floating Bottom Navbar on Mobile/Tablet */}
        {!sidebarOpen && (
          <BottomNavbar
            tabs={homeTabs}
            activeTab={activeTab}
            showLabels={false}
            className="fixed lg:hidden bottom-6 left-1/2 transform -translate-x-1/2 lg:left-[calc(50vw+15rem)] z-9999"
          />
        )}
      </div>
    </div>
  );
}
