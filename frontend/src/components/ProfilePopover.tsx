"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User as UserIcon, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function ProfilePopover() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!user) {
    return (
      <Link
        href="/login"
        className="btn btn-circle btn-sm bg-base-200 hover:bg-base-300 border border-base-300 text-base-content/80 hover:text-base-content cursor-pointer flex items-center justify-center shrink-0"
        aria-label="Sign In"
      >
        <UserIcon className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn btn-circle btn-sm bg-base-200 hover:bg-base-300 border border-base-300 text-base-content cursor-pointer flex items-center justify-center overflow-hidden p-0 shrink-0"
        aria-label="Open profile menu"
      >
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.name}
            className="h-7 w-7 rounded-full object-cover"
          />
        ) : (
          <span className="text-[11px] font-bold">{getInitials(user.name)}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 card card-bordered bg-base-100 shadow-xl p-4 z-[80] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3 pb-3 border-b border-base-200">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="h-12 w-12 rounded-2xl object-cover border-2 border-base-300 shrink-0"
              />
            ) : (
              <div className="h-12 w-12 rounded-2xl bg-base-200 border-2 border-base-300 flex items-center justify-center font-bold text-base-content shrink-0">
                {getInitials(user.name)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-base-content truncate">{user.name}</h3>
              <p className="text-xs text-base-content/60 truncate">{user.email}</p>
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary mt-1 inline-block">
                {user.role}
              </span>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <Link
              href="/user/profile"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-base-content/80 hover:text-primary hover:bg-base-200 rounded-xl transition-colors"
            >
              <UserIcon className="h-4 w-4" />
              Profile
            </Link>
            <button
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-base-content/75 hover:text-rose-600 hover:bg-rose-50/50 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
