"use client";

import { useAuth } from "@/hooks/useAuth";
import Avatar from "@/components/Avatar";

/**
 * The current user's generated avatar, styled/sized purely via `className` so it
 * matches the lucide icon signature (`{ className?: string }`) and can be used as
 * a drop-in tab icon in the nav bars.
 */
export default function AvatarIcon({ className }: { className?: string }) {
  const { user } = useAuth();
  return (
    <span
      className={`${className ?? ""} inline-flex items-center justify-center rounded-full bg-white ring-1 ring-base-content/30 overflow-hidden`.trim()}
    >
      <Avatar
        email={user?.email}
        name={user?.name}
        className="w-full h-full rounded-full object-cover"
      />
    </span>
  );
}
