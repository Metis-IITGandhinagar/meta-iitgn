"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Trash2, Tag } from "lucide-react";
import { EditableCell } from "@/components/article/editable-cell";
import { InfoboxData } from "@/lib/types";
import { apiService } from "@/api";
import { useAuth } from "@/hooks/useAuth";
import type { Category } from "@/context/AuthContext";
import { toast } from "react-hot-toast";

interface WikiInfoBoxProps {
  rightSidebarOpen: boolean;
  setRightSidebarOpen: (open: boolean) => void;
  isMobile: boolean;
  rightWidth: number;
  isEditing: boolean;
  parsed: {
    infobox: InfoboxData;
    contentMarkdown?: string;
    toc: Array<{
      id: string;
      title: string;
      subItems?: Array<{ id: string; title: string }>;
    }>;
  };
  handleInfoboxChange: (newInfobox: InfoboxData) => void;
  activeSection: string;
  handleTocClick: (e: React.MouseEvent<HTMLAnchorElement>, id: string) => void;
  startResizeRight: (e: React.MouseEvent) => void;
  handleRightDoubleClick: () => void;
}

/**
 * Category selector for the infobox "Category" row. It acts like a dropdown you
 * can also type into, but only lets you commit a value that matches one of the
 * real categories (typed free-text is reverted on blur/close).
 */
function CategoryCombobox({
  value,
  onChange,
  categories,
}: {
  value: string;
  onChange: (value: string) => void;
  categories: Category[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  const normalized = (s: string) => s.toLowerCase().trim();
  const filtered = categories.filter(
    (c) =>
      !query ||
      normalized(c.name).includes(normalized(query)) ||
      normalized(c.slug).includes(normalized(query))
  );
  const isValid = categories.some(
    (c) =>
      normalized(c.name) === normalized(query) ||
      normalized(c.slug) === normalized(query)
  );

  const select = (cat: Category) => {
    onChange(cat.name);
    setQuery(cat.name);
    setOpen(false);
  };

  // Only allow committing a real category — revert stray text on close/blur.
  const revertIfInvalid = () => {
    if (!isValid) setQuery(value || "");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " ") {
      e.stopPropagation();
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && filtered[activeIndex]) select(filtered[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
      revertIfInvalid();
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActiveIndex(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(revertIfInvalid, 120)}
        onKeyDown={handleKeyDown}
        placeholder="Select category"
        className="w-full border border-base-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-primary font-normal bg-transparent resize-none"
      />
      {open && (
        <ul className="absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-lg border border-base-300 bg-base-100 shadow-lg no-scrollbar">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-xs text-base-content/40">
              No matching categories
            </li>
          ) : (
            filtered.map((cat, idx) => (
              <li
                key={cat.category_id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(cat);
                }}
                onMouseEnter={() => setActiveIndex(idx)}
                className={`px-3 py-2 text-xs cursor-pointer ${
                  idx === activeIndex
                    ? "bg-primary/10 text-primary"
                    : "text-base-content hover:bg-base-200"
                }`}
              >
                {cat.name}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export default function WikiInfoBox({
  rightSidebarOpen,
  setRightSidebarOpen,
  isMobile,
  rightWidth,
  isEditing,
  parsed,
  handleInfoboxChange,
  activeSection,
  handleTocClick,
  startResizeRight,
  handleRightDoubleClick,
}: WikiInfoBoxProps) {
  const { categories } = useAuth();
  return (
    <>
      {/* Resize Handle - desktop only, sits on the left edge of the right sidebar */}
      {rightSidebarOpen && (
        <div
          onMouseDown={startResizeRight}
          onDoubleClick={handleRightDoubleClick}
          className="hidden lg:block w-1.5 -mr-1 cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors z-20 h-full shrink-0 order-2"
          title="Drag to resize, double-click to reset"
        />
      )}

      {/* InfoBox (Right Sidebar) */}
      <aside
        style={{ width: rightSidebarOpen ? (isMobile ? "320px" : `${rightWidth}px`) : undefined }}
        className={`
          border-l border-base-200 shrink-0 overflow-y-auto overflow-x-hidden bg-base-100 flex flex-col select-none right-sidebar-mobile-toggle no-scrollbar 
          transition-transform duration-300 ease-in-out order-3
          fixed lg:relative top-16 lg:top-0 bottom-0 right-0 z-[10001] h-[calc(100vh-4rem)] lg:h-full
          ${
            rightSidebarOpen
              ? "translate-x-0 w-80 shadow-2xl lg:shadow-none"
              : "translate-x-full lg:translate-x-0 lg:w-0 lg:border-l-0 overflow-hidden pointer-events-none lg:pointer-events-auto"
          }
        `}
      >
        {/* Inner fixed-width container to prevent layout squeezing during transitions */}
        <div style={{ width: isMobile ? "320px" : `${rightWidth}px` }} className="h-full flex flex-col shrink-0 relative">
          {/* Mobile-only absolute close button */}
          {rightSidebarOpen && (
            <button
              onClick={() => setRightSidebarOpen(false)}
              className="lg:hidden absolute top-4 right-4 p-1 hover:bg-base-200 rounded-lg text-base-content/50 hover:text-base-content/80 transition-colors duration-200 cursor-pointer active:scale-95 z-50"
              aria-label="Close Sidebar"
            >
              <X className="h-6 w-6 text-base-content" />
            </button>
          )}
          {/* Infobox Image */}
          <div
            className={`w-full relative ${isEditing ? "mt-15" : "md:mt-18"} bg-base-200/50 border-b border-base-200 flex items-center justify-center overflow-hidden transition-all duration-300 shrink-0 ${
              isEditing ? "h-32 p-4" : "object-cover p-1"
            }`}
          >
            <div className={`w-full h-full relative overflow-hidden transition-all duration-300 ${
              isEditing ? "rounded-xl border border-base-300/80 shadow-sm bg-base-100" : ""
            }`}>
              {parsed.infobox.image ? (
                <img
                  src={parsed.infobox.image}
                  alt={parsed.infobox.imageAlt}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-base-content/30 text-sm font-medium absolute inset-0 flex items-center justify-center bg-base-200/50">No Image</div>
              )}
            </div>
          </div>

          {/* Description below image in read mode */}
          {parsed.infobox.description && !isEditing && (
            <div className="px-6 py-4 border-b border-base-200 bg-base-200/30">
              <p className="text-xs text-base-content/60 italic leading-relaxed whitespace-pre-wrap">
                {parsed.infobox.description}
              </p>
            </div>
          )}

          {/* Inline Image Editor Fields (In-place, only shown when editing) */}
          {isEditing && (
            <div className="p-6 border-b border-base-200 flex flex-col gap-4 bg-base-200/50 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold text-base-content/50 tracking-wider uppercase">
                  Image & Description Options
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
                    className="text-error hover:text-error/80 p-1.5 hover:bg-error/10 rounded-lg transition-colors cursor-pointer"
                    title="Remove Image"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Image URL input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase font-bold text-base-content/50 tracking-wider">
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
                  className="w-full border border-base-300 hover:border-base-content/30 focus:border-primary rounded-xl px-3 py-2 text-xs text-base-content placeholder-base-content/40 bg-base-100 focus:outline-none transition-all duration-150 shadow-sm"
                />
              </div>

              {/* Upload Image input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase font-bold text-base-content/50 tracking-wider">
                  Or Upload Local Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    // Validate image size: 2MB limit in frontend
                    if (file.size > 2 * 1024 * 1024) {
                      toast.error("Image size cannot exceed 2MB");
                      e.target.value = ""; // reset
                      return;
                    }

                    const formData = new FormData();
                    formData.append("file", file);

                    try {
                      const res = await apiService.uploadMedia(formData);
                      if (res && res.url) {
                        handleInfoboxChange({
                          ...parsed.infobox,
                          image: res.url,
                        });
                        toast.success("Image uploaded successfully!");
                      }
                    } catch (err: any) {
                      console.error("Error uploading image:", err);
                      toast.error(err.response?.data?.error || err.message || "Failed to upload image");
                    }
                  }}
                  className="w-full border border-base-300 hover:border-base-content/30 focus:border-primary rounded-xl px-2 py-1 text-xs text-base-content bg-base-100 focus:outline-none transition-all duration-150 shadow-sm file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                />
              </div>

              {/* Alt Text input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase font-bold text-base-content/50 tracking-wider">
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
                  onKeyDown={(e) => {
                    if (e.key === " ") {
                      e.stopPropagation();
                    }
                  }}
                  placeholder="e.g. Campus View"
                  className="w-full border border-base-300 hover:border-base-content/30 focus:border-primary rounded-xl px-3 py-2 text-xs text-base-content placeholder-base-content/40 bg-base-100 focus:outline-none transition-all duration-150 shadow-sm"
                />
              </div>

              {/* Description Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase font-bold text-base-content/50 tracking-wider">
                  Article Description
                </label>
                <textarea
                  value={parsed.infobox.description || ""}
                  onChange={(e) =>
                    handleInfoboxChange({
                      ...parsed.infobox,
                      description: e.target.value,
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === " ") {
                      e.stopPropagation();
                    }
                  }}
                  placeholder="Enter a short description..."
                  rows={3}
                  className="w-full border border-base-300 hover:border-base-content/30 focus:border-primary rounded-xl px-3 py-2 text-xs text-base-content placeholder-base-content/40 bg-base-100 focus:outline-none transition-all duration-150 shadow-sm resize-none"
                />
              </div>
            </div>
          )}

          {/* Infobox Fields Table */}
          <div className="p-6">
            <h4 className="text-[10px] font-bold text-base-content/50 tracking-wider mb-4 uppercase">
              Key Information
            </h4>
            <table className="w-full text-xs text-base-content/80">
              <tbody>
                {parsed.infobox.rows.map((row, index) => {
                  const isLast = index === parsed.infobox.rows.length - 1;
                  const isCategory = row.label?.toLowerCase() === "category";
                  return (
                    <tr
                      key={index}
                      className={isLast ? "" : "border-b border-base-200/50"}
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
                            className="w-full border border-base-300 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-primary font-semibold text-base-content/80 uppercase tracking-wider bg-transparent"
                          />
                        ) : (
                          <span className="font-semibold text-base-content/50 uppercase tracking-wider">{row.label}</span>
                        )}
                      </td>
                      <td className="py-3 align-top font-semibold text-base-content">
                        {isEditing ? (
                          <div className="flex gap-2 items-center w-full">
                            {isCategory ? (
                              <CategoryCombobox
                                value={Array.isArray(row.value) ? row.value.join(", ") : (row.value as string)}
                                categories={categories}
                                onChange={(newVal) => {
                                  const newRows = [...parsed.infobox.rows];
                                  newRows[index] = { ...row, value: newVal };
                                  handleInfoboxChange({
                                    ...parsed.infobox,
                                    rows: newRows,
                                  });
                                }}
                              />
                            ) : (
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
                              className="w-full border border-base-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-primary font-normal bg-transparent resize-none"
                              as={row.type === "badge" ? "textarea" : "input"}
                            />
                            )}
                            {!isCategory && (
                              <>
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
                                  ? "text-primary bg-primary/10 hover:bg-primary/20"
                                  : "text-base-content/50 hover:text-primary hover:bg-base-200"
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
                              className="text-base-content/50 hover:text-rose-500 p-1 cursor-pointer transition-colors"
                              title="Delete fact row"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                              </>
                            )}
                          </div>
                        ) : row.type === "badge" && Array.isArray(row.value) ? (
                          <div className="flex flex-wrap gap-1">
                            {row.value.map((val) => (
                              <span
                                key={val}
                                className="text-[10px] text-primary border border-primary/20 rounded-full px-2 py-0.5 font-semibold bg-primary/10"
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
                className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-base-300 hover:border-primary text-base-content/50 hover:text-primary rounded-lg text-xs font-semibold cursor-pointer transition-all duration-155 hover:bg-primary/5"
              >
                <span>+ Add</span>
              </button>
            )}
          </div>

          <div className="p-6 select-none pt-0">
            <h4 className="text-[10px] font-bold text-base-content/50 tracking-wider mb-4 uppercase">
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
                            ? "text-primary font-bold translate-x-1"
                            : "text-base-content/60 hover:text-base-content"
                        }`}
                      >
                        {index + 1}. {item.title}
                      </a>
                    </li>
                    {item.subItems && item.subItems.length > 0 && (
                      <ul className="flex flex-col gap-1.5 pl-3 text-[11px] font-medium border-l border-base-200 ml-1.5">
                        {item.subItems.map((sub, idx) => {
                          const isSubActive = activeSection === sub.id;
                          return (
                            <li key={sub.id}>
                              <a
                                href={`#${sub.id}`}
                                onClick={(e) => handleTocClick(e, sub.id)}
                                className={`truncate block py-0.5 transition-all duration-150 ${
                                  isSubActive
                                    ? "text-primary font-bold translate-x-0.5"
                                    : "text-base-content/50 hover:text-base-content"
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
    </>
  );
}
