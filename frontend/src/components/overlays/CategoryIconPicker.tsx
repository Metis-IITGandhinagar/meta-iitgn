"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Search as SearchIcon } from "lucide-react";
import { CATEGORY_COLORS } from "@/lib/categoryIcon";
import {
  EmojiPicker,
  type EmojiPickerListComponents,
  type EmojiPickerListCategoryHeaderProps,
  type EmojiPickerListRowProps,
  type EmojiPickerListEmojiProps,
} from "frimousse";

interface CategoryIconPickerProps {
  currentIcon?: string | null;
  currentColor: string;
  onSave: (icon: string, color: string) => Promise<void> | void;
  onClose: () => void;
}

// Emoji picker built on frimousse's primitives, now with a color palette.
// Selecting an emoji or color persists it via onSave and closes the popover.
export default function CategoryIconPicker({
  currentIcon,
  currentColor,
  onSave,
  onClose,
}: CategoryIconPickerProps) {
  const [saving, setSaving] = useState(false);

  const handleSelect = async (emoji: string) => {
    if (saving) return;
    setSaving(true);
    try {
      await onSave(emoji, currentColor);
      onClose();
    } catch (err) {
      console.error("Failed to save category icon:", err);
      setSaving(false);
    }
  };

  const handleColorSelect = async (newColor: string) => {
    if (saving) return;
    setSaving(true);
    try {
      await onSave(currentIcon || "", newColor);
      onClose();
    } catch (err) {
      console.error("Failed to save category color:", err);
      setSaving(false);
    }
  };

  // Stable component identities so frimousse's internal row memoization holds
  // during scroll/hover (recreating these each render would re-render the
  // entire list). emojiVersion is pinned to a stable major so the picker
  // fetches a much smaller, cached dataset instead of emojibase-data@latest.
  const listComponents = useMemo<EmojiPickerListComponents>(
    () => ({
      CategoryHeader: ({ category }: EmojiPickerListCategoryHeaderProps) => (
        <div className="sticky top-0 z-10 px-1 py-1.5 text-[10px] font-bold uppercase tracking-wider text-base-content/50 bg-base-100/95 backdrop-blur">
          {category.label}
        </div>
      ),
      Row: ({ children }: EmojiPickerListRowProps) => (
        <div className="flex gap-0.5">{children}</div>
      ),
      Emoji: ({ emoji, ...props }: EmojiPickerListEmojiProps) => (
        <button
          {...props}
          className={`flex-1 aspect-square flex items-center justify-center rounded-lg text-xl leading-none transition-all duration-150 cursor-pointer hover:bg-primary/10 hover:scale-105 active:scale-95 ${
            emoji.isActive ? "bg-primary/10" : ""
          }`}
        >
          {emoji.emoji}
        </button>
      ),
    }),
    [],
  );

  return (
    <>
      {/* Backdrop closes the popover on outside click */}
      <div className="fixed inset-0 z-[20500]" onClick={onClose} />

      <div className="absolute left-0 top-full mt-2 z-[20501] w-80 max-w-[calc(100vw-2rem)] bg-base-100 border border-base-200 rounded-2xl shadow-xl animate-in zoom-in-95 duration-150 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-base-content">Set Icon & Color</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-base-300 rounded-lg transition-colors cursor-pointer text-base-content/70 hover:text-base-content"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-1.5">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => handleColorSelect(c)}
                className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer hover:scale-110 active:scale-95 ${
                  currentColor === c ? "border-base-content shadow-md scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
                title={`Set color to ${c}`}
              />
            ))}
          </div>
        </div>

        <div className="h-px bg-base-200" />

        <EmojiPicker.Root
          columns={8}
          emojiVersion={15}
          // Serve emojibase data from our own origin instead of the jsdelivr
          // CDN — same-origin, fast, and cached by the browser. Files live in
          // public/emojis/{locale}/data.json + messages.json.
          emojibaseUrl="/emojis"
          className="flex flex-col [&_*]:outline-none"
          onEmojiSelect={(e) => handleSelect(e.emoji)}
        >
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-base-content/40 pointer-events-none" />
            <EmojiPicker.Search
              autoFocus
              placeholder="Search emoji…"
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-base-300 bg-base-100 text-base-content placeholder-base-content/40 focus:border-primary focus:outline-none"
            />
          </div>

          <EmojiPicker.Viewport className="h-64 overflow-y-auto rounded-lg mt-2">
            <EmojiPicker.Loading className="flex items-center justify-center h-full text-xs text-base-content/50">
              Loading emojis…
            </EmojiPicker.Loading>
            <EmojiPicker.Empty className="flex items-center justify-center h-full text-xs text-base-content/50">
              No emoji found.
            </EmojiPicker.Empty>
            <EmojiPicker.List
              className="flex flex-col"
              components={listComponents}
            />
          </EmojiPicker.Viewport>
        </EmojiPicker.Root>
      </div>
    </>
  );
}
