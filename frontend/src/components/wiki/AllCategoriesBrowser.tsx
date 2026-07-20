"use client";

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  forwardRef,
  useImperativeHandle,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  SquarePen,
  Check,
  Search,
  X,
  Pencil,
  Pin,
  PlusCircle,
  Loader2,
  FolderOpen,
  SearchX,
  LayoutGrid,
  MoreVertical,
} from "lucide-react";
import { CategoryIcon } from "@/lib/categoryIcon";
import { useAuth } from "@/hooks/useAuth";
import { useHomeStore } from "@/store/useHomeStore";
import { Category } from "@/context/AuthContext";
import { toast } from "react-hot-toast";
import { apiService } from "@/api";
import CategoryEditModal from "@/components/overlays/CategoryEditModal";
import CategoryCreateForm from "@/components/overlays/CategoryCreateForm";

// Blend a category's hex colour with transparent at the given percentage so the
// tint follows any theme and works for every colour format (unlike the old
// `${color}1a` hex-append trick, which only worked for 6-digit hex).
const colorTint = (color: string, pct: number) =>
  `color-mix(in srgb, ${color} ${pct}%, transparent)`;

const DEFAULT_COLOR = "#4f46e5";
const MAX_PINS = 10;

/** A sub-category chip. In selection mode the chip becomes a checkbox that
 * toggles membership; otherwise clicking it opens the sub-category. */
function SubChip({
  child,
  color,
  selectionMode,
  selected,
  onOpen,
  onToggleSelect,
}: {
  child: Category;
  color: string;
  selectionMode: boolean;
  selected: boolean;
  onOpen: (slug: string) => void;
  onToggleSelect: (id: number) => void;
}) {
  const selectionBox = (
    <span
      className={`inline-flex w-5 h-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
        selected
          ? "bg-primary border-primary text-primary-content"
          : "border-base-300 bg-base-100 text-transparent"
      }`}
    >
      <Check className="h-3.5 w-3.5" />
    </span>
  );

  if (selectionMode) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect(child.category_id);
        }}
        className="inline-flex items-center gap-1.5 max-w-full px-2.5 py-1.5 rounded-lg border bg-base-100 transition-colors cursor-pointer select-none"
        style={{ borderColor: selected ? color : undefined }}
        title={`Toggle ${child.name}`}
      >
        {selectionBox}
        <span className="text-xs font-semibold text-base-content/80 truncate">{child.name}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpen(child.slug);
      }}
      className="group/chip inline-flex items-center gap-1.5 max-w-full px-2.5 py-1.5 rounded-lg border border-base-200 bg-base-100 hover:border-primary hover:bg-base-200 transition-all duration-150 cursor-pointer"
      title={`Open ${child.name}`}
    >
      <span
        className="w-5 h-5 shrink-0 rounded-md border flex items-center justify-center"
        style={{
          backgroundColor: colorTint(color, 12),
          borderColor: colorTint(color, 30),
          color,
        }}
      >
        <CategoryIcon icon={child.icon} size={12} />
      </span>
      <span className="text-xs font-semibold text-base-content/80 truncate group-hover/chip:text-primary transition-colors duration-150">
        {child.name}
      </span>
      {child.total_articles > 0 && (
        <span
          className="text-[10px] font-bold shrink-0 px-1.5 py-0.5 rounded-full"
          style={{ backgroundColor: colorTint(color, 12), color }}
        >
          {child.total_articles}
        </span>
      )}
    </button>
  );
}

/**
 * Wraps a top-level card so the browse grid can render pinned + top-level
 * categories through the same `renderCard` path. Defined at module scope (not
 * inside the overlay component) so it is not re-created on every render.
 */
function DroppableCard({
  cat,
  childCats,
  render,
}: {
  cat: Category;
  childCats?: Category[];
  render: (cat: Category, childCats?: Category[]) => ReactNode;
}) {
  return <>{render(cat, childCats)}</>;
}

/**
 * "All Categories" browser — the shared content surfaced both as a modal (via
 * CategoriesOverlay, opened from the Quick Portal) and as a standalone page
 * (via /wiki/categories, reached from the sidebar). Mirrors the former
 * /wiki/categories page: top-level category grid (click opens the matching
 * Quick Portal modal), search (across every category, surfacing subcategories
 * with their parent label), pin/unpin to Quick Portals, edit, and the inline
 * Create Category form — all preserved here as a single source of truth.
 *
 * Overhauled layout:
 *  - Browse mode groups categories by the parent/child hierarchy. Each top-level
 *    category card lists its sub-categories as inline chips, so the tree is
 *    visible at a glance instead of only via search.
 *  - Pinned categories are pulled into a dedicated "Pinned to Quick Portal"
 *    strip at the top of the browse view.
 *  - Search mode flattens back to a single matched grid (sub-categories show
 *    their parent label), preserving the previous behaviour.
 *
 * Management features (admin / moderator only):
 *  - "Select" mode toggles checkboxes for bulk pin / unpin (respecting the 10-pin cap).
 *  - Inline rename via the title (double-click) or the rename action.
 *  - Create a sub-category directly inside a top-level card via its "+" action.
 *
 * The component owns its own "Create Category" panel state; the surrounding
 * shell (modal header button, or page header button) toggles it through the
 * imperative `toggleCreateForm` handle so the trigger can live outside the
 * component's own DOM.
 */
export interface AllCategoriesBrowserHandle {
  toggleCreateForm: () => void;
}

const AllCategoriesBrowser = forwardRef<AllCategoriesBrowserHandle>(
  function AllCategoriesBrowser(_props, ref) {
    const { user, categories, updateCategoryState } = useAuth();
    const { setActiveOverlay, setActivePortalCategory } = useHomeStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [showAddForm, setShowAddForm] = useState(false);

    // Toggled by the shell's "Create Category" button (modal header or page
    // header) via the forwarded ref, so the button can live outside this body.
    useImperativeHandle(ref, () => ({
      toggleCreateForm: () => setShowAddForm((s) => !s),
    }));

    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [pinningCategoryId, setPinningCategoryId] = useState<number | null>(null);

    // Bulk-select mode for pinning many categories at once.
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    // Inline rename: which card is being renamed and its in-progress value.
    const [renamingId, setRenamingId] = useState<number | null>(null);
    const [renameValue, setRenameValue] = useState("");

    // "Create sub-category inside" panel: the parent id whose form is open.
    const [addSubParentId, setAddSubParentId] = useState<number | null>(null);
    // Tracks which category card's overflow menu is currently open (null = none).
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);

    // Close the overflow menu when clicking anywhere outside of it.
    useEffect(() => {
      if (openMenuId === null) return;
      const onDocClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest(".dropdown")) setOpenMenuId(null);
      };
      document.addEventListener("mousedown", onDocClick);
      return () => document.removeEventListener("mousedown", onDocClick);
    }, [openMenuId]);

    // Gate the edit-modal portal on client mount so createPortal never runs during
    // SSR (where `document` is undefined).
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => setIsMounted(true), []);

    const canManageCategory = user?.role === "admin" || user?.role === "moderator";

    // Quick lookup of category_id -> name for rendering a subcategory's parent.
    const nameById = useMemo(() => {
      const map = new Map<number, string>();
      categories.forEach((c) => map.set(c.category_id, c.name));
      return map;
    }, [categories]);

    // Sub-categories grouped under each parent_id (sorted alphabetically).
    const childrenByParent = useMemo(() => {
      const map = new Map<number, Category[]>();
      categories.forEach((c) => {
        if (c.parent_id != null) {
          const arr = map.get(c.parent_id) ?? [];
          arr.push(c);
          map.set(c.parent_id, arr);
        }
      });
      map.forEach((arr) => arr.sort((a, b) => a.name.localeCompare(b.name)));
      return map;
    }, [categories]);

    const pinnedCategories = useMemo(
      () => categories.filter((c) => c.is_pinned).sort((a, b) => a.name.localeCompare(b.name)),
      [categories]
    );

    // Browse mode (not searching): top-level categories only, pinned ones pulled
    // out into their own strip above so they don't appear twice. Alphabetical.
    const topLevelBrowse = useMemo(() => {
      return categories
        .filter((cat) => cat.parent_id == null && !cat.is_pinned)
        .sort((a, b) => a.name.localeCompare(b.name));
    }, [categories]);

    // Search mode: match across ALL categories (name + description) so deeper
    // sub-categories surface too. Pinned always sort front, then alphabetically.
    const searchResults = useMemo(() => {
      const q = searchQuery.trim().toLowerCase();
      const base = categories.filter(
        (cat) =>
          cat.name.toLowerCase().includes(q) ||
          (cat.description || "").toLowerCase().includes(q)
      );
      return [...base].sort((a, b) => {
        if (!!b.is_pinned !== !!a.is_pinned) return a.is_pinned ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    }, [categories, searchQuery]);

    const isSearching = searchQuery.trim().length > 0;
    const hasAnyCategories = categories.length > 0;

    // Open the matching category inside the Quick Portal modal (no navigation).
    const openCategory = (slug: string) => {
      setActivePortalCategory(slug);
      setActiveOverlay("portal");
    };

    const togglePin = useCallback(
      async (cat: Category) => {
        const pinnedCount = categories.filter((c) => c.is_pinned).length;
        if (!cat.is_pinned && pinnedCount >= MAX_PINS) {
          toast.error(
            "Quick Portals is full! You can pin a maximum of 10 categories. Please unpin another category first."
          );
          return;
        }
        setPinningCategoryId(cat.category_id);
        try {
          const updated = await apiService.updateCategory(cat.category_id, {
            is_pinned: !cat.is_pinned,
          });
          updateCategoryState(updated);
        } catch (err) {
          console.error(err);
          toast.error("Failed to toggle pin");
        } finally {
          setPinningCategoryId(null);
        }
      },
      [categories, updateCategoryState]
    );

    // ---- Bulk pin / unpin ----------------------------------------------------
    const toggleSelect = useCallback((id: number) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }, []);

    const exitSelection = useCallback(() => {
      setSelectionMode(false);
      setSelectedIds(new Set());
    }, []);

    const applyBulkPin = useCallback(
      async (pin: boolean) => {
        const selectedCats = categories.filter((c) => selectedIds.has(c.category_id));
        const targets = selectedCats.filter((c) => (pin ? !c.is_pinned : c.is_pinned));
        if (targets.length === 0) return;

        let toApply = targets;
        if (pin) {
          const currentPinned = categories.filter((c) => c.is_pinned).length;
          const available = MAX_PINS - currentPinned;
          if (available <= 0) {
            toast.error("Quick Portals is full! You can pin a maximum of 10 categories.");
            return;
          }
          if (targets.length > available) {
            toast.error(
              `Only ${available} slot${available === 1 ? "" : "s"} left — pinning the first ${available}.`
            );
            toApply = targets.slice(0, available);
          }
        }

        const results = await Promise.allSettled(
          toApply.map((t) => apiService.updateCategory(t.category_id, { is_pinned: pin }))
        );
        results.forEach((r) => {
          if (r.status === "fulfilled") updateCategoryState(r.value);
          else console.error(r.reason);
        });
        const ok = results.filter((r) => r.status === "fulfilled").length;
        if (ok > 0) {
          toast.success(
            `${pin ? "Pinned" : "Unpinned"} ${ok} categor${ok === 1 ? "y" : "ies"}`
          );
        }
        exitSelection();
      },
      [categories, selectedIds, updateCategoryState, exitSelection]
    );

    // ---- Inline rename -------------------------------------------------------
    const startRename = useCallback((cat: Category) => {
      setRenamingId(cat.category_id);
      setRenameValue(cat.name);
    }, []);

    const cancelRename = useCallback(() => {
      setRenamingId(null);
      setRenameValue("");
    }, []);

    const saveRename = useCallback(
      async (cat: Category) => {
        const next = renameValue.trim();
        setRenamingId(null);
        setRenameValue("");
        if (!next || next === cat.name) return;
        try {
          const updated = await apiService.updateCategory(cat.category_id, { name: next });
          updateCategoryState(updated);
          toast.success("Renamed");
        } catch (err: any) {
          console.error(err);
          toast.error(err?.response?.data?.error || "Failed to rename");
        }
      },
      [renameValue, updateCategoryState]
    );

    // Management actions (pin + edit + rename + add-sub) shared by every card.
    const renderActions = (cat: Category) => {
      if (!canManageCategory || selectionMode) return null;
      const menuOpen = openMenuId === cat.category_id;
      return (
        <div className="flex items-center gap-1 shrink-0">
          <div className="dropdown dropdown-end dropdown-bottom">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId((cur) => (cur === cat.category_id ? null : cat.category_id));
              }}
              className={`p-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
                menuOpen
                  ? "text-primary bg-primary/10"
                  : "text-base-content/50 hover:text-primary hover:bg-base-200"
              }`}
              title="More actions"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
            {menuOpen && (
              <ul
                className="dropdown-content menu z-50 p-1 shadow-lg bg-base-100 rounded-xl border border-base-200 w-48 mt-1"
                onClick={(e) => e.stopPropagation()}
              >
                {!isSearching && (
                  <li>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(null);
                        setAddSubParentId((cur) =>
                          cur === cat.category_id ? null : cat.category_id
                        );
                      }}
                    >
                      <PlusCircle className="h-4 w-4" />
                      Add sub-category
                    </button>
                  </li>
                )}
                <li>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      setOpenMenuId(null);
                      await togglePin(cat);
                    }}
                    disabled={pinningCategoryId === cat.category_id}
                    className="disabled:cursor-not-allowed"
                  >
                    {pinningCategoryId === cat.category_id ? (
                      <Loader2 className="h-4 w-4 text-primary animate-spin" />
                    ) : (
                      <Pin className={`h-4 w-4 ${cat.is_pinned ? "fill-current" : ""}`} />
                    )}
                    {cat.is_pinned ? "Unpin" : "Pin to Quick Portal"}
                  </button>
                </li>
                <li>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(null);
                      startRename(cat);
                    }}
                  >
                    <SquarePen className="h-4 w-4" />
                    Rename
                  </button>
                </li>
                <li>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(null);
                      setEditingCategory(cat);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit Category
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>
      );
    };

    // Selection state shared by every card.
    const isSelected = (id: number) => selectedIds.has(id);

    // A category card. In browse mode, `childCats` renders the sub-category chips
    // inline; in search mode it is omitted and the parent label is shown instead.
    const renderCard = (cat: Category, childCats?: Category[]) => {
      const color = cat.color || DEFAULT_COLOR;
      const parentName = cat.parent_id != null ? nameById.get(cat.parent_id) : undefined;
      const isPinned = cat.is_pinned;
      const inSelection = selectionMode;
      const selected = isSelected(cat.category_id);
      const isRenaming = renamingId === cat.category_id;

      return (
        <div
          role="button"
          tabIndex={0}
          aria-pressed={inSelection ? selected : undefined}
          onClick={() => (inSelection ? toggleSelect(cat.category_id) : openCategory(cat.slug))}
          onKeyDown={(e) => {
            if (inSelection) {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleSelect(cat.category_id);
              }
              return;
            }
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openCategory(cat.slug);
            }
          }}
          className={`group relative flex flex-col gap-3 p-4 md:p-5 rounded-2xl border cursor-pointer select-none transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
            isPinned
              ? "border-[color:var(--pin-border)] bg-[color:var(--pin-tint)]"
              : "bg-base-100 border-base-200 hover:border-primary"
          }`}
          style={
            isPinned
              ? ({ "--pin-tint": colorTint(color, 8), "--pin-border": colorTint(color, 30) } as CSSProperties)
              : undefined
          }
        >
          {inSelection && (
            <span
              className={`absolute top-3 left-3 inline-flex w-5 h-5 items-center justify-center rounded-md border transition-colors ${
                selected
                  ? "bg-primary border-primary text-primary-content"
                  : "border-base-300 bg-base-100 text-transparent"
              }`}
            >
              <Check className="h-3.5 w-3.5" />
            </span>
          )}

          <div className="flex items-start gap-3">
            {/* Icon badge */}
            <div
              className="w-10 h-10 shrink-0 rounded-xl border flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-105"
              style={{
                backgroundColor: colorTint(color, 12),
                borderColor: colorTint(color, 30),
                color,
              }}
            >
              <CategoryIcon icon={cat.icon} size={18} />
            </div>

            {/* Title + meta */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {isRenaming ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => saveRename(cat)}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === "Enter") saveRename(cat);
                      else if (e.key === "Escape") cancelRename();
                    }}
                    className="text-sm md:text-base font-bold text-base-content font-serif bg-base-100 border border-primary rounded-md px-1.5 py-0.5 w-full max-w-[16rem] focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                ) : (
                  <h3
                    onDoubleClick={(e) => {
                      if (!canManageCategory || selectionMode) return;
                      e.stopPropagation();
                      startRename(cat);
                    }}
                    className="text-sm md:text-base font-bold text-base-content font-serif group-hover:text-primary transition-colors duration-200 truncate"
                    title={canManageCategory ? "Double-click to rename" : undefined}
                  >
                    {cat.name}
                  </h3>
                )}
                {isPinned && (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ backgroundColor: colorTint(color, 14), color }}
                  >
                    <Pin className="h-2.5 w-2.5 fill-current" />
                    Pinned
                  </span>
                )}
              </div>
              {parentName && (
                <p className="text-[11px] text-base-content/45 font-medium truncate mt-0.5">
                  in {parentName}
                </p>
              )}
            </div>

            {renderActions(cat)}
          </div>

          {/* Description */}
          <p className="text-xs text-base-content/60 leading-relaxed line-clamp-3">
            {cat.description || "No description provided."}
          </p>

          {/* Sub-category chips (browse mode only) */}
          {childCats && childCats.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-3 mt-1 border-t border-base-200/70">
              {childCats.map((child) => (
                <SubChip
                  key={child.slug}
                  child={child}
                  color={child.color || DEFAULT_COLOR}
                  selectionMode={selectionMode}
                  selected={isSelected(child.category_id)}
                  onOpen={openCategory}
                  onToggleSelect={toggleSelect}
                />
              ))}
            </div>
          )}
        </div>
      );
    };

    const renderEmptyState = (
      icon: ReactNode,
      title: string,
      message: ReactNode,
      action?: ReactNode
    ) => (
      <div className="flex flex-col items-center justify-center text-center py-16 px-6">
        <div className="w-14 h-14 rounded-2xl bg-base-200 flex items-center justify-center mb-4">{icon}</div>
        <h3 className="text-base font-bold text-base-content font-serif">{title}</h3>
        <p className="text-sm text-base-content/55 mt-1 max-w-xs">{message}</p>
        {action}
      </div>
    );

    // Builds the browse-mode body (pinned strip + top-level grid).
    const browseBody = (
      <div className="space-y-7">
        {/* Inline Create Sub-category panel */}
        {addSubParentId != null && canManageCategory && (
          <CategoryCreateForm
            defaultParentId={addSubParentId}
            parentName={nameById.get(addSubParentId) ?? "this category"}
            onCancel={() => setAddSubParentId(null)}
          />
        )}

        {/* Pinned strip */}
        {pinnedCategories.length > 0 && (
          <section>
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-base-content/50 mb-3">
              <Pin className="h-3.5 w-3.5 text-primary" />
              Pinned to Quick Portal
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {pinnedCategories.map((cat) => (
                <DroppableCard key={cat.slug} cat={cat} childCats={childrenByParent.get(cat.category_id)} render={renderCard} />
              ))}
            </div>
          </section>
        )}

        {/* Browse by top-level category */}
        <section>
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-base-content/50 mb-3">
            <LayoutGrid className="h-3.5 w-3.5" />
            Browse Categories
          </h2>
          {topLevelBrowse.length === 0 ? (
            renderEmptyState(
              <FolderOpen className="h-7 w-7 text-base-content/40" />,
              "No top-level categories",
              "Every category currently lives inside a parent. Create a top-level category to browse it here."
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {topLevelBrowse.map((cat) => (
                <DroppableCard key={cat.slug} cat={cat} childCats={childrenByParent.get(cat.category_id)} render={renderCard} />
              ))}
            </div>
          )}
        </section>
      </div>
    );

    const selectedCats = categories.filter((c) => selectedIds.has(c.category_id));
    const selectedUnpinned = selectedCats.filter((c) => !c.is_pinned);
    const selectedPinned = selectedCats.filter((c) => c.is_pinned);

    return (
      <div className="space-y-5">
        {/* Inline Create Category panel (non-modal) */}
        {showAddForm && canManageCategory && (
          <CategoryCreateForm onCancel={() => setShowAddForm(false)} />
        )}

        {/* Sticky search + live count */}
        <div className="sticky top-0 z-10 -mx-6 px-6 pt-6 pb-3 bg-base-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-450 h-4 w-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2 border border-base-300 rounded-full text-sm bg-base-100 text-base-content placeholder-gray-450 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all duration-200"
              />
              {isSearching && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-450 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <p className="text-xs text-base-content/50 sm:ml-auto shrink-0">
              {selectionMode
                ? `${selectedIds.size} selected`
                : isSearching
                ? `${searchResults.length} ${searchResults.length === 1 ? "match" : "matches"} of ${categories.length}`
                : `${topLevelBrowse.length + pinnedCategories.length} top-level ${
                    topLevelBrowse.length + pinnedCategories.length === 1 ? "category" : "categories"
                  }`}
            </p>
          </div>
        </div>

        {/* Body */}
        {!hasAnyCategories ? (
          renderEmptyState(
            <FolderOpen className="h-7 w-7 text-base-content/40" />,
            "No categories yet",
            "Categories organize the wiki. Create the first one to get started.",
            canManageCategory && (
              <button
                onClick={() => setShowAddForm(true)}
                className="btn btn-primary btn-sm font-bold rounded-xl shadow-sm mt-4 text-primary-content cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                Create Category
              </button>
            )
          )
        ) : isSearching && searchResults.length === 0 ? (
          renderEmptyState(
            <SearchX className="h-7 w-7 text-base-content/40" />,
            "No matches",
            <>
              Nothing matches &ldquo;{searchQuery}&rdquo;.
            </>,
            <button
              onClick={() => setSearchQuery("")}
              className="btn btn-outline btn-sm rounded-xl mt-4 cursor-pointer"
            >
              Clear search
            </button>
          )
        ) : isSearching ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {searchResults.map((cat) => renderCard(cat))}
          </div>
        ) : (
          browseBody
        )}

        {/* Bulk pin / unpin toolbar (selection mode only) */}
        {selectionMode && (
          <div className="sticky bottom-0 z-10 -mx-6 px-6 pb-4 pt-3 bg-gradient-to-t from-base-100 via-base-100 to-transparent">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-base-300 bg-base-100 shadow-lg px-4 py-3">
              <span className="text-sm font-semibold text-base-content">
                {selectedIds.size} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => applyBulkPin(false)}
                  disabled={selectedPinned.length === 0}
                  className="btn btn-outline btn-sm font-bold rounded-xl cursor-pointer disabled:opacity-40"
                >
                  Unpin{selectedPinned.length > 0 ? ` (${selectedPinned.length})` : ""}
                </button>
                <button
                  onClick={() => applyBulkPin(true)}
                  disabled={selectedUnpinned.length === 0}
                  className="btn btn-primary btn-sm font-bold rounded-xl text-primary-content cursor-pointer disabled:opacity-40"
                >
                  <Pin className="h-4 w-4" />
                  Pin{selectedUnpinned.length > 0 ? ` (${selectedUnpinned.length})` : ""}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Category Modal — portaled to document.body so it renders as a true
            top-level dialog above the parent modal instead of being trapped inside
            its scrollable body (which caused it to render "inside" the modal). */}
        {isMounted && editingCategory && createPortal(
          <CategoryEditModal category={editingCategory} onClose={() => setEditingCategory(null)} />,
          document.body
        )}
      </div>
    );
  }
);

export default AllCategoriesBrowser;
