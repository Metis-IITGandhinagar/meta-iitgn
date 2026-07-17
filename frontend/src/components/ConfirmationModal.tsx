"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, AlertCircle, Info, X } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning",
}: ConfirmationModalProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !isMounted) return null;

  const getIcon = () => {
    switch (type) {
      case "danger":
        return <AlertTriangle className="h-6 w-6 text-error shrink-0 animate-bounce" />;
      case "warning":
        return <AlertCircle className="h-6 w-6 text-warning shrink-0" />;
      default:
        return <Info className="h-6 w-6 text-info shrink-0" />;
    }
  };

  const getConfirmButtonClass = () => {
    switch (type) {
      case "danger":
        return "bg-error text-error-content hover:bg-error/95 hover:shadow-error/15";
      case "warning":
        return "bg-warning text-warning-content hover:bg-warning/95 hover:shadow-warning/15";
      default:
        return "bg-primary text-primary-content hover:bg-primary/95 hover:shadow-primary/15";
    }
  };

  return (
    <div className="fixed inset-0 z-[25000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-neutral-900/65 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
      />

      {/* Card */}
      <div className="relative w-full max-w-md overflow-hidden bg-base-100 border border-base-300/80 rounded-3xl shadow-2xl p-6 md:p-8 animate-in zoom-in-95 duration-200 pointer-events-auto flex flex-col gap-4 font-sans select-none">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-xl text-base-content/40 hover:text-base-content/80 hover:bg-base-200 transition-all active:scale-95 duration-100"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content Row */}
        <div className="flex items-start gap-4 mt-2">
          <div className="p-3 rounded-2xl bg-base-200/50 flex items-center justify-center">
            {getIcon()}
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="text-lg font-serif font-black text-base-content tracking-tight leading-snug">
              {title}
            </h3>
            <p className="text-sm text-base-content/65 font-medium leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-base-200">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl text-sm font-extrabold text-base-content/75 hover:bg-base-200 hover:text-base-content active:scale-98 transition-all duration-150 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-5 py-2.5 rounded-2xl text-sm font-black active:scale-98 shadow-md hover:shadow-lg transition-all duration-150 cursor-pointer ${getConfirmButtonClass()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
