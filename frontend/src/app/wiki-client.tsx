"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { parseMarkdown, stringifyMarkdown } from "@/lib/utils";
import { InfoboxData } from "@/lib/types";

import { EditableCell } from "@/components/article/editable-cell";
import { useRouter } from "next/navigation";
import {
  Edit3,
  Check,
  X,
  History,
  PanelRight,
  ArrowLeft,
  PlusCircle,
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
}

export default function WikiClient({ initialMarkdown, defaultEditing, dbPageId, version }: WikiClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(defaultEditing || false);
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const parsed = useMemo(() => parseMarkdown(markdown), [markdown]);
  const [activeSection, setActiveSection] = useState<string>("");
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [toolbarContainer, setToolbarContainer] = useState<HTMLDivElement | null>(null);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

  const [rightWidth, setRightWidth] = useState(320);
  const [isMobile, setIsMobile] = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);
  const [showPendingChanges, setShowPendingChanges] = useState(false);

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

  const handleSave = async () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    const targetUrl = `${apiBase}/drafts`;

    try {
      const payload = {
        page_id: dbPageId ? Number(dbPageId) : null,
        title: parsed.title || "Untitled Page",
        content: markdownRef.current,
        metadata: {},
        editor_id: 0, // Simulated default editor_id
        base_version: version !== undefined ? Number(version) : null,
      };

      const response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert("Draft successfully submitted for review!");
        // Keep the local editor state updated with the unsaved changes for immediate feedback
        setMarkdown(markdownRef.current);
      } else {
        const errData = await response.json().catch(() => ({}));
        console.error("Failed to submit draft. Server returned status:", response.status, errData);
        alert(`Failed to submit draft: ${errData.detail || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error submitting draft to backend:", error);
      alert("Error submitting draft to backend");
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
          className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-40 lg:hidden animate-in fade-in duration-200"
          onClick={() => setRightSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content Wrapper */}
      <div className="flex flex-1 h-full mt-2 w-full min-w-full lg:min-w-0 overflow-hidden order-1">
        {/* Main Scrollable Article Body */}
        <main className="flex-1 min-w-full lg:min-w-0 px-4 md:px-8 pt-20 pb-28 overflow-y-auto bg-white relative scroll-smooth">
          <article className="w-full max-w-5xl mx-auto space-y-6">
            {/* Teleported editor toolbar container */}
            {isEditing && (
              <div
                ref={setToolbarContainer}
                className="border border-gray-200 rounded-xl bg-gray-50 p-1.5 mb-6 milkdown flex items-center justify-center min-h-10"
              />
            )}
            {/* Title Header (Separated from editor to prevent accidental deletion) */}
            {isEditing ? (
              <EditableCell
                initialValue={parsed.title}
                onChange={handleTitleChange}
                placeholder="Untitled Page"
                className="text-3xl sm:text-4xl font-display font-black tracking-tight text-gray-900 w-full border-none focus:outline-none focus:ring-0 mb-8 bg-transparent placeholder-gray-300"
              />
            ) : (
              <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-gray-900 mb-8">
                {parsed.title}
              </h1>
            )}

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
              isEditing
                ? [
                    {
                      id: "back",
                      label: "Back",
                      icon: ArrowLeft,
                      onClick: () => {
                        if (window.history.length > 1) {
                          router.back();
                        } else {
                          router.push("/");
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
                        setIsEditing(false);
                      },
                    },
                    {
                      id: "sidebar",
                      label: "Sidebar",
                      icon: PanelRight,
                      onClick: () => setRightSidebarOpen(!rightSidebarOpen),
                    },
                  ]
                : [
                    {
                      id: "edit",
                      label: "Edit Page",
                      icon: Edit3,
                      onClick: () => setIsEditing(true),
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
                      badgeCount: 2,
                    },
                    {
                      id: "new",
                      label: "New Page",
                      icon: PlusCircle,
                      onClick: () => {
                        router.push("/wiki/campus/new");
                      },
                    },
                    {
                      id: "sidebar",
                      label: "Sidebar",
                      icon: PanelRight,
                      onClick: () => setRightSidebarOpen(!rightSidebarOpen),
                    },
                  ]
            }
            activeTab={rightSidebarOpen ? "sidebar" : (isEditing ? "edit" : undefined)}
            style={{
              left: !isMobile && rightSidebarOpen ? `calc((100vw - ${rightWidth}px) / 2)` : "50%",
            }}
            className="fixed bottom-6 transform -translate-x-1/2 z-[9999]"
          />
        </main>
      </div>

      {/* InfoBox (Right Sidebar) */}
      <WikiInfoBox
        rightSidebarOpen={rightSidebarOpen}
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