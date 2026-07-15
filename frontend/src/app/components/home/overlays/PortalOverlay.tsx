"use client";

import React from "react";
import GenericOverlayModal from "@/components/GenericOverlayModal";
import CategoryPage from "@/components/CategoryPage";
import { useAuth } from "@/hooks/useAuth";

interface PortalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  categorySlug: string | null;
}

/**
 * Opens a wiki category ("Quick Portal") inside the global modal instead of
 * navigating to a new page. The category page is rendered in an embedded mode
 * so its page-only chrome (edit/new buttons, nested edit modal) is suppressed.
 */
export default function PortalOverlay({
  isOpen,
  onClose,
  categorySlug,
}: PortalOverlayProps) {
  const { categories } = useAuth();
  if (!isOpen || !categorySlug) return null;

  const category = categories?.find((c) => c.slug === categorySlug);
  const title = category?.name || categorySlug;

  return (
    <GenericOverlayModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidthClass="max-w-5xl"
    >
      <CategoryPage categorySlug={categorySlug} embedded />
    </GenericOverlayModal>
  );
}
