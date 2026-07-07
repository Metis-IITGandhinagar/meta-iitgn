"use client";

import { useState, useEffect, useRef } from "react";

interface EditableCellProps {
  initialValue: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  as?: "input" | "textarea";
}

export function EditableCell({ initialValue, onChange, placeholder, className, as = "input" }: EditableCellProps) {
  const [val, setVal] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setVal(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (as === "textarea" && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [val, as]);

  if (as === "textarea") {
    return (
      <textarea
        ref={textareaRef}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => {
          if (val !== initialValue) {
            onChange(val);
          }
        }}
        placeholder={placeholder}
        className={className}
        rows={1}
        style={{ overflow: "hidden", resize: "none" }}
      />
    );
  }

  return (
    <input
      type="text"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => {
        if (val !== initialValue) {
          onChange(val);
        }
      }}
      placeholder={placeholder}
      className={className}
    />
  );
}
