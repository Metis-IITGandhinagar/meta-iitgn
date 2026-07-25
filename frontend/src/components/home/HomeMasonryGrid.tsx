"use client";

import React from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCommonStore } from "@/store/useCommonStore";
import { motion } from "framer-motion";

export interface MasonryCardConfig {
  id: string;
  colSpan?: number;
  rowSpan?: number;
  content: React.ReactNode;
}

interface HomeMasonryGridProps {
  cards: MasonryCardConfig[];
  storageKey?: string;
  reorderEnabled?: boolean;
}

function SortableCard({
  card,
  reorderEnabled,
}: {
  card: MasonryCardConfig;
  reorderEnabled: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, disabled: !reorderEnabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layoutId={card.id}
      layout="position"
      {...(reorderEnabled ? attributes : {})}
      {...(reorderEnabled ? listeners : {})}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={reorderEnabled ? {} : { y: -6, scale: 1.015 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 25,
        opacity: { duration: 0.4 }
      }}
      className={`w-full aspect-square rounded-2xl overflow-hidden relative transition-shadow ${
        reorderEnabled
          ? "ring-2 ring-blue-500/30 hover:ring-blue-500/70 cursor-grab active:cursor-grabbing shadow-lg"
          : "shadow-sm border border-base-200"
      }`}
    >
      <div className="w-full h-full flex flex-col [&>div]:h-full select-none">
        {card.content}
      </div>
      {reorderEnabled && (
        <div className="absolute top-3 right-3 bg-blue-600 text-white rounded-full p-2 shadow-md pointer-events-none z-[50] flex items-center justify-center">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9M20.25 20.25v-4.5m0 4.5h-4.5m4.5 0L15 15"
            />
          </svg>
        </div>
      )}
    </motion.div>
  );
}

export default function HomeMasonryGrid({
  cards,
  reorderEnabled = false,
}: HomeMasonryGridProps) {
  const { homeCardOrder, setHomeCardOrder } = useCommonStore();
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = homeCardOrder.indexOf(active.id as string);
      const newIndex = homeCardOrder.indexOf(over.id as string);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(homeCardOrder, oldIndex, newIndex);
        setHomeCardOrder(newOrder);
      }
    }
    setActiveId(null);
  };

  // 1. Featured Article
  const featuredCard = cards.find((c) => c.id === "featured-article");

  // 2. Bottom horizontal banner cards
  const bottomCards = cards.filter(
    (c) => c.id === "pending-pages" || c.id === "quick-stats"
  );

  // 3. Middle cards
  const otherCards = cards.filter(
    (c) =>
      c.id !== "featured-article" &&
      c.id !== "pending-pages" &&
      c.id !== "quick-stats"
  );

  // Sort otherCards based on the persisted homeCardOrder
  const sortedOtherCards = [...otherCards].sort((a, b) => {
    const aIndex = homeCardOrder.indexOf(a.id);
    const bIndex = homeCardOrder.indexOf(b.id);
    const aVal = aIndex === -1 ? 999 : aIndex;
    const bVal = bIndex === -1 ? 999 : bIndex;
    return aVal - bVal;
  });

  return (
    <div className="w-full flex flex-col gap-6 mt-4">
      {/* Featured Card */}
      {featuredCard && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.215, 0.61, 0.355, 1] }}
          className="w-full aspect-square md:h-[450px] lg:h-[700px] overflow-hidden rounded-xl border border-base-200"
        >
          <div className="w-full h-full flex flex-col [&>div]:h-full">
            {featuredCard.content}
          </div>
        </motion.div>
      )}

      {/* Middle Cards: 3x2 Grid with optional drag and drop reordering */}
      {sortedOtherCards.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={sortedOtherCards.map((c) => c.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sortedOtherCards.map((card) => (
                <SortableCard
                  key={card.id}
                  card={card}
                  reorderEnabled={reorderEnabled}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay adjustScale={true}>
            {activeId ? (
              <div className="w-full aspect-square rounded-2xl overflow-hidden ring-2 ring-blue-500/70 shadow-2xl opacity-90 scale-105 cursor-grabbing">
                <div className="w-full h-full flex flex-col [&>div]:h-full select-none">
                  {sortedOtherCards.find((c) => c.id === activeId)?.content}
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Bottom Banner Cards */}
      {bottomCards.length > 0 && (
        <div className="flex flex-col gap-6">
          {bottomCards.map((card) => {
            const isStats = card.id === "quick-stats";
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
                whileHover={{ y: -4 }}
                className={`w-full overflow-hidden rounded-xl border border-base-200 ${
                  isStats ? "min-h-[9.5rem] md:h-36" : "min-h-[7.5rem] md:h-36"
                }`}
              >
                <div className="w-full h-full flex flex-col [&>div]:h-full">
                  {card.content}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}