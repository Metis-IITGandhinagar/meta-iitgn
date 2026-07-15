"use client";

import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/shadcn";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/shadcn/style.css";
import { useEffect, useRef } from "react";

interface BlockNoteEditorProps {
  initialContent?: string;
  onChange: (contentJson: string) => void;
  uploadFile: (file: File) => Promise<string>;
  theme: "light" | "dark";
}

export default function BlockNoteEditor({
  initialContent,
  onChange,
  uploadFile,
  theme,
}: BlockNoteEditorProps) {
  const editor = useCreateBlockNote({
    uploadFile,
  });

  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current || !editor) return;
    
    if (initialContent) {
      try {
        const blocks = JSON.parse(initialContent);
        editor.replaceBlocks(editor.document, blocks);
      } catch (e) {
        console.error("Failed to parse initial content blocks:", e);
        try {
          const blocks = editor.tryParseHTMLToBlocks(initialContent);
          editor.replaceBlocks(editor.document, blocks);
        } catch (htmlErr) {
          console.error("Failed to parse fallback HTML:", htmlErr);
        }
      }
    }
    isInitialized.current = true;
  }, [editor, initialContent]);

  return (
    <div className="w-full h-full min-h-[400px]">
      <BlockNoteView
        editor={editor}
        theme={theme}
        onChange={() => {
          const contentJson = JSON.stringify(editor.document);
          onChange(contentJson);
        }}
      />
    </div>
  );
}
