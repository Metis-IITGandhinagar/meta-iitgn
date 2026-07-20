"use client";

import { useRef } from "react";
import { PlusCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useHomeStore } from "@/store/useHomeStore";
import AllCategoriesBrowser, {
  type AllCategoriesBrowserHandle,
} from "@/components/wiki/AllCategoriesBrowser";
import PortalOverlay from "@/components/overlays/PortalOverlay";

/**
 * Standalone "All Categories" page (reached from the sidebar). Reuses the exact
 * same browser content as the Quick Portal's "All" modal via <AllCategoriesBrowser />,
 * so the two never drift. A PortalOverlay is mounted here too, so clicking a
 * category card still opens it in a modal without leaving the page.
 */
export default function AllCategoriesPage() {
  const { user } = useAuth();
  const { activeOverlay, setActiveOverlay, activePortalCategory, setActivePortalCategory } =
    useHomeStore();
  const browserRef = useRef<AllCategoriesBrowserHandle>(null);
  const canManage = user?.role === "admin" || user?.role === "moderator";

  const closePortal = () => {
    setActiveOverlay(null);
    setActivePortalCategory(null);
  };

  return (
    <main className="flex-1 overflow-y-auto bg-base-100 mt-15">
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl md:text-3xl font-serif font-black text-base-content tracking-tight">
            All Categories
          </h1>
          {canManage && (
            <button
              onClick={() => browserRef.current?.toggleCreateForm()}
              className="btn btn-primary btn-sm font-bold rounded-xl shadow-sm transition-all duration-200 cursor-pointer text-primary-content shrink-0"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Create Category</span>
            </button>
          )}
        </div>

        <AllCategoriesBrowser ref={browserRef} />
      </div>

      <PortalOverlay
        isOpen={activeOverlay === "portal"}
        onClose={closePortal}
        categorySlug={activePortalCategory}
      />
    </main>
  );
}
