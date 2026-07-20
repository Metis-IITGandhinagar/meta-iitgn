"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Maximize2, Minimize2, ChevronDown, FolderOpen, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useHomeStore } from "@/store/useHomeStore";
import { apiService } from "@/api";
import { CategoryIcon, DEFAULT_ICON, DEFAULT_COLOR } from "@/lib/categoryIcon";

interface CategoryEditModalProps {
  category: {
    category_id: number;
    slug: string;
    name: string;
    description: string;
    icon?: string;
    color?: string;
    parent_id?: number | null;
  };
  onClose: () => void;
}

// Blend the category colour with transparent so the tint follows any theme and
// works for every colour format (unlike the old `${color}1a` hex-append trick).
const tint = (color: string, pct: number) =>
  `color-mix(in srgb, ${color} ${pct}%, transparent)`;

/**
 * A searchable, hierarchical replacement for the native <select> used to pick a
 * parent category. Options are indented by depth and filterable by name, which
 * is far easier to use than a flat native <select> once there are many
 * categories. The panel is portaled to document.body and positioned with fixed
 * coordinates so it can't be clipped by the editor's scrollable body. Closes on
 * outside click, Escape, or when the page scrolls/resizes.
 */
function ParentCategoryPicker({
  value,
  onChange,
  options,
  depthById,
}: {
  value: string;
  onChange: (next: string) => void;
  options: { category_id: number; name: string }[];
  depthById: Map<number, number>;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const openMenu = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setCoords({ top: r.bottom + 4, left: r.left, width: r.width });
    setOpen(true);
  }, []);

  const closeMenu = useCallback(() => setOpen(false), []);

  // Close on outside click / Escape, and close on scroll or resize (the panel is
  // fixed against the trigger, so it would drift out of alignment otherwise).
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onReflow = () => setOpen(false);
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onReflow, true);
    window.addEventListener("resize", onReflow);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onReflow, true);
      window.removeEventListener("resize", onReflow);
    };
  }, [open]);

  // Focus the filter box once the panel mounts.
  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  const selected = value ? options.find((o) => String(o.category_id) === value) : undefined;
  const q = query.trim().toLowerCase();
  const filtered = q ? options.filter((o) => o.name.toLowerCase().includes(q)) : options;

  const select = (next: string) => {
    onChange(next);
    setOpen(false);
    setQuery("");
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? closeMenu() : openMenu())}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-left text-sm text-base-content transition-colors hover:border-primary/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          {selected ? (
            <>
              <FolderOpen className="h-4 w-4 shrink-0 text-base-content/50" />
              <span className="truncate">{selected.name}</span>
            </>
          ) : (
            <span className="text-base-content/50">None (top-level)</span>
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-base-content/50 transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && coords && createPortal(
        <div
          ref={panelRef}
          className="fixed z-[22000] overflow-hidden rounded-xl border border-base-200 bg-base-100 shadow-2xl"
          style={{ top: coords.top, left: coords.left, width: coords.width }}
        >
          <div className="border-b border-base-200 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search categories..."
                className="w-full rounded-lg border border-base-300 bg-base-100 py-1.5 pl-8 pr-2 text-sm text-base-content placeholder-base-content/40 focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <ul className="max-h-60 overflow-y-auto py-1" role="listbox">
            <li>
              <button
                type="button"
                onClick={() => select("")}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-base-200 ${
                  !value ? "font-semibold text-primary" : "text-base-content"
                }`}
              >
                <FolderOpen className="h-4 w-4 shrink-0 text-base-content/50" />
                None (top-level)
              </button>
            </li>
            {filtered.map((o) => {
              const depth = depthById.get(o.category_id) ?? 0;
              const active = String(o.category_id) === value;
              return (
                <li key={o.category_id}>
                  <button
                    type="button"
                    onClick={() => select(String(o.category_id))}
                    style={{ paddingLeft: `${0.75 + depth * 1.1}rem` }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-base-200 ${
                      active ? "font-semibold text-primary" : "text-base-content"
                    }`}
                  >
                    <FolderOpen className="h-4 w-4 shrink-0 text-base-content/40" />
                    <span className="truncate">{o.name}</span>
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-3 py-3 text-center text-xs text-base-content/40">
                No categories match &ldquo;{query}&rdquo;
              </li>
            )}
          </ul>
        </div>,
        document.body
      )}
    </>
  );
}

export default function CategoryEditModal({ category, onClose }: CategoryEditModalProps) {
  const { categories, updateCategoryState } = useAuth();
  const { setActivePortalCategory, setActiveOverlay } = useHomeStore();
  const [editName, setEditName] = useState(category.name);
  const [editDescription, setEditDescription] = useState(category.description);
  // Icon/color are no longer edited here (they're set via the icon popover on
  // the category page); keep the current values so saving preserves them.
  const editIcon = category.icon || DEFAULT_ICON;
  const editColor = category.color || DEFAULT_COLOR;
  const [editParentId, setEditParentId] = useState<string>(
    category.parent_id != null ? String(category.parent_id) : ""
  );
  const [editError, setEditError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Used to detect a double-tap on touch devices (the maximize button is hidden
  // on small screens, so a double-tap on the header is the only way to maximize
  // there).
  const lastTapRef = useRef(0);

  // Valid parent options exclude the category itself and all of its descendants
  // (choosing one of those would create a cycle in the hierarchy).
  const parentOptions = useMemo(() => {
    const excluded = new Set<number>([category.category_id]);
    // Iteratively collect descendants until no new ones are found.
    let changed = true;
    while (changed) {
      changed = false;
      for (const c of categories) {
        if (c.parent_id != null && excluded.has(c.parent_id) && !excluded.has(c.category_id)) {
          excluded.add(c.category_id);
          changed = true;
        }
      }
    }
    return categories
      .filter((c) => !excluded.has(c.category_id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [categories, category.category_id]);

  // Depth of each category in the parent tree, used to indent the options in the
  // parent <select> so the hierarchy is visible at a glance.
  const depthById = useMemo(() => {
    const depth = new Map<number, number>();
    const getDepth = (c: (typeof categories)[number]): number => {
      if (depth.has(c.category_id)) return depth.get(c.category_id)!;
      const parent = c.parent_id != null ? categories.find((p) => p.category_id === c.parent_id) : undefined;
      const d = parent ? getDepth(parent) + 1 : 0;
      depth.set(c.category_id, d);
      return d;
    };
    categories.forEach((c) => getDepth(c));
    return depth;
  }, [categories]);

  // Whether the form differs from the original category, so the Save button can
  // be disabled until there is actually something to persist.
  const currentParentId = editParentId ? Number(editParentId) : null;
  const hasChanges =
    editName.trim() !== category.name ||
    editDescription.trim() !== category.description ||
    currentParentId !== (category.parent_id ?? null);

  const previewParentName = editParentId
    ? categories.find((c) => c.category_id === Number(editParentId))?.name
    : undefined;

  const toggleMaximize = () => setIsMaximized((m) => !m);

  const handleHeaderDoubleTap = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      e.preventDefault();
      toggleMaximize();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  const onEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editDescription.trim()) {
      setEditError("Name and description are required");
      return;
    }
    try {
      setEditError("");
      setSubmitting(true);
      const updatedCat = await apiService.updateCategory(category.category_id, {
        name: editName.trim(),
        description: editDescription.trim(),
        icon: editIcon || DEFAULT_ICON,
        color: editColor,
        parent_id: currentParentId,
      });
      updateCategoryState(updatedCat);
      onClose();
      // Categories are shown in the portal modal (not a route page), so on a
      // rename open that modal for the (possibly new) slug instead of navigating.
      if (updatedCat.slug !== category.slug) {
        setActivePortalCategory(updatedCat.slug);
        setActiveOverlay("portal");
      }
    } catch (err: any) {
      console.error(err);
      setEditError(err.response?.data?.error || err.message || "Failed to update category");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-base-content/40 backdrop-blur-xs flex items-center justify-center z-[21000] animate-in fade-in duration-200 ${
        isMaximized ? "p-0" : "p-0 sm:p-4"
      }`}
    >
      <form
        onSubmit={onEditSubmit}
        className={`relative flex flex-col overflow-hidden bg-base-100 border border-base-200 animate-in zoom-in-95 duration-200 ${
          isMaximized
            ? "w-full h-full max-w-none rounded-none shadow-none border-0"
            : "w-full h-full sm:h-auto sm:max-h-[calc(100vh-2rem)] sm:max-w-lg rounded-none sm:rounded-2xl shadow-2xl"
        }`}
      >
        {/* Window Header — icon + title (left) · maximize + close (right) */}
        <div
          onDoubleClick={(e) => {
            if ((e.target as HTMLElement).closest("button")) return;
            toggleMaximize();
          }}
          onTouchEnd={handleHeaderDoubleTap}
          className="flex items-center justify-between px-5 py-3 border-b border-base-200 bg-base-100 rounded-t-2xl select-none shrink-0"
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0"
              style={{
                backgroundColor: tint(editColor, 12),
                borderColor: tint(editColor, 30),
                color: editColor,
              }}
            >
              <CategoryIcon icon={editIcon} size={16} />
            </div>
            <span className="font-bold text-base-content">Edit Category</span>
          </div>
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={toggleMaximize}
              className="p-1 hover:bg-base-300/60 rounded-lg transition-colors cursor-pointer text-base-content/60 hover:text-base-content"
              aria-label={isMaximized ? "Restore" : "Maximize"}
              title={isMaximized ? "Restore" : "Maximize"}
            >
              {isMaximized ? (
                <Minimize2 className="h-4.5 w-4.5 shrink-0" />
              ) : (
                <Maximize2 className="h-4.5 w-4.5 shrink-0" />
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-base-300 rounded-lg transition-colors cursor-pointer text-base-content/70 hover:text-base-content"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5 shrink-0" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
          {editError && (
            <div className="p-3 text-xs bg-error/10 text-error border border-error/20 rounded-lg">
              {editError}
            </div>
          )}

          {/* Live preview — mirrors how the category card looks, updating as you type */}
          <div
            className="flex items-center gap-3 p-4 rounded-2xl border border-base-200"
            style={{ backgroundColor: tint(editColor, 6) }}
          >
            <div
              className="w-12 h-12 shrink-0 rounded-xl border flex items-center justify-center shadow-sm"
              style={{
                backgroundColor: tint(editColor, 14),
                borderColor: tint(editColor, 30),
                color: editColor,
              }}
            >
              <CategoryIcon icon={editIcon} size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-base-content truncate">
                {editName.trim() || "Category name"}
              </p>
              <p className="text-xs text-base-content/55 leading-relaxed line-clamp-2 mt-0.5">
                {editDescription.trim() || "No description provided."}
              </p>
              {previewParentName && (
                <p className="text-[11px] text-base-content/45 font-medium mt-0.5 truncate">
                  in {previewParentName}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-base-content/70 uppercase">
              Category Name
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Category Name"
              className="input input-bordered w-full text-base-content focus:border-primary"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-base-content/70 uppercase">
              Description
            </label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Description..."
              className="textarea textarea-bordered w-full text-base-content focus:border-primary min-h-24 max-h-48"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-base-content/70 uppercase">
              Parent Category
            </label>
            <ParentCategoryPicker
              value={editParentId}
              onChange={setEditParentId}
              options={parentOptions}
              depthById={depthById}
            />
            <p className="text-[10px] text-base-content/50">
              If set, this category is shown inside its parent instead of the All Categories page.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-3 border-t border-base-200 bg-base-100 rounded-b-2xl shrink-0">
          {!hasChanges && !submitting && (
            <span className="text-xs text-base-content/40 mr-auto">No changes to save</span>
          )}
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm text-base-content/60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !hasChanges}
            className="btn btn-primary btn-sm text-primary-content"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
