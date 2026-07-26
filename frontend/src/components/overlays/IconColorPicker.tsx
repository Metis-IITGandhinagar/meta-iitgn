"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { CategoryIcon } from "@/lib/categoryIcon";
import { CATEGORY_COLORS } from "@/lib/categoryIcon";
import EmojiPicker from "emoji-picker-react";

interface IconColorPickerProps {
  currentIcon?: string | null;
  currentColor: string;
  onSave: (icon: string, color: string) => Promise<void> | void;
  canManage: boolean;
  size?: number;
  hideColorPicker?: boolean;
}

export default function IconColorPicker({
  currentIcon,
  currentColor,
  onSave,
  canManage,
  size = 24,
  hideColorPicker = false,
}: IconColorPickerProps) {
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const emojiPopoverRef = useRef<HTMLDivElement>(null);
  const colorPopoverRef = useRef<HTMLDivElement>(null);
  const emojiTriggerRef = useRef<HTMLButtonElement>(null);
  const colorTriggerRef = useRef<HTMLButtonElement>(null);

  const handleEmojiSelect = useCallback(
    async (emojiData: { emoji: string }) => {
      try {
        await onSave(emojiData.emoji, currentColor);
        setEmojiPickerOpen(false);
      } catch (err) {
        console.error("Failed to save icon:", err);
      }
    },
    [currentColor, onSave]
  );

  const handleColorSelect = useCallback(
    async (color: string) => {
      try {
        await onSave(currentIcon || "", color);
        setColorPickerOpen(false);
      } catch (err) {
        console.error("Failed to save color:", err);
      }
    },
    [currentIcon, onSave]
  );

  // Close popovers on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerOpen &&
        emojiPopoverRef.current &&
        !emojiPopoverRef.current.contains(event.target as Node) &&
        emojiTriggerRef.current &&
        !emojiTriggerRef.current.contains(event.target as Node)
      ) {
        setEmojiPickerOpen(false);
      }
      if (
        colorPickerOpen &&
        colorPopoverRef.current &&
        !colorPopoverRef.current.contains(event.target as Node) &&
        colorTriggerRef.current &&
        !colorTriggerRef.current.contains(event.target as Node)
      ) {
        setColorPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [emojiPickerOpen, colorPickerOpen]);

  if (!canManage) return null;

  return (
    <div className="relative inline-flex items-center gap-2">
      {/* Emoji/Icon Trigger */}
      <button
        ref={emojiTriggerRef}
        type="button"
        onClick={() => setEmojiPickerOpen((o) => !o)}
        className="inline-flex items-center justify-center p-3 rounded-2xl shadow-sm transition-transform duration-200 cursor-pointer hover:scale-105 active:scale-95"
        style={{
          backgroundColor: `${currentColor || "#4f46e5"}1a`,
          color: currentColor || "#4f46e5",
        }}
        title="Set icon"
        aria-label="Set icon"
      >
        <CategoryIcon icon={currentIcon || undefined} size={size} />
      </button>

      {/* Color Circle Trigger - shown beside emoji icon, hidden on pages */}
      {!hideColorPicker && (
        <button
          ref={colorTriggerRef}
          type="button"
          onClick={() => setColorPickerOpen((o) => !o)}
          className="w-8 h-8 rounded-full border-2 shadow-sm transition-transform duration-200 cursor-pointer hover:scale-110 active:scale-95 flex-shrink-0"
          style={{ backgroundColor: currentColor, borderColor: currentColor }}
          title="Set color"
          aria-label="Set color"
        />
      )}

      {/* Emoji Picker Popover - "dont wrap its ui" */}
      {emojiPickerOpen && (
        <div
          ref={emojiPopoverRef}
          className="absolute left-0 top-full mt-2 z-[20501] shadow-xl animate-in zoom-in-95 duration-150 rounded-2xl overflow-hidden border border-base-300 bg-base-100"
          role="dialog"
          aria-label="Emoji picker"
        >
          <EmojiPicker
            onEmojiClick={handleEmojiSelect}
            searchPlaceholder="Search emoji…"
            emojiVersion="15.0"
            autoFocusSearch={true}
            theme={"auto" as any}
            previewConfig={{ showPreview: false }}
            lazyLoadEmojis={true}
            style={{
              "--epr-bg": "transparent",
              "--epr-border": "none",
              "--epr-border-radius": "0.75rem",
              "--epr-category-button-height": "2.5rem",
              "--epr-category-button-width": "2.5rem",
              "--epr-emoji-size": "1.5rem",
              "--epr-emoji-padding": "0.25rem",
              "--epr-search-height": "2.5rem",
              "--epr-search-bg": "transparent",
              "--epr-search-border": "1px solid var(--b3, #e5e7eb)",
              "--epr-search-placeholder-color": "var(--bc, #1f2937) / 0.4",
              "--epr-search-focus-border": "var(--p, #4f46e5)",
              "--epr-category-button-active-bg": "var(--p, #4f46e5) / 0.1",
              "--epr-category-button-hover-bg": "var(--p, #4f46e5) / 0.1",
              "--epr-category-button-active-color": "var(--p, #4f46e5)",
              "--epr-emoji-hover-bg": "var(--p, #4f46e5) / 0.1",
              "--epr-emoji-hover-scale": "1.15",
            } as React.CSSProperties}
            className="emoji-picker-wrapper"
          />
        </div>
      )}

      {/* Color Picker Popover */}
      {colorPickerOpen && !hideColorPicker && (
        <div
          ref={colorPopoverRef}
          className="absolute left-0 top-full mt-2 z-[20501] w-56 bg-base-100 border border-base-200 rounded-2xl shadow-xl animate-in zoom-in-95 duration-150 p-3"
          role="dialog"
          aria-label="Color picker"
        >
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => handleColorSelect(c)}
                className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer hover:scale-110 active:scale-95 ${
                  currentColor === c
                    ? "border-base-content shadow-md scale-110"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
                title={`Set color to ${c}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}