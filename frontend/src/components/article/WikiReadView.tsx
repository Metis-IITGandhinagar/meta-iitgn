"use client";

import React, { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import WikiInfoBox from "@/components/wiki/WikiInfoBox";
import { parseMarkdown } from "@/lib/utils";

interface WikiReadViewProps {
  markdown: string;
  className?: string;
}

/**
 * Renders wiki content exactly like the published page read mode: a scrollable
 * article body (title + ReactMarkdown in a Tailwind prose container) with the
 * WikiInfoBox metadata sidebar (cover image, description, key info, TOC).
 */
export default function WikiReadView({ markdown, className }: WikiReadViewProps) {
  const parsed = parseMarkdown(markdown || "");
  const mainRef = useRef<HTMLElement>(null);

  // Assign heading ids to match the parsed TOC so the sidebar TOC links scroll.
  useEffect(() => {
    const container = mainRef.current?.querySelector(".prose");
    if (!container) return;
    const headings = Array.from(container.querySelectorAll("h2, h3")) as HTMLElement[];
    const flatIds = parsed.toc.flatMap((t) => [
      t.id,
      ...(t.subItems?.map((s) => s.id) ?? []),
    ]);
    headings.forEach((h, i) => {
      if (flatIds[i]) h.id = flatIds[i];
    });
    setLoaded(true);
  }, [parsed]);

  return (
    <div className={`flex h-full w-full min-w-0 overflow-hidden ${className || ""}`}>
      <main
        ref={mainRef}
        className="flex-1 min-w-0 px-4 md:px-6 pt-4 pb-8 overflow-y-auto bg-base-100 relative text-base-content order-1 scrollbar-none"
      >
        <article className="w-full max-w-2xl mx-auto space-y-6">
          <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-base-content mb-6 leading-tight">
            {parsed.title}
          </h1>
          <div className="prose prose-sm md:prose-base max-w-none text-base-content leading-relaxed font-sans dark:prose-invert">
            <ReactMarkdown>{parsed.contentMarkdown}</ReactMarkdown>
          </div>
        </article>
      </main>

      <WikiInfoBox
        rightSidebarOpen
        setRightSidebarOpen={() => {}}
        isMobile={false}
        rightWidth={220}
        isEditing={false}
        parsed={{ infobox: parsed.infobox, toc: parsed.toc }}
        handleInfoboxChange={() => {}}
        activeSection=""
        handleTocClick={() => {}}
        startResizeRight={() => {}}
        handleRightDoubleClick={() => {}}
      />
    </div>
  );
}
