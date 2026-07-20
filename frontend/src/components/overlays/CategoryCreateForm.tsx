"use client";

import { useState } from "react";
import { ArrowLeft, FolderPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiService } from "@/api";
import { Category } from "@/context/AuthContext";
import { DEFAULT_ICON, DEFAULT_COLOR } from "@/lib/categoryIcon";

interface CategoryCreateFormProps {
  // When provided, the new category is created as a child of this parent.
  defaultParentId?: number | null;
  // Human-readable parent name, shown as a hint in the header.
  parentName?: string;
  onCreated?: (cat: Category) => void;
  onCancel: () => void;
}

export default function CategoryCreateForm({
  defaultParentId = null,
  parentName,
  onCreated,
  onCancel,
}: CategoryCreateFormProps) {
  const { addCategoryState } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  // Icon/color default here; they're set later via the icon popover on the
  // category page. Kept so the created category has sane defaults.
  const icon = DEFAULT_ICON;
  const color = DEFAULT_COLOR;
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      setError("Name and description are required");
      return;
    }
    try {
      setError("");
      setSubmitting(true);
      const newCat = await apiService.createCategory({
        name: name.trim(),
        description: description.trim(),
        icon,
        color,
        parent_id: defaultParentId,
      });
      addCategoryState(newCat);
      onCreated?.(newCat);
      onCancel();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.message || "Failed to create category");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="card card-border bg-base-100 border-base-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)] rounded-2xl p-5 sm:p-6 space-y-4"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-primary font-bold">
          <FolderPlus className="h-5 w-5" />
          <span>{parentName ? `Add Subcategory in ${parentName}` : "Add Custom Category"}</span>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 hover:bg-base-300 rounded-lg transition-colors cursor-pointer text-base-content/70 hover:text-base-content"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5 shrink-0" />
        </button>
      </div>

      {error && (
        <div className="p-3 text-xs bg-rose-50 text-rose-600 border border-rose-100 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-base-content/80 uppercase">
          Category Name
        </label>
        <input
          type="text"
          autoComplete="off"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Alumni, Research Grants, Internships"
          className="w-full px-3 py-2 text-sm border border-base-300 text-gray-600 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-base-content/60 uppercase">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief summary of what pages are found in this category..."
          className="w-full px-3 py-2 text-sm border border-base-300 text-gray-600 rounded-xl focus:outline-none focus:border-blue-500 transition-colors min-h-20 max-h-40"
        />
      </div>

      <div className="flex items-center gap-2 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3.5 py-1.5 border border-base-300 rounded-xl text-xs font-bold text-base-content/60 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-primary-content rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-60"
        >
          {submitting ? "Creating..." : "Create"}
        </button>
      </div>
    </form>
  );
}
