"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiService } from "@/api";
import { ICON_MAP } from "@/components/CategoryPage";

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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-[21000] p-0 sm:p-4 animate-in fade-in duration-200">
      <form
        onSubmit={onEditSubmit}
        className="w-full h-full sm:h-auto sm:max-w-md bg-base-100 border-0 sm:border border-base-200 p-6 rounded-none sm:rounded-2xl shadow-none sm:shadow-xl space-y-4 animate-in zoom-in-95 duration-200 overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2 text-primary font-bold">
            <Pencil className="h-5 w-5" />
            <span>Edit Category</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-base-content/50 hover:text-base-content/85 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

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
      </form>
    </div>
  );
}
