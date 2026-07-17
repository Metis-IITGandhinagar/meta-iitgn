"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Maximize2, Minimize2 } from "lucide-react";
import ProfilePopover from "@/components/ProfilePopover";

interface GenericOverlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  headerColorClass?: string;
  maxWidthClass?: string;
  headerActions?: React.ReactNode;
  headerTrailing?: React.ReactNode;
  defaultMaximized?: boolean;
  children: React.ReactNode;
}

export default function GenericOverlayModal({
  isOpen,
  onClose,
  title,
  children,
  maxWidthClass = "max-w-4xl",
  headerActions,
  headerTrailing,
  defaultMaximized = false,
}: GenericOverlayModalProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const [isMaximized, setIsMaximized] = useState(defaultMaximized);
  const [isDragging, setIsDragging] = useState(false);

  const dragRef = useRef<{
    isDragging: boolean;
    startX: number;
    startY: number;
    startPos: { x: number; y: number };
  }>({
    isDragging: false,
    startX: 0,
    startY: 0,
    startPos: { x: 0, y: 0 },
  });

  // Used to detect a double-tap on touch devices (the maximize button is
  // hidden on small screens, so a double-tap on the header is the only way
  // to maximize there).
  const lastTapRef = useRef(0);

  const toggleMaximize = () => setIsMaximized((m) => !m);

  const handleHeaderDoubleTap = (e: React.TouchEvent) => {
    // Don't hijack taps on header buttons (close, maximize, actions).
    if ((e.target as HTMLElement).closest("button")) return;
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      e.preventDefault();
      toggleMaximize();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (window.innerWidth < 640 || isMaximized) return;
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("input") ||
      target.closest("textarea") ||
      target.closest("select") ||
      target.closest("a")
    ) {
      return;
    }
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startPos: { ...position },
    };
    setIsDragging(true);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragRef.current.isDragging) return;
    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;
    setPosition({
      x: dragRef.current.startPos.x + deltaX,
      y: dragRef.current.startPos.y + deltaY,
    });
  };

  const handleMouseUp = () => {
    dragRef.current.isDragging = false;
    setIsDragging(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[20000] flex min-h-screen items-center justify-center bg-transparent overflow-hidden font-sans ${
      isMaximized ? "p-0" : "p-0 sm:p-4"
    }`}>
      {/* Dialog Card - matching SettingsModal aesthetics and draggable header */}
      <div
        style={
          isMounted && window.innerWidth >= 640 && !isMaximized
            ? {
                transform: `translate(${position.x}px, ${position.y}px)`,
                transition: isDragging ? "none" : undefined,
              }
            : undefined
        }
        className={`relative box-border flex flex-col shrink-0 grow-0 overflow-hidden bg-base-100 shadow-xl pointer-events-auto ${
          isDragging ? "" : "transition-all duration-200"
        } ${
          isMaximized
            ? "w-full h-full max-w-none max-h-none sm:w-screen sm:h-screen sm:max-h-none sm:rounded-none sm:border-0"
            : `w-full h-full ${maxWidthClass} sm:h-[min(640px,calc(100vh-2rem))] sm:min-h-0 sm:max-h-[calc(100vh-2rem)] sm:rounded-lg border border-base-300/60`
        }`}
      >
        {/* Unified Draggable Header */}
        <div
          onMouseDown={handleMouseDown}
          onDoubleClick={(e) => {
            if ((e.target as HTMLElement).closest("button")) return;
            toggleMaximize();
          }}
          onTouchEnd={handleHeaderDoubleTap}
          className={`flex items-center justify-between px-4 py-2.5 border-b border-base-300 bg-base-200 text-base-content select-none shrink-0 ${
            "cursor-default"
          }`}
        >
          {/* Left: Close Button */}
          <div className="flex items-center justify-start">
            <button
              onClick={onClose}
              className="p-1 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer text-red-400 hover:text-red-500"
              aria-label="Close"
            >
              <X className="w-5 h-5 shrink-0" />
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center justify-end gap-1">
            {headerActions}
            {headerActions ? (
              <span className="mx-1.5 h-5 w-px bg-base-content/20" aria-hidden="true" />
            ) : null}
            {headerTrailing ?? <ProfilePopover />}
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="hidden sm:inline-flex p-1 hover:bg-base-300 rounded-lg transition-colors cursor-pointer text-base-content/70 hover:text-base-content"
              aria-label={isMaximized ? "Restore" : "Maximize"}
            >
              {isMaximized ? (
                <Minimize2 className="w-4 h-4 shrink-0" />
              ) : (
                <Maximize2 className="w-4 h-4 shrink-0" />
              )}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-base-100 flex flex-col p-6 w-full text-base-content select-text">
          {children}
        </div>
      </div>
    </div>
  );
}
