"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

export interface MasonryCardConfig {
  id: string;
  featured?: boolean;
  content: React.ReactNode;
}

interface HomeMasonryGridProps {
  cards: MasonryCardConfig[];
  storageKey?: string;
  // When true, drag handles are shown on every card and reordering is enabled.
  // When false, cards are not draggable (e.g. customize panel is closed).
  reorderEnabled?: boolean;
}

function loadOrder(key: string): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveOrder(key: string, order: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(order));
  } catch {
    /* ignore */
  }
}

function applyOrder(cards: MasonryCardConfig[], order: string[]): MasonryCardConfig[] {
  const map = new Map(cards.map((c) => [c.id, c]));
  const sorted: MasonryCardConfig[] = [];
  for (const id of order) {
    if (map.has(id)) {
      sorted.push(map.get(id)!);
      map.delete(id);
    }
  }
  for (const remaining of map.values()) sorted.push(remaining);
  return sorted;
}

function useContainerCols(ref: React.RefObject<HTMLDivElement | null>): number {
  const [cols, setCols] = useState(3);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      if (width < 520) setCols(1);
      else if (width < 900) setCols(2);
      else setCols(3);
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
  return cols;
}

interface SortableCardItemProps {
  card: MasonryCardConfig;
  isDraggingOver: boolean;
  reorderEnabled: boolean;
}

function SortableCardItem({ card, isDraggingOver, reorderEnabled }: SortableCardItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, disabled: !reorderEnabled });

  const [span, setSpan] = useState(20);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDragging) return; // Lock the layout height footprint during active drag
    const el = contentRef.current;
    if (!el) return;

    const calculateSpan = () => {
      const height = el.getBoundingClientRect().height;
      const rowSpan = Math.ceil((height + 20) / 10);
      setSpan(rowSpan);
    };

    calculateSpan();

    const observer = new ResizeObserver(() => {
      calculateSpan();
    });
    observer.observe(el);

    window.addEventListener("load", calculateSpan);

    return () => {
      observer.disconnect();
      window.removeEventListener("load", calculateSpan);
    };
  }, [isDragging]);

  const colSpan = 1;

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    gridColumn: colSpan > 1 ? `span ${colSpan}` : undefined,
    gridRowEnd: `span ${span}`,
    minHeight: 0,
    marginBottom: "20px", // Acts as the vertical gap
    zIndex: isDragging ? 1 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group/card rounded-2xl focus:outline-none ${
        isDragging ? "ring-2 ring-primary/30 ring-offset-2 ring-offset-base-100" : ""
      } ${isDraggingOver ? "scale-[0.98]" : ""} transition-transform duration-150`}
    >
      {reorderEnabled && (
        <button
          {...attributes}
          {...listeners}
          tabIndex={0}
          aria-label="Drag to reorder"
          className={`
            absolute top-3 right-3 z-10 p-1 rounded-lg
            opacity-100
            bg-base-200/80 backdrop-blur-sm border border-base-300
            text-base-content/50 hover:text-base-content
            cursor-grab active:cursor-grabbing
            transition-opacity duration-150 shadow-sm
          `}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
      )}
      <div ref={contentRef} className="h-fit">
        {card.content}
      </div>
    </div>
  );
}

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0.35" } },
  }),
};

const DEFAULT_STORAGE_KEY = "meta_iitgn_home_card_order";

export default function HomeMasonryGrid({
  cards,
  storageKey = DEFAULT_STORAGE_KEY,
  reorderEnabled = false,
}: HomeMasonryGridProps) {
  const [items, setItems] = useState<MasonryCardConfig[]>(cards);
  const [activeId, setActiveId] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const cols = useContainerCols(gridRef);
  const [colWidth, setColWidth] = useState(0);

  // Stable key of the current card id set. Re-syncs the displayed order when the
  // set of cards changes (e.g. cards are filtered out via preferences) without
  // clobbering an in-progress drag, which doesn't change the id set.
  const cardsKey = cards.map((c) => c.id).join(",");

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;

    const measure = () => {
      const width = el.getBoundingClientRect().width;
      const gapTotal = 20 * (cols - 1);
      const computedWidth = (width - gapTotal) / cols;
      setColWidth(computedWidth);
    };

    measure();

    const observer = new ResizeObserver(() => {
      measure();
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, [cols]);

  useEffect(() => {
    const saved = loadOrder(storageKey);
    if (saved && saved.length > 0) {
      setItems(applyOrder(cards, saved));
    } else {
      setItems(cards);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, cardsKey]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      if (!over || active.id === over.id) return;
      setItems((prev) => {
        const oldIndex = prev.findIndex((c) => c.id === active.id);
        const newIndex = prev.findIndex((c) => c.id === over.id);
        const next = arrayMove(prev, oldIndex, newIndex);
        saveOrder(storageKey, next.map((c) => c.id));
        return next;
      });
    },
    [storageKey]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const activeCard = items.find((c) => c.id === activeId) ?? null;
  const activeFeatured = false;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={items.map((c) => c.id)} strategy={rectSortingStrategy}>
        <div
          ref={gridRef}
          className="grid gap-x-5 gap-y-0"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gridAutoRows: "10px",
          }}
        >
          {items.map((card) => (
            <SortableCardItem
              key={card.id}
              card={card}
              isDraggingOver={!!activeId && activeId !== card.id}
              reorderEnabled={reorderEnabled}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={dropAnimation}>
        {activeCard ? (
          <div
            className="rounded-2xl shadow-[0_24px_48px_rgba(0,0,0,0.18)] ring-2 ring-primary/40 ring-offset-2 rotate-1 scale-[1.03] opacity-95 pointer-events-none"
            style={{
              width: activeFeatured ? `${colWidth * 2 + 20}px` : `${colWidth}px`,
            }}
          >
            {activeCard.content}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
