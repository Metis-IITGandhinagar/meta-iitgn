"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

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
    <div className="fixed inset-0 bg-white z-[99999] flex flex-col h-dvh w-screen overflow-hidden select-none animate-in fade-in duration-200">
      <header className="h-16 border-b border-gray-200 flex items-center justify-between px-6 shrink-0 bg-white shadow-sm select-none">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-center"
          >
            <ArrowLeft className="h-6 w-6 text-gray-900" />
          </button>
          <span className="text-sm font-bold text-blue-400 uppercase tracking-wider">Active Wiki Editors</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain bg-gray-55 p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {editors.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-gray-300 bg-white rounded-2xl">
              <p className="text-gray-500 font-medium">No registered editors found.</p>
            </div>
          ) : (
            editors.map((editor) => {
              const initials = editor.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() || "U";
              return (
                <div
                  key={editor.user_id}
                  className="p-4 border border-gray-200 bg-white rounded-2xl shadow-xs flex items-center gap-4 text-left animate-in fade-in"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center font-bold text-gray-700 shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-bold text-gray-800 truncate">{editor.name}</h4>
                    <p className="text-xs text-gray-400 font-medium truncate">{editor.email}</p>
                  </div>
                  {canSeeRoles && (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-150">
                      {editor.role || "Bronze"}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
