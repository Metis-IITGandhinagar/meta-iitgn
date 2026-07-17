"use client";

import { useEffect, useRef, useState } from "react";
import { Crepe } from "@milkdown/crepe";
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react";
import { listener, listenerCtx } from "@milkdown/plugin-listener";
import { cn } from "@/lib/utils";
import { apiService } from "@/api";

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
}

function MilkdownEditorInner({
  initialMarkdown,
  onMarkdownChange,
  readOnly = false,
  onLoaded,
  toolbarContainer,
}: MilkdownEditorInnerProps) {
  const onMarkdownChangeRef = useRef(onMarkdownChange);
  const crepeRef = useRef<Crepe | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [topBarNode, setTopBarNode] = useState<Element | null>(null);

  // Editor-specific preferences read from localStorage.
  const [editorFontStyle, setEditorFontStyle] = useState("serif");
  const [editorFontSize, setEditorFontSize] = useState("normal");
  const [spellCheck, setSpellCheck] = useState(true);
  const [showWordCount, setShowWordCount] = useState(true);
  const [wordCount, setWordCount] = useState({ words: 0, chars: 0 });

  useEffect(() => {
    onMarkdownChangeRef.current = onMarkdownChange;
  }, [onMarkdownChange]);

  // Load editor preferences and keep them in sync while editing.
  useEffect(() => {
    const readPrefs = () => {
      setEditorFontStyle(localStorage.getItem("wiki_editor_font_style") || "serif");
      setEditorFontSize(localStorage.getItem("wiki_editor_font_size") || "normal");
      setSpellCheck(localStorage.getItem("wiki_editor_spellcheck") !== "false");
      setShowWordCount(localStorage.getItem("wiki_editor_word_count") !== "false");
    };
    readPrefs();
    window.addEventListener("wiki_settings_changed", readPrefs);
    return () => window.removeEventListener("wiki_settings_changed", readPrefs);
  }, []);

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
          }
        }
      }
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
    </div>
  );
}

interface MilkdownEditorProps {
  initialMarkdown: string;
  onMarkdownChange: (markdown: string) => void;
  readOnly?: boolean;
  onLoaded?: () => void;
  toolbarContainer?: HTMLDivElement | null;
}

export default function MilkdownEditor({
  initialMarkdown,
  onMarkdownChange,
  readOnly = false,
  onLoaded,
  toolbarContainer,
}: MilkdownEditorProps) {
  return (
    <MilkdownProvider>
      <MilkdownEditorInner
        initialMarkdown={initialMarkdown}
        onMarkdownChange={onMarkdownChange}
        readOnly={readOnly}
        onLoaded={onLoaded}
        toolbarContainer={toolbarContainer}
      />
    </MilkdownProvider>
  );
}
