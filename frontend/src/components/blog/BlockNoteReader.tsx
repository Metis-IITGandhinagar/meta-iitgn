"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";
import "highlight.js/styles/github-dark.css";
import { BlockNoteView } from "@blocknote/shadcn";
import { useCreateBlockNote } from "@blocknote/react";
import { useEffect, useState, useMemo, useRef } from "react";
import DOMPurify from "dompurify";
import { marked } from "marked";
import hljs from "highlight.js";

interface BlockNoteReaderProps {
  contentJson?: string | null;
  theme: "light" | "dark";
}

interface ContentAnalysis {
  type: "blocknote" | "markdown" | "empty";
  parsedBlocks?: any[];
}

// Clean list of allowed HTML tags for strict sanitization
const ALLOWED_TAGS = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "a", "ul", "ol", "li", "span", "div",
  "blockquote", "pre", "code", "table", "thead", "tbody", "tr", "th", "td",
  "img", "br", "strong", "em", "u", "s", "del", "ins",
  "input"
];

// Clean list of allowed HTML attributes
const ALLOWED_ATTR = [
  "href", "src", "alt", "title", "class", "target", "rel",
  "type", "checked", "disabled", "role"
];

const DOMPURIFY_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  // Strict regex to reject javascript:, data:, and vbscript: URIs
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|ftp|tel):|[^&:\/?#]*(?:[\/?#]|$))/i,
  RETURN_TRUSTED_TYPE: false,
};

// Robust detector to classify content type
const analyzeContent = (content: string | null | undefined): ContentAnalysis => {
  if (!content || content.trim() === "") {
    return { type: "empty" };
  }

  const trimmed = content.trim();

  // Try parsing as BlockNote JSON
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const hasBlockProps = parsed.every(
          (block) => block && typeof block === "object" && "id" in block && "type" in block
        );
        if (hasBlockProps) {
          return { type: "blocknote", parsedBlocks: parsed };
        }
      }
    } catch (e) {
      // Fall through to markdown
    }
  }

  return { type: "markdown" };
};

interface BlockNoteJSONRendererProps {
  blocks: any[];
  theme: "light" | "dark";
}

// Dedicated renderer for BlockNote JSON content to optimize performance and prevent unnecessary editor recreation
function BlockNoteJSONRenderer({ blocks, theme }: BlockNoteJSONRendererProps) {
  const editor = useCreateBlockNote();
  const [isReady, setIsReady] = useState(false);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current || !editor || !blocks) return;
    try {
      editor.replaceBlocks(editor.document, blocks);
      setIsReady(true);
      isInitialized.current = true;
    } catch (err) {
      console.error("Failed to load blocks into editor:", err);
    }
  }, [editor, blocks]);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <span className="loading loading-spinner loading-md text-primary"></span>
      </div>
    );
  }

  return (
    <div className="bn-root bn-container">
      <BlockNoteView editor={editor} editable={false} theme={theme} />
    </div>
  );
}

export default function BlockNoteReader({ contentJson, theme }: BlockNoteReaderProps) {
  // Analyze content format
  const analysis = useMemo(() => analyzeContent(contentJson), [contentJson]);

  // Set up DOMPurify link hook cleanly with lifecycle cleanup to prevent duplicates
  useEffect(() => {
    const linkHook = (node: Element) => {
      if (node.tagName === "A") {
        const href = node.getAttribute("href");
        // Ensure only external links open in a new tab
        if (href && (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("//"))) {
          node.setAttribute("target", "_blank");
          node.setAttribute("rel", "noopener noreferrer");
        }
      }
    };

    DOMPurify.addHook("afterSanitizeAttributes", linkHook);
    return () => {
      DOMPurify.removeHook("afterSanitizeAttributes");
    };
  }, []);

  // Memoized Markdown-to-HTML parser and XSS sanitizer
  const parsedHTML = useMemo(() => {
    if (analysis.type === "empty") return "";

    let html = "";
    try {
      // Always parse with marked so that Markdown syntax (headings, code blocks, lists, checklists)
      // is correctly translated to HTML structure. This also safely preserves embedded HTML tags.
      html = marked.parse(contentJson || "", { gfm: true, breaks: true }) as string;
    } catch (err) {
      console.error("Failed parsing Markdown fallback:", err);
      html = contentJson || "";
    }

    return DOMPurify.sanitize(html, DOMPURIFY_CONFIG as any) as unknown as string;
  }, [analysis.type, contentJson]);

  // Apply syntax highlighting on fallback HTML code blocks
  useEffect(() => {
    if (analysis.type === "markdown") {
      hljs.highlightAll();
    }
  }, [parsedHTML, analysis.type]);

  if (analysis.type === "empty") {
    return (
      <div className="text-center py-10 text-base-content/40 font-semibold italic text-sm">
        No content available.
      </div>
    );
  }

  // Render official BlockNote editor for JSON data
  if (analysis.type === "blocknote" && analysis.parsedBlocks) {
    return (
      <BlockNoteJSONRenderer 
        key={JSON.stringify(analysis.parsedBlocks)}
        blocks={analysis.parsedBlocks} 
        theme={theme} 
      />
    );
  }

  // Render static HTML for Markdown and legacy formats
  return (
    <div>
      <div 
        className="prose prose-sm sm:prose-base prose-base-content max-w-none prose-img:rounded-3xl prose-img:border prose-img:border-base-200 prose-a:text-primary prose-a:font-bold prose-headings:font-serif prose-headings:font-black prose-headings:tracking-tight prose-headings:text-base-content prose-p:text-base-content/85 prose-p:leading-relaxed prose-li:text-base-content/80 prose-code:text-secondary select-text"
        dangerouslySetInnerHTML={{ __html: parsedHTML }} 
      />
    </div>
  );
}
