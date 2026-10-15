import type { ReactNode } from "react";

export type FormatMark = "bold" | "italic" | "underline";

/**
 * Parses **bold**, *italic*, and __underline__ markers in a plain
 * string into React nodes. Order matters: bold (double asterisk) is
 * matched before italic (single asterisk) so **text** isn't
 * misread as two italic markers.
 */
export function renderFormattedText(text: string): ReactNode[] {
  const pattern = /(\*\*(.+?)\*\*)|(__(.+?)__)|(\*(.+?)\*)/g;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    // Recurse into the matched content so a bold span can itself
    // contain italic/underline (or any combination) and have both
    // styles apply, instead of only the outermost marker winning.
    if (match[1]) {
      nodes.push(<strong key={key++}>{renderFormattedText(match[2])}</strong>);
    } else if (match[3]) {
      nodes.push(<u key={key++}>{renderFormattedText(match[4])}</u>);
    } else if (match[5]) {
      nodes.push(<em key={key++}>{renderFormattedText(match[6])}</em>);
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

/**
 * Strips **bold**, *italic*, and __underline__ markers, leaving
 * plain text. Used for contexts that show raw text only (card
 * excerpts, previews, word/character counts) rather than rendering
 * formatting.
 */
export function stripFormatMarks(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/__(.+?)__/g, "$1").replace(/\*(.+?)\*/g, "$1");
}

// ============================================================
// Rich text editor support (contentEditable-based, WYSIWYG)
// ============================================================
//
// The editor itself is a contentEditable <div>. Internally the browser
// represents bold/italic/underline as real DOM elements (<b>, <i>, <u>,
// or inline styles) so formatting is visible immediately as you type —
// same as Word/Google Docs — instead of showing raw **asterisks**.
//
// The stored/submitted value is still the same plain markdown-ish string
// (**bold**, *italic*, __underline__) the rest of the app already
// understands (renderFormattedText, stripFormatMarks, article storage).
// These two functions convert between the two representations.

const BLOCK_TAGS = new Set(["DIV", "P"]);

/** Converts a stored markdown-ish string into HTML for the editor's initial content. */
export function markdownToHtml(text: string): string {
  if (!text) return "";
  const escapeHtml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return text
    .split("\n")
    .map((line) => {
      if (line === "") return "<div><br></div>";
      const escaped = escapeHtml(line);
      const withMarks = escaped
        .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
        .replace(/__(.+?)__/g, "<u>$1</u>")
        .replace(/\*(.+?)\*/g, "<i>$1</i>");
      return `<div>${withMarks}</div>`;
    })
    .join("");
}

function hasStyle(el: HTMLElement, prop: "fontWeight" | "fontStyle" | "textDecorationLine" | "textDecoration", test: (v: string) => boolean): boolean {
  const inline = el.style[prop as any] as string | undefined;
  if (inline && test(inline)) return true;
  return false;
}

function isBoldEl(el: HTMLElement): boolean {
  if (el.tagName === "B" || el.tagName === "STRONG") return true;
  if (hasStyle(el, "fontWeight", (v) => v === "bold" || v === "700" || parseInt(v, 10) >= 600)) return true;
  return false;
}

function isItalicEl(el: HTMLElement): boolean {
  if (el.tagName === "I" || el.tagName === "EM") return true;
  if (hasStyle(el, "fontStyle", (v) => v === "italic" || v === "oblique")) return true;
  return false;
}

function isUnderlineEl(el: HTMLElement): boolean {
  if (el.tagName === "U") return true;
  if (hasStyle(el, "textDecorationLine", (v) => v.includes("underline"))) return true;
  if (hasStyle(el, "textDecoration", (v) => v.includes("underline"))) return true;
  return false;
}

/**
 * Walks the editor's live DOM (or a pasted HTML fragment) and serializes
 * it into the plain markdown-ish string format the rest of the app
 * stores/expects. Handles nested combinations (bold+italic, etc.) and
 * both semantic tags (<b>/<i>/<u>) and inline-style formatting (what
 * Google Docs/Word/PDF pastes typically use instead of semantic tags).
 */
export function htmlToMarkdown(root: Node): string {
  function serializeInline(node: Node, bold: boolean, italic: boolean, underline: boolean): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent ?? "";
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return "";

    const el = node as HTMLElement;
    if (el.tagName === "BR") return "\n";

    const nextBold = bold || isBoldEl(el);
    const nextItalic = italic || isItalicEl(el);
    const nextUnderline = underline || isUnderlineEl(el);

    let inner = Array.from(el.childNodes)
      .map((child) => serializeInline(child, nextBold, nextItalic, nextUnderline))
      .join("");

    // Only wrap at the point a mark actually turns on, so we don't emit
    // nested/duplicate markers for text that's e.g. bold inside a bold parent.
    if (isUnderlineEl(el) && !underline && inner.trim()) inner = `__${inner}__`;
    if (isItalicEl(el) && !italic && inner.trim()) inner = `*${inner}*`;
    if (isBoldEl(el) && !bold && inner.trim()) inner = `**${inner}**`;

    return inner;
  }

  function serializeBlock(node: Node): string[] {
    if (node.nodeType === Node.TEXT_NODE) {
      return [node.textContent ?? ""];
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return [];

    const el = node as HTMLElement;

    if (el.tagName === "BR") return ["", ""]; // line break within flow -> split

    if (BLOCK_TAGS.has(el.tagName)) {
      // A block element's own content is one line (contentEditable puts
      // each visual line in its own <div> on Enter in most browsers). A
      // lone <br> inside (the "<div><br></div>" idiom browsers use for a
      // blank line) would otherwise get double-counted as a newline here
      // AND as a blank entry in `lines` below — strip it so one Enter
      // press means one line break, matching the original plain-textarea
      // behavior this replaces.
      const line = serializeInline(el, false, false, false).replace(/\n/g, "");
      return [line];
    }

    // Inline element at the top level (e.g. pasted <b>text</b> with no
    // wrapping block) — treat as part of the current line.
    return [serializeInline(el, false, false, false)];
  }

  const lines: string[] = [];
  let current = "";
  for (const child of Array.from(root.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE && BLOCK_TAGS.has((child as HTMLElement).tagName)) {
      if (current) {
        lines.push(current);
        current = "";
      }
      lines.push(...serializeBlock(child));
    } else {
      const [piece] = serializeBlock(child);
      current += piece ?? "";
    }
  }
  if (current) lines.push(current);

  return lines.join("\n");
}

const ALLOWED_STYLE_TEST: Array<{ tag: string; test: (el: HTMLElement) => boolean }> = [
  { tag: "b", test: isBoldEl },
  { tag: "i", test: isItalicEl },
  { tag: "u", test: isUnderlineEl },
];

/**
 * Cleans HTML from the clipboard (Word, Google Docs, PDF viewers, etc.)
 * down to ONLY bold/italic/underline formatting plus line breaks —
 * stripping fonts, colors, tables, images, comments, and everything else
 * those sources tend to bring along. Both semantic tags and inline-style
 * formatting (Google Docs' usual output) are recognized. Returns HTML
 * safe to insert directly into the editor.
 */
export function sanitizePastedHtml(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  function clean(node: Node): Node[] {
    if (node.nodeType === Node.TEXT_NODE) {
      return [document.createTextNode(node.textContent ?? "")];
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return [];

    const el = node as HTMLElement;

    if (el.tagName === "SCRIPT" || el.tagName === "STYLE") return [];

    if (el.tagName === "BR") return [document.createElement("br")];

    const isBlock = el.tagName === "P" || el.tagName === "DIV" || /^H[1-6]$/.test(el.tagName) || el.tagName === "LI";

    const childResults = Array.from(el.childNodes).flatMap(clean);

    // Wrap children in the innermost-matching allowed mark, based on
    // this element's own formatting (tag or inline style).
    let wrapped: Node[] = childResults;
    for (const { tag, test } of ALLOWED_STYLE_TEST) {
      if (test(el)) {
        const wrapper = document.createElement(tag);
        wrapped.forEach((n) => wrapper.appendChild(n));
        wrapped = [wrapper];
      }
    }

    if (isBlock) {
      const div = document.createElement("div");
      wrapped.forEach((n) => div.appendChild(n));
      return [div];
    }

    return wrapped;
  }

  const container = document.createElement("div");
  Array.from(doc.body.childNodes).flatMap(clean).forEach((n) => container.appendChild(n));

  // Collapse to at least one empty line if paste resulted in nothing usable
  if (!container.childNodes.length) {
    container.appendChild(document.createTextNode(doc.body.textContent ?? ""));
  }

  return container.innerHTML;
}
