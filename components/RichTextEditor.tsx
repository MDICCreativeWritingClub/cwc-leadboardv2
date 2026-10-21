"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Bold, Italic, Underline } from "lucide-react";
import { colors } from "@/lib/theme";
import { markdownToHtml, htmlToMarkdown, sanitizePastedHtml } from "@/lib/richText";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  minHeight?: string;
}

/**
 * A WYSIWYG rich text editor (contentEditable-based) supporting bold,
 * italic, and underline — behaving like Word/Google Docs: formatting is
 * visible immediately as you type, toolbar buttons toggle ON/OFF based on
 * the current selection (via the browser's native bold/italic/underline
 * handling), and pasting from Word/Docs/PDF preserves bold/italic/
 * underline while stripping everything else (fonts, colors, images).
 *
 * The value stored/passed to onChange is still the same plain
 * markdown-ish string format (bold/italic/underline markers) the rest
 * of the app already understands — this component just changes how the
 * person edits it, not what gets saved.
 */
export function RichTextEditor({ value, onChange, onBlur, placeholder, minHeight = "220px" }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeMarks, setActiveMarks] = useState({ bold: false, italic: false, underline: false });
  const [isEmpty, setIsEmpty] = useState(!value);
  const lastEmittedValue = useRef(value);
  const initialized = useRef(false);

  // Set initial HTML content once (and if `value` changes from OUTSIDE
  // this editor, e.g. loading a different submission to edit) — never on
  // every keystroke, which would fight the browser's own cursor position.
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (!initialized.current || value !== lastEmittedValue.current) {
      el.innerHTML = markdownToHtml(value);
      lastEmittedValue.current = value;
      initialized.current = true;
      setIsEmpty(!value);
    }
  }, [value]);

  const emitChange = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const markdown = htmlToMarkdown(el);
    lastEmittedValue.current = markdown;
    setIsEmpty(el.textContent?.length === 0);
    onChange(markdown);
  }, [onChange]);

  const updateActiveMarks = useCallback(() => {
    if (typeof document === "undefined") return;
    try {
      setActiveMarks({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
      });
    } catch {
      // queryCommandState can throw if selection isn't inside the editor
    }
  }, []);

  function handleCommand(command: "bold" | "italic" | "underline") {
    editorRef.current?.focus();
    document.execCommand(command);
    updateActiveMarks();
    emitChange();
  }

  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const plain = e.clipboardData.getData("text/plain");

    if (html) {
      const clean = sanitizePastedHtml(html);
      document.execCommand("insertHTML", false, clean);
    } else {
      document.execCommand("insertText", false, plain);
    }
    emitChange();
  }

  useEffect(() => {
    document.addEventListener("selectionchange", updateActiveMarks);
    return () => document.removeEventListener("selectionchange", updateActiveMarks);
  }, [updateActiveMarks]);

  const buttonStyle = (active: boolean): React.CSSProperties => ({
    padding: "0.4rem 0.6rem",
    borderRadius: "0.5rem",
    border: `1px solid ${active ? colors.green900 : colors.gray200}`,
    backgroundColor: active ? colors.badgeBg : colors.surface,
    color: active ? colors.green900 : colors.gray700,
  });

  return (
    <div>
      <div className="flex gap-1.5 mb-2">
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => handleCommand("bold")} style={buttonStyle(activeMarks.bold)} className="hover:opacity-80 transition-opacity" title="Bold (Ctrl+B)">
          <Bold size={14} />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => handleCommand("italic")} style={buttonStyle(activeMarks.italic)} className="hover:opacity-80 transition-opacity" title="Italic (Ctrl+I)">
          <Italic size={14} />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => handleCommand("underline")} style={buttonStyle(activeMarks.underline)} className="hover:opacity-80 transition-opacity" title="Underline (Ctrl+U)">
          <Underline size={14} />
        </button>
      </div>

      <div className="relative">
        {isEmpty && placeholder && (
          <div
            className="absolute top-0 left-0 pointer-events-none select-none"
            style={{ color: colors.gray400, padding: "0.75rem 1rem", fontSize: "0.92rem", lineHeight: 1.7 }}
          >
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={emitChange}
          onPaste={handlePaste}
          onKeyUp={updateActiveMarks}
          onMouseUp={updateActiveMarks}
          onFocus={updateActiveMarks}
          onBlur={onBlur}
          style={{
            minHeight,
            padding: "0.75rem 1rem",
            borderRadius: "0.75rem",
            border: `1px solid ${colors.gray200}`,
            backgroundColor: colors.surface,
            color: colors.gray900,
            fontSize: "0.92rem",
            lineHeight: 1.7,
            outline: "none",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        />
      </div>
    </div>
  );
}
