"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
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
  Calendar,
  Shield,
  TrendingUp,
  GraduationCap,
  HelpCircle,
  LucideIcon,
  User,
  History,
  LogOut,
  X,
} from "lucide-react";
import { SIDEBAR_SECTIONS } from "@/lib/constants";

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
  Calendar,
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
export default function Sidebar({
  isOpen,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, categories } = useAuth();

  // Helper to render Lucide icons dynamically from their string names
  const renderIcon = (iconName: string, isActive: boolean) => {
    const IconComponent = ICON_MAP[iconName] || HelpCircle;

    return (
      <IconComponent
        className={`h-5 w-5 transition-colors duration-200 ${
          isActive ? "text-primary" : "text-base-content/50 group-hover:text-base-content/80"
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
            className="btn btn-ghost btn-square btn-sm text-base-content/50 hover:text-base-content/80 transition-colors cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
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
                      className={`group flex items-center gap-3 px-3 py-2 text-[13px] font-semibold rounded-lg transition-all duration-200 ${
                        isActive
                          ? "bg-primary/10 text-primary font-bold"
                          : "text-base-content/75 hover:text-base-content hover:bg-base-200"
                      }`}
                    >
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
          {categories.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="px-3 text-[10px] font-bold tracking-wider text-base-content/50 uppercase">
                Categories
              </h3>
              <div className="space-y-0.5">
                {categories.map((category) => {
                  const path = `/wiki/${category.slug}`;
                  const isActive = pathname === path;

                  return (
                    <Link
                      key={category.category_id}
                      href={path}
                      onClick={() => {
                        // Close sidebar on mobile after clicking a link
                        if (window.innerWidth < 1024) {
                          onClose();
                        }
                      }}
                      className={`group flex items-center gap-3 px-3 py-2 text-[13px] font-semibold rounded-lg transition-all duration-200 ${
                        isActive
                          ? "bg-primary/10 text-primary font-bold"
                          : "text-base-content/75 hover:text-base-content hover:bg-base-200"
                      }`}
                    >
                      {renderIcon(category.icon || "BookOpen", isActive)}
                      <span className="truncate">{category.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

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
                  className={`group flex items-center gap-3 px-3 py-2 text-[13px] font-semibold rounded-lg transition-all duration-200 ${
                    pathname === "/user/profile"
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-base-content/75 hover:text-base-content hover:bg-base-200"
                  }`}
                >
                  <History
                  className={`h-5 w-5 transition-colors duration-200 ${
                    pathname === "/user/profile"
                      ? "text-primary"
                      : "text-base-content/50 group-hover:text-base-content/80"
                  }`}
                  />
                  <span className="truncate">My Contributions</span>
                </Link>
                <Link
                  href="/logout"
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className="group flex items-center gap-3 px-3 py-2 text-[13px] font-semibold rounded-lg transition-all duration-200 text-error hover:bg-error/10"
                >
                  <LogOut className="h-5 w-5 text-error group-hover:text-error/80" />
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
                className="btn btn-primary btn-sm w-full font-semibold rounded-xl shadow-md cursor-pointer transition-all duration-100 ease-in-out hover:scale-105"
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
