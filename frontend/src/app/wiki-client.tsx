"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import NextLink from "next/link";
import { parseMarkdown, stringifyMarkdown } from "@/lib/utils";
import { InfoboxData } from "@/lib/types";

import { EditableCell } from "@/components/article/editable-cell";
import { useRouter } from "next/navigation";
import {
  Share2,
  Edit3,
  Bookmark,
  Download,
  Check,
  X,
  Tag,
  History,
  Trash2,
  PanelRight,
  Home,
  ArrowLeft,
  PlusCircle,
} from "lucide-react";
import BottomNavbar from "@/components/BottomNavbar";

// Dynamically import MilkdownEditor so it doesn't run during SSR
const MilkdownEditor = dynamic(() => import("@/components/article/milkdown-editor"), {
  ssr: false,
});

interface WikiClientProps {
  initialMarkdown: string;
  defaultEditing?: boolean;
}

export default function WikiClient({ initialMarkdown, defaultEditing }: WikiClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(defaultEditing || false);
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const parsed = useMemo(() => parseMarkdown(markdown), [markdown]);
  const [activeSection, setActiveSection] = useState<string>("");
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toolbarContainer, setToolbarContainer] = useState<HTMLDivElement | null>(null);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

  const [rightWidth, setRightWidth] = useState(320);
  const [isMobile, setIsMobile] = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);
  const [showPendingChanges, setShowPendingChanges] = useState(false);

  useEffect(() => {
    const savedRight = localStorage.getItem("wiki-right-sidebar-width");
    if (savedRight) setRightWidth(Math.max(200, Number(savedRight)));
    if (window.innerWidth < 1024) {
      setRightSidebarOpen(false);
      setIsMobile(true);
    }

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
      currentWidth = Math.max(200, Math.min(600, startWidth + (moveEvent.clientX - startX)));
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
  const menuRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (menuOpen || profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen, profileOpen]);

  // Sync ref with initialMarkdown / state changes
  useEffect(() => {
    markdownRef.current = markdown;
  }, [markdown]);

  // Reset editor loaded state when switching modes
  useEffect(() => {
    setEditorLoaded(false);
  }, [isEditing]);

  // Debounce state update to keep the UI smooth while typing
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
    try {
      const response = await fetch("https://meta-iitgn-vercel.onrender.com/page/1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: markdownRef.current }),
      });
      if (!response.ok) {
        console.warn("Backend save failed or endpoint not implemented. Saved locally.");
      }
    } catch (error) {
      console.error("Error saving to backend:", error);
    }
    setIsEditing(false);
  };


  // Add IDs to headings dynamically when content changes or is loaded
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

  // Scrollspy to set active TOC item
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

      // Find the heading closest to the top of the viewport
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
    // Run once on load
    handleScroll();

    return () => {
      mainElement.removeEventListener("scroll", handleScroll);
    };
  }, [editorLoaded]);

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
    return (
      <div className="fixed inset-0 bg-white z-[60] flex flex-col h-screen w-screen overflow-hidden select-none animate-in fade-in duration-200">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-gray-150 flex items-center gap-4 px-4 lg:px-6 shrink-0 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] select-none">
          <button
            onClick={() => {
              setShowRevisions(false);
              window.dispatchEvent(new CustomEvent("hide-wiki-history"));
            }}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-655 transition-colors duration-200 cursor-pointer active:scale-95 flex items-center justify-center"
            aria-label="Back to Wiki"
          >
            <ArrowLeft className="h-6 w-6 text-black" />
          </button>
          <span className="text-sm font-bold text-gray-800 uppercase tracking-wider">Changes</span>
        </header>

        {/* Changes Body (Like Search & Bookmarks pages) */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6 md:p-8 lg:p-12">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-serif font-black text-gray-900 tracking-tight">Recent Page Revisions</h2>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Track and restore past edits for this article</p>
            </div>

            <div className="space-y-4 pt-4">
              {[
                {
                  rev: 3,
                  title: "Added cs curriculum and policies",
                  author: "Meta IITGN",
                  avatar: "MI",
                  time: "4 hours ago",
                  badge: "Admin",
                  badgeBg: "bg-blue-50 text-blue-600 border border-blue-150",
                  details: "Inserted curriculum listings under CS major and updated hostel rules. Added detail on curriculum pathways."
                },
                {
                  rev: 2,
                  title: "Updated infobox stats",
                  author: "Alex Carter",
                  avatar: "AC",
                  time: "1 day ago",
                  badge: "Gold Contributor",
                  badgeBg: "bg-amber-50 text-amber-600 border border-amber-150",
                  details: "Modified placement percentages and Amalthea festival dates. Corrected coordinate references."
                },
                {
                  rev: 1,
                  title: "Initial page creation",
                  author: "System Init",
                  avatar: "SY",
                  time: "2 days ago",
                  badge: "System",
                  badgeBg: "bg-gray-50 text-gray-600 border border-gray-150",
                  details: "Imported markdown core structure, category hierarchies, and initial infobox configurations."
                }
              ].map((revision) => (
                <div key={revision.rev} className="p-5 border border-gray-150 bg-white rounded-2xl shadow-depth shadow-depth-hover transition-all duration-150 relative group">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-150 flex items-center justify-center font-bold text-sm text-gray-750 shrink-0">
                      {revision.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-base font-bold text-gray-800 truncate leading-snug">{revision.title}</h4>
                        <span className="text-xs text-gray-400 shrink-0 font-medium">{revision.time}</span>
                      </div>
                      <p className="text-sm text-gray-550 mt-1.5 leading-relaxed">{revision.details}</p>
                      
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 border-dashed">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-700">{revision.author}</span>
                          <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${revision.badgeBg}`}>
                            {revision.badge}
                          </span>
                        </div>
                        
                        <button 
                          onClick={() => {
                            alert(`Restoring Revision #${revision.rev}...`);
                            setShowRevisions(false);
                          }}
                          className="text-xs font-extrabold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer duration-150"
                        >
                          Restore Version
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showPendingChanges) {
    return (
      <div className="fixed inset-0 bg-white z-[60] flex flex-col h-screen w-screen overflow-hidden select-none animate-in fade-in duration-200">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-gray-150 flex items-center gap-4 px-4 lg:px-6 shrink-0 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] select-none">
          <button
            onClick={() => {
              setShowPendingChanges(false);
              window.dispatchEvent(new CustomEvent("hide-wiki-history"));
            }}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-655 transition-colors duration-200 cursor-pointer active:scale-95 flex items-center justify-center animate-in fade-in"
            aria-label="Back to Wiki"
          >
            <ArrowLeft className="h-6 w-6 text-black" />
          </button>
          <span className="text-sm font-bold text-gray-800 uppercase tracking-wider">Changes</span>
        </header>

        {/* Changes Body (Like Search & Bookmarks pages) */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6 md:p-8 lg:p-12">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-serif font-black text-gray-900 tracking-tight">Pending Approval</h2>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Review proposed community revisions before publishing</p>
            </div>

            <div className="space-y-4 pt-4">
              {[
                {
                  rev: 1,
                  title: "Updated CS Major placement statistics for 2025",
                  author: "Rohan Sharma",
                  avatar: "RS",
                  time: "2 hours ago",
                  badge: "Student Contributor",
                  badgeBg: "bg-emerald-50 text-emerald-600 border border-emerald-150",
                  details: "Proposed update to placements: CS average package changed from 22.4 LPA to 23.8 LPA according to official council records."
                },
                {
                  rev: 2,
                  title: "Palaj Campus hostel guide clarification",
                  author: "Aditi Patel",
                  avatar: "AP",
                  time: "6 hours ago",
                  badge: "Guest Editor",
                  badgeBg: "bg-gray-50 text-gray-600 border border-gray-150",
                  details: "Suggested formatting and detail cleanups under the hostel guide laundry services."
                }
              ].map((pending) => (
                <div key={pending.rev} className="p-5 border border-gray-150 bg-white rounded-2xl shadow-depth shadow-depth-hover transition-all duration-150 relative group">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-150 flex items-center justify-center font-bold text-sm text-gray-700 shrink-0">
                      {pending.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-base font-bold text-gray-800 truncate leading-snug">{pending.title}</h4>
                        <span className="text-xs text-gray-400 shrink-0 font-medium">{pending.time}</span>
                      </div>
                      <p className="text-sm text-gray-550 mt-1.5 leading-relaxed">{pending.details}</p>
                      
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 border-dashed">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-700">{pending.author}</span>
                          <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${pending.badgeBg}`}>
                            {pending.badge}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => {
                              alert(`Proposed change approved successfully!`);
                              setShowPendingChanges(false);
                              window.dispatchEvent(new CustomEvent("hide-wiki-history"));
                            }}
                            className="text-xs font-extrabold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer duration-150"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => {
                              alert(`Proposed change rejected.`);
                              setShowPendingChanges(false);
                              window.dispatchEvent(new CustomEvent("hide-wiki-history"));
                            }}
                            className="text-xs font-extrabold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer duration-150"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* InfoBox (Left Sidebar) */}
      <aside
        style={{ width: rightSidebarOpen ? (isMobile ? "320px" : `${rightWidth}px`) : undefined }}
        className={`
          border-r border-gray-150 shrink-0 overflow-y-auto overflow-x-hidden bg-white flex flex-col select-none right-sidebar-mobile-toggle no-scrollbar
          transition-all duration-300 ease-in-out
          fixed lg:static inset-y-0 left-0 z-50 lg:z-auto lg:h-full lg:border-r lg:border-gray-150
          ${
            rightSidebarOpen
              ? "translate-x-0 w-80 shadow-2xl lg:shadow-none lg:border-r lg:border-gray-150"
              : "-translate-x-full lg:translate-x-0 lg:w-0 lg:border-r-0 overflow-hidden pointer-events-none lg:pointer-events-auto"
          }
        `}
      >
        {/* Inner fixed-width container to prevent layout squeezing during transitions */}
        <div style={{ width: isMobile ? "320px" : `${rightWidth}px` }} className="h-full flex flex-col shrink-0 relative">
          {/* Mobile-only absolute close button */}
          {rightSidebarOpen && (
            <button
              onClick={() => setRightSidebarOpen(false)}
              className="lg:hidden absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg text-gray-450 hover:text-gray-700 transition-colors duration-200 cursor-pointer active:scale-95 z-50"
              aria-label="Close Right Sidebar"
            >
              <X className="h-6 w-6 text-black" />
            </button>
          )}
          {/* Infobox Image */}
          <div
            className={`w-full relative bg-gray-50 border-b border-gray-100 flex items-center justify-center overflow-hidden transition-all duration-300 shrink-0 ${
              isEditing ? "h-32 p-4 bg-gray-50/50" : "aspect-square"
            }`}
          >
            <div className={`w-full h-full relative overflow-hidden transition-all duration-300 ${
              isEditing ? "rounded-xl border border-gray-200 shadow-sm bg-white" : ""
            }`}>
              {parsed.infobox.image ? (
                <img
                  src={parsed.infobox.image}
                  alt={parsed.infobox.imageAlt}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-300 text-sm font-medium absolute inset-0 flex items-center justify-center bg-gray-50">No Image</div>
              )}
            </div>
          </div>

          {/* Inline Image Editor Fields (In-place, only shown when editing) */}
          {isEditing && (
            <div className="p-6 border-b border-gray-100 flex flex-col gap-4 bg-gray-50/30 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">
                  Image Options
                </h4>
                {parsed.infobox.image && (
                  <button
                    onClick={() =>
                      handleInfoboxChange({
                        ...parsed.infobox,
                        image: "",
                        imageAlt: "",
                      })
                    }
                    className="text-rose-500 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Remove Image"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              
              {/* Image URL input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">
                  Image URL
                </label>
                <input
                  type="text"
                  value={parsed.infobox.image || ""}
                  onChange={(e) =>
                    handleInfoboxChange({
                      ...parsed.infobox,
                      image: e.target.value,
                    })
                  }
                  placeholder="https://example.com/image.jpg"
                  className="w-full border border-gray-200 hover:border-gray-300 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-gray-800 placeholder-gray-400 bg-white focus:outline-none transition-all duration-150 shadow-sm"
                />
              </div>

              {/* Alt Text input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">
                  Caption / Alt Text
                </label>
                <input
                  type="text"
                  value={parsed.infobox.imageAlt || ""}
                  onChange={(e) =>
                    handleInfoboxChange({
                      ...parsed.infobox,
                      imageAlt: e.target.value,
                    })
                  }
                  placeholder="e.g. Campus View"
                  className="w-full border border-gray-200 hover:border-gray-300 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-gray-800 placeholder-gray-400 bg-white focus:outline-none transition-all duration-150 shadow-sm"
                />
              </div>
            </div>
          )}

          {/* Infobox Fields Table */}
          <div className="p-6">
            <h4 className="text-[10px] font-bold text-gray-400 tracking-wider mb-4 uppercase">
              Key Information
            </h4>
            <table className="w-full text-xs text-gray-700">
              <tbody>
                {parsed.infobox.rows.map((row, index) => {
                  const isLast = index === parsed.infobox.rows.length - 1;
                  return (
                    <tr
                      key={index}
                      className={isLast ? "" : "border-b border-gray-50"}
                    >
                      <td className="py-3 pr-2 align-top w-[35%]">
                        {isEditing ? (
                          <EditableCell
                            initialValue={row.label}
                            onChange={(newLabel) => {
                              const newRows = [...parsed.infobox.rows];
                              newRows[index] = {
                                ...row,
                                label: newLabel,
                              };
                              handleInfoboxChange({
                                ...parsed.infobox,
                                rows: newRows,
                              });
                            }}
                            placeholder="Label"
                            className="w-full border border-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-indigo-500 font-semibold text-gray-700 uppercase tracking-wider bg-transparent"
                          />
                        ) : (
                          <span className="font-semibold text-gray-400 uppercase tracking-wider">{row.label}</span>
                        )}
                      </td>
                      <td className="py-3 align-top font-semibold text-gray-900">
                        {isEditing ? (
                          <div className="flex gap-2 items-center w-full">
                            <EditableCell
                              initialValue={Array.isArray(row.value) ? row.value.join(", ") : (row.value as string)}
                              onChange={(newVal) => {
                                const isBadgeType = row.type === "badge";
                                const parsedValue = isBadgeType
                                  ? newVal.split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean)
                                  : newVal;
                                
                                const newRows = [...parsed.infobox.rows];
                                newRows[index] = {
                                  ...row,
                                  value: parsedValue,
                                };
                                handleInfoboxChange({
                                  ...parsed.infobox,
                                  rows: newRows,
                                });
                              }}
                              placeholder="Value (use comma for tags)"
                              className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 font-normal bg-transparent resize-none"
                              as={row.type === "badge" ? "textarea" : "input"}
                            />
                            <button
                              onMouseDown={(e) => {
                                e.preventDefault(); // Prevent input from losing focus
                                const currentType = row.type || "text";
                                const nextType = currentType === "badge" ? "text" : "badge";
                                const newRows = [...parsed.infobox.rows];
                                
                                let nextValue = row.value;
                                if (nextType === "badge" && typeof row.value === "string") {
                                  nextValue = row.value.split(",").map((s) => s.trim()).filter(Boolean);
                                } else if (nextType === "text" && Array.isArray(row.value)) {
                                  nextValue = row.value.join(", ");
                                }

                                newRows[index] = {
                                  ...row,
                                  type: nextType,
                                  value: nextValue,
                                };
                                handleInfoboxChange({
                                  ...parsed.infobox,
                                  rows: newRows,
                                });
                              }}
                              className={`p-1 rounded cursor-pointer transition-colors ${
                                row.type === "badge"
                                  ? "text-indigo-600 bg-indigo-50 hover:bg-indigo-100/80"
                                  : "text-gray-400 hover:text-indigo-600 hover:bg-gray-50"
                              }`}
                              title={`Toggle representation (currently: ${row.type === "badge" ? "Badges/Tags" : "Text line"}). Click to switch.`}
                            >
                              <Tag className="h-4 w-4" />
                            </button>
                            <button
                              onMouseDown={(e) => {
                                e.preventDefault(); // Prevent input from losing focus
                                const newRows = parsed.infobox.rows.filter((_, idx) => idx !== index);
                                handleInfoboxChange({
                                  ...parsed.infobox,
                                  rows: newRows,
                                });
                              }}
                              className="text-gray-450 hover:text-rose-500 p-1 cursor-pointer transition-colors"
                              title="Delete fact row"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ) : row.type === "badge" && Array.isArray(row.value) ? (
                          <div className="flex flex-wrap gap-1">
                            {row.value.map((val) => (
                              <span
                                key={val}
                                className="text-[10px] text-indigo-600 border border-indigo-200 rounded-full px-2 py-0.5 font-semibold bg-indigo-50/50"
                              >
                                {val}
                              </span>
                            ))}
                          </div>
                        ) : (
                          row.value
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {isEditing && (
              <button
                onClick={() => {
                  const newRows = [...parsed.infobox.rows];
                  newRows.push({
                    label: "",
                    value: "",
                    type: "text"
                  });
                  handleInfoboxChange({
                    ...parsed.infobox,
                    rows: newRows
                  });
                }}
                className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-gray-200 hover:border-indigo-300 text-gray-400 hover:text-indigo-600 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150 hover:bg-indigo-50/5"
              >
                <span>+ Add</span>
              </button>
            )}
          </div>

          <div className="p-6 select-none pt-0">
            <h4 className="text-[10px] font-bold text-gray-400 tracking-wider mb-4 uppercase">
              Table of Contents
            </h4>
            <ul className="text-xs flex flex-col gap-2.5 font-semibold">
              {parsed.toc.map((item, index) => {
                const isActive = activeSection === item.id;
                return (
                  <div key={item.id} className="flex flex-col gap-1.5">
                    <li className="flex items-center justify-between">
                      <a
                        href={`#${item.id}`}
                        onClick={(e) => handleTocClick(e, item.id)}
                        className={`truncate flex-1 py-0.5 transition-all duration-150 ${
                          isActive
                            ? "text-indigo-600 font-bold translate-x-1"
                            : "text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        {index + 1}. {item.title}
                      </a>
                    </li>
                    {item.subItems && item.subItems.length > 0 && (
                      <ul className="flex flex-col gap-1.5 pl-3 text-[11px] font-medium border-l border-gray-100 ml-1.5">
                        {item.subItems.map((sub, idx) => {
                          const isSubActive = activeSection === sub.id;
                          return (
                            <li key={sub.id}>
                              <a
                                href={`#${sub.id}`}
                                onClick={(e) => handleTocClick(e, sub.id)}
                                className={`truncate block py-0.5 transition-all duration-150 ${
                                  isSubActive
                                    ? "text-indigo-500 font-bold translate-x-0.5"
                                    : "text-gray-400 hover:text-gray-600"
                                }`}
                              >
                                {index + 1}.{idx + 1} {sub.title}
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </ul>
          </div>
        </div>
      </aside>

      {/* Resize Handle - desktop only */}
      {rightSidebarOpen && (
        <div
          onMouseDown={startResizeRight}
          onDoubleClick={handleRightDoubleClick}
          className="hidden lg:block w-1.5 -ml-1 cursor-col-resize hover:bg-indigo-500/30 active:bg-indigo-500/50 transition-colors z-20 h-full shrink-0"
          title="Drag to resize, double-click to reset"
        />
      )}

      {/* Main Content Wrapper */}
      <div className={`flex flex-1 h-full w-full min-w-full lg:min-w-0 overflow-hidden transition-transform duration-300 ease-in-out ${
        rightSidebarOpen ? "translate-x-80 lg:translate-x-0" : "translate-x-0"
      }`}>
        {/* Main Scrollable Article Body */}
        <main className="flex-1 min-w-full lg:min-w-0 px-4 md:px-8 pt-8 pb-28 overflow-y-auto bg-white relative scroll-smooth">
          <article className="w-full max-w-5xl mx-auto space-y-6">
            {/* Teleported editor toolbar container */}
            {isEditing && (
              <div 
                ref={setToolbarContainer} 
                className="border border-gray-150 rounded-xl bg-gray-50 p-1.5 mb-6 milkdown flex items-center justify-center min-h-10"
              />
            )}
            {/* Title Header (Separated from editor to prevent accidental deletion) */}
            {isEditing ? (
              <EditableCell
                initialValue={parsed.title}
                onChange={handleTitleChange}
                placeholder="Untitled Page"
                className="text-4xl font-display font-black tracking-tight text-gray-900 w-full border-none focus:outline-none focus:ring-0 mb-8 bg-transparent placeholder-gray-200"
              />
            ) : (
              <h1 className="text-4xl font-display font-black tracking-tight text-gray-900 mb-8">
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
                      id: "sidebar",
                      label: "Sidebar",
                      icon: PanelRight,
                      onClick: () => setRightSidebarOpen(!rightSidebarOpen),
                    },
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
                  ]
            }
            activeTab={rightSidebarOpen ? "sidebar" : (isEditing ? "edit" : undefined)}
            style={{
              left: !isMobile && rightSidebarOpen ? `calc((100vw - ${rightWidth}px) / 2)` : '50%'
            }}
            className="fixed bottom-6 transform -translate-x-1/2 z-[9999]"
          />
        </main>
      </div>
      </>
    );
}
