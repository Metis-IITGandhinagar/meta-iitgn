"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import GenericOverlayModal from "@/components/GenericOverlayModal";

interface EditorsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  editors: any[];
}

export default function EditorsOverlay({
  isOpen,
  onClose,
  editors,
}: EditorsOverlayProps) {
  const { user } = useAuth();
  const canSeeRoles = user?.role === "admin" || user?.role === "moderator";

  if (!isOpen) return null;

  return (
    <GenericOverlayModal
      isOpen={isOpen}
      onClose={onClose}
      title="Active Wiki Contributors"
      headerColorClass="text-blue-500 bg-base-200"
    >
      <div className="max-w-2xl mx-auto space-y-4 w-full">
        {editors.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-base-300 bg-base-100 rounded-2xl">
            <p className="text-base-content/60 font-medium">No registered contributors found.</p>
          </div>
        ) : (
          editors.map((editor) => {
            const initials = editor.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() || "U";
            return (
              <Link
                key={editor.user_id}
                href={`/user/profile?userId=${editor.user_id}`}
                className="block p-4 border border-base-300 bg-base-100 rounded-2xl shadow-xs flex items-center gap-4 text-left animate-in fade-in transition-colors hover:bg-base-200/60 hover:border-base-300"
              >
                <div className="w-12 h-12 rounded-full bg-base-200 border border-base-300 flex items-center justify-center font-bold text-base-content/85 shrink-0">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-base font-bold text-base-content truncate">{editor.name}</h4>
                  <p className="text-xs text-base-content/50 font-medium truncate">{editor.email}</p>
                </div>
                {canSeeRoles && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-primary border border-blue-150">
                    {editor.role || "Bronze"}
                  </span>
                )}
              </Link>
            );
          })
        )}
      </div>
    </GenericOverlayModal>
  );
}
