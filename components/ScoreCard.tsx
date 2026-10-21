"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { staffSupabase } from "@/lib/staffSupabase";
import { colors } from "@/lib/theme";
import { ROLE_LABEL } from "@/lib/roles";
import {
  CATEGORIES,
  MAX_PER_CATEGORY,
  MAX_TOTAL,
  parseScore,
  type Category,
  type Scores,
} from "@/lib/scoring";

type JudgeRole = "admin" | "eic" | "editor";

interface ScoreRow extends Scores {
  judge_id: string;
  judge_role: JudgeRole;
}

type Draft = Record<Category, string>;

const EMPTY_DRAFT: Draft = { theme: "", writing: "", voice: "", structure: "" };

// Built from the site's own colour tokens, so it follows light and dark mode.
// The yellow Next button is the one deliberate accent.
const P = {
  navy: colors.green900,
  blue: colors.green700,
  body: colors.surface,
  ink: colors.heading,
  muted: colors.gray500,
  line: colors.gray200,
  yellow: colors.yellow400,
  red: colors.red600,
  green: colors.badgeText,
  highlight: colors.badgeBg,
  accent: colors.green600,
};

const LAST = CATEGORIES.length - 1;

function toDraft(scores: Scores): Draft {
  return {
    theme: String(scores.theme),
    writing: String(scores.writing),
    voice: String(scores.voice),
    structure: String(scores.structure),
  };
}

function parseAll(draft: Draft): Scores | null {
  const out = {} as Scores;
  for (const { key } of CATEGORIES) {
    const n = parseScore(draft[key]);
    if (n === null) return null;
    out[key] = n;
  }
  return out;
}

interface ScoreCardProps {
  articleId: string;
  /** The signed-in judge's user id. */
  userId: string;
  role: JudgeRole;
  /** Called with true once this judge has saved scores for the writing. */
  onScoredChange?: (scored: boolean) => void;
}

/**
 * Scoring card shown beside the edit panel. One category at a time: type a
 * whole number from 0 to 20, press Next, and the scores save once all four
 * are filled. The EIC also sees the editor's scores; admin sees both.
 */
export function ScoreCard({ articleId, userId, role, onScoredChange }: ScoreCardProps) {
  const [rows, setRows] = useState<ScoreRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [saved, setSaved] = useState<Scores | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    let cancelled = false;
    staffSupabase
      .from("article_scores")
      .select("judge_id, judge_role, theme, writing, voice, structure")
      .eq("article_id", articleId)
      .then(({ data, error: loadErr }) => {
        if (cancelled) return;
        if (loadErr) {
          setLoadError(true);
        } else {
          const list = (data ?? []) as ScoreRow[];
          setRows(list);
          const mine = list.find((r) => r.judge_id === userId);
          if (mine) {
            const scores: Scores = { theme: mine.theme, writing: mine.writing, voice: mine.voice, structure: mine.structure };
            setSaved(scores);
            setDraft(toDraft(scores));
          }
        }
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [articleId, userId]);

  useEffect(() => {
    if (loaded) onScoredChange?.(saved !== null);
  }, [loaded, saved, onScoredChange]);

  // Keep the cursor in the score field as the judge moves between categories.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    inputRef.current?.focus();
  }, [index]);

  const category = CATEGORIES[index];
  const parsed = parseAll(draft);
  const total = CATEGORIES.reduce((sum, c) => sum + (parseScore(draft[c.key]) ?? 0), 0);
  const changed = CATEGORIES.some((c) => parseScore(draft[c.key]) !== (saved ? saved[c.key] : null));
  const isLast = index === LAST;

  const editorRow = rows.find((r) => r.judge_role === "editor");
  const eicRow = rows.find((r) => r.judge_role === "eic");
  const judgeColumns =
    role === "admin"
      ? [{ label: "Editor", row: editorRow }, { label: "EIC", row: eicRow }]
      : role === "eic"
        ? [{ label: "Editor", row: editorRow }]
        : [];

  const persist = useCallback(
    async (scores: Scores): Promise<void> => {
      setSaving(true);
      setError(null);
      const { error: rpcError } = await staffSupabase.rpc("save_article_score", {
        p_article_id: articleId,
        p_theme: scores.theme,
        p_writing: scores.writing,
        p_voice: scores.voice,
        p_structure: scores.structure,
      });
      setSaving(false);
      if (rpcError) {
        setError(rpcError.message?.includes("NOT_AUTHORIZED") ? "Your account can't score writings." : "Couldn't save. Try again.");
        return;
      }
      setSaved(scores);
    },
    [articleId]
  );

  function go(next: number) {
    setError(null);
    setIndex(Math.min(LAST, Math.max(0, next)));
  }

  async function handleNext() {
    if (saving || !loaded) return;
    setError(null);

    if (parseScore(draft[category.key]) === null) {
      setError(`Enter a whole number from 0 to ${MAX_PER_CATEGORY}.`);
      return;
    }

    if (!isLast) {
      // When re-adjusting a finished set, save as soon as it is complete again.
      if (parsed && changed) void persist(parsed);
      setIndex(index + 1);
      return;
    }

    if (!parsed) {
      const missing = CATEGORIES.findIndex((c) => parseScore(draft[c.key]) === null);
      setIndex(missing);
      setError(`Enter a score for ${CATEGORIES[missing].label}.`);
      return;
    }
    if (changed) await persist(parsed);
  }

  const lastStepDone = isLast && !changed && saved !== null;
  const buttonLabel = saving ? "Saving…" : isLast ? (lastStepDone ? "Saved ✓" : "Save scores") : "Next";

  let status: { text: string; color: string } | null = null;
  if (error) status = { text: error, color: P.red };
  else if (loadError) status = { text: "Couldn't load existing scores.", color: P.red };
  else if (saving) status = { text: "Saving…", color: P.muted };
  else if (saved && !changed) status = { text: "✓ Scores saved", color: P.green };
  else if (parsed) status = { text: isLast ? "Press Save scores to keep these." : "Unsaved changes. They save when you press Next.", color: P.muted };
  else status = { text: "Scores save once all four categories are filled.", color: P.muted };

  const circleButton = (disabled: boolean): React.CSSProperties => ({
    width: "1.9rem",
    height: "1.9rem",
    borderRadius: "999px",
    border: "1.5px solid rgba(255,255,255,0.75)",
    background: "transparent",
    color: colors.white,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: disabled ? 0.35 : 1,
    cursor: disabled ? "not-allowed" : "pointer",
    flexShrink: 0,
  });

  return (
    <section
      aria-label="Scoring"
      style={{
        width: "100%",
        borderRadius: "1rem",
        overflow: "hidden",
        border: `1px solid ${P.line}`,
        backgroundColor: P.body,
        boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
        color: P.ink,
      }}
    >
      {/* Header: category + back / forward */}
      <div style={{ backgroundColor: P.navy, color: colors.white, padding: "1rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.02rem", margin: 0, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          Scoring: {category.label}
        </h2>
        <div style={{ display: "flex", gap: "0.35rem" }}>
          <button type="button" aria-label="Previous category" onClick={() => go(index - 1)} disabled={index === 0} style={circleButton(index === 0)}>
            <ChevronLeft size={17} />
          </button>
          <button type="button" aria-label="Next category" onClick={() => go(index + 1)} disabled={isLast} style={circleButton(isLast)}>
            <ChevronRight size={17} />
          </button>
        </div>
      </div>

      {/* Strip */}
      <div style={{ backgroundColor: P.blue, color: colors.white, padding: "0.45rem 1.1rem", display: "flex", justifyContent: "space-between", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.03em", textTransform: "uppercase" }}>
        <span>Category {index + 1} of {CATEGORIES.length}</span>
        <span style={{ fontWeight: 600 }}>{ROLE_LABEL[role]}</span>
      </div>

      <div style={{ padding: "1.25rem 1.1rem 1.1rem" }}>
        {/* Total */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase" }}>Total score</div>
          <div aria-live="polite" style={{ fontFamily: "var(--font-display)", fontSize: "4.25rem", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.02em", margin: "0.15rem 0" }}>{total}</div>
          <div style={{ fontSize: "0.85rem", color: P.muted, textDecoration: "underline dotted", textUnderlineOffset: "4px", display: "inline-block" }}>
            / {MAX_TOTAL}
          </div>
        </div>

        {/* Other judges' scores (EIC and admin) */}
        {judgeColumns.length > 0 && (
          <div style={{ marginTop: "1.25rem", borderTop: `1px solid ${P.line}` }}>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.25rem", padding: "0.6rem 0 0.2rem" }}>
              {judgeColumns.map((col) => (
                <span key={col.label} style={{ width: "3.4rem", textAlign: "right", fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: P.muted }}>
                  {col.label}
                </span>
              ))}
            </div>
            {CATEGORIES.map((c, i) => (
              <button
                key={c.key}
                type="button"
                onClick={() => go(i)}
                aria-current={i === index ? "true" : undefined}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.55rem 0.5rem",
                  textAlign: "left",
                  background: i === index ? P.highlight : "transparent",
                  boxSizing: "border-box",
                  borderTop: "none",
                  borderRight: "none",
                  borderLeft: `3px solid ${i === index ? P.accent : "transparent"}`,
                  borderBottom: i === LAST ? "none" : `1px solid ${P.line}`,
                  color: P.ink,
                  cursor: "pointer",
                }}
              >
                <span>
                  <span style={{ display: "block", fontWeight: 700, fontSize: "1rem" }}>{c.label}</span>
                  <span style={{ display: "block", fontSize: "0.75rem", color: P.muted }}>0-{MAX_PER_CATEGORY}</span>
                </span>
                <span style={{ display: "flex", gap: "0.25rem" }}>
                  {judgeColumns.map((col) => (
                    <span key={col.label} style={{ width: "3.4rem", textAlign: "right", fontWeight: 800, fontSize: "1.5rem", color: col.row ? P.ink : P.muted }}>
                      {col.row ? col.row[c.key] : "—"}
                    </span>
                  ))}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Score field */}
        <div style={{ marginTop: "1.25rem" }}>
          <label htmlFor="score-card-input" style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.4rem" }}>
            <span>{category.label} score</span>
            <span style={{ color: P.muted, fontWeight: 500 }}>0-{MAX_PER_CATEGORY}</span>
          </label>
          <input
            id="score-card-input"
            ref={inputRef}
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX_PER_CATEGORY}
            step={1}
            disabled={!loaded || saving}
            value={draft[category.key]}
            onChange={(e) => {
              setError(null);
              setDraft((prev) => ({ ...prev, [category.key]: e.target.value }));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleNext();
              }
            }}
            style={{
              boxSizing: "border-box",
              width: "100%",
              padding: "0.6rem 0.75rem",
              borderRadius: "0.75rem",
              border: `2px solid ${error ? P.red : P.accent}`,
              backgroundColor: colors.surface,
              color: P.ink,
              fontSize: "1.5rem",
              fontWeight: 700,
              textAlign: "center",
              outline: "none",
            }}
          />
        </div>

        <button
          type="button"
          onClick={() => void handleNext()}
          disabled={!loaded || saving || lastStepDone}
          className="transition-all hover:brightness-95 active:scale-[0.98]"
          style={{
            boxSizing: "border-box",
            width: "100%",
            marginTop: "0.9rem",
            padding: "0.7rem 1rem",
            borderRadius: "999px",
            border: "none",
            backgroundColor: P.yellow,
            color: colors.black,
            boxShadow: "0 2px 0 rgba(0,0,0,0.18)",
            fontWeight: 800,
            fontSize: "0.95rem",
            opacity: !loaded || saving || lastStepDone ? 0.6 : 1,
            cursor: !loaded || saving || lastStepDone ? "not-allowed" : "pointer",
          }}
        >
          {buttonLabel}
        </button>

        {status && (
          <p role="status" style={{ marginTop: "0.7rem", textAlign: "center", fontSize: "0.78rem", color: status.color }}>
            {status.text}
          </p>
        )}
      </div>
    </section>
  );
}
