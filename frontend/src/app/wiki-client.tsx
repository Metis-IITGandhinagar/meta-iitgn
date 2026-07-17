"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { parseMarkdown, stringifyMarkdown } from "@/lib/utils";
import { InfoboxData } from "@/lib/types";
import { apiService } from "@/api";
import { useAuth } from "@/hooks/useAuth";

import { EditableCell } from "@/components/article/editable-cell";
import { useRouter, useSearchParams } from "next/navigation";
import { parseModalParams, buildQuery } from "@/lib/modalUrl";
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
import MessMenuView from "@/components/article/MessMenuView";
import MessMenuOverlay from "@/app/components/home/overlays/MessMenuOverlay";
import TransportView from "@/components/article/TransportView";
import TransportOverlay from "@/app/components/home/overlays/TransportOverlay";

// Dynamically import MilkdownEditor so it doesn't run during SSR
const MilkdownEditor = dynamic(
  () => import("@/components/article/milkdown-editor"),
  {
    ssr: false,
  }
);

interface WikiClientProps {
  initialMarkdown: string;
  defaultEditing?: boolean;
  dbPageId?: number;
  version?: number;
  categorySlug?: string;
  initialMetadata?: any;
}

export default function WikiClient({
  initialMarkdown,
  defaultEditing,
  dbPageId,
  categorySlug,
  initialMetadata,
  version,
}: WikiClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isEditing, setIsEditing] = useState(defaultEditing || false);
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const parsed = useMemo(() => parseMarkdown(markdown), [markdown]);
  const isProfile = useMemo(() => {
    let currentSlug = initialMetadata?.slug;
    if (!currentSlug && typeof window !== "undefined") {
      currentSlug = window.location.pathname.split("/").pop();
    }
    return !!(
      currentSlug?.startsWith("profile-") || categorySlug === "profile"
    );
  }, [initialMetadata, categorySlug]);
  const [activeSection, setActiveSection] = useState<string>("");
  const [readingProgressPct, setReadingProgressPct] = useState(0);
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [toolbarContainer, setToolbarContainer] =
    useState<HTMLDivElement | null>(null);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

  const [versionId, setVersionId] = useState<number>(version || 1);
  const [conflictData, setConflictData] = useState<{
    myDraft: string;
    latestContent: string;
    baseVersion: number;
    currentVersion: number;
  } | null>(null);
  const [resolvedContent, setResolvedContent] = useState<string>("");

  // Autosave to IndexedDB
  useEffect(() => {
    if (!isEditing) return;
    // Respect the "Auto-save drafts" preference.
    if (localStorage.getItem("wiki_editor_autosave") === "false") return;
    const saveToIndexedDB = async () => {
      try {
        const pageKey = dbPageId
          ? String(dbPageId)
          : `new-${parsed.title || "untitled"}`;
        const { db } = await import("@/lib/db");
        await db.pendingpages.put({
          id: pageKey,
          content: markdown,
          baseVersion: versionId,
          updatedAt: Date.now(),
        });
      } catch (err) {
        console.error("Failed to autosave draft to IndexedDB:", err);
      }
    };
    saveToIndexedDB();
  }, [markdown, isEditing, dbPageId, versionId, parsed.title]);

  const isNews = useMemo(() => {
    return (
      parsed.infobox?.rows?.some(
        (row: any) =>
          row.label?.toLowerCase() === "category" &&
          typeof row.value === "string" &&
          row.value?.toLowerCase() === "news"
      ) || false
    );
  }, [parsed]);

  const isMessMenu = useMemo(() => {
    const slug =
      initialMetadata?.slug ||
      (typeof window !== "undefined"
        ? window.location.pathname.split("/").pop()
        : "");
    return slug === "mess-menu";
  }, [initialMetadata]);

  const isTransport = useMemo(() => {
    const slug =
      initialMetadata?.slug ||
      (typeof window !== "undefined"
        ? window.location.pathname.split("/").pop()
        : "");
    return slug === "campus-transport";
  }, [initialMetadata]);

  // Stable prop objects for the editor modals (avoid re-parsing on every render
  // while a modal is open).
  const messMenuProp = useMemo(() => ({ content: markdown }), [markdown]);
  const transportProp = useMemo(() => ({ content: markdown }), [markdown]);

  const [rightWidth, setRightWidth] = useState(320);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileNavHidden, setMobileNavHidden] = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);
  const [showPendingChanges, setShowPendingChanges] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [showMessEditor, setShowMessEditor] = useState(false);
  const [showTransportEditor, setShowTransportEditor] = useState(false);

  // The right sidebar (and its toggle button) is suppressed for page types that
  // don't use it. Extend `hideSidebar` for any future page/modal that should take
  // over the whole reading area without the sidebar getting in the way.
  const hideSidebar = (isNews && isEditing) || isMessMenu || isTransport;
  const actualSidebarOpen = rightSidebarOpen && !hideSidebar;

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

  // URL -> state: open the matching wiki modal on deep-link load / back-forward.
  useEffect(() => {
    const { wmodal } = parseModalParams(searchParams);
    const target = wmodal ?? "";
    if (target !== "revisions" && showRevisions) setShowRevisions(false);
    if (target !== "pending" && showPendingChanges) setShowPendingChanges(false);
    if (target !== "mess" && showMessEditor) setShowMessEditor(false);
    if (target !== "transport" && showTransportEditor) setShowTransportEditor(false);
    if (target === "revisions" && !showRevisions) setShowRevisions(true);
    if (target === "pending" && !showPendingChanges) setShowPendingChanges(true);
    if (target === "mess" && !showMessEditor) setShowMessEditor(true);
    if (target === "transport" && !showTransportEditor) setShowTransportEditor(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // state -> URL (open only): push one entry when a wiki modal opens, clearing
  // the settings/overlay params so the modal systems don't fight over the URL.
  const lastPushedWmodal = useRef<string | null>(null);
  if (lastPushedWmodal.current === null && typeof window !== "undefined") {
    lastPushedWmodal.current = window.location.search.replace(/^\?/, "");
  }
  useEffect(() => {
    let desired: string | null = null;
    if (showRevisions) desired = "revisions";
    else if (showPendingChanges) desired = "pending";
    else if (showMessEditor) desired = "mess";
    else if (showTransportEditor) desired = "transport";
    if (!desired) {
      lastPushedWmodal.current = "";
      return;
    }
    const qs = buildQuery(window.location.search.slice(1), {
      wmodal: desired,
      settings: null,
      overlay: null,
    });
    if (qs !== lastPushedWmodal.current) {
      lastPushedWmodal.current = qs;
      router.push(qs ? `?${qs}` : window.location.pathname, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showRevisions, showPendingChanges, showMessEditor, showTransportEditor]);

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

  useEffect(() => {
    const mainElement = document.querySelector("main");
    if (!mainElement) return;

    let lastScrollTop = 0;
    const threshold = 8;

    const handleScroll = () => {
      const currentScrollTop = mainElement.scrollTop;
      const delta = currentScrollTop - lastScrollTop;

      if (currentScrollTop < 10) {
        setMobileNavHidden(false);
      } else if (delta > threshold) {
        setMobileNavHidden(true);
      } else if (delta < -threshold) {
        setMobileNavHidden(false);
      }

      lastScrollTop = currentScrollTop;
    };

    mainElement.addEventListener("scroll", handleScroll, { passive: true });
    return () => mainElement.removeEventListener("scroll", handleScroll);
  }, []);

  const startResizeRight = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rightWidth;
    let currentWidth = startWidth;
    const doDrag = (moveEvent: MouseEvent) => {
      currentWidth = Math.max(
        200,
        Math.min(600, startWidth - (moveEvent.clientX - startX))
      );
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
    const newMarkdown = stringifyMarkdown(
      newContentMarkdown,
      parsed.infobox,
      parsed.title
    );
    markdownRef.current = newMarkdown;
    debouncedSetMarkdown(newMarkdown);
  };

  const handleTitleChange = (newTitle: string) => {
    const parsedLatest = parseMarkdown(markdownRef.current);
    const newMarkdown = stringifyMarkdown(
      parsedLatest.contentMarkdown,
      parsedLatest.infobox,
      newTitle
    );
    markdownRef.current = newMarkdown;
    setMarkdown(newMarkdown);
  };

  const handleInfoboxChange = (newInfobox: InfoboxData) => {
    const parsedLatest = parseMarkdown(markdownRef.current);
    const newMarkdown = stringifyMarkdown(
      parsedLatest.contentMarkdown,
      newInfobox,
      parsedLatest.title
    );
    markdownRef.current = newMarkdown;
    setMarkdown(newMarkdown);
  };

  const normalizeCategoryToSlug = (value: string): string => {
    const normalized = value.toLowerCase().trim();
    if (normalized === "campus facilities" || normalized === "facilities")
      return "facilities";
    if (normalized === "faculty profiles" || normalized === "faculty")
      return "faculty";
    if (normalized === "courses info" || normalized === "courses")
      return "courses";
    if (normalized === "research labs" || normalized === "research")
      return "research";
    if (normalized === "hostels guide" || normalized === "hostels")
      return "hostels";
    if (normalized === "student clubs" || normalized === "clubs")
      return "clubs";
    if (normalized === "institute fests" || normalized === "fests")
      return "fests";
    if (normalized === "placement stats" || normalized === "placements")
      return "placements";
    if (normalized === "institute policies" || normalized === "policies")
      return "policies";
    if (normalized === "academic calendar" || normalized === "calendar")
      return "calendar";
    return normalized;
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this article? This action cannot be undone."
      )
    ) {
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
      alert(
        err.response?.data?.error || err.message || "Failed to delete article"
      );
    }
  };

  const handleSave = async (
    resolvedContentOverride?: string,
    resolvedVersionOverride?: number
  ) => {
    try {
      let category = categorySlug || initialMetadata?.category || "campus";
      const categoryRow = parsed.infobox?.rows?.find(
        (row: any) => row.label?.toLowerCase() === "category"
      );
      if (
        categoryRow &&
        categoryRow.value &&
        typeof categoryRow.value === "string"
      ) {
        category = normalizeCategoryToSlug(categoryRow.value);
      } else {
        category = normalizeCategoryToSlug(category);
      }

      // Check if trying to make normal page a profile page
      let currentSlug = initialMetadata?.slug;
      if (!currentSlug && typeof window !== "undefined") {
        currentSlug = window.location.pathname.split("/").pop();
      }
      const isProfilePage =
        currentSlug?.startsWith("profile-") || category === "profile";
      if (category === "profile" && !isProfilePage) {
        alert("Normal articles cannot be categorized as 'profile'.");
        return;
      }

      const tagRow = parsed.infobox?.rows?.find(
        (row: any) => row.label?.toLowerCase() === "tag"
      );
      const locationRow = parsed.infobox?.rows?.find(
        (row: any) => row.label?.toLowerCase() === "location"
      );
      const description = parsed.infobox?.description || "";
      const metadata = {
        category,
        description,
        tag: tagRow?.value || "Featured Story",
        location: locationRow?.value || "",
      };

      const payload = {
        page_id: dbPageId || null,
        title: parsed.title || "Untitled Page",
        content:
          resolvedContentOverride !== undefined
            ? resolvedContentOverride
            : markdownRef.current,
        metadata,
        editor_id: user?.user_id || 0,
        base_version:
          resolvedVersionOverride !== undefined
            ? resolvedVersionOverride
            : versionId,
      };

      await apiService.submitDraft(payload);

      alert("Proposed changes submitted for review successfully!");
      setIsEditing(false);
      setConflictData(null);
      router.refresh();
    } catch (error: any) {
      if (error.response?.status === 409) {
        const data = error.response.data;
        setConflictData({
          myDraft: markdownRef.current,
          latestContent: data.currentContent || "",
          baseVersion: versionId,
          currentVersion: data.currentVersion || versionId,
        });
        setResolvedContent(data.currentContent || "");
      } else {
        console.error("Error saving draft:", error);
        const detail =
          error.response?.data?.detail ||
          error.response?.data?.error?.message ||
          error.response?.data?.error ||
          error.message ||
          "Unknown error";
        alert(`Failed to submit draft: ${detail}`);
      }
    }
  };

  useEffect(() => {
    const container = document.querySelector(".milkdown-container");
    if (!container) return;

    const headings = container.querySelectorAll("h2, h3");
    const seenIds: Record<string, number> = {};
    headings.forEach((heading) => {
      const text = heading.textContent || "";
      let baseId = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
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

      // TOC active-section tracking (only meaningful when headings exist).
      if (headingElements.length > 0) {
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
      }

      // Reading progress: how far the article body has scrolled past. Runs
      // regardless of whether the article has headings.
      if (localStorage.getItem("wiki_reading_progress") !== "false") {
        const scrollable = mainElement.scrollHeight - mainElement.clientHeight;
        const pct = scrollable > 0 ? Math.min(100, Math.max(0, (mainElement.scrollTop / scrollable) * 100)) : 0;
        setReadingProgressPct(pct);
      } else {
        setReadingProgressPct(0);
      }
    };

    mainElement.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      mainElement.removeEventListener("scroll", handleScroll);
    };
  }, [editorLoaded, activeSection]);

  const handleTocClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string
  ) => {
    e.preventDefault();
    const heading = document.getElementById(id);
    const mainElement = document.querySelector("main");
    if (heading && mainElement) {
      heading.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
    }
  };


  return (
    <>
      {/* Mobile backdrop for the drawer — tap to close instead of shifting the whole page */}
      {isMobile && rightSidebarOpen && (
        <div
          className="fixed inset-0 bg-base-content/30 backdrop-blur-[1px] z-[10000] lg:hidden animate-in fade-in duration-200"
          onClick={() => setRightSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Reading progress bar — fixed to the bottom of the viewport, shown only
          when the preference is on. Driven by the <main> scroll position. */}
      {localStorage.getItem("wiki_reading_progress") !== "false" && (
        <div
          className="fixed bottom-0 left-0 right-0 z-[15000] h-1 w-full bg-base-200"
          aria-hidden="true"
        >
          <div
            className="h-full bg-primary transition-[width] duration-75 ease-linear"
            style={{ width: `${readingProgressPct}%` }}
          />
        </div>
      )}

      {/* Main Content Wrapper */}
      <div className="flex flex-1 h-full mt-2 w-full min-w-full lg:min-w-0 overflow-hidden order-1">
        {" "}
        {/* Main Scrollable Article Body */}
        <main className="flex-1 min-w-full lg:min-w-0 px-4 md:px-8 pt-20 pb-28 overflow-y-auto bg-base-100 relative scroll-smooth text-base-content">
          <article className="w-full max-w-5xl mx-auto space-y-6">
            {/* Teleported editor toolbar container */}
            {isEditing && (
              <div
                ref={setToolbarContainer}
                className="editor-toolbar-container border border-base-300 rounded-xl bg-base-200 p-1.5 mb-6 milkdown flex items-center justify-center min-h-10"
              />
            )}
            {/* Title Header (Separated from editor to prevent accidental deletion) */}
            {(!isProfile || !isEditing) && (
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
              </div>
            )}

            {/* Milkdown Editor (replaced by the structured views on the mess-menu
                and campus-transport pages) */}
            {isMessMenu ? (
              <MessMenuView content={parsed.contentMarkdown} />
            ) : isTransport ? (
              <TransportView content={parsed.contentMarkdown} />
            ) : (
              <MilkdownEditor
                key={isEditing ? "edit" : "view"}
                initialMarkdown={parsed.contentMarkdown}
                onMarkdownChange={handleMarkdownChange}
                readOnly={!isEditing}
                onLoaded={() => setEditorLoaded(true)}
                toolbarContainer={toolbarContainer}
              />
            )}
          </article>
          {/* Material Design 3 Bottom Navigation Bar */}
          <BottomNavbar
            tabs={(isEditing
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
                        window.open(
                          "https://www.markdownguide.org/basic-syntax/",
                          "_blank"
                        );
                      }
                    },
                  },
                  {
                    id: "save",
                    label: "Save",
                    icon: Check,
                    onClick: () => handleSave(),
                    colorClass: "bg-success text-success-content",
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
                    colorClass: "bg-error text-error-content",
                  },
                  {
                    id: "sidebar",
                    label: "Sidebar",
                    icon: PanelRight,
                    onClick: () => setRightSidebarOpen(!rightSidebarOpen),
                  },
                ]
              : ([
                  (user?.role === "admin" ||
                    user?.role === "moderator") &&
                    !isMessMenu &&
                    !isTransport && {
                      id: "delete",
                      label: "Delete Page",
                      icon: Trash2,
                      onClick: handleDelete,
                      colorClass:
                        "bg-error/10 text-error border border-error/20 hover:bg-error/20 hover:text-error",
                    },
                  {
                    id: "changes",
                    label: "Changes",
                    icon: History,
                    onClick: () => {
                      setShowPendingChanges(true);
                      setShowRevisions(false);
                      window.dispatchEvent(
                        new CustomEvent("show-wiki-pending")
                      );
                    },
                    badgeCount: pendingCount,
                  },
                  {
                    id: "edit",
                    label: "Edit Page",
                    icon: Edit3,
                    onClick: async () => {
                      if (!user) {
                        router.push("/login");
                        return;
                      }
                      // The mess-menu and campus-transport pages are edited via
                      // their dedicated editor modals.
                      if (isMessMenu) {
                        setShowMessEditor(true);
                        return;
                      }
                      if (isTransport) {
                        setShowTransportEditor(true);
                        return;
                      }
                      try {
                        let currentSlug = initialMetadata?.slug;
                        if (!currentSlug && typeof window !== "undefined") {
                          currentSlug = window.location.pathname
                            .split("/")
                            .pop();
                        }
                        if (currentSlug) {
                          const editData =
                            await apiService.getPageForEdit(currentSlug);
                          setMarkdown(editData.content);
                          markdownRef.current = editData.content;
                          setVersionId(editData.versionId);
                        }
                      } catch (err) {
                        console.error("Failed to load page for editing:", err);
                      }
                      setIsEditing(true);
                    },
                  },

                  {
                    id: "sidebar",
                    label: "Sidebar",
                    icon: PanelRight,
                    onClick: () => setRightSidebarOpen(!rightSidebarOpen),
                  },
                ].filter(Boolean) as any)
            ).filter((tab: any) => tab.id !== "sidebar" || !hideSidebar)}
            activeTab={
              actualSidebarOpen ? "sidebar" : isEditing ? "edit" : undefined
            }
            hidden={mobileNavHidden}
            style={{
              left:
                !isMobile && actualSidebarOpen
                  ? `calc((100vw - ${rightWidth}px) / 2)`
                  : "50%",
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

      {/* Conflict Resolution Modal Overlay */}
      {conflictData && (
        <div className="fixed inset-0 z-[20005] bg-base-content/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-base-100 rounded-3xl border border-base-200 shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <header className="px-6 py-4 border-b border-base-200 flex items-center justify-between shrink-0 bg-base-100">
              <div>
                <h3 className="text-lg font-black text-base-content leading-snug">
                  Edit Conflict Detected (v{conflictData.baseVersion} vs v
                  {conflictData.currentVersion})
                </h3>
                <p className="text-xs text-base-content/50 mt-1 font-semibold uppercase tracking-wider">
                  Another user saved changes first. Resolve conflicts below.
                </p>
              </div>
              <button
                onClick={() => setConflictData(null)}
                className="btn btn-sm btn-ghost btn-circle text-base-content/50 hover:text-base-content"
              >
                ✕
              </button>
            </header>

            <div className="flex-1 p-6 overflow-hidden flex flex-col md:flex-row gap-6 min-h-0">
              {/* Left Column: My Draft (Read Only) */}
              <div className="flex-1 flex flex-col h-full min-h-0 bg-base-200/30 border border-base-200 rounded-2xl p-4 overflow-hidden">
                <div className="flex justify-between items-center mb-3 shrink-0">
                  <h4 className="text-xs font-black text-warning uppercase tracking-wider">
                    My Draft (Read Only)
                  </h4>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(conflictData.myDraft);
                      alert("Copied your draft to clipboard!");
                    }}
                    className="btn btn-xs btn-outline btn-warning rounded-lg"
                  >
                    Copy My Draft
                  </button>
                </div>
                <textarea
                  readOnly
                  value={conflictData.myDraft}
                  className="flex-1 w-full bg-base-200/50 border border-base-300 rounded-xl p-3 text-xs font-mono resize-none focus:outline-none text-base-content/75 overflow-y-auto"
                />
              </div>

              {/* Right Column: Latest Version (Editable for merge) */}
              <div className="flex-1 flex flex-col h-full min-h-0 bg-base-100 border border-base-200 rounded-2xl p-4 overflow-hidden">
                <h4 className="text-xs font-black text-primary uppercase tracking-wider mb-3 shrink-0">
                  Latest Version (Editable / Merge Destination)
                </h4>
                <textarea
                  value={resolvedContent}
                  onChange={(e) => setResolvedContent(e.target.value)}
                  className="flex-1 w-full bg-base-100 border border-base-300 rounded-xl p-3 text-xs font-mono resize-none focus:outline-none focus:border-primary text-base-content overflow-y-auto"
                  placeholder="Paste your merged content here..."
                />
              </div>
            </div>

            <footer className="px-6 py-4 border-t border-base-200 flex flex-wrap gap-3 justify-between items-center shrink-0 bg-base-100">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setMarkdown(conflictData.myDraft);
                    markdownRef.current = conflictData.myDraft;
                    setVersionId(conflictData.currentVersion);
                    setConflictData(null);
                    alert(
                      "Applied your draft to the editor. Save again to submit with version v" +
                        conflictData.currentVersion
                    );
                  }}
                  className="btn btn-warning btn-sm rounded-xl"
                >
                  Keep Mine
                </button>
                <button
                  onClick={() => {
                    setMarkdown(conflictData.latestContent);
                    markdownRef.current = conflictData.latestContent;
                    setVersionId(conflictData.currentVersion);
                    setConflictData(null);
                    alert("Applied the latest server version to the editor.");
                  }}
                  className="btn btn-outline btn-sm rounded-xl"
                >
                  Use Latest
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setConflictData(null)}
                  className="btn btn-ghost btn-sm rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleSave(resolvedContent, conflictData.currentVersion);
                  }}
                  className="btn btn-primary btn-sm rounded-xl"
                >
                  Save Resolved
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* Mess menu editor modal (opened from the mess-menu wiki page) */}
      {isMessMenu && (
        <MessMenuOverlay
          isOpen={showMessEditor}
          onClose={() => router.back()}
          messMenu={messMenuProp}
        />
      )}

      {isTransport && (
        <TransportOverlay
          isOpen={showTransportEditor}
          onClose={() => router.back()}
          transport={transportProp}
        />
      )}

      {/* Wiki overlays for revisions and pending approvals */}
      {showRevisions && (
        <RevisionsView setShowRevisions={setShowRevisions} />
      )}

      {showPendingChanges && (
        <PendingChangesView
          setShowPendingChanges={setShowPendingChanges}
          pageId={dbPageId}
        />
      )}
    </>
  );
}
