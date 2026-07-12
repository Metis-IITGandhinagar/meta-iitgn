"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Bookmark as BookmarkIcon,
  Home,
  ArrowLeft,
  Loader2,
  Pencil,
} from "lucide-react";
import { apiService } from "@/api";
import BottomNavbar from "@/components/BottomNavbar";
import { useAuth } from "@/hooks/useAuth";

// Subcomponents
import LeftPanel from "./components/home/LeftPanel";
import HomeTab from "./components/home/HomeTab";
import SearchTab from "./components/home/SearchTab";
import BookmarksTab from "./components/home/BookmarksTab";

// Overlays
import NewPagesOverlay from "./components/home/overlays/NewPagesOverlay";
import UpdatedPagesOverlay from "./components/home/overlays/UpdatedPagesOverlay";
import PendingPagesOverlay from "./components/home/overlays/PendingPagesOverlay";
import NewsOverlay from "./components/home/overlays/NewsOverlay";
import TriviaOverlay from "./components/home/overlays/TriviaOverlay";
import HistoryOverlay from "./components/home/overlays/HistoryOverlay";
import EditorsOverlay from "./components/home/overlays/EditorsOverlay";

export default function HomePage() {
  const { user, auth, loading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Collapsed by default
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  const [newPages, setNewPages] = useState<any[]>([]);
  const [updatedPages, setUpdatedPages] = useState<any[]>([]);
  const [pendingPages, setPendingPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAllNew, setShowAllNew] = useState(false);
  const [showAllUpdated, setShowAllUpdated] = useState(false);
  const [showAllPending, setShowAllPending] = useState(false);
  const [showAllNews, setShowAllNews] = useState(false);
  const [showAllTrivia, setShowAllTrivia] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [showAllEditors, setShowAllEditors] = useState(false);

  const [newsPages, setNewsPages] = useState<any[]>([]);
  const [activeNewsItem, setActiveNewsItem] = useState<any | null>(null);
  const [showAddNewsForm, setShowAddNewsForm] = useState(false);
  const [newNewsTitle, setNewNewsTitle] = useState("");
  const [newNewsContent, setNewNewsContent] = useState("");
  const [isSubmittingNews, setIsSubmittingNews] = useState(false);

  const [triviaPages, setTriviaPages] = useState<any[]>([]);
  const [activeTriviaItem, setActiveTriviaItem] = useState<any | null>(null);
  const [showAddTriviaForm, setShowAddTriviaForm] = useState(false);
  const [newTriviaTitle, setNewTriviaTitle] = useState("");
  const [newTriviaContent, setNewTriviaContent] = useState("");
  const [isSubmittingTrivia, setIsSubmittingTrivia] = useState(false);

  const [historyPages, setHistoryPages] = useState<any[]>([]);
  const [activeHistoryItem, setActiveHistoryItem] = useState<any | null>(null);
  const [showAddHistoryForm, setShowAddHistoryForm] = useState(false);
  const [newHistoryTitle, setNewHistoryTitle] = useState("");
  const [newHistoryContent, setNewHistoryContent] = useState("");
  const [isSubmittingHistory, setIsSubmittingHistory] = useState(false);

  const [editors, setEditors] = useState<any[]>([]);
  const [totalPagesCount, setTotalPagesCount] = useState<number | null>(null);

  const loadHomeData = async () => {
    try {
      const [recentNew, recentUpdated, pending, users, stats] = await Promise.all([
        apiService.getRecentNewPages(15),
        apiService.getRecentUpdatedPages(15),
        apiService.getPendingDrafts(),
        apiService.getUsers(),
        apiService.getPageStats(),
      ]);
      setNewPages(recentNew);
      setUpdatedPages(recentUpdated);
      setPendingPages(pending.filter((d: any) => d.status === "in_review"));
      setEditors(users);
      if (stats && typeof stats.totalPages === "number") {
        setTotalPagesCount(stats.totalPages);
      }

      // Fetch 10 recent new and 10 recent updated pages, merge and filter
      const [recentNewList, recentUpdatedList] = await Promise.all([
        apiService.getRecentNewPages(10),
        apiService.getRecentUpdatedPages(10)
      ]);

      const merged = [...recentNewList, ...recentUpdatedList];
      const uniquePagesMap = new Map();
      for (const page of merged) {
        uniquePagesMap.set(page.slug || page.page_id, page);
      }
      const uniquePages = Array.from(uniquePagesMap.values());

      const filteredNews = uniquePages.filter((p: any) => {
        return p.metadata && typeof p.metadata === "object" && 
          ((p.metadata as any).category?.toLowerCase() === "news");
      });

      // Sort by updated_at (or created_at fallback) desc
      filteredNews.sort((a: any, b: any) => {
        const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
        const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
        return dateB - dateA;
      });

      setNewsPages(filteredNews);

      const filteredTrivia = uniquePages.filter((p: any) => {
        return p.metadata && typeof p.metadata === "object" && 
          ((p.metadata as any).category?.toLowerCase() === "trivia");
      });
      filteredTrivia.sort((a: any, b: any) => {
        const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
        const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
        return dateB - dateA;
      });
      setTriviaPages(filteredTrivia);

      const filteredHistory = uniquePages.filter((p: any) => {
        return p.metadata && typeof p.metadata === "object" && 
          ((p.metadata as any).category?.toLowerCase() === "history");
      });
      filteredHistory.sort((a: any, b: any) => {
        const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
        const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
        return dateB - dateA;
      });
      setHistoryPages(filteredHistory);
    } catch (err) {
      console.error("Error loading home page activity lists:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, []);

  const handleReview = async (pendingId: number, action: "approve" | "reject") => {
    try {
      await apiService.reviewDraft(pendingId, {
        reviewer_id: user?.user_id || 0,
        action: action,
        rejection_reason: action === "reject" ? "Rejected by reviewer/moderator." : undefined,
      });
      alert(`Draft ${action === "approve" ? "approved and published" : "rejected"} successfully!`);
      loadHomeData();
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message || "Failed to process review"}`);
    }
  };

  const handleAddNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNewsTitle || !newNewsContent) return;
    setIsSubmittingNews(true);
    try {
      const slug = "news-" + newNewsTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const payload = {
        page_id: null,
        title: newNewsTitle,
        content: `---
image: https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=600
imageAlt: News Article
rows:
  - label: Category
    value: News
    type: text
---

# ${newNewsTitle}

${newNewsContent}`,
        metadata: { category: "news", slug },
        editor_id: 0,
        base_version: null,
      };

      await apiService.submitDraft(payload);
      alert("News page submitted for review!");
      setNewNewsTitle("");
      setNewNewsContent("");
      setShowAddNewsForm(false);
      loadHomeData();
    } catch (err: any) {
      console.error(err);
      alert(`Error submitting news: ${err.message || "Failed to submit"}`);
    } finally {
      setIsSubmittingNews(false);
    }
  };

  const handleAddTrivia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTriviaTitle || !newTriviaContent) return;
    setIsSubmittingTrivia(true);
    try {
      const slug = "trivia-" + newTriviaTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const payload = {
        page_id: null,
        title: newTriviaTitle,
        content: `---
image: https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600
imageAlt: Trivia Article
rows:
  - label: Category
    value: Trivia
    type: text
---

# ${newTriviaTitle}

${newTriviaContent}`,
        metadata: { category: "trivia", slug },
        editor_id: 0,
        base_version: null,
      };

      await apiService.submitDraft(payload);
      alert("Trivia page submitted for review!");
      setNewTriviaTitle("");
      setNewTriviaContent("");
      setShowAddTriviaForm(false);
      loadHomeData();
    } catch (err: any) {
      console.error(err);
      alert(`Error submitting trivia: ${err.message || "Failed to submit"}`);
    } finally {
      setIsSubmittingTrivia(false);
    }
  };

  const handleAddHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHistoryTitle || !newHistoryContent) return;
    setIsSubmittingHistory(true);
    try {
      const slug = "history-" + newHistoryTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const payload = {
        page_id: null,
        title: newHistoryTitle,
        content: `---
image: https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600
imageAlt: History Article
rows:
  - label: Category
    value: History
    type: text
---

# ${newHistoryTitle}

${newHistoryContent}`,
        metadata: { category: "history", slug },
        editor_id: 0,
        base_version: null,
      };

      await apiService.submitDraft(payload);
      alert("History page submitted for review!");
      setNewHistoryTitle("");
      setNewHistoryContent("");
      setShowAddHistoryForm(false);
      loadHomeData();
    } catch (err: any) {
      console.error(err);
      alert(`Error submitting history: ${err.message || "Failed to submit"}`);
    } finally {
      setIsSubmittingHistory(false);
    }
  };

  function getRelativeTime(dateString: string) {
    if (!dateString) return "some time ago";
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  }

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
    const q = searchQuery.trim();
    if (!q) {
      return;
    }
    router.push(
      `/search-results?query=${encodeURIComponent(q)}`
    );
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

  if (authLoading || auth === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

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
                
                const buttonStyle = !isScrolled
                  ? (isActive
                      ? "bg-white/20 text-white border border-white/25 shadow-xs"
                      : "text-white/70 hover:bg-white/10 hover:text-white")
                  : (isActive
                      ? "bg-slate-900/15 text-slate-950 border border-slate-900/20 shadow-xs"
                      : "text-slate-700 hover:bg-slate-900/5 hover:text-slate-950");

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
                setShowAllNew={setShowAllNew}
                setShowAllUpdated={setShowAllUpdated}
                setShowAllPending={setShowAllPending}
                newPages={newPages}
                updatedPages={updatedPages}
                pendingPages={pendingPages}
                loading={loading}
                getRelativeTime={getRelativeTime}
                newsPages={newsPages}
                setShowAllNews={setShowAllNews}
                setActiveNewsItem={setActiveNewsItem}
                triviaPages={triviaPages}
                setShowAllTrivia={setShowAllTrivia}
                setActiveTriviaItem={setActiveTriviaItem}
                historyPages={historyPages}
                setShowAllHistory={setShowAllHistory}
                setActiveHistoryItem={setActiveHistoryItem}
                editors={editors}
                setShowAllEditors={setShowAllEditors}
                totalPagesCount={totalPagesCount}
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
      {/* Dynamic Overlays */}
      <NewPagesOverlay
        isOpen={showAllNew}
        onClose={() => setShowAllNew(false)}
        newPages={newPages}
        getRelativeTime={getRelativeTime}
      />

      <UpdatedPagesOverlay
        isOpen={showAllUpdated}
        onClose={() => setShowAllUpdated(false)}
        updatedPages={updatedPages}
        getRelativeTime={getRelativeTime}
      />

      <PendingPagesOverlay
        isOpen={showAllPending}
        onClose={() => setShowAllPending(false)}
        pendingPages={pendingPages}
        getRelativeTime={getRelativeTime}
        handleReview={handleReview}
      />

      <NewsOverlay
        isOpen={showAllNews}
        onClose={() => setShowAllNews(false)}
        newsPages={newsPages}
        activeNewsItem={activeNewsItem}
        setActiveNewsItem={setActiveNewsItem}
        showAddNewsForm={showAddNewsForm}
        setShowAddNewsForm={setShowAddNewsForm}
        newNewsTitle={newNewsTitle}
        setNewNewsTitle={setNewNewsTitle}
        newNewsContent={newNewsContent}
        setNewNewsContent={setNewNewsContent}
        isSubmittingNews={isSubmittingNews}
        handleAddNews={handleAddNews}
        getRelativeTime={getRelativeTime}
      />

      <TriviaOverlay
        isOpen={showAllTrivia}
        onClose={() => setShowAllTrivia(false)}
        triviaPages={triviaPages}
        activeTriviaItem={activeTriviaItem}
        setActiveTriviaItem={setActiveTriviaItem}
        showAddTriviaForm={showAddTriviaForm}
        setShowAddTriviaForm={setShowAddTriviaForm}
        newTriviaTitle={newTriviaTitle}
        setNewTriviaTitle={setNewTriviaTitle}
        newTriviaContent={newTriviaContent}
        setNewTriviaContent={setNewTriviaContent}
        isSubmittingTrivia={isSubmittingTrivia}
        handleAddTrivia={handleAddTrivia}
        getRelativeTime={getRelativeTime}
      />

      <HistoryOverlay
        isOpen={showAllHistory}
        onClose={() => setShowAllHistory(false)}
        historyPages={historyPages}
        activeHistoryItem={activeHistoryItem}
        setActiveHistoryItem={setActiveHistoryItem}
        showAddHistoryForm={showAddHistoryForm}
        setShowAddHistoryForm={setShowAddHistoryForm}
        newHistoryTitle={newHistoryTitle}
        setNewHistoryTitle={setNewHistoryTitle}
        newHistoryContent={newHistoryContent}
        setNewHistoryContent={setNewHistoryContent}
        isSubmittingHistory={isSubmittingHistory}
        handleAddHistory={handleAddHistory}
        getRelativeTime={getRelativeTime}
      />

      <EditorsOverlay
        isOpen={showAllEditors}
        onClose={() => setShowAllEditors(false)}
        editors={editors}
      />
    </div>
  );
}
