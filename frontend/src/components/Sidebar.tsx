"use client";

import { useState, useEffect } from "react";
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
  HelpCircle,
  LucideIcon,
  User,
  History,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { SIDEBAR_SECTIONS, TIERS } from "@/lib/constants";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier?: string;
  onChangeTier?: (tier: string) => void;
}
type userType = {
  name: string;
  email: string;
  image: string;
  currentTier: string;
};

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
};

export default function Sidebar({
  isOpen,
  onClose,
  currentTier,
}: SidebarProps) {
  const pathname = usePathname();
  const [maxItems, setMaxItems] = useState(5);

  useEffect(() => {
    const handleResize = () => {
      const height = window.innerHeight;
      if (height < 650) {
        setMaxItems(1);
      } else if (height < 720) {
        setMaxItems(2);
      } else if (height < 820) {
        setMaxItems(3);
      } else if (height < 920) {
        setMaxItems(4);
      } else {
        setMaxItems(5);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { user } = useAuth();

  const roleToTier = (role: string): "bronze" | "silver" | "gold" => {
    const r = role?.toLowerCase();
    if (r === "admin") return "gold";
    if (r === "moderator") return "silver";
    return "bronze";
  };

  const activeTier = roleToTier(user?.role || "normal");
  const activeTierData = TIERS[activeTier as keyof typeof TIERS] || TIERS.gold;

  // Helper to render Lucide icons dynamically from their string names
  const renderIcon = (iconName: string, isActive: boolean) => {
    const IconComponent = ICON_MAP[iconName] || HelpCircle;

    return (
      <IconComponent
        className={`h-5 w-5 transition-colors duration-200 ${
          isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-650"
        }`}
      />
    );
  };

  return (
    <>
      {/* Backdrop overlay - visible when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 animate-in fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col h-full bg-white border-r border-gray-150 transition-all duration-300 ease-in-out shrink-0 select-none overflow-hidden ${
          isOpen
            ? "w-70 lg:w-80 translate-x-0 shadow-2xl"
            : "w-0 -translate-x-full lg:border-r-0"
        }`}
      >
        {/* Sidebar Header with Brand Logo & Close Button */}
        <div className="flex items-center justify-between px-5 border-b border-gray-100 h-16 shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <span className="font-serif text-2xl font-extrabold tracking-tight  text-blue-500">
              META
            </span>
            <span className="ml-1 text-sm font-semibold uppercase tracking-wider text-gray-500">
              IITGN
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list area */}
        <div className="flex-1 overflow-hidden p-4 space-y-6">
          {SIDEBAR_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-1.5">
              {/* Section Header */}
              <h3 className="px-3 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                {section.title}
              </h3>

              {/* Section Items */}
              <div className="space-y-0.5">
                {(section.title === "NAVIGATION"
                  ? section.items
                  : section.items.slice(0, maxItems)
                ).map((item) => {
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
                          ? "bg-blue-50 text-blue-700 font-bold"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
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

          {/* Account/Profile Section */}
          {user ? (
            <div className="space-y-1.5 border-t border-gray-100 pt-4">
              <h3 className="px-3 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
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
                      ? "bg-blue-50 text-blue-700 font-bold"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <User
                    className={`h-5 w-5 transition-colors duration-200 ${
                      pathname === "/user/profile"
                        ? "text-blue-600"
                        : "text-gray-400 group-hover:text-gray-650"
                    }`}
                  />
                  <span className="truncate">My Profile</span>
                </Link>
                <Link
                  href="/user/contributions"
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`group flex items-center gap-3 px-3 py-2 text-[13px] font-semibold rounded-lg transition-all duration-200 ${
                    pathname === "/user/contributions"
                      ? "bg-blue-50 text-blue-700 font-bold"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <History
                    className={`h-5 w-5 transition-colors duration-200 ${
                      pathname === "/user/contributions"
                        ? "text-blue-600"
                        : "text-gray-400 group-hover:text-gray-650"
                    }`}
                  />
                  <span className="truncate">My Contributions</span>
                </Link>
                <Link
                  href="/user/settings"
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`group flex items-center gap-3 px-3 py-2 text-[13px] font-semibold rounded-lg transition-all duration-200 ${
                    pathname === "/user/settings"
                      ? "bg-blue-50 text-blue-700 font-bold"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Settings
                    className={`h-5 w-5 transition-colors duration-200 ${
                      pathname === "/user/settings"
                        ? "text-blue-600"
                        : "text-gray-400 group-hover:text-gray-650"
                    }`}
                  />
                  <span className="truncate">Settings</span>
                </Link>
                <Link
                  href="/logout"
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className="group flex items-center gap-3 px-3 py-2 text-[13px] font-semibold rounded-lg transition-all duration-200 text-rose-600 hover:text-rose-800 hover:bg-rose-50/50"
                >
                  <LogOut className="h-5 w-5 text-rose-500 group-hover:text-rose-600" />
                  <span className="truncate">Sign Out</span>
                </Link>
              </div>
              {/* Tier Banner at Bottom */}
              {user ? (
                <div className="mb-3 shrink-0">
                  <div className="py-3 px-1 rounded-xl border border-gray-150 bg-gray-50/30">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-bold text-gray-400 tracking-wider uppercase">
                        Contributor Tier
                      </span>
                      <span className="text-[10px] font-bold text-gray-400">
                        Rank {activeTierData.rank}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base leading-none">
                          {activeTierData.icon}
                        </span>
                        <span className="text-xs font-extrabold text-gray-800">
                          {activeTierData.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-extrabold text-gray-500">
                        {activeTierData.xp} XP
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full transition-all duration-350 ${activeTierData.progressBar}`}
                        style={{ width: `${activeTierData.percent}%` }}
                      />
                    </div>

                    {/* Next Tier Unlock */}
                    {activeTierData.nextTier && (
                      <p className="text-[9px] font-semibold text-gray-400 leading-normal line-clamp-1">
                        Next: {activeTierData.nextTier} •{" "}
                        {activeTierData.nextUnlock}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <></>
              )}
            </div>
          ) : (
            <div className="px-2 mt-4">
              <Link
                href="/login"
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className="w-full py-2 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-md cursor-pointer transition-all duration-100 ease-in-out hover:scale-105"
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
