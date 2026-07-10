"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  
  const user:userType = {
  name: "Meta IITGN",
  image: "Image",
  email: "meta.iitgn@iitgn.ac.in",
  currentTier: currentTier as string,
};

  const activeTier = user?.currentTier || "bronze";
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
      {/* Sidebar Container */}
      <aside
        className={`
          flex flex-col h-full bg-white border-r border-gray-150 select-none overflow-hidden shrink-0 relative
          transition-all duration-300 ease-in-out
          fixed inset-y-0 left-0 z-50 lg:static lg:h-full lg:z-auto
          ${
            isOpen
              ? "w-80 translate-x-0"
              : "w-0 lg:w-0 -translate-x-full lg:translate-x-0 lg:border-r-0"
          }
        `}
      >
        {/* Inner fixed-width container to prevent layout squeezing during transitions */}
        <div className="w-80 h-full flex flex-col shrink-0 relative">
          {/* Mobile-only absolute close button */}
          {isOpen && (
            <button
              onClick={onClose}
              className="lg:hidden absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg text-gray-450 hover:text-gray-700 transition-colors duration-200 cursor-pointer active:scale-95 z-50"
              aria-label="Close Sidebar"
            >
              <X className="h-6 w-6 text-black" />
            </button>
          )}

          {/* User Profile Card */}
          {/* Use user.name and user.email and user.picture here after implemting user auth */}
          <div className="px-4 py-4 border-b border-gray-100 bg-gray-50/30 shrink-0">
            {user ? (
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-inner transition-colors duration-300 shrink-0 ${activeTierData.progressBar}`}
                >
                  {user?.image}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-800 truncate">
                    {user?.name}
                  </h4>
                  <p className="text-[11px] text-gray-400 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-inner transition-colors duration-300 shrink-0 ${activeTierData.progressBar}`}
                >
                  G
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-800 truncate">
                    Guest
                  </h4>
                  <p className="text-[11px] text-gray-400 truncate">
                    guest@iitgn.ac.in
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation list area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6 no-scrollbar">
            {SIDEBAR_SECTIONS.map((section) => (
              <div key={section.title} className="space-y-1.5">
                {/* Section Header */}
                <h3 className="px-3 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
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

            {/* Tier Banner - Scrollable */}
            {user && (
              <div className="space-y-1.5 border-t border-gray-100 pt-4 px-3">
                <div className="p-3.5 rounded-xl border border-gray-150 bg-gray-50/30">
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
                      className={`h-full rounded-full transition-all duration-355 ${activeTierData.progressBar}`}
                      style={{ width: `${activeTierData.percent}%` }}
                    />
                  </div>

                  {/* Next Tier Unlock */}
                  {activeTierData.nextTier && (
                    <p className="text-[9px] font-semibold text-gray-400 leading-normal line-clamp-1">
                      Next: {activeTierData.nextTier} • {activeTierData.nextUnlock}
                    </p>
                  )}
                </div>
              </div>
            )}

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
                    href="/user/signout"
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className="group flex items-center gap-3 px-3 py-2 text-[13px] font-semibold rounded-lg transition-all duration-200 text-rose-600 hover:text-rose-800 hover:bg-rose-50/50"
                  >
                    <LogOut className="h-5 w-5 text-rose-500 group-hover:text-rose-600" />
                    <span className="truncate">Sign Out</span>
                  </Link>
                </div>
              </div>
            ) : (
              <>
               <div className="p-1 py-2 mx-2 cursor-pointer transition-all duration-100 ease-in-out hover:scale-105 rounded-xl border flex justify-center border-gray-150 bg-blue-500">
                <div className="flex items-center justify-center">
                  <button>Login</button>
                </div>
              </div>
              </>
            )}
          </div>



          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 shrink-0">
            <p className="text-[10px] font-semibold text-gray-400">
              © {new Date().getFullYear()} IIT Gandhinagar
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Community maintained
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
