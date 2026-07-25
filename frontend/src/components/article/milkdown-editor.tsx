"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Crepe } from "@milkdown/crepe";
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react";
import { listener, listenerCtx } from "@milkdown/plugin-listener";
import { Plugin } from "@milkdown/prose/state";
import type { EditorView } from "@milkdown/prose/view";
import { $prose, $useKeymap } from "@milkdown/utils";
import { cn } from "@/lib/utils";
import { applySectionFolding } from "@/lib/wikiFolding";
import { apiService, getPagesList } from "@/api";
import type { PageListItem } from "@/api";
import { useCommonStore } from "@/store/useCommonStore";

import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/common/toolbar.css";
import "@milkdown/crepe/theme/common/top-bar.css";
// We want to load the frame theme which has full editor styles
import "@milkdown/crepe/theme/frame.css";

// Editor typography is controlled independently from the interface/article
// font. Both the editor font style and size are stored separately
// (wiki_editor_font_style / wiki_editor_font_size) and applied via
// data-editor-font-* attributes on the editing surface. The matching CSS (in
// globals.css) beats the interface font rules, so the two stay independent and
// the interface font never leaks into the editor.

interface MilkdownEditorInnerProps {
  initialMarkdown: string;
  onMarkdownChange: (markdown: string) => void;
  readOnly?: boolean;
  onLoaded?: () => void;
  toolbarContainer?: HTMLDivElement | null;
  enableFolding?: boolean;
  autoFold?: boolean;
}

// Section folding for the read-only surface is implemented in
// `@/lib/wikiFolding` (shared with the lightweight static reader) and invoked
// from the reader-only effect below.

/** Active `[[` page-link suggestion shown by the editor dropdown. */
interface WikiLinkSuggestion {
  query: string;
  /** Doc position just after the opening `[[`. */
  from: number;
  /** Doc position of the cursor (end of the typed query). */
  to: number;
  /** Viewport coords of the cursor, from `view.coordsAtPos`. */
  coords: { left: number; top: number; bottom: number };
}

/**
 * Floating picker that appears below the cursor when the user types `[[`.
 * Lists pages (filtered by the query) and inserts a slug-based Markdown link
 * on selection. Keyboard navigation is driven by the editor's keymap; this
 * component only renders the list and reports clicks/hover.
 */
function WikiLinkDropdown({
  suggestion,
  pages,
  selectedIndex,
  loading,
  onSelect,
  onHover,
}: {
  suggestion: WikiLinkSuggestion;
  pages: PageListItem[];
  selectedIndex: number;
  loading: boolean;
  onSelect: (page: PageListItem) => void;
  onHover: (index: number) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  // Keep the highlighted item in view as the selection moves.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${selectedIndex}"]`
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const style: CSSProperties = {
    position: "fixed",
    left: suggestion.coords.left,
    top: suggestion.coords.bottom + 6,
    zIndex: 60,
    maxWidth: "min(320px, calc(100vw - 24px))",
  };

  return (
    <div
      style={style}
      className="max-h-64 w-72 overflow-y-auto rounded-lg border border-base-300 bg-base-100 p-1 shadow-xl"
      role="listbox"
      aria-label="Link to a page"
      ref={listRef}
    >
      {loading ? (
        <div className="px-3 py-2 text-sm text-base-content/60">Loading pages…</div>
      ) : pages.length === 0 ? (
        <div className="px-3 py-2 text-sm text-base-content/60">No pages found</div>
      ) : (
        pages.map((page, i) => (
          <button
            key={page.slug}
            type="button"
            data-index={i}
            role="option"
            aria-selected={i === selectedIndex}
            // Use mousedown + preventDefault so the editor keeps focus and the
            // current selection (the `[[` range) stays valid when we insert.
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(page);
            }}
            onMouseEnter={() => onHover(i)}
            className={cn(
              "flex w-full flex-col gap-0.5 rounded-md px-3 py-2 text-left text-sm transition-colors",
              i === selectedIndex ? "bg-base-200" : "hover:bg-base-200/60"
            )}
          >
            <span className="truncate font-medium text-base-content">
              {page.title?.trim() || page.slug}
            </span>
            {page.category && (
              <span className="truncate text-[11px] text-base-content/50">
                {page.category}
              </span>
            )}
          </button>
        ))
      )}
    </div>
  );
}

function MilkdownEditorInner({
  initialMarkdown,
  onMarkdownChange,
  readOnly = false,
  onLoaded,
  toolbarContainer,
  enableFolding = false,
  autoFold = false,
}: MilkdownEditorInnerProps) {
  const onMarkdownChangeRef = useRef(onMarkdownChange);
  const crepeRef = useRef<Crepe | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [topBarNode, setTopBarNode] = useState<Element | null>(null);

  const editorFontStyle = useCommonStore((state) => state.editorFontStyle);
  const editorFontSize = useCommonStore((state) => state.editorFontSize);
  const spellCheck = useCommonStore((state) => state.editorSpellCheck);
  const showWordCount = useCommonStore((state) => state.editorWordCount);
  const [wordCount, setWordCount] = useState({ words: 0, chars: 0 });

  // --- `[[` page-link autocomplete state ---------------------------------
  const viewRef = useRef<EditorView | null>(null);
  const suggestionRef = useRef<WikiLinkSuggestion | null>(null);
  const filteredRef = useRef<PageListItem[]>([]);
  const selectedIndexRef = useRef(0);
  const pagesRef = useRef<PageListItem[]>([]);
  const [suggestion, setSuggestion] = useState<WikiLinkSuggestion | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [pages, setPages] = useState<PageListItem[]>([]);

  // Report a new suggestion state, skipping redundant updates.
  const report = useCallback((next: WikiLinkSuggestion | null) => {
    const prev = suggestionRef.current;
    if (next && prev && next.query === prev.query && next.from === prev.from && next.to === prev.to) {
      return;
    }
    if (!next && !prev) return;
    suggestionRef.current = next;
    setSuggestion(next);
    if (next) setSelectedIndex(0);
  }, []);

  // Insert the chosen page as a slug-based Markdown link, replacing `[[query`.
  const selectPage = useCallback(
    (page: PageListItem | undefined) => {
      const view = viewRef.current;
      const sug = suggestionRef.current;
      if (!view || !sug || !page) return;

      const { state } = view;
      const label = (page.title && page.title.trim()) || page.slug;
      const href = `/wiki/page/${page.slug}`;
      const linkMark = state.schema.marks.link;
      const node = linkMark
        ? state.schema.text(label, [linkMark.create({ href, title: "" })])
        : state.schema.text(`[${label}](${href})`);

      const tr = state.tr.replaceWith(sug.from, sug.to, node).insertText(" ");
      view.dispatch(tr);
      report(null);
      view.focus();
    },
    [report]
  );

  useEffect(() => {
    onMarkdownChangeRef.current = onMarkdownChange;
  }, [onMarkdownChange]);

  // Load the full page list once for the `[[` autocomplete (editable only).
  useEffect(() => {
    if (readOnly) return;
    let cancelled = false;
    getPagesList()
      .then((data) => {
        if (cancelled) return;
        pagesRef.current = data;
        setPages(data);
      })
      .catch((err) => console.error("Failed to load pages for autocomplete:", err));
    return () => {
      cancelled = true;
    };
  }, [readOnly]);

  // Pages filtered by the current `[[` query (empty query => all pages).
  const filtered = useMemo(() => {
    const q = (suggestion?.query ?? "").toLowerCase().trim();
    const list = q
      ? pages.filter((p) =>
          `${p.title ?? ""} ${p.slug} ${p.category ?? ""}`.toLowerCase().includes(q)
        )
      : pages;
    return list.slice(0, 8);
  }, [pages, suggestion]);

  // Keep refs in sync with render state for use inside ProseMirror handlers.
  useEffect(() => {
    filteredRef.current = filtered;
  }, [filtered]);
  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  useEffect(() => {
    if (selectedIndex >= filtered.length) {
      setSelectedIndex(Math.max(0, filtered.length - 1));
    }
  }, [filtered.length, selectedIndex]);

  // Live word/character count derived from the current markdown.
  const updateWordCount = (md: string) => {
    const text = md
      .replace(/```[\s\S]*?```/g, " ") // fenced code
      .replace(/`[^`]*`/g, " ") // inline code
      .replace(/!?\[[^\]]*\]\([^)]*\)/g, " ") // links/images
      .replace(/[#>*_~`-]/g, " ") // markdown punctuation
      .replace(/\s+/g, " ")
      .trim();
    const words = text ? text.split(" ").length : 0;
    setWordCount({ words, chars: text.replace(/\s/g, "").length });
  };

  const { loading } = useEditor((root) => {
    const crepe = new Crepe({
      root,
      defaultValue: initialMarkdown,
      features: {
        [Crepe.Feature.TopBar]: !readOnly,
      },
      featureConfigs: {
        [Crepe.Feature.ImageBlock]: {
          onUpload: async (file: File) => {
            try {
              const formData = new FormData();
              formData.append("file", file);
              const res = await apiService.uploadMedia(formData);
              return res.url;
            } catch (err) {
              console.error("Failed to upload image inside Milkdown:", err);
              throw err;
            }
          },
        },
      },
    });

    crepe.setReadonly(readOnly);
    crepe.editor.use(listener);

    crepe.editor.config((ctx) => {
      const lst = ctx.get(listenerCtx);
      lst.markdownUpdated((_, markdown, prevMarkdown) => {
        if (markdown !== prevMarkdown) {
          onMarkdownChangeRef.current(markdown);
          updateWordCount(markdown);
        }
      });
    });

    // Detect `[[` in the current text block and surface a suggestion. The
    // plugin's view runs on every transaction; it is read-only with respect to
    // the document (no keydown handling here — that lives in the keymap below).
    crepe.editor.use(
      $prose(
        () =>
          new Plugin({
            view(editorView) {
              viewRef.current = editorView;
              return {
                update(view) {
                  if (!view.editable) {
                    report(null);
                    return;
                  }
                  const { selection } = view.state;
                  if (!selection.empty) {
                    report(null);
                    return;
                  }
                  const $from = view.state.doc.resolve(selection.from);
                  const parent = $from.parent;
                  if (parent.type.spec.code) {
                    report(null);
                    return;
                  }
                  const textBefore = parent.textBetween(0, $from.parentOffset);
                  const match = /\[\[([^\]\n]*)$/.exec(textBefore);
                  if (!match) {
                    report(null);
                    return;
                  }
                  const query = match[1];
                  const from = selection.from - match[0].length;
                  const to = selection.from;
                  const coords = view.coordsAtPos(to);
                  report({
                    query,
                    from,
                    to,
                    coords: { left: coords.left, top: coords.top, bottom: coords.bottom },
                  });
                },
                destroy() {
                  viewRef.current = null;
                },
              };
            },
          })
      )
    );

    // Intercept navigation/confirm keys while a `[[` suggestion is open. Priority
    // 1000 runs before ProseMirror's baseKeymap (priority 100) so Enter inserts
    // the link instead of splitting the paragraph.
    crepe.editor.use(
      $useKeymap("wikiLink", {
        ConfirmWikiLink: {
          shortcuts: ["Enter"],
          priority: 1000,
          command: () => () => {
            const sug = suggestionRef.current;
            if (!sug) return false;
            const list = filteredRef.current;
            if (list.length === 0) return false;
            selectPage(list[selectedIndexRef.current]);
            return true;
          },
        },
        NextWikiLink: {
          shortcuts: ["ArrowDown"],
          priority: 1000,
          command: () => () => {
            const sug = suggestionRef.current;
            if (!sug) return false;
            const list = filteredRef.current;
            if (list.length === 0) return false;
            selectedIndexRef.current = (selectedIndexRef.current + 1) % list.length;
            setSelectedIndex(selectedIndexRef.current);
            return true;
          },
        },
        PrevWikiLink: {
          shortcuts: ["ArrowUp"],
          priority: 1000,
          command: () => () => {
            const sug = suggestionRef.current;
            if (!sug) return false;
            const list = filteredRef.current;
            if (list.length === 0) return false;
            selectedIndexRef.current =
              (selectedIndexRef.current - 1 + list.length) % list.length;
            setSelectedIndex(selectedIndexRef.current);
            return true;
          },
        },
        CloseWikiLink: {
          shortcuts: ["Escape"],
          priority: 1000,
          command: () => () => {
            if (!suggestionRef.current) return false;
            report(null);
            return true;
          },
        },
      })
    );

    crepeRef.current = crepe;
    return crepe;
  }, []);

  useEffect(() => {
    if (!loading) {
      const node = document.querySelector(".milkdown-top-bar");
      setTopBarNode(node);
      // Seed the word count from the initial content.
      updateWordCount(initialMarkdown);
      if (onLoaded) {
        onLoaded();
      }
    }
  }, [loading, onLoaded, initialMarkdown]);

  // Reader-only section folding: wrap H2/H3 regions in collapsible markup once
  // the read-only document has rendered. Gated on readOnly so the editing
  // surface (and any other MilkdownEditor consumer) is never affected.
  useEffect(() => {
    if (loading || !readOnly || !enableFolding) return;
    const prose = containerRef.current?.querySelector<HTMLElement>(".ProseMirror");
    if (prose) applySectionFolding(prose, autoFold);
  }, [loading, readOnly, enableFolding, autoFold, initialMarkdown]);

  // Apply the editor typography + spell-check. Font style/size are set as
  // data-editor-font-* attributes on the editing surface; the matching CSS in
  // globals.css scopes them to `.milkdown-editing .ProseMirror` so they beat the
  // interface font rules without leaking out. Read-only renders deliberately opt
  // out so they inherit the interface font like the rest of the article.
  useEffect(() => {
    if (loading) return;
    const root = containerRef.current;
    if (!root) return;
    if (!readOnly) {
      root.setAttribute("data-editor-font-style", editorFontStyle);
      root.setAttribute("data-editor-font-size", editorFontSize);
    }
    const editable = root.querySelector('[contenteditable="true"]') as HTMLElement | null;
    if (editable) {
      editable.setAttribute("spellcheck", spellCheck ? "true" : "false");
    }
  }, [spellCheck, editorFontStyle, editorFontSize, loading, readOnly]);

  // Safely teleport the top bar DOM element to the header portal container
  useEffect(() => {
    if (!toolbarContainer || !topBarNode) return;

    toolbarContainer.appendChild(topBarNode);

    return () => {
      if (toolbarContainer.contains(topBarNode)) {
        toolbarContainer.removeChild(topBarNode);
      }
    };
  }, [toolbarContainer, topBarNode]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "milkdown-container prose max-w-none transition-colors relative",
        !readOnly && "milkdown-editing",
        readOnly ? "min-h-0 border-none p-0" : "min-h-[400px] border-none p-0"
      )}
    >
      <div className="relative z-10">
        <Milkdown />
      </div>
      {!readOnly && showWordCount && (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-0 -translate-x-1/2 flex gap-3 rounded-lg bg-base-200/30 px-3 py-1 text-[10px] font-semibold text-base-content/40">
          <span>{wordCount.words} words</span>
          <span>{wordCount.chars} chars</span>
        </div>
      )}
      {!readOnly && suggestion && (
        <WikiLinkDropdown
          suggestion={suggestion}
          pages={filtered}
          selectedIndex={selectedIndex}
          loading={pages.length === 0}
          onSelect={(page) => selectPage(page)}
          onHover={(i) => setSelectedIndex(i)}
        />
      )}
    </div>
  );
}

interface MilkdownEditorProps {
  initialMarkdown: string;
  onMarkdownChange: (markdown: string) => void;
  readOnly?: boolean;
  onLoaded?: () => void;
  toolbarContainer?: HTMLDivElement | null;
  enableFolding?: boolean;
  autoFold?: boolean;
}

export default function MilkdownEditor({
  initialMarkdown,
  onMarkdownChange,
  readOnly = false,
  onLoaded,
  toolbarContainer,
  enableFolding = false,
  autoFold = false,
}: MilkdownEditorProps) {
  return (
    <MilkdownProvider>
      <MilkdownEditorInner
        initialMarkdown={initialMarkdown}
        onMarkdownChange={onMarkdownChange}
        readOnly={readOnly}
        onLoaded={onLoaded}
        toolbarContainer={toolbarContainer}
        enableFolding={enableFolding}
        autoFold={autoFold}
      />
    </MilkdownProvider>
  );
}
