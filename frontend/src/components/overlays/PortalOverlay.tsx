"use client";

import GenericOverlayModal from "@/components/overlays/GenericOverlayModal";
import CategoryPage from "@/components/wiki/CategoryPage";
import { useAuth } from "@/hooks/useAuth";
import { useHomeStore } from "@/store/useHomeStore";

interface PortalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  categorySlug: string | null;
}

/**
 * Opens a wiki category inside the global modal instead of navigating to a new
 * page. CategoryPage is rendered in `embedded` mode (which only drops the
 * page-only layout chrome); all of its management features — add subcategory,
 * edit, new article, icon picker, subcategories — are kept, so the modal is a
 * full-featured replacement for the former category route page.
 */
export default function PortalOverlay({
  isOpen,
  onClose,
  categorySlug,
}: PortalOverlayProps) {
  const { categories } = useAuth();
  const { portalMaximized } = useHomeStore();
  if (!isOpen || !categorySlug) return null;

  const category = categories?.find((c) => c.slug === categorySlug);
  const title = category?.name || categorySlug;

  return (
    <GenericOverlayModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidthClass="max-w-5xl"
      defaultMaximized={portalMaximized}
    >
      <CategoryPage categorySlug={categorySlug} embedded />
    </GenericOverlayModal>
  );
}
