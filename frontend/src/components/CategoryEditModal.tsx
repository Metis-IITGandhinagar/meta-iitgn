"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, Maximize2, Minimize2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiService } from "@/api";
import { ICON_MAP } from "@/components/CategoryPage";
import ProfilePopover from "@/components/ProfilePopover";

interface CategoryEditModalProps {
  category: {
    category_id: number;
    slug: string;
    name: string;
    description: string;
    icon?: string;
  };
  onClose: () => void;
}

export default function CategoryEditModal({ category, onClose }: CategoryEditModalProps) {
  const router = useRouter();
  const { updateCategoryState } = useAuth();
  const [editName, setEditName] = useState(category.name);
  const [editDescription, setEditDescription] = useState(category.description);
  const [editIcon, setEditIcon] = useState(category.icon || "BookOpen");
  const [editError, setEditError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Used to detect a double-tap on touch devices (the maximize button is
  // hidden on small screens, so a double-tap on the header is the only way
  // to maximize there).
  const lastTapRef = useRef(0);

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
        icon: editIcon || "BookOpen",
      });
      updateCategoryState(updatedCat);
      onClose();
      if (updatedCat.slug !== category.slug) {
        router.push(`/wiki/${updatedCat.slug}`);
      }
    } catch (err: any) {
      console.error(err);
      setEditError(err.response?.data?.error || err.message || "Failed to update category");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`fixed inset-0 bg-base-content/40 backdrop-blur-xs flex items-center justify-center z-[21000] animate-in fade-in duration-200 ${isMaximized ? "p-0" : "p-0 sm:p-4"}`}>
      <form
        onSubmit={onEditSubmit}
        className={`relative flex flex-col overflow-hidden bg-base-100 border-0 sm:border border-base-200 animate-in zoom-in-95 duration-200 ${
          isMaximized
            ? "w-full h-full max-w-none rounded-none shadow-none border-0"
            : "w-full h-full sm:h-auto sm:max-h-[calc(100vh-2rem)] sm:max-w-md rounded-none sm:rounded-2xl shadow-none sm:shadow-xl"
        }`}
      >
        {/* Window Header — close (left) · profile + maximize (right) */}
        <div
          onDoubleClick={(e) => {
            if ((e.target as HTMLElement).closest("button")) return;
            toggleMaximize();
          }}
          onTouchEnd={handleHeaderDoubleTap}
          className="flex items-center justify-between px-4 py-2.5 border-b border-base-200 bg-base-200 text-base-content select-none shrink-0"
        >
          <div className="flex items-center gap-2 text-primary font-bold">
            <Pencil className="h-5 w-5" />
            <span>Edit Category</span>
          </div>
          <div className="flex items-center justify-end gap-1">
            <ProfilePopover />
            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              className="hidden sm:inline-flex p-1 hover:bg-base-300 rounded-lg transition-colors cursor-pointer text-base-content/70 hover:text-base-content"
              aria-label={isMaximized ? "Restore" : "Maximize"}
            >
              {isMaximized ? (
                <Minimize2 className="w-4 h-4 shrink-0" />
              ) : (
                <Maximize2 className="w-4 h-4 shrink-0" />
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer text-red-400 hover:text-red-500"
              aria-label="Close"
            >
              <X className="h-5 w-5 shrink-0" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
          {editError && (
            <div className="p-3 text-xs bg-error/10 text-error border border-error/20 rounded-lg">
              {editError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-base-content/70 uppercase">
              Category Name
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Category Name"
              className="input input-bordered w-full text-base-content"
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
              className="textarea textarea-bordered w-full text-base-content min-h-20 max-h-40"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-base-content/70 uppercase block">
              Category Icon
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 bg-base-200 p-3.5 rounded-2xl border border-base-300 max-w-lg">
              {Object.keys(ICON_MAP).map((iconKey) => {
                const IconComponent = ICON_MAP[iconKey];
                const isSelected = editIcon === iconKey;
                return (
                  <button
                    key={iconKey}
                    type="button"
                    onClick={() => setEditIcon(iconKey)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer active:scale-95 group ${isSelected
                      ? "bg-primary border-primary text-primary-content shadow-md shadow-primary/20 scale-105"
                      : "bg-base-100 border-base-300 text-base-content/70 hover:text-base-content hover:bg-base-200"
                      }`}
                    title={iconKey}
                  >
                    <IconComponent className="h-5 w-5" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-sm text-base-content/60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary btn-sm text-primary-content"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
