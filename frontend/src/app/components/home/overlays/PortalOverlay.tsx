"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Pencil, PlusCircle } from "lucide-react";
import GenericOverlayModal from "@/components/GenericOverlayModal";
import CategoryPage from "@/components/CategoryPage";
import CategoryEditModal from "@/components/CategoryEditModal";
import ProfilePopover from "@/components/ProfilePopover";
import { useAuth } from "@/hooks/useAuth";

interface PortalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  categorySlug: string | null;
}

/**
 * Opens a wiki category ("Quick Portal") inside the global modal instead of
 * navigating to a new page. The category page is rendered in an embedded mode
 * so its page-only chrome (edit/new buttons, nested edit modal) is suppressed;
 * those actions are surfaced into the modal header instead, alongside a
 * profile popover that sits immediately left of the maximize button.
 */
export default function PortalOverlay({
  isOpen,
  onClose,
  categorySlug,
}: PortalOverlayProps) {
  const { categories, user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  if (!isOpen || !categorySlug) return null;

  const category = categories?.find((c) => c.slug === categorySlug);
  const title = category?.name || categorySlug;
  const canManage = user?.role === "admin" || user?.role === "moderator";

  const headerActions = canManage ? (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setIsEditing(true)}
        className="btn btn-outline btn-sm font-bold rounded-xl shadow-xs transition-all duration-200 cursor-pointer active:scale-95"
      >
        <Pencil className="h-4.5 w-4.5" />
        <span className="hidden sm:inline">Edit Category</span>
      </button>
      {/* Navigate to the new-article editor for this category. Intentionally
          NOT calling onClose (router.back) here — that would pop history
          instead of opening the editor. */}
      <Link
        href={`/wiki/${categorySlug}/new`}
        className="btn btn-primary btn-sm font-bold rounded-xl shadow-md transition-all duration-200 cursor-pointer text-white"
      >
        <PlusCircle className="h-4.5 w-4.5" />
        <span className="hidden sm:inline">New Article</span>
      </Link>
    </div>
  ) : null;

  return (
    <GenericOverlayModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidthClass="max-w-5xl"
      headerActions={headerActions}
      headerTrailing={<ProfilePopover />}
    >
      <CategoryPage categorySlug={categorySlug} embedded />
      {isEditing && category && (
        <CategoryEditModal category={category} onClose={() => setIsEditing(false)} />
      )}
    </GenericOverlayModal>
  );
}
