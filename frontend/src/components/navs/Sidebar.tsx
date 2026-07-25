import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useHomeStore } from "@/store/useHomeStore";
import {
  Home,
  Shuffle,
  Building2,
  Users2,
  BookOpen,
  FlaskConical,
  Tent,
  MapPin,
  Trophy,
  Sparkles,
  Shield,
  TrendingUp,
  GraduationCap,
  HelpCircle,
  LucideIcon,
  User,
  UserCircle2,
  InboxIcon,
  LogOut,
  PackageCheck,
  ChartNoAxesCombined,
  X,
  Calendar,
} from "lucide-react";
import { VscFeedback } from "react-icons/vsc";
import { SIDEBAR_SECTIONS } from "@/lib/constants";
import { CategoryIcon } from "@/lib/categoryIcon";

// Local map for statically imported icons to avoid wildcard imports
const ICON_MAP: Record<string, LucideIcon> = {
  Home,
  Shuffle,
  Building2,
  Users2,
  BookOpen,
  FlaskConical,
  Tent,
  MapPin,
  Trophy,
  Sparkles,
  InboxIcon,
  Shield,
  TrendingUp,
  GraduationCap,
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier?: string;
  onChangeTier?: (tier: string) => void;
}

// Shared row styling so every nav item (sections, categories, tools, account)
// gets the exact same "slide + glow" hover treatment.
const navRowClass = (isActive: boolean, tone: "default" | "error" = "default") => {
  if (tone === "error") {
    return "group relative flex items-center gap-3 px-3 py-2 text-[13px] font-semibold rounded-lg select-none overflow-hidden transition-all duration-300 ease-out text-error hover:bg-error/10 hover:translate-x-1 hover:pl-4";
  }
  return `group relative flex items-center gap-3 px-3 py-2 text-[13px] font-semibold rounded-lg select-none overflow-hidden transition-all duration-300 ease-out ${
    isActive
      ? "bg-primary/10 text-primary font-bold pl-4"
      : "text-base-content/75 hover:text-base-content hover:bg-base-200 hover:translate-x-1 hover:pl-4"
  }`;
};

// The little accent bar that glides out from the left edge on hover and
// stays lit while the route is active — this is the "comes out smoothly" bit.
const NavIndicator = ({
  isActive,
  tone = "primary",
}: {
  isActive: boolean;
  tone?: "primary" | "error";
}) => (
  <span
    aria-hidden
    className={`pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-300 ease-out ${
      tone === "error" ? "bg-error" : "bg-primary"
    } ${
      isActive
        ? "h-3/5 opacity-100"
        : "h-0 opacity-0 group-hover:h-2/5 group-hover:opacity-80"
    }`}
  />
);

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, categories } = useAuth();
  const { setActiveOverlay, setActivePortalCategory, setPortalMaximized, activeOverlay, activePortalCategory } = useHomeStore();
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Only show root-level categories (those without a parent) on the sidebar.
  const rootCategories = categories.filter(
    (category) => category.parent_id == null
  );

  // Helper to render Lucide icons dynamically from their string names
  const renderIcon = (iconName: string, isActive: boolean) => {
    const IconComponent = ICON_MAP[iconName] || HelpCircle;

    return (
      <IconComponent
        className={`h-5 w-5 shrink-0 transition-all duration-200 ease-out ${
          isActive
            ? "text-primary"
            : "text-base-content/50 group-hover:text-base-content/80 group-hover:scale-110"
        }`}
      />
    );
  };

  return (
    <>
      {/* Backdrop overlay - visible when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-base-content/30 z-40 transition-opacity duration-300 animate-in fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col h-full bg-base-100 border-r border-base-200 transition-all duration-300 ease-in-out shrink-0 select-none overflow-hidden ${
          isOpen
            ? "w-70 lg:w-80 translate-x-0 shadow-2xl"
            : "w-0 -translate-x-full lg:border-r-0"
        }`}
      >
        {/* Sidebar Header with Brand Logo & Close Button */}
        <div className="flex items-center justify-between px-5 border-b border-base-200 h-16 shrink-0 bg-base-100">
          <div className="flex items-center gap-2.5">
            <span className="font-serif text-2xl font-extrabold tracking-tight text-primary">
              META
            </span>
            <span className="ml-1 text-sm font-semibold uppercase tracking-wider text-base-content/70">
              IITGN
            </span>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-square btn-sm text-base-content/50 hover:text-base-content/80 hover:rotate-90 transition-all duration-300 cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {SIDEBAR_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-1.5">
              {/* Section Header */}
              <h3 className="px-3 text-[10px] font-bold tracking-wider text-base-content/50 uppercase">
                {section.title}
              </h3>

              {/* Section Items */}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.path;

                  return (
                    <Link
                      key={item.name}
                      href={item.path}
                      onClick={() => {
                        // Close sidebar on mobile after clicking a link
                        if (window.innerWidth < 1024) {
                          onClose();
                        }
                      }}
                      className={navRowClass(isActive)}
                    >
                      <NavIndicator isActive={isActive} />
                      {renderIcon(item.iconName, isActive)}
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Categories — sourced dynamically from the live categories API so the
              sidebar always reflects the current set of categories. */}
          {rootCategories.length > 0 && (
            <div className="space-y-1">
              <h3 className="px-3 text-[10px] font-bold tracking-wider text-base-content/50 uppercase">
                Categories
              </h3>
              <div className="space-y-0.5">
                {(showAllCategories
                  ? rootCategories
                  : rootCategories.slice(0, 4)
                ).map(
                  (category) => {
                    const isActive =
                      activeOverlay === "portal" && activePortalCategory === category.slug;

                    return (
                      <button
                        key={category.category_id}
                        type="button"
                        onClick={() => {
                          // Open the category in the portal modal instead of
                          // navigating to a (now-removed) category route. Mark it
                          // to open maximized (Quick Portals don't set this).
                          setActivePortalCategory(category.slug);
                          setPortalMaximized(true);
                          setActiveOverlay("portal");
                          if (window.innerWidth < 1024) onClose();
                        }}
                        className={navRowClass(isActive)}
                      >
                        <NavIndicator isActive={isActive} />
                        <CategoryIcon
                          icon={category.icon}
                          size={20}
                          className={`shrink-0 transition-all duration-200 ease-out ${
                            isActive
                              ? "text-primary"
                              : "text-base-content/50 group-hover:text-base-content/80 group-hover:scale-110"
                          }`}
                        />
                        <span className="truncate">{category.name}</span>
                      </button>
                    );
                  }
                )}
                {rootCategories.length > 4 && (
                  <button
                    type="button"
                    onClick={() => setShowAllCategories(!showAllCategories)}
                    className="group flex w-full items-center justify-between px-3 py-2 text-[12px] font-semibold text-primary hover:bg-base-200 rounded-lg cursor-pointer transition-all duration-300 ease-out hover:translate-x-1 mt-0.5 text-left"
                  >
                    <span>
                      {showAllCategories
                        ? "Show Less"
                        : `+ ${rootCategories.length - 4} More`}
                    </span>
                    <span
                      className={`text-primary/60 transition-transform duration-300 ease-out ${
                        showAllCategories ? "rotate-180" : "group-hover:translate-y-0.5"
                      }`}
                    >
                      ⌄
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="space-y-1 border-t border-base-200 pt-2">
              <h3 className="px-3 text-[10px] font-bold tracking-wider text-base-content/40 uppercase">
                Tools
              </h3>
              <div className="space-y-0.5">
                <Link
                  href="/paper"
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={navRowClass(pathname === "/paper")}
                >
                  <NavIndicator isActive={pathname === "/paper"} />
                  <PackageCheck
                    className={`h-5 w-5 shrink-0 transition-all duration-200 ease-out ${
                      pathname === "/paper"
                        ? "text-primary"
                        : "text-base-content/50 group-hover:text-base-content/80 group-hover:scale-110"
                    }`}
                  />
                  <span className="truncate">PYQs</span>
                </Link>
                <Link
                  href="/calender"
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={navRowClass(pathname === "/calender")}
                >
                  <NavIndicator isActive={pathname === "/calender"} />
                  <Calendar
                    className={`h-5 w-5 shrink-0 transition-all duration-200 ease-out ${
                      pathname === "/calender"
                        ? "text-primary"
                        : "text-base-content/50 group-hover:text-base-content/80 group-hover:scale-110"
                    }`}
                  />
                  <span className="truncate">Academic Calender</span>
                </Link>
                <Link
                  href="/interviews"
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={navRowClass(pathname === "/interviews")}
                >
                  <NavIndicator isActive={pathname === "/interviews"} />
                  <VscFeedback
                    className={`h-5 w-5 shrink-0 transition-all duration-200 ease-out ${
                      pathname === "/interviews"
                        ? "text-primary"
                        : "text-base-content/50 group-hover:text-base-content/80 group-hover:scale-110"
                    }`}
                  />
                  <span className="truncate">Interviews</span>
                </Link>
                <Link
                  href="/competitions"
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={navRowClass(pathname === "/competitions")}
                >
                  <NavIndicator isActive={pathname === "/competitions"} />
                  <ChartNoAxesCombined
                    className={`h-5 w-5 shrink-0 transition-all duration-200 ease-out ${
                      pathname === "/competitions"
                        ? "text-primary"
                        : "text-base-content/50 group-hover:text-base-content/80 group-hover:scale-110"
                    }`}
                  />
                  <span className="truncate">Competitions</span>
                </Link>
              </div>
            </div>

          {/* Account/Profile Section */}
          {user ? (
            <div className="space-y-1 border-t border-base-200 pt-2">
              <h3 className="px-3 text-[10px] font-bold tracking-wider text-base-content/40 uppercase">
                Account
              </h3>
              <div className="space-y-0.5">
                <Link
                  href="/user/profile"
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={navRowClass(pathname === "/user/profile")}
                >
                  <NavIndicator isActive={pathname === "/user/profile"} />
                  <UserCircle2
                    className={`h-5 w-5 shrink-0 transition-all duration-200 ease-out ${
                      pathname === "/user/profile"
                        ? "text-primary"
                        : "text-base-content/50 group-hover:text-base-content/80 group-hover:scale-110"
                    }`}
                  />
                  <span className="truncate">Profile</span>
                </Link>
                <Link
                  href="/logout"
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={navRowClass(false, "error")}
                >
                  <NavIndicator isActive={false} tone="error" />
                  <LogOut className="h-5 w-5 shrink-0 text-error transition-transform duration-200 ease-out group-hover:scale-110" />
                  <span className="truncate">Sign Out</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="px-2 mt-4">
              <Link
                href="/login"
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className="btn btn-primary btn-sm w-full font-semibold rounded-xl shadow-md cursor-pointer transition-all duration-200 ease-out hover:scale-[1.03] hover:shadow-lg active:scale-95"
              >
                <User className="w-4 h-4" />
                <span>Login</span>
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}