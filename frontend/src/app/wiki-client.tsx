"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import NextLink from "next/link";
import { parseMarkdown, stringifyMarkdown } from "@/lib/utils";
import { InfoboxData } from "@/lib/types";

import { EditableCell } from "@/components/article/editable-cell";
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
  Home
} from "lucide-react";

// Dynamically import MilkdownEditor so it doesn't run during SSR
const MilkdownEditor = dynamic(() => import("@/components/article/milkdown-editor"), {
  ssr: false,
});

interface WikiClientProps {
  initialMarkdown: string;
  defaultEditing?: boolean;
  pageId?: string;
}

export default function WikiClient({ initialMarkdown, defaultEditing, pageId = "1" }: WikiClientProps) {
  const [isEditing, setIsEditing] = useState(defaultEditing || false);
  const [currentPageId, setCurrentPageId] = useState(pageId);
  const [savedMarkdown, setSavedMarkdown] = useState(initialMarkdown);
  const [markdown, setMarkdown] = useState(initialMarkdown);

  useEffect(() => {
    setSavedMarkdown(initialMarkdown);
    setMarkdown(initialMarkdown);
    setCurrentPageId(pageId);
  }, [initialMarkdown, pageId]);
  const parsed = useMemo(() => parseMarkdown(markdown), [markdown]);
  const [activeSection, setActiveSection] = useState<string>("");
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toolbarContainer, setToolbarContainer] = useState<HTMLDivElement | null>(null);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  const [rightWidth, setRightWidth] = useState(320);

  useEffect(() => {
    const savedRight = localStorage.getItem("wiki-right-sidebar-width");
    if (savedRight) setRightWidth(Math.max(200, Number(savedRight)));
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
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    const targetUrl = `${apiBase}/page/${currentPageId}`;
    
    console.log("=== Debug Save ===");
    console.log("Browser Origin:", window.location.origin);
    console.log("Target URL:", targetUrl);
    console.log("Markdown Content:", markdownRef.current);
    
    try {
      const response = await fetch(targetUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: markdownRef.current }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.content) {
          setSavedMarkdown(data.content);
          setMarkdown(data.content);
          markdownRef.current = data.content;
        }
      } else {
        console.error("Failed to save page. Server returned status:", response.status);
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





  return (
    <>

        {/* Main Scrollable Article Body */}
        <main className="flex-1 px-4 md:px-8 pt-8 pb-20 overflow-y-auto bg-white relative scroll-smooth">
          <article className="w-full max-w-5xl mx-auto space-y-6">
            
            {/* Article Action Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-150 pb-4 mb-6 select-none">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Wiki Page
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden md:flex">
                {isEditing ? (
                  <div className="flex gap-5">
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs cursor-pointer transition-colors shadow-sm"
                    >
                      <Check className="h-4 w-4" /> Save
                    </button>
                    <button
                      onClick={() => {
                        setMarkdown(savedMarkdown);
                        markdownRef.current = savedMarkdown;
                        setIsEditing(false);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs cursor-pointer transition-colors shadow-sm"
                    >
                      <X className="h-4 w-4" /> Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs cursor-pointer transition-colors shadow-sm"
                    >
                      <Edit3 className="h-4 w-4" /> Edit Page
                    </button>
                  </>
                )}
                </div>
                
                <div className="h-6 w-px bg-gray-250 mx-1" />
                
                <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors cursor-pointer" title="History">
                  <History className="h-4 w-4" />
                </button>
                <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors cursor-pointer" title="Share">
                  <Share2 className="h-4 w-4" />
                </button>
                <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors cursor-pointer" title="Bookmark">
                  <Bookmark className="h-4 w-4" />
                </button>
                <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors cursor-pointer" title="Download">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>

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
        </main>

        <div
          onMouseDown={startResizeRight}
          onDoubleClick={handleRightDoubleClick}
          className="hidden lg:block w-1.5 -mr-1 cursor-col-resize hover:bg-indigo-500/30 active:bg-indigo-500/50 transition-colors z-20 h-full shrink-0"
          title="Drag to resize, double-click to reset"
        />
        {/* Mobile Backdrop for Right Sidebar */}
        {rightSidebarOpen && (
          <div
            onClick={() => setRightSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-[2px] z-45 animate-in fade-in duration-200"
          />
        )}

        {/* InfoBox (Right Sidebar) */}
        <aside
          style={{ width: `${rightWidth}px` }}
          className={`
            border-l border-gray-300 shrink-0 overflow-y-auto bg-white flex flex-col select-none right-sidebar-mobile-toggle
            fixed lg:static top-0 bottom-0 right-0 z-50 lg:z-auto h-full lg:h-auto shadow-2xl lg:shadow-none min-w-sm
            transition-transform duration-300 ease-in-out
            ${rightSidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
          `}
        >
          {/* Close Button on Mobile */}
          <div className="lg:hidden absolute top-4 right-4 z-50">
            <button
              onClick={() => setRightSidebarOpen(false)}
              className="p-2 bg-white/95 hover:bg-white backdrop-blur-md rounded-full shadow border border-slate-200 text-gray-500 hover:text-gray-900 transition-all active:scale-95 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
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
                              className="text-gray-400 hover:text-rose-500 p-1 cursor-pointer transition-colors"
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
        </aside>

        {/* Pinned Bottom Dock for Small Screens */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200/85 shadow-lg p-3 flex items-center justify-around z-40">
          {isEditing ? (
            <div className="flex w-full divide-x divide-slate-200">
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
              >
                <Check className="h-5 w-5" />
                <span>SAVE CHANGES</span>
              </button>
              <button
                onClick={() => {
                  setMarkdown(savedMarkdown);
                  markdownRef.current = savedMarkdown;
                  setIsEditing(false);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
                <span>CANCEL</span>
              </button>
            </div>
          ) : (
            <>
              {/* Button 1: Home */}
              <NextLink
                href="/"
                className="flex flex-col items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <Home className="h-5 w-5" />
                <span>Home</span>
              </NextLink>

              {/* Button 2: Edit */}
              <button
                onClick={() => setIsEditing(true)}
                className="flex flex-col items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
              >
                <Edit3 className="h-5 w-5" />
                <span>Edit</span>
              </button>


              {/* Button 4: Sidebar Toggle */}
              <button
                onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
                className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-colors cursor-pointer ${
                  rightSidebarOpen ? "text-indigo-600" : "text-slate-500 hover:text-indigo-600"
                }`}
              >
                <PanelRight className="h-5 w-5" />
                <span>Sidebar</span>
              </button>
            </>
          )}
        </div>
      </>
    );
}
