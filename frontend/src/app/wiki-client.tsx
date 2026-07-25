"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import { parseMarkdown, stringifyMarkdown } from "@/lib/utils";
import { InfoboxData, InfoboxRow } from "@/lib/types";
import { apiService } from "@/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "react-hot-toast";
import { useCommonStore } from "@/store/useCommonStore";

import { EditableCell } from "@/components/article/editable-cell";
import { useRouter, useSearchParams } from "next/navigation";
import { parseModalParams, buildQuery } from "@/lib/modalUrl";
import {
  Edit3,
  Check,
  X,
  PanelRight,
  HelpCircle,
  Trash2,
  FileClock,
} from "lucide-react";
import BottomNavbar from "@/components/navs/BottomNavbar";
import ConfirmationModal from "@/components/overlays/ConfirmationModal";
import GenericOverlayModal from "@/components/overlays/GenericOverlayModal";

// Subcomponents
import RevisionsView from "@/components/wiki/RevisionsView";
import PendingChangesView from "@/components/wiki/PendingChangesView";
import WikiInfoBox from "@/components/wiki/WikiInfoBox";
import { makeHeadingId } from "@/lib/wikiFolding";
import { CategoryIcon } from "@/lib/categoryIcon";
import CategoryIconPicker from "@/components/overlays/CategoryIconPicker";
import { DEFAULT_ICON, DEFAULT_COLOR } from "@/lib/categoryIcon";

// Progressive enhancement for the read-only surface: while the heavy Milkdown
// (Crepe) chunk is still downloading, render the article as lightweight static
// markdown so the title and body paint together immediately instead of the
// content popping in once the editor bundle arrives. Milkdown then takes over
// as the reader (preserving visual parity with edit mode). The fallback is
// transient — it is replaced the moment the editor is ready.
function MilkdownEditorLazy(props: any) {
  const fallbackMarkdown = useRef(props.initialMarkdown ?? "");
  fallbackMarkdown.current = props.initialMarkdown ?? "";
  const Editor = useMemo(
    () =>
      dynamic(() => import("@/components/article/milkdown-editor"), {
        ssr: false,
        loading: () => (
          <div className="milkdown-container prose max-w-none relative min-h-0 border-none p-0">
            <ReactMarkdown>{fallbackMarkdown.current}</ReactMarkdown>
          </div>
        ),
      }),
    []
  );
  return <Editor {...props} />;
}

interface WikiClientProps {
  initialMarkdown: string;
  defaultEditing?: boolean;
  dbPageId?: number;
  version?: number;
  categorySlug?: string;
  initialMetadata?: any;
  updatedAt?: string;
  updatedByName?: string | null;
  contributors?: any;
  // Per-page icon + color, echoed from the page's `icon`/`color` columns.
  initialIcon?: string;
  initialColor?: string;
  // Page slug — needed client-side to fire the (non-blocking) view-count.
  slug?: string;
}

export default function WikiClient({
  initialMarkdown,
  defaultEditing,
  dbPageId,
  categorySlug,
  initialMetadata,
  version,
  updatedAt,
  updatedByName,
  contributors,
  initialIcon,
  initialColor,
  slug,
}: WikiClientProps) {
  // ALL HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isEditing, setIsEditing] = useState(defaultEditing || false);
  const [showSubmitSummary, setShowSubmitSummary] = useState(false);
  const [submitSummary, setSubmitSummary] = useState('');
  const [markdown, setMarkdown] = useState(initialMarkdown ?? '');
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
  const [rightWidth, setRightWidth] = useState(320);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileNavHidden, setMobileNavHidden] = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);
  const [showPendingChanges, setShowPendingChanges] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showHelpConfirm, setShowHelpConfirm] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const [showReadingProgress, setShowReadingProgress] = useState(true);
  const readingProgress = useCommonStore((state) => state.readingProgress);
  const autoFold = useCommonStore((state) => state.autoFold);
  const editorAutosave = useCommonStore((state) => state.editorAutosave);

  useEffect(() => {
    setShowReadingProgress(readingProgress);
  }, [readingProgress]);

  // Page icon picker state (admin/moderator only) — mirrors CategoryPage: a
  // page has its own icon+color/emoji, editable from the article header.
  const [pageIcon, setPageIcon] = useState(initialIcon || DEFAULT_ICON);
  const [pageColor, setPageColor] = useState(initialColor || DEFAULT_COLOR);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const canManagePage = user?.role === "admin" || user?.role === "moderator";

  const handleIconSave = async (icon: string, color: string) => {
    let currentSlug = initialMetadata?.slug;
    if (!currentSlug && typeof window !== "undefined") {
      currentSlug = window.location.pathname.split("/").pop();
    }
    if (!currentSlug || !dbPageId) return;
    try {
      await apiService.updatePage(currentSlug, { icon, color });
      setPageIcon(icon);
      setPageColor(color);
      toast.success("Icon updated");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Failed to update icon");
      throw err;
    }
  };

  // Refs for stabilizing callbacks that depend on changing props
  const dbPageIdRef = useRef(dbPageId);
  useEffect(() => {
    dbPageIdRef.current = dbPageId;
  }, [dbPageId]);

  // Count a view for genuine article reads. Fired client-side after mount
  // (not in the SSR pass) so it never blocks the server render or adds
  // a network round-trip to first paint. Guarded by a ref to run once.
  const countedRef = useRef(false);
  useEffect(() => {
    if (countedRef.current) return;
    if (dbPageId && !defaultEditing && slug) {
      countedRef.current = true;
      apiService.incrementPageViewCount(slug);
    }
  }, [dbPageId, defaultEditing, slug]);

  const parsed = useMemo(() => parseMarkdown(markdown), [markdown]);
  const isProfile = useMemo(() => {
    return categorySlug === "profile";
  }, [categorySlug]);



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

  // Reader "auto fold" preference — sections start collapsed on load.
  // Bound reactively via Zustand useCommonStore

  // The right sidebar (and its toggle button) is suppressed for page types that
  // don't use it. Extend `hideSidebar` for any future page/modal that should take
  // over the whole reading area without the sidebar getting in the way.
  const hideSidebar = isNews && isEditing;
  const actualSidebarOpen = rightSidebarOpen && !hideSidebar;

  const fetchPendingCount = useCallback(async () => {
    try {
      // Use the ref to get the latest dbPageId (already number | undefined)
      const pageId = dbPageIdRef.current;
      const data = await apiService.getPendingDrafts(pageId);
      const count = data.filter((d: any) => d.status === "in_review").length;
      setPendingCount(count);
    } catch (err) {
      console.error("Error fetching pending drafts count:", err);
    }
  }, []); // empty deps because we use the ref

  // Refetch pending count when dbPageId changes
  useEffect(() => {
    fetchPendingCount();
  }, [dbPageId, fetchPendingCount]);

  // Set up event listener for pending count updates (runs once because fetchPendingCount is stable)
  useEffect(() => {
    window.addEventListener("wiki-pending-updated", fetchPendingCount);
    return () => {
      window.removeEventListener("wiki-pending-updated", fetchPendingCount);
    };
  }, [fetchPendingCount]);

  // Autosave to IndexedDB
  useEffect(() => {
    if (!isEditing) return;
    // Respect the "Auto-save drafts" preference.
    if (!editorAutosave) return;
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
  }, [markdown, isEditing, dbPageId, versionId, parsed.title, editorAutosave]);

  // URL -> state: open the matching wiki modal on deep-link load / back-forward.
  useEffect(() => {
    const { wmodal } = parseModalParams(searchParams);
    const target = wmodal ?? "";
    if (target !== "revisions" && showRevisions) setShowRevisions(false);
    if (target !== "pending" && showPendingChanges) setShowPendingChanges(false);
    if (target === "revisions" && !showRevisions) setShowRevisions(true);
    if (target === "pending" && !showPendingChanges) setShowPendingChanges(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // state -> URL (open only): push one entry when a wiki modal opens, clearing
  // the settings/overlay params so the modal systems don't fight over the URL.
  const lastPushedWmodal = useRef<string | null>(null);
  useEffect(() => {
    if (lastPushedWmodal.current === null && typeof window !== "undefined") {
      lastPushedWmodal.current = window.location.search.replace(/^\?/, "");
    }
    let desired: string | null = null;
    if (showRevisions) desired = "revisions";
    else if (showPendingChanges) desired = "pending";
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
  }, [showRevisions, showPendingChanges]);

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
    // Fallback for any category not in the hardcoded list above: kebab-case the
    // name so multi-word categories like "All Pages" become "all-pages".
    return normalized.replace(/\s+/g, "-");
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      let currentSlug = initialMetadata?.slug;
      if (!currentSlug && typeof window !== "undefined") {
        currentSlug = window.location.pathname.split("/").pop();
      }
      if (!currentSlug) {
        toast.error("Could not identify article slug.");
        return;
      }
      await apiService.deletePage(currentSlug);
      toast.success("Article deleted successfully.");
      router.push("/");
    } catch (err: any) {
      console.error("Error deleting article:", err);
      toast.error(
        err.response?.data?.error || err.message || "Failed to delete article"
      );
    }
  };

  const handleSave = async (
    resolvedContentOverride?: string,
    resolvedVersionOverride?: number,
    summary?: string
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
      if (category === "profile") {
        toast.error("Normal articles cannot be categorized as 'profile'.");
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
 
      const isStaff = user?.role === "admin" || user?.role === "moderator";
      const contentVal = resolvedContentOverride !== undefined
        ? resolvedContentOverride
        : markdownRef.current;
 
      // Drop empty key-info rows so they aren't persisted (e.g. unused
      // optional fields added on a new page).
      const parsedForSave = parseMarkdown(contentVal);
      const cleanedRows = (parsedForSave.infobox.rows as InfoboxRow[]).filter(
        (r) => {
          if (Array.isArray(r.value)) return r.value.length > 0;
          return (r.value ?? "").toString().trim() !== "";
        }
      );
      const cleanedContent = stringifyMarkdown(
        parsedForSave.contentMarkdown,
        { ...parsedForSave.infobox, rows: cleanedRows },
        parsedForSave.title
      );
 
      if (isStaff) {
        if (dbPageId) {
          const res = await apiService.updatePage(currentSlug || "", {
            title: parsed.title || "Untitled Page",
            content: cleanedContent,
            metadata,
            edit_summary: summary ?? '',
          });
          toast.success("Page updated successfully!");
          setIsEditing(false);
          router.push(`/wiki/page/${res.slug}`);
          router.refresh();
        } else {
          const res = await apiService.createPage({
            title: parsed.title || "Untitled Page",
            content: cleanedContent,
            metadata,
          });
          toast.success("Page created and published successfully!");
          setIsEditing(false);
          router.push(`/wiki/page/${res.slug}`);
          router.refresh();
        }
      } else {
        const payload = {
          page_id: dbPageId || null,
          title: parsed.title || "Untitled Page",
          content: cleanedContent,
          metadata: {
            ...metadata,
            ...(summary && summary.trim() ? { edit_summary: summary.trim() } : {}),
          },
          editor_id: user?.user_id || 0,
          base_version:
            resolvedVersionOverride !== undefined
              ? resolvedVersionOverride
              : versionId,
        };
 
        await apiService.submitDraft(payload);
        toast.success("Proposed changes submitted for review successfully!");
        setIsEditing(false);
        setConflictData(null);
        router.refresh();
      }
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
        toast.error(`Failed to submit draft: ${detail}`);
      }
    }
  };

  useEffect(() => {
    // Heading ids are assigned here for the Milkdown (ProseMirror) surfaces
    // — both edit mode and the read-only reader — since neither renders ids in
    // the markup. This only runs once the editor has loaded (`editorLoaded`).
    // Ids are derived from the raw markdown (matching `parsed.toc`) rather than
    // the rendered text, so headings containing links/formatting still line up
    // with the table of contents.
    if (!editorLoaded) return;
    const container = document.querySelector(".milkdown-container");
    if (!container) return;

    const seenIds: Record<string, number> = {};
    const ids: string[] = [];
    for (const line of parsed.contentMarkdown.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("## ") || trimmed.startsWith("### ")) {
        const text = trimmed.replace(/^#{2,3}\s+/, "").trim();
        ids.push(makeHeadingId(text, seenIds));
      }
    }

    const headings = Array.from(
      container.querySelectorAll("h2, h3")
    ) as HTMLElement[];
    headings.forEach((heading, i) => {
      const id = ids[i];
      if (id && heading.id !== id) heading.id = id;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorLoaded]);

  // Mirror of `activeSection` so the scroll handler can read the latest value
  // without being re-subscribed on every section change (fewer listener churns).
  const activeSectionRef = useRef(activeSection);
  activeSectionRef.current = activeSection;

  useEffect(() => {
    const mainElement = document.querySelector("main");
    if (!mainElement) return;

    const container = document.querySelector(".milkdown-container");
    if (!container) return;

    // Coalesce scroll work to one pass per animation frame so a burst of scroll
    // events can't trigger a synchronous layout read + state update per event.
    let ticking = false;
    let lastPct = -1;
    const update = () => {
      ticking = false;
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
        if (currentActive && currentActive !== activeSectionRef.current) {
          setActiveSection(currentActive);
        }
      }

      // Reading progress: how far the article body has scrolled past. Runs
      // regardless of whether the article has headings.
      if (showReadingProgress) {
        const scrollable = mainElement.scrollHeight - mainElement.clientHeight;
        const pct = scrollable > 0 ? Math.min(100, Math.max(0, (mainElement.scrollTop / scrollable) * 100)) : 0;
        if (pct !== lastPct) {
          lastPct = pct;
          setReadingProgressPct(pct);
        }
      } else if (lastPct !== 0) {
        lastPct = 0;
        setReadingProgressPct(0);
      }
    };

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    mainElement.addEventListener("scroll", handleScroll, { passive: true });
    update();

    return () => {
      mainElement.removeEventListener("scroll", handleScroll);
    };
  }, [editorLoaded, showReadingProgress]);

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

  // Page stats shown below the article body (logged-in users only).
  const contentStats = useMemo(() => {
    const content = (parsed.contentMarkdown || "").replace(
      /^---\n[\s\S]*?\n---\n?/,
      ""
    );
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const chars = content.length;
    return {
      words,
      chars,
      readingMin: words > 0 ? Math.max(1, Math.round(words / 200)) : 0,
    };
  }, [parsed.contentMarkdown]);

  const relativeTime = useMemo(() => {
    if (!updatedAt) return null;
    const then = new Date(updatedAt).getTime();
    if (isNaN(then)) return null;
    const days = Math.floor((Date.now() - then) / 86400000);
    if (days < 1) return "today";
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  }, [updatedAt]);

  const isStale = useMemo(() => {
    if (!updatedAt) return false;
    const then = new Date(updatedAt).getTime();
    if (isNaN(then)) return false;
    return (Date.now() - then) / 86400000 > 180;
  }, [updatedAt]);

  const contributorList = useMemo(() => {
    if (Array.isArray(contributors)) return contributors as string[];
    if (contributors && typeof contributors === "object") {
      return Object.values(contributors) as string[];
    }
    return [];
  }, [contributors]);

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
      {showReadingProgress && (
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
              <div className="flex items-start gap-4">
                {/* Page icon — clickable icon/emoji picker for staff */}
                <div className="relative pt-1 shrink-0">
                  {canManagePage ? (
                    <button
                      type="button"
                      onClick={() => setIconPickerOpen((o) => !o)}
                      className="inline-flex items-center justify-center p-3 rounded-2xl shadow-sm transition-transform duration-200 cursor-pointer hover:scale-105 active:scale-95"
                      style={{
                        backgroundColor: `${pageColor || DEFAULT_COLOR}1a`,
                        color: pageColor || DEFAULT_COLOR,
                      }}
                      title="Set icon"
                    >
                      <CategoryIcon icon={pageIcon} size={24} />
                    </button>
                  ) : (
                    <div
                      className="inline-flex items-center justify-center p-3 rounded-2xl shadow-sm"
                      style={{
                        backgroundColor: `${pageColor || DEFAULT_COLOR}1a`,
                        color: pageColor || DEFAULT_COLOR,
                      }}
                    >
                      <CategoryIcon icon={pageIcon} size={24} />
                    </div>
                  )}
                  {iconPickerOpen && canManagePage && (
                    <CategoryIconPicker
                      currentColor={pageColor}
                      onSave={handleIconSave}
                      onClose={() => setIconPickerOpen(false)}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
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
              </div>
            )}

            {isEditing ? (
              <MilkdownEditorLazy
                key="edit"
                initialMarkdown={parsed.contentMarkdown}
                onMarkdownChange={handleMarkdownChange}
                readOnly={false}
                onLoaded={() => setEditorLoaded(true)}
                toolbarContainer={toolbarContainer}
                enableFolding={false}
                autoFold={false}
              />
            ) : (
              // Read-only surface rendered by the Milkdown (Crepe) reader so it
              // matches the editing surface's output exactly. While the editor
              // chunk loads, MilkdownEditorLazy shows the static fallback so the
              // content appears together with the title.
              <MilkdownEditorLazy
                key="view"
                initialMarkdown={parsed.contentMarkdown}
                readOnly={true}
                onMarkdownChange={() => {}}
                onLoaded={() => setEditorLoaded(true)}
                enableFolding
                autoFold={autoFold}
              />
            )}
          </article>

          {/* Page stats — visible to logged-in users only, below the article body */}
          {user && (
            <section className="w-full max-w-5xl mx-auto mt-4 mb-12">
              <div className="rounded-2xl border border-base-200 bg-base-100 px-5 py-4">
                <h4 className="text-[10px] font-bold text-base-content/50 tracking-wider mb-3 uppercase">
                  Page Stats
                </h4>
                <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs text-base-content/70">
                  <span>
                    <span className="font-semibold text-base-content">{contentStats.words}</span> words
                  </span>
                  <span>
                    <span className="font-semibold text-base-content">{contentStats.chars}</span> characters
                  </span>
                  {contentStats.readingMin > 0 && (
                    <span>
                      <span className="font-semibold text-base-content">~{contentStats.readingMin} min</span> read
                    </span>
                  )}
                  {versionId != null && (
                    <span>
                      version <span className="font-semibold text-base-content">v{versionId}</span>
                    </span>
                  )}
                  {relativeTime && (
                    <span className="flex items-center gap-1.5">
                      updated <span className="font-semibold text-base-content">{relativeTime}</span>
                      {updatedByName ? `by ${updatedByName}` : ""}
                      {isStale && (
                        <span className="text-[9px] uppercase font-bold text-warning border border-warning/30 rounded px-1 py-0.5">
                          Stale
                        </span>
                      )}
                    </span>
                  )}
                  {contributorList.length > 0 && (
                    <span className="min-w-0">
                      contributors:{" "}
                      <span className="font-semibold text-base-content truncate">
                        {contributorList.join(", ")}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Material Design 3 Bottom Navigation Bar */}
          <BottomNavbar
            tabs={(isEditing
              ? [
                  {
                    id: "help",
                    label: "Help",
                    icon: HelpCircle,
                    onClick: () => {
                      setShowHelpConfirm(true);
                    },
                  },
                  {
                    id: "save",
                    label: "Save",
                    icon: Check,
                    onClick: () => {
                      setShowSubmitSummary(true);
                    },
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
                  user?.role === "admin" && {
                      id: "delete",
                      label: "Delete Page",
                      icon: Trash2,
                      onClick: handleDelete,
                      colorClass:
                        "bg-error/10 text-error border border-error/20 hover:bg-error/20 hover:text-error",
                    },
                  {
                    id: "changes",
                    label: "Pending Drafts",
                    icon: FileClock,
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
                      setSubmitSummary('');
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
                      toast.success("Copied your draft to clipboard!");
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
                    toast.success(
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
                    toast.success("Applied the latest server version to the editor.");
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

      {/* Submit summary modal — captures the human-readable change note */}
      {showSubmitSummary && (
        <GenericOverlayModal
          isOpen={true}
          onClose={() => setShowSubmitSummary(false)}
          title="Describe your changes"
          maxWidthClass="max-w-lg"
        >
          <div className="space-y-4">
            <p className="text-sm text-base-content/60">
              This note is saved with the revision history so reviewers and
              readers can see what was changed.
            </p>
            <input
              type="text"
              autoFocus
              value={submitSummary}
              onChange={(e) => setSubmitSummary(e.target.value)}
              placeholder="e.g. Fixed admission dates, added hostel info"
              className="input input-bordered w-full bg-base-100 border-base-300 focus:border-primary rounded-xl text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setShowSubmitSummary(false);
                  handleSave(undefined, undefined, submitSummary);
                }
              }}
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSubmitSummary(false)}
                className="btn btn-ghost btn-sm rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowSubmitSummary(false);
                  handleSave(undefined, undefined, submitSummary);
                }}
                className="btn btn-success btn-sm text-success-content rounded-xl font-bold"
              >
                Submit Changes
              </button>
            </div>
          </div>
        </GenericOverlayModal>
      )}



      {/* Wiki overlays for revisions and pending approvals */}
      {showRevisions && (
        <RevisionsView
          setShowRevisions={setShowRevisions}
          slug={initialMetadata?.slug || (typeof window !== "undefined" ? window.location.pathname.split("/").pop() || "" : "")}
        />
      )}

      {showPendingChanges && (
        <PendingChangesView
          setShowPendingChanges={setShowPendingChanges}
          pageId={dbPageId}
          slug={initialMetadata?.slug || (typeof window !== "undefined" ? window.location.pathname.split("/").pop() || "" : "")}
          title={parsed.title || ""}
        />
      )}

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Wiki Article"
        message="Are you sure you want to delete this wiki article? This action is permanent and cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      <ConfirmationModal
        isOpen={showHelpConfirm}
        onClose={() => setShowHelpConfirm(false)}
        onConfirm={() => window.open("https://www.markdownguide.org/basic-syntax/", "_blank")}
        title="External Redirection"
        message="You are being redirected to an external website (Markdown Guide) for formatting help. Do you want to continue?"
        confirmText="Continue"
        cancelText="Stay Here"
        type="info"
      />
    </>
  );
}