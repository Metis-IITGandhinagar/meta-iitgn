"use client";

import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Maximize2, Minimize2 } from "lucide-react";
import ProfilePopover from "@/components/navs/ProfilePopover";

interface GenericOverlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  headerColorClass?: string;
  maxWidthClass?: string;
  headerActions?: React.ReactNode;
  headerTrailing?: React.ReactNode;
  defaultMaximized?: boolean;
  paddingClass?: string;
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
  paddingClass = "p-6",
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

  // Mirror of `isMaximized` kept in a ref so the drag/move handlers (which are
  // registered once per drag and therefore capture a stale closure) always read
  // the live maximized state.
  const isMaxRef = useRef(defaultMaximized);

  // Position the window had before it was last maximized, so dragging it back
  // down from the top edge can restore it (like a regular OS window).
  const preMaxPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // How close to the top viewport edge (px) the pointer must get for the
  // window to snap-maximize while dragging.
  const TOP_SNAP_THRESHOLD = 8;

  useEffect(() => {
    isMaxRef.current = isMaximized;
  }, [isMaximized]);

  const setMax = (val: boolean) => {
    isMaxRef.current = val;
    setIsMaximized(val);
  };

  const maximize = () => {
    preMaxPos.current = { x: position.x, y: position.y };
    setMax(true);
  };

  const restore = () => setMax(false);

  const toggleMaximize = () => (isMaxRef.current ? restore() : maximize());

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
    if (window.innerWidth < 640) return;
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
    const d = dragRef.current;
    const atTop = e.clientY <= TOP_SNAP_THRESHOLD;

    // Pointer at the top edge: snap-maximize (remember where we were so we can
    // restore on the way back down).
    if (atTop) {
      if (!isMaxRef.current) {
        preMaxPos.current = { x: d.startPos.x, y: d.startPos.y };
        setMax(true);
      }
      return;
    }

    // Pointer below the top edge while maximized (e.g. dragging a maximized
    // window down): un-maximize and keep following the cursor from where it was.
    if (isMaxRef.current) {
      setMax(false);
      d.startPos = { x: preMaxPos.current.x, y: preMaxPos.current.y };
      d.startX = e.clientX;
      d.startY = e.clientY;
    }

    const deltaX = e.clientX - d.startX;
    const deltaY = e.clientY - d.startY;
    setPosition({
      x: d.startPos.x + deltaX,
      y: d.startPos.y + deltaY,
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
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          {/* Left: Close Button */}
          <div className="flex items-center justify-start">
            <button
              onClick={onClose}
              className="p-1 hover:bg-base-300 rounded-lg transition-colors cursor-pointer text-base-content/70 hover:text-base-content"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 shrink-0" />
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
              onClick={toggleMaximize}
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
        <div className={`flex-1 min-h-0 overflow-y-auto overscroll-contain bg-base-100 flex flex-col w-full text-base-content select-text ${paddingClass}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
