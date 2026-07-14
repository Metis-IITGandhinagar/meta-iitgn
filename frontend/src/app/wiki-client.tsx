"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { parseMarkdown, stringifyMarkdown } from "@/lib/utils";
import { InfoboxData } from "@/lib/types";
import { apiService } from "@/api";
import { useAuth } from "@/hooks/useAuth";

import { EditableCell } from "@/components/article/editable-cell";
import { useRouter } from "next/navigation";
import {
  Edit3,
  Check,
  X,
  History,
  PanelRight,
  PlusCircle,
  HelpCircle,
  Trash2,
  Pencil,
} from "lucide-react";
import BottomNavbar from "@/components/BottomNavbar";

// Subcomponents
import RevisionsView from "./components/wiki/RevisionsView";
import PendingChangesView from "./components/wiki/PendingChangesView";
import WikiInfoBox from "./components/wiki/WikiInfoBox";

// Dynamically import MilkdownEditor so it doesn't run during SSR
const MilkdownEditor = dynamic(() => import("@/components/article/milkdown-editor"), {
  ssr: false,
});

interface WikiClientProps {
  initialMarkdown: string;
  defaultEditing?: boolean;
  dbPageId?: number;
  version?: number;
  categorySlug?: string;
  initialMetadata?: any;
}

export default function WikiClient({ initialMarkdown, defaultEditing, dbPageId, categorySlug, initialMetadata }: WikiClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(defaultEditing || false);
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const parsed = useMemo(() => parseMarkdown(markdown), [markdown]);
  const [activeSection, setActiveSection] = useState<string>("");
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [toolbarContainer, setToolbarContainer] = useState<HTMLDivElement | null>(null);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

  const isNews = useMemo(() => {
    return parsed.infobox?.rows?.some((row: any) =>
      row.label?.toLowerCase() === "category" && typeof row.value === "string" && row.value?.toLowerCase() === "news"
    ) || false;
  }, [parsed]);

  const hideSidebar = isNews && isEditing;
  const actualSidebarOpen = rightSidebarOpen && !hideSidebar;

  const [rightWidth, setRightWidth] = useState(320);
  const [isMobile, setIsMobile] = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);
  const [showPendingChanges, setShowPendingChanges] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchPendingCount = useCallback(async () => {
    try {
      const data = await apiService.getPendingDrafts(dbPageId);
      const count = data.filter((d: any) => d.status === "in_review").length;
      setPendingCount(count);
    } catch (err) {
      console.error("Error fetching pending drafts count:", err);
    }
  }, [dbPageId]);

  useEffect(() => {
    fetchPendingCount();
    window.addEventListener("wiki-pending-updated", fetchPendingCount);
    return () => {
      window.removeEventListener("wiki-pending-updated", fetchPendingCount);
    };
  }, [fetchPendingCount]);

  useEffect(() => {
    const savedRight = localStorage.getItem("wiki-right-sidebar-width");
    if (savedRight) setRightWidth(Math.max(200, Number(savedRight)));

    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setRightSidebarOpen(false);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    const handleShowRevisions = () => {
      setShowRevisions(true);
      setShowPendingChanges(false);
    };
    const handleShowPending = () => {
      setShowPendingChanges(true);
      setShowRevisions(false);
    };
    const handleHideHistory = () => {
      setShowRevisions(false);
      setShowPendingChanges(false);
    };
    window.addEventListener("show-wiki-history", handleShowRevisions);
    window.addEventListener("show-wiki-revisions", handleShowRevisions);
    window.addEventListener("show-wiki-pending", handleShowPending);
    window.addEventListener("hide-wiki-history", handleHideHistory);
    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("show-wiki-history", handleShowRevisions);
      window.removeEventListener("show-wiki-revisions", handleShowRevisions);
      window.removeEventListener("show-wiki-pending", handleShowPending);
      window.removeEventListener("hide-wiki-history", handleHideHistory);
    };
  }, []);

  const startResizeRight = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rightWidth;
    let currentWidth = startWidth;
    const doDrag = (moveEvent: MouseEvent) => {
      currentWidth = Math.max(200, Math.min(600, startWidth - (moveEvent.clientX - startX)));
      setRightWidth(currentWidth);
    };
    const stopDrag = () => {
      document.removeEventListener("mousemove", doDrag);
      document.removeEventListener("mouseup", stopDrag);
      localStorage.setItem("wiki-right-sidebar-width", String(currentWidth));
    };
    document.addEventListener("mousemove", doDrag);
    document.addEventListener("mouseup", stopDrag);
  };

  const handleRightDoubleClick = () => {
    setRightWidth(320);
    localStorage.setItem("wiki-right-sidebar-width", "320");
  };

  const markdownRef = useRef(markdown);

  useEffect(() => {
    markdownRef.current = markdown;
  }, [markdown]);

  useEffect(() => {
    setEditorLoaded(false);
  }, [isEditing]);

  const debouncedSetMarkdown = useMemo(() => {
    let timeout: NodeJS.Timeout;
    return (value: string) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setMarkdown(value);
      }, 300);
    };
  }, []);

  const handleMarkdownChange = (newContentMarkdown: string) => {
    const newMarkdown = stringifyMarkdown(newContentMarkdown, parsed.infobox, parsed.title);
    markdownRef.current = newMarkdown;
    debouncedSetMarkdown(newMarkdown);
  };

  const handleTitleChange = (newTitle: string) => {
    const parsedLatest = parseMarkdown(markdownRef.current);
    const newMarkdown = stringifyMarkdown(parsedLatest.contentMarkdown, parsedLatest.infobox, newTitle);
    markdownRef.current = newMarkdown;
    setMarkdown(newMarkdown);
  };

  const handleInfoboxChange = (newInfobox: InfoboxData) => {
    const parsedLatest = parseMarkdown(markdownRef.current);
    const newMarkdown = stringifyMarkdown(parsedLatest.contentMarkdown, newInfobox, parsedLatest.title);
    markdownRef.current = newMarkdown;
    setMarkdown(newMarkdown);
  };

  const normalizeCategoryToSlug = (value: string): string => {
    const normalized = value.toLowerCase().trim();
    if (normalized === "campus facilities" || normalized === "facilities") return "facilities";
    if (normalized === "faculty profiles" || normalized === "faculty") return "faculty";
    if (normalized === "courses info" || normalized === "courses") return "courses";
    if (normalized === "research labs" || normalized === "research") return "research";
    if (normalized === "hostels guide" || normalized === "hostels") return "hostels";
    if (normalized === "student clubs" || normalized === "clubs") return "clubs";
    if (normalized === "institute fests" || normalized === "fests") return "fests";
    if (normalized === "placement stats" || normalized === "placements") return "placements";
    if (normalized === "institute policies" || normalized === "policies") return "policies";
    if (normalized === "academic calendar" || normalized === "calendar") return "calendar";
    return normalized;
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this article? This action cannot be undone.")) {
      return;
    }
    try {
      let currentSlug = initialMetadata?.slug;
      if (!currentSlug && typeof window !== "undefined") {
        currentSlug = window.location.pathname.split("/").pop();
      }
      if (!currentSlug) {
        alert("Could not identify article slug.");
        return;
      }
      await apiService.deletePage(currentSlug);
      alert("Article deleted successfully.");
      router.push(`/wiki/${categorySlug || "campus"}`);
    } catch (err: any) {
      console.error("Error deleting article:", err);
      alert(err.response?.data?.error || err.message || "Failed to delete article");
    }
  };

  const handleSave = async () => {
    try {
      let category = categorySlug || initialMetadata?.category || "campus";
      const categoryRow = parsed.infobox?.rows?.find((row: any) =>
        row.label?.toLowerCase() === "category"
      );
      if (categoryRow && categoryRow.value && typeof categoryRow.value === "string") {
        category = normalizeCategoryToSlug(categoryRow.value);
      } else {
        category = normalizeCategoryToSlug(category);
      }

      const isNew = !dbPageId;
      if (isNew && user?.role !== "admin" && user?.role !== "moderator") {
        alert("Only admins and moderators can create new articles.");
        return;
      }

      const description = parsed.infobox.description || "";
      const metadata = {
        category,
        description
      };

      if (isNew) {
        const response = await apiService.createPage({
          title: parsed.title || "Untitled Page",
          content: markdownRef.current,
          metadata
        });

        if (response && response.slug) {
          alert("Article created successfully!");
          router.push(`/wiki/${category}/${response.slug}`);
        }
      } else {
        let currentSlug = initialMetadata?.slug;
        if (!currentSlug && typeof window !== "undefined") {
          currentSlug = window.location.pathname.split("/").pop();
        }
        if (!currentSlug) {
          alert("Could not identify article slug.");
          return;
        }

        const response = await apiService.updatePage(currentSlug, {
          title: parsed.title || "Untitled Page",
          content: markdownRef.current,
          metadata
        });

        if (response) {
          alert("Article updated successfully!");
          setMarkdown(markdownRef.current);
          router.refresh();
        }
      }
    } catch (error: any) {
      console.error("Error saving article:", error);
      const detail = error.response?.data?.detail || error.response?.data?.error || error.response?.data?.message || error.message || "Unknown error";
      alert(`Failed to save article: ${detail}`);
    }
    setIsEditing(false);
  };

  useEffect(() => {
    const container = document.querySelector(".milkdown-container");
    if (!container) return;

    const headings = container.querySelectorAll("h2, h3");
    const seenIds: Record<string, number> = {};
    headings.forEach((heading) => {
      const text = heading.textContent || "";
      let baseId = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      if (!baseId) baseId = "heading";

      let finalId = baseId;
      if (seenIds[baseId] === undefined) {
        seenIds[baseId] = 0;
      } else {
        seenIds[baseId]++;
        finalId = `${baseId}-${seenIds[baseId]}`;
      }

      if (heading.id !== finalId) {
        heading.id = finalId;
      }
    });
  }, [editorLoaded]);

  useEffect(() => {
    const mainElement = document.querySelector("main");
    if (!mainElement) return;

    const container = document.querySelector(".milkdown-container");
    if (!container) return;

    const handleScroll = () => {
      const headingElements = Array.from(container.querySelectorAll("h2, h3"));
      if (headingElements.length === 0) return;

      const mainRect = mainElement.getBoundingClientRect();
      let currentActive = "";

      for (const el of headingElements) {
        const rect = el.getBoundingClientRect();
        if (rect.top - mainRect.top < 150) {
          currentActive = el.id;
        } else {
          break;
        }
      }

      if (currentActive && currentActive !== activeSection) {
        setActiveSection(currentActive);
      }
    };

    mainElement.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      mainElement.removeEventListener("scroll", handleScroll);
    };
  }, [editorLoaded, activeSection]);

  const handleTocClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const heading = document.getElementById(id);
    const mainElement = document.querySelector("main");
    if (heading && mainElement) {
      heading.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
    }
  };

  if (showRevisions) {
    return <RevisionsView setShowRevisions={setShowRevisions} />;
  }

  if (showPendingChanges) {
    return <PendingChangesView setShowPendingChanges={setShowPendingChanges} pageId={dbPageId} />;
  }

  return (
    <>
      {/* Mobile backdrop for the drawer — tap to close instead of shifting the whole page */}
      {isMobile && rightSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-[10000] lg:hidden animate-in fade-in duration-200"
          onClick={() => setRightSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content Wrapper */}
      <div className="flex flex-1 h-full mt-2 w-full min-w-full lg:min-w-0 overflow-hidden order-1">        {/* Main Scrollable Article Body */}
        <main className="flex-1 min-w-full lg:min-w-0 px-4 md:px-8 pt-20 pb-28 overflow-y-auto bg-base-100 relative scroll-smooth text-base-content">
          <article className="w-full max-w-5xl mx-auto space-y-6">
            {/* Teleported editor toolbar container */}
            {isEditing && (
              <div
                ref={setToolbarContainer}
                className="border border-base-300 rounded-xl bg-base-200 p-1.5 mb-6 milkdown flex items-center justify-center min-h-10"
              />
            )}
            {/* Title Header (Separated from editor to prevent accidental deletion) */}
            <div className="flex items-start justify-between gap-4">
              {isEditing ? (
                <EditableCell
                  initialValue={parsed.title}
                  onChange={handleTitleChange}
                  placeholder="Untitled Page"
                  className="text-3xl sm:text-4xl font-display font-black tracking-tight text-base-content w-full border-none focus:outline-none focus:ring-0 mb-8 bg-transparent placeholder-base-content/30"
                />
              ) : (
                <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-base-content mb-8">
                  {parsed.title}
                </h1>
              )}
              {!isEditing && (
                <button
                  onClick={() => {
                    if (!user) {
                      router.push("/login");
                      return;
                    }
                    setIsEditing(true);
                  }}
                  className="btn btn-primary btn-sm rounded-xl shrink-0"
                >
                  <Pencil className="h-4 w-4" /> Edit
                </button>
              )}
            </div>

            {/* Milkdown Editor */}
            <MilkdownEditor
              key={isEditing ? "edit" : "view"}
              initialMarkdown={parsed.contentMarkdown}
              onMarkdownChange={handleMarkdownChange}
              readOnly={!isEditing}
              onLoaded={() => setEditorLoaded(true)}
              toolbarContainer={toolbarContainer}
            />
          </article>
          {/* Material Design 3 Bottom Navigation Bar */}
          <BottomNavbar
            tabs={
              (isEditing
                ? [
                  {
                    id: "help",
                    label: "Help",
                    icon: HelpCircle,
                    onClick: () => {
                      const proceed = window.confirm(
                        "You are being redirected to an external site (Markdown Guide) for formatting help. Do you want to continue?"
                      );
                      if (proceed) {
                        window.open("https://www.markdownguide.org/basic-syntax/", "_blank");
                      }
                    },
                  },
                  {
                    id: "save",
                    label: "Save",
                    icon: Check,
                    onClick: handleSave,
                  },
                  {
                    id: "cancel",
                    label: "Cancel",
                    icon: X,
                    onClick: () => {
                      setMarkdown(initialMarkdown);
                      markdownRef.current = initialMarkdown;
                      if (dbPageId) {
                        setIsEditing(false);
                      } else {
                        if (window.history.length > 1) {
                          router.back();
                        } else {
                          router.push("/");
                        }
                      }
                    },
                    colorClass: "bg-error/10 text-error border border-error/20 hover:bg-error/20 hover:text-error",
                  },
                  {
                    id: "sidebar",
                    label: "Sidebar",
                    icon: PanelRight,
                    onClick: () => setRightSidebarOpen(!rightSidebarOpen),
                  },
                ]
                : [
                  (user?.role === "admin" || user?.role === "moderator") && {
                    id: "new",
                    label: "New Page",
                    icon: PlusCircle,
                    onClick: () => {
                      router.push(`/wiki/${categorySlug || "campus"}/new`);
                    },
                  },
                  (user?.role === "admin" || user?.role === "moderator") && {
                    id: "delete",
                    label: "Delete Page",
                    icon: Trash2,
                    onClick: handleDelete,
                    colorClass: "bg-error/10 text-error border border-error/20 hover:bg-error/20 hover:text-error",
                  },
                  {
                    id: "changes",
                    label: "Changes",
                    icon: History,
                    onClick: () => {
                      setShowPendingChanges(true);
                      setShowRevisions(false);
                      window.dispatchEvent(new CustomEvent("show-wiki-pending"));
                    },
                    badgeCount: pendingCount,
                  },
                  {
                    id: "edit",
                    label: "Edit Page",
                    icon: Edit3,
                    onClick: () => {
                      if (!user) {
                        router.push("/login");
                      } else {
                        setIsEditing(true);
                      }
                    },
                  },

                  {
                    id: "sidebar",
                    label: "Sidebar",
                    icon: PanelRight,
                    onClick: () => setRightSidebarOpen(!rightSidebarOpen),
                  },
                ].filter(Boolean) as any
              ).filter((tab: any) => tab.id !== "sidebar" || !hideSidebar)
            }
            activeTab={actualSidebarOpen ? "sidebar" : (isEditing ? "edit" : undefined)}
            style={{
              left: !isMobile && actualSidebarOpen ? `calc((100vw - ${rightWidth}px) / 2)` : "50%",
            }}
            className="fixed bottom-6 transform -translate-x-1/2 z-[9999]"
          />
        </main>
      </div>

      {/* InfoBox (Right Sidebar) */}
      <WikiInfoBox
        rightSidebarOpen={actualSidebarOpen}
        setRightSidebarOpen={setRightSidebarOpen}
        isMobile={isMobile}
        rightWidth={rightWidth}
        isEditing={isEditing}
        parsed={parsed}
        handleInfoboxChange={handleInfoboxChange}
        activeSection={activeSection}
        handleTocClick={handleTocClick}
        startResizeRight={startResizeRight}
        handleRightDoubleClick={handleRightDoubleClick}
      />
    </>
  );
}
