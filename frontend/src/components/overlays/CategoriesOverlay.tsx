"use client";

import { useRef } from "react";
import { PlusCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import GenericOverlayModal from "@/components/overlays/GenericOverlayModal";
import AllCategoriesBrowser, {
  type AllCategoriesBrowserHandle,
} from "@/components/wiki/AllCategoriesBrowser";

interface CategoriesOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * "All Categories" browser surfaced as a modal (vs. the standalone page at
 * /wiki/categories). The shared content lives in <AllCategoriesBrowser />; this
 * wrapper only provides the modal shell (draggable header, title, and the
 * "Create Category" action) and forwards the create-form toggle to the browser
 * via a ref so the trigger can live in the modal header.
 */
export default function CategoriesOverlay({ isOpen, onClose }: CategoriesOverlayProps) {
  const { user } = useAuth();
  const browserRef = useRef<AllCategoriesBrowserHandle>(null);
  const canManageCategory = user?.role === "admin" || user?.role === "moderator";

  const headerActions = canManageCategory ? (
    <button
      onClick={() => browserRef.current?.toggleCreateForm()}
      className="btn btn-primary btn-sm font-bold rounded-xl shadow-sm transition-all duration-200 cursor-pointer text-primary-content"
    >
      <PlusCircle className="h-4 w-4" />
      <span className="hidden sm:inline">Create Category</span>
    </button>
  ) : null;

  return (
    <GenericOverlayModal
      isOpen={isOpen}
      onClose={onClose}
      title="All Categories"
      maxWidthClass="max-w-5xl"
      headerActions={headerActions}
    >
      <AllCategoriesBrowser ref={browserRef} />
    </GenericOverlayModal>
  );
}
