"use client";

import { colors } from "@/lib/theme";
import { useState } from "react";
import Link from "next/link";
import { CheckCircle, XCircle, Eye, EyeOff, PenSquare, StickyNote, FileCheck } from "lucide-react";
import type { Submission } from "@/context/SubmissionsContext";

function ConfirmationCard({
  sub,
  updateStatus,
}: {
  sub: Submission;
  updateStatus: (id: string, status: Submission["status"]) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(sub.submittedAt).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: colors.gray200, backgroundColor: colors.surface }}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 style={{ color: colors.heading, fontWeight: 600, fontSize: "1rem", marginBottom: "0.25rem" }}>
              {sub.title}
            </h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span style={{ color: colors.gray700, fontSize: "0.8rem", fontWeight: 500 }}>{sub.name}</span>
              <span style={{ color: colors.gray400, fontSize: "0.75rem" }}>·</span>
              <span style={{ color: colors.gray500, fontSize: "0.75rem" }}>{sub.studentCode}</span>
              <span style={{ color: colors.gray400, fontSize: "0.75rem" }}>·</span>
              <span style={{ color: colors.gray500, fontSize: "0.75rem" }}>{sub.grade}</span>
            </div>
          </div>
          <span
            className="inline-block px-2.5 py-0.5 rounded-full text-xs shrink-0"
            style={{ backgroundColor: colors.violet50, color: colors.violet700, border: `1px solid ${colors.violet200}` }}
          >
            Writing for Confirmation
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <span
            className="px-2.5 py-0.5 rounded-full text-xs"
            style={{ backgroundColor: colors.badgeBg, color: colors.badgeText, border: `1px solid ${colors.badgeBorder}` }}
          >
            {sub.category}
          </span>
          <span
            className="px-2.5 py-0.5 rounded-full text-xs"
            style={{ backgroundColor: colors.violet50, color: colors.violet700, border: `1px solid ${colors.violet200}` }}
          >
            Theme: {sub.theme}
          </span>
        </div>

        <div
          className="rounded-xl p-4 mb-3 cursor-pointer"
          style={{ backgroundColor: colors.gray50, border: `1px solid ${colors.gray100}` }}
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center justify-between mb-2">
            <span style={{ color: colors.gray500, fontSize: "0.75rem" }}>Content preview</span>
            <div className="flex items-center gap-1" style={{ color: colors.gray400, fontSize: "0.75rem" }}>
              {expanded ? <EyeOff size={12} /> : <Eye size={12} />}
              {expanded ? "Collapse" : "Expand"}
            </div>
          </div>
          <p
            style={{
              color: colors.gray700,
              fontSize: "0.85rem",
              lineHeight: "1.7",
              display: "-webkit-box",
              WebkitLineClamp: expanded ? undefined : 3,
              WebkitBoxOrient: "vertical" as React.CSSProperties["WebkitBoxOrient"],
              overflow: expanded ? "visible" : "hidden",
              whiteSpace: "pre-wrap",
            }}
          >
            {sub.content}
          </p>
        </div>

        {sub.editorNotes && (
          <div
            className="rounded-xl p-3.5 mb-3 flex gap-2.5"
            style={{ backgroundColor: colors.violet50, border: `1px solid ${colors.violet200}` }}
          >
            <StickyNote size={15} style={{ color: colors.violet700, flexShrink: 0, marginTop: "0.1rem" }} />
            <div className="min-w-0">
              <p style={{ color: colors.violet700, fontSize: "0.7rem", fontWeight: 600, marginBottom: "0.15rem" }}>
                Editor notes
              </p>
              <p style={{ color: colors.gray700, fontSize: "0.82rem", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                {sub.editorNotes}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span style={{ color: colors.gray400, fontSize: "0.7rem" }}>Submitted {date}</span>
          <div className="flex gap-2">
            <button
              onClick={() => updateStatus(sub.id, "rejected")}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: colors.red100, color: colors.red800, border: `1px solid ${colors.red300}` }}
            >
              <XCircle size={14} /> Reject
            </button>
            <button
              onClick={() => updateStatus(sub.id, "approved")}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: colors.badgeBgStrong, color: colors.badgeText, border: `1px solid ${colors.badgeBorder}` }}
              title="Publish — this makes the writing go live"
            >
              <CheckCircle size={14} /> Accept &amp; Publish
            </button>
            <Link
              href={`/review/${sub.id}`}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: colors.green900, color: colors.white }}
            >
              <PenSquare size={14} /> Edit
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ConfirmationTab({
  submissions,
  updateStatus,
}: {
  submissions: Submission[];
  updateStatus: (id: string, status: Submission["status"]) => void;
}) {
  const items = submissions.filter((s) => s.status === "writing_confirmation");

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-1.5">
        <FileCheck size={18} style={{ color: colors.violet700 }} />
        <h2 style={{ color: colors.heading, fontWeight: 700, fontSize: "1.2rem" }}>Writing for Confirmation</h2>
      </div>
      <p style={{ color: colors.gray500, fontSize: "0.85rem", marginBottom: "1.5rem" }}>
        The final check before a writing goes live. These pieces have already passed Unverified, Pending, and
        Waiting for Confirmation in the Review Panel.
      </p>

      {items.length === 0 ? (
        <div className="text-center py-16" style={{ color: colors.gray400 }}>
          Nothing waiting on a final decision right now.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((sub) => (
            <ConfirmationCard key={sub.id} sub={sub} updateStatus={updateStatus} />
          ))}
        </div>
      )}
    </div>
  );
}
