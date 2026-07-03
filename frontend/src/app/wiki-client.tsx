"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import NextLink from "next/link";
import { parseMarkdown, stringifyMarkdown } from "@/lib/utils";
import { InfoboxData } from "@/lib/types";
import {
  Search,
  ChevronDown,
  Share2,
  Edit3,
  Bookmark,
  Download,
  Check,
  X,
  Home,
  Map,
  BookOpen,
  Users,
  Compass,
  Link,
  ChevronRight,
  Menu,
  Tag,
  Settings,
  HelpCircle,
  History,
  LogOut,
  Trash2,
  PlusCircle,
  Calendar,
  MessageSquare,
  Activity
} from "lucide-react";

// Dynamically import MilkdownEditor so it doesn't run during SSR
const MilkdownEditor = dynamic(() => import("@/components/article/milkdown-editor"), {
  ssr: false,
});

interface WikiClientProps {
  initialMarkdown: string;
}

interface EditableCellProps {
  initialValue: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  as?: "input" | "textarea";
}

function EditableCell({ initialValue, onChange, placeholder, className, as = "input" }: EditableCellProps) {
  const [val, setVal] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setVal(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (as === "textarea" && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [val, as]);

  if (as === "textarea") {
    return (
      <textarea
        ref={textareaRef}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => {
          if (val !== initialValue) {
            onChange(val);
          }
        }}
        placeholder={placeholder}
        className={className}
        rows={1}
        style={{ overflow: "hidden", resize: "none" }}
      />
    );
  }

  return (
    <input
      type="text"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => {
        if (val !== initialValue) {
          onChange(val);
        }
      }}
      placeholder={placeholder}
      className={className}
    />
  );
}

export default function WikiClient({ initialMarkdown }: WikiClientProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [activeSection, setActiveSection] = useState<string>("");
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toolbarContainer, setToolbarContainer] = useState<HTMLDivElement | null>(null);
  const markdownRef = useRef(markdown);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

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

  // Parse markdown dynamically
  const parsed = useMemo(() => parseMarkdown(markdown), [markdown]);

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
    headings.forEach((heading) => {
      const text = heading.textContent || "";
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      if (heading.id !== id) {
        heading.id = id;
      }
    });
  }, [markdown, editorLoaded]);

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
  }, [markdown, isEditing, activeSection, editorLoaded]);

  const handleTocClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const heading = document.getElementById(id);
    const mainElement = document.querySelector("main");
    if (heading && mainElement) {
      heading.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
    }
  };



  // Static navigation menu items
  const menuItems = [
    { title: "Home", icon: Home, link: "/" },
    { title: "Campus Map", icon: Map, link: "#" },
    { title: "Academics", icon: BookOpen, link: "#" },
    { title: "Student Life", icon: Users, link: "#" },
  ];

  return (
    <div className="flex flex-col w-full h-screen bg-[#fcfcfd] overflow-hidden font-sans">
      {/* Top Header Bar */}
      <header className="h-16 border-b border-gray-100 flex items-center justify-between px-8 shrink-0 bg-white shadow-sm z-10">
        {/* Leftmost: Hamburger Menu & Brand Logo */}
        <div className="flex items-center gap-4">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {menuOpen && (
              <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-300 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="py-1">
                  <a href="#" className="flex items-center gap-3 px-4 py-2 text-xs text-gray-900 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors font-semibold">
                    <PlusCircle className="h-4 w-4 text-gray-500" />
                    <span>New Article</span>
                  </a>
                  <a href="#" className="flex items-center gap-3 px-4 py-2 text-xs text-gray-900 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors font-semibold">
                    <History className="h-4 w-4 text-gray-500" />
                    <span>History</span>
                  </a>
                  <a href="#" className="flex items-center gap-3 px-4 py-2 text-xs text-gray-900 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors font-semibold">
                    <Settings className="h-4 w-4 text-gray-500" />
                    <span>Settings</span>
                  </a>
                  <a href="#" className="flex items-center gap-3 px-4 py-2 text-xs text-gray-900 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors font-semibold">
                    <HelpCircle className="h-4 w-4 text-gray-500" />
                    <span>Help</span>
                  </a>
                </div>

                {/* Section 2: Campus Tools */}
                <div className="px-4 py-1.5 border-t border-b border-gray-50 mt-1">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Campus</p>
                </div>
                <div className="py-1">
                  <a href="#" className="flex items-center gap-3 px-4 py-2 text-xs text-gray-900 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors font-semibold">
                    <Map className="h-4 w-4 text-gray-500" />
                    <span>Map</span>
                  </a>
                  <a href="#" className="flex items-center gap-3 px-4 py-2 text-xs text-gray-900 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors font-semibold">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>Events</span>
                  </a>
                  <a href="#" className="flex items-center gap-3 px-4 py-2 text-xs text-gray-900 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors font-semibold">
                    <MessageSquare className="h-4 w-4 text-gray-500" />
                    <span>Forum</span>
                  </a>
                  <a href="#" className="flex items-center gap-3 px-4 py-2 text-xs text-gray-900 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors font-semibold">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>Directory</span>
                  </a>
                </div>

                <div className="border-t border-gray-50 my-1"></div>
                <div className="py-1">
                  <a href="#" className="flex items-center gap-3 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50/50 transition-colors font-semibold">
                    <LogOut className="h-4 w-4 text-rose-400" />
                    <span>Sign Out</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          <NextLink href="/" className="flex items-center gap-3 select-none cursor-pointer group">
            <div className="flex items-center justify-center w-9 h-9 bg-gray-950 text-white font-display font-black text-xs rounded-full shadow transition-transform group-hover:scale-105">
              mI
            </div>
            <span className="text-xl font-sans font-black tracking-tight text-gray-900 transition-colors group-hover:text-indigo-600">
              meta IIT GN
            </span>
          </NextLink>
        </div>

        <div className={`relative flex items-center flex-1 w-full h-full mx-8 transition-all duration-500 ease-in-out ${
          isEditing ? "max-w-5xl" : "max-w-xl"
        }`}>
          {/* Editor Toolbar Portal */}
          <div
            id="editor-toolbar-portal"
            ref={setToolbarContainer}
            className={`milkdown w-full h-full flex items-center justify-center transition-all duration-500 ease-in-out ${
              isEditing
                ? "opacity-100 pointer-events-auto translate-y-0 scale-100 relative w-full shrink-0"
                : "opacity-0 pointer-events-none -translate-y-2 scale-95 absolute inset-x-0"
            }`}
            onMouseDown={() => {
              setTimeout(() => {
                const miniBar = document.querySelector(".milkdown-toolbar");
                if (miniBar) {
                  (miniBar as HTMLElement).style.display = "none";
                }
              }, 50);
            }}
          />

          {/* Search Box */}
          <div className={`w-full transition-all duration-500 ease-in-out ${
            isEditing
              ? "opacity-0 pointer-events-none translate-y-2 scale-95 absolute inset-x-0"
              : "opacity-100 pointer-events-auto translate-y-0 scale-100 relative w-full shrink-0"
          }`}>
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search campus wiki..."
                className="w-full bg-[#f3f4f6]/80 hover:bg-[#f3f4f6] focus:bg-white border border-gray-500 focus:border-gray-700 rounded-full pl-10 pr-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Profile Info */}
        <div className="flex items-center gap-4 relative">
          <button className="flex items-center gap-2 group cursor-pointer">
            <div className="h-8 w-8 rounded-full overflow-hidden relative border border-gray-100 bg-gray-100 flex items-center justify-center">
              <div className="w-full h-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-inner">
                JB
              </div>
            </div>
            <span className="text-xs font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">
              Jane Brady
            </span>
            <ChevronDown className="h-3 w-3 text-gray-400 group-hover:text-gray-600" />
          </button>
        </div>
      </header>

      {/* Main Content Workspace */}
      <div className="flex flex-1 overflow-hidden w-full">
        {/* Left Sidebar */}
        <aside className="w-64 border-r border-gray-300 p-6 shrink-0 overflow-y-auto bg-white flex flex-col gap-6 select-none">
          {/* Main Navigation Menu */}
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 tracking-wider mb-3 uppercase">
              Explore
            </h3>
            <nav className="flex flex-col gap-1">
              {menuItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <NextLink
                    key={index}
                    href={item.link}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all duration-150"
                  >
                    <IconComponent className="h-4 w-4 text-gray-400 group-hover:text-indigo-600" />
                    <span className="flex-1">{item.title}</span>
                    <ChevronRight className="h-3 w-3 text-gray-300 opacity-0 hover:opacity-100" />
                  </NextLink>
                );
              })}
            </nav>
          </div>

          <hr className="border-gray-100" />

          {/* Action Toolbar */}
          <div className="flex flex-col gap-2">
            <h3 className="text-[10px] font-bold text-gray-400 tracking-wider mb-2 uppercase">
              Actions
            </h3>
            <nav className="flex flex-col gap-2 text-xs text-gray-600 font-semibold">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-emerald-50 text-emerald-600 font-bold cursor-pointer transition-colors"
                  >
                    <Check className="h-4 w-4" /> SAVE CHANGES
                  </button>
                  <button
                    onClick={() => {
                      setMarkdown(initialMarkdown);
                      markdownRef.current = initialMarkdown;
                      setIsEditing(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-500 font-bold cursor-pointer transition-colors"
                  >
                    <X className="h-4 w-4" /> CANCEL
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-indigo-50 text-indigo-600 font-bold cursor-pointer transition-colors"
                >
                  <Edit3 className="h-4 w-4" /> EDIT ARTICLE
                </button>
              )}
              <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <History className="h-4 w-4 text-gray-400" /> CHANGES
              </button>
              <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <Share2 className="h-4 w-4 text-gray-400" /> SHARE
              </button>
              <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <Bookmark className="h-4 w-4 text-gray-400" /> BOOKMARK
              </button>
              <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <Download className="h-4 w-4 text-gray-400" /> DOWNLOAD
              </button>
            </nav>
          </div>

          <hr className="border-gray-100" />

          {/* Dynamic Table of Contents */}
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 tracking-wider mb-3 uppercase">
              Contents
            </h3>
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
                          const subId = sub.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                          const isSubActive = activeSection === subId;
                          return (
                            <li key={idx}>
                              <a
                                href={`#${subId}`}
                                onClick={(e) => handleTocClick(e, subId)}
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

        {/* Main Scrollable Article Body */}
        <main className="flex-1 px-16 pt-8 pb-12 overflow-y-auto bg-white relative scroll-smooth">
          <article className="w-full max-w-4xl mx-auto">
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

        {/* InfoBox (Right Sidebar) */}
        <aside className="w-80 border-l border-gray-300 shrink-0 overflow-y-auto bg-white flex flex-col select-none">
          {/* Infobox Image */}
          <div
            className={`w-full relative bg-gray-50 border-b border-gray-100 flex items-center justify-center overflow-hidden transition-all duration-300 ${
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
        </aside>
      </div>
    </div>
  );
}
