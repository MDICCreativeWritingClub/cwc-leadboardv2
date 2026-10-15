"use client";

import { colors } from "@/lib/theme";

import { useEffect, useReducer, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Undo2, Redo2, CheckCircle, Lock, StickyNote,
} from "lucide-react";
import { useSubmissions, type Submission } from "@/context/SubmissionsContext";
import { getReviewerSession } from "@/lib/reviewerAuth";
import { roleFromEmail, type StaffRole } from "@/lib/roles";
import { ScoreCard } from "@/components/ScoreCard";
import { RichTextEditor } from "@/components/RichTextEditor";

interface Draft {
  title: string;
  content: string;
  name: string;
  studentCode: string;
  grade: string;
  editorNotes: string;
}

/** What Accept does at each editable stage, and how the button should read. */
const editStageConfig: Partial<Record<Submission["status"], { next: Submission["status"]; label: string }>> = {
  pending:              { next: "waiting_confirmation", label: "Save & Send to Waiting for Confirmation" },
  waiting_confirmation: { next: "writing_confirmation", label: "Save & Send to Writing for Confirmation" },
  writing_confirmation: { next: "approved",             label: "Save & Publish" },
};

interface HistoryState {
  entries: Draft[];
  index: number;
}

type HistoryAction =
  | { type: "commit"; value: Draft }
  | { type: "undo" }
  | { type: "redo" };

function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case "commit": {
      const current = state.entries[state.index];
      if (
        current.title === action.value.title &&
        current.content === action.value.content &&
        current.name === action.value.name &&
        current.studentCode === action.value.studentCode &&
        current.grade === action.value.grade &&
        current.editorNotes === action.value.editorNotes
      ) {
        return state;
      }
      const truncated = state.entries.slice(0, state.index + 1);
      const entries = [...truncated, action.value];
      return { entries, index: entries.length - 1 };
    }
    case "undo":
      return { ...state, index: Math.max(0, state.index - 1) };
    case "redo":
      return { ...state, index: Math.min(state.entries.length - 1, state.index + 1) };
    default:
      return state;
  }
}

const COMMIT_DEBOUNCE_MS = 500;

export function ReviewEditPage({ id }: { id: string }) {
  const { submissions, updateSubmission, loading } = useSubmissions();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [staff, setStaff] = useState<{ userId: string; role: StaffRole | null } | null>(null);
  const [saving, setSaving] = useState<Submission["status"] | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const submission = submissions.find((s) => s.id === id);

  const [history, dispatch] = useReducer(historyReducer, {
    entries: [{ title: "", content: "", name: "", studentCode: "", grade: "", editorNotes: "" }],
    index: 0,
  });
  const initialized = useRef(false);

  useEffect(() => {
    getReviewerSession().then((session) => {
      setAuthorized(!!session);
      setStaff(session ? { userId: session.user.id, role: roleFromEmail(session.user.email) } : null);
    });
  }, []);

  useEffect(() => {
    if (submission && !initialized.current) {
      dispatch({
        type: "commit",
        value: {
          title: submission.title,
          content: submission.content,
          name: submission.name,
          studentCode: submission.studentCode,
          grade: submission.grade,
          editorNotes: submission.editorNotes ?? "",
        },
      });
      initialized.current = true;
    }
  }, [submission]);

  const draft = history.entries[history.index];
  const canUndo = history.index > 0;
  const canRedo = history.index < history.entries.length - 1;

  function scheduleCommit(next: Draft) {
    if (commitTimer.current) clearTimeout(commitTimer.current);
    commitTimer.current = setTimeout(() => {
      dispatch({ type: "commit", value: next });
    }, COMMIT_DEBOUNCE_MS);
  }

  const [liveDraft, setLiveDraft] = useState<Draft>(draft);
  useEffect(() => {
    setLiveDraft(draft);
  }, [draft]);

  function handleChange(field: keyof Draft, value: string) {
    const next = { ...liveDraft, [field]: value };
    setLiveDraft(next);
    scheduleCommit(next);
  }

  function flushPendingCommit() {
    if (commitTimer.current) {
      clearTimeout(commitTimer.current);
      commitTimer.current = null;
    }
    dispatch({ type: "commit", value: liveDraft });
  }

  function handleUndo() {
    flushPendingCommit();
    dispatch({ type: "undo" });
  }

  function handleRedo() {
    dispatch({ type: "redo" });
  }

  async function handleSave(status: Submission["status"]) {
    if (!submission) return;
    flushPendingCommit();

    if (!/^\d{1,9}$/.test(liveDraft.studentCode)) {
      setSaveError("Student code must contain only numbers (up to 9 digits).");
      return;
    }

    setSaving(status);
    setSaveError(null);
    try {
      await updateSubmission(
        submission.id,
        {
          title: liveDraft.title,
          content: liveDraft.content,
          name: liveDraft.name,
          studentCode: liveDraft.studentCode,
          grade: liveDraft.grade,
          editorNotes: liveDraft.editorNotes,
        },
        status
      );
      window.location.href = redirectTo;
    } catch {
      setSaveError("Failed to save changes. Please try again.");
      setSaving(null);
    }
  }

  if (authorized === null || loading) {
    return <div className="max-w-2xl mx-auto px-5 pt-32 text-center" style={{ color: colors.gray400 }}>Loading...</div>;
  }

  if (!authorized) {
    return (
      <div className="max-w-sm mx-auto px-5 pt-32 pb-20 text-center">
        <div className="rounded-2xl border p-8" style={{ borderColor: colors.gray200, backgroundColor: colors.surface }}>
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: colors.yellow100, border: `2px solid ${colors.amber200}` }}
          >
            <Lock size={24} style={{ color: colors.amber800 }} />
          </div>
          <h1 style={{ color: colors.heading, fontWeight: 700, fontSize: "1.25rem", marginBottom: "0.5rem" }}>
            Editor Access Required
          </h1>
          <p style={{ color: colors.gray500, fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            Please unlock the Review Panel with your editor code before editing submissions.
          </p>
          <Link
            href="/review"
            className="inline-block px-5 py-2 rounded-xl text-white text-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: colors.green900 }}
          >
            Go to Review Panel
          </Link>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="max-w-sm mx-auto px-5 pt-32 pb-20 text-center">
        <p style={{ color: colors.gray500, fontSize: "0.9rem", marginBottom: "1.25rem" }}>
          This submission could not be found. It may have already been actioned.
        </p>
        <Link
          href="/review"
          className="inline-block px-5 py-2 rounded-xl text-white text-sm hover:opacity-90 transition-opacity"
          style={{ backgroundColor: colors.green900 }}
        >
          Back to Review Panel
        </Link>
      </div>
    );
  }

  const metaInputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.5rem 0.75rem",
    borderRadius: "0.6rem",
    border: `1px solid ${colors.gray200}`,
    fontSize: "0.85rem",
    backgroundColor: colors.surface,
    color: colors.gray800,
    outline: "none",
  };

  // Writing-for-Confirmation edits are launched from the Control Panel, not the
  // Review Panel, so discarding or saving from there should return there too.
  const redirectTo = submission.status === "writing_confirmation" ? "/control" : "/review";
  const stage = editStageConfig[submission.status];

  const judgeRole = staff && (staff.role === "admin" || staff.role === "eic" || staff.role === "editor") ? staff.role : null;
  const showCard = judgeRole !== null && staff !== null;

  return (
    <div className={showCard ? "max-w-6xl mx-auto px-5 pt-24 pb-16 lg:flex lg:items-start lg:gap-6" : undefined}>
      {showCard && staff && judgeRole && (
        <div className="w-full max-w-sm mx-auto mb-6 lg:mb-0 lg:mx-0 lg:w-72 lg:shrink-0 lg:sticky lg:top-24">
          <ScoreCard articleId={submission.id} userId={staff.userId} role={judgeRole} />
        </div>
      )}
      <div className={showCard ? "flex-1 min-w-0 max-w-3xl" : "max-w-3xl mx-auto px-5 pt-24 pb-16"}>
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            href={redirectTo}
            className="flex items-center gap-1.5 text-sm hover:opacity-70 transition-opacity"
            style={{ color: colors.gray500 }}
          >
            <ArrowLeft size={16} /> Discard &amp; Go Back
          </Link>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={!canUndo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all disabled:opacity-40 active:scale-95"
              style={{ backgroundColor: colors.gray100, color: colors.gray700 }}
              title="Undo"
            >
              <Undo2 size={14} /> Undo
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={!canRedo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all disabled:opacity-40 active:scale-95"
              style={{ backgroundColor: colors.gray100, color: colors.gray700 }}
              title="Redo"
            >
              <Redo2 size={14} /> Redo
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-5">
          <div>
            <label style={{ color: colors.gray500, fontSize: "0.7rem", display: "block", marginBottom: "0.3rem" }}>
              Name
            </label>
            <input
              type="text"
              value={liveDraft.name}
              onChange={(e) => handleChange("name", e.target.value)}
              onBlur={flushPendingCommit}
              style={metaInputStyle}
            />
          </div>
          <div>
            <label style={{ color: colors.gray500, fontSize: "0.7rem", display: "block", marginBottom: "0.3rem" }}>
              Student Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={liveDraft.studentCode}
              onChange={(e) => handleChange("studentCode", e.target.value.replace(/\D/g, "").slice(0, 9))}
              onBlur={flushPendingCommit}
              style={metaInputStyle}
            />
          </div>
          <div>
            <label style={{ color: colors.gray500, fontSize: "0.7rem", display: "block", marginBottom: "0.3rem" }}>
              Grade
            </label>
            <input
              type="text"
              value={liveDraft.grade}
              onChange={(e) => handleChange("grade", e.target.value)}
              onBlur={flushPendingCommit}
              style={metaInputStyle}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-5">
          <span
            className="px-2.5 py-0.5 rounded-full text-xs"
            style={{ backgroundColor: colors.badgeBg, color: colors.badgeText, border: `1px solid ${colors.badgeBorder}` }}
          >
            {submission.category}
          </span>
          <span
            className="px-2.5 py-0.5 rounded-full text-xs"
            style={{ backgroundColor: colors.violet50, color: colors.violet700, border: `1px solid ${colors.violet200}` }}
          >
            Theme: {submission.theme}
          </span>
        </div>

        <div className="flex flex-col gap-4 mb-8">
          <div>
            <label style={{ color: colors.gray500, fontSize: "0.75rem", display: "block", marginBottom: "0.35rem" }}>
              Title
            </label>
            <input
              type="text"
              value={liveDraft.title}
              onChange={(e) => handleChange("title", e.target.value)}
              onBlur={flushPendingCommit}
              style={{
                width: "100%",
                padding: "0.65rem 1rem",
                borderRadius: "0.75rem",
                border: `1px solid ${colors.green200}`,
                fontSize: "1rem",
                fontWeight: 600,
                backgroundColor: colors.surface,
                color: colors.heading,
                outline: "none",
              }}
            />
          </div>
          <div>
            <label style={{ color: colors.gray500, fontSize: "0.75rem", display: "block", marginBottom: "0.35rem" }}>
              Content
            </label>
            <RichTextEditor
              value={liveDraft.content}
              onChange={(value) => handleChange("content", value)}
              onBlur={flushPendingCommit}
              minHeight="360px"
            />
          </div>
        </div>

        <div className="mb-8">
          <label className="flex items-center gap-1.5" style={{ color: colors.violet700, fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.35rem" }}>
            <StickyNote size={14} /> Editor Notes
          </label>
          <p style={{ color: colors.gray400, fontSize: "0.75rem", marginBottom: "0.5rem" }}>
            Note what you changed, and leave instructions for whoever reviews this at the next stage. Visible on the
            submission's card there.
          </p>
          <textarea
            value={liveDraft.editorNotes}
            onChange={(e) => handleChange("editorNotes", e.target.value)}
            onBlur={flushPendingCommit}
            rows={3}
            placeholder="e.g. Fixed a few typos in paragraph 2 — please double-check the ending still reads well."
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              borderRadius: "0.75rem",
              border: `1px solid ${colors.violet200}`,
              backgroundColor: colors.violet50,
              fontSize: "0.85rem",
              lineHeight: "1.6",
              color: colors.gray700,
              outline: "none",
              resize: "vertical",
            }}
          />
        </div>

        {saveError && (
          <div className="rounded-xl px-4 py-3 mb-4 text-sm" style={{ backgroundColor: colors.red100, color: colors.red700 }}>
            {saveError}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {stage ? (
            <button
              type="button"
              onClick={() => handleSave(stage.next)}
              disabled={saving !== null}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm text-white transition-all hover:opacity-90 disabled:opacity-60 active:scale-95"
              style={{ backgroundColor: colors.green900 }}
            >
              <CheckCircle size={16} /> {saving === stage.next ? "Saving..." : stage.label}
            </button>
          ) : (
            <p style={{ color: colors.gray400, fontSize: "0.85rem" }}>
              This submission isn&apos;t at an editable stage right now.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
