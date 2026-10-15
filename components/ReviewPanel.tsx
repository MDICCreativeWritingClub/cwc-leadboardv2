"use client";

import { colors } from "@/lib/theme";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CheckCircle, XCircle, Clock, Lock, Eye, EyeOff,
  ClipboardList, Settings, PenSquare, LogOut,
  MessageCircle, FileText, CornerDownRight, Ban,
  Inbox, Hourglass, StickyNote, Palette, Star,
} from "lucide-react";
import { useSubmissions, type Submission } from "@/context/SubmissionsContext";
import { useComments, type Comment } from "@/context/CommentsContext";
import { usePublishedArticles } from "@/hooks/usePublishedArticles";
import { useSiteConfig, type SiteConfig } from "@/context/SiteConfigContext";
import { getReviewerSession, getReviewerRole, signInReviewer, signOutReviewer } from "@/lib/reviewerAuth";
import { REVIEW_ACCESS, type StaffRole, type WritingTab, type ReviewSection, ROLE_LABEL, canFlagVoters } from "@/lib/roles";
import { useAuth } from "@/context/AuthContext";
import { staffSupabase } from "@/lib/staffSupabase";
import { ThemeTab } from "@/components/control-panel/ThemeTab";
import { ChoiceTab } from "@/components/control-panel/ChoiceTab";
import { StandingsTab } from "@/components/control-panel/StandingsTab";
import { VotesTab } from "@/components/control-panel/VotesTab";
import { SaveBanner } from "@/components/control-panel/shared";

type FilterTab = WritingTab;
type ContentType = ReviewSection;

/** The status a writing moves into when Advance is pressed at each stage. */
const nextStatus: Partial<Record<Submission["status"], Submission["status"]>> = {
  unverified: "pending",
  pending: "waiting_confirmation",
  waiting_confirmation: "writing_confirmation",
};

function StatusBadge({ status }: { status: Submission["status"] }) {
  const map = {
    unverified:           { label: "Unverified",             bg: colors.gray100, color: colors.gray700, border: colors.gray300 },
    pending:              { label: "Pending",                bg: colors.yellow100, color: colors.amber800, border: colors.amber200 },
    waiting_confirmation: { label: "Waiting for Confirmation", bg: colors.violet50, color: colors.violet700, border: colors.violet200 },
    writing_confirmation: { label: "Writing for Confirmation", bg: colors.violet50, color: colors.violet700, border: colors.violet200 },
    approved:             { label: "Approved",                bg: colors.badgeBgStrong, color: colors.badgeText, border: colors.badgeBorder },
    rejected:             { label: "Rejected",                bg: colors.red100, color: colors.red800, border: colors.red300 },
  };
  const s = map[status];
  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded-full text-xs"
      style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {s.label}
    </span>
  );
}

function SubmissionCard({
  sub,
  phone,
  updateStatus,
  controllableStatuses,
}: {
  sub: Submission;
  phone?: string;
  updateStatus: (id: string, status: Submission["status"]) => void;
  controllableStatuses: WritingTab[];
}) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(sub.submittedAt).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
  const hasControl = controllableStatuses.includes(sub.status as WritingTab);
  const canEdit = hasControl && (sub.status === "pending" || sub.status === "waiting_confirmation");
  const canAct = hasControl && (sub.status === "unverified" || canEdit);
  // Only unverified/pending/waiting_confirmation ever have actions for anyone — approved/rejected
  // are terminal for everyone, so only show "View only" where a role's lack of control is the reason.
  const wouldBeActionable = sub.status === "unverified" || sub.status === "pending" || sub.status === "waiting_confirmation";

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        borderColor:
          sub.status === "approved" ? colors.green200 : sub.status === "rejected" ? colors.red300 : colors.gray200,
        backgroundColor: colors.surface,
      }}
    >
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
              {phone && (
                <>
                  <span style={{ color: colors.gray400, fontSize: "0.75rem" }}>·</span>
                  <a href={`tel:${phone}`} style={{ color: colors.gray500, fontSize: "0.75rem" }}>{phone}</a>
                </>
              )}
            </div>
          </div>
          <StatusBadge status={sub.status} />
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

          {canAct && (
            <div className="flex gap-2">
              <button
                onClick={() => updateStatus(sub.id, "rejected")}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: colors.red100, color: colors.red800, border: `1px solid ${colors.red300}` }}
              >
                <XCircle size={14} /> Reject
              </button>
              <button
                onClick={() => updateStatus(sub.id, nextStatus[sub.status] ?? "approved")}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: colors.badgeBgStrong, color: colors.badgeText, border: `1px solid ${colors.badgeBorder}` }}
                title="Moves this on to the next stage — not a final publish"
              >
                <CheckCircle size={14} /> Advance
              </button>
              {canEdit && (
                <Link
                  href={`/review/${sub.id}`}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm transition-all hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: colors.green900, color: colors.white }}
                >
                  <PenSquare size={14} /> Edit
                </Link>
              )}
            </div>
          )}
          {!canAct && wouldBeActionable && (
            <span
              className="px-2.5 py-1 rounded-full text-xs"
              style={{ backgroundColor: colors.gray100, color: colors.gray400 }}
            >
              View only
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function CommentCard({
  comment,
  parent,
  articleTitle,
  updateStatus,
}: {
  comment: Comment;
  parent: Comment | undefined;
  articleTitle: string;
  updateStatus: (id: string, status: "approved" | "rejected") => void;
}) {
  const date = new Date(comment.submittedAt).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        borderColor:
          comment.status === "approved" ? colors.green200 : comment.status === "rejected" ? colors.red300 : colors.gray200,
        backgroundColor: colors.surface,
      }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span style={{ color: colors.heading, fontWeight: 600, fontSize: "0.95rem" }}>{comment.authorName}</span>
              <span style={{ color: colors.gray400, fontSize: "0.75rem" }}>·</span>
              <span style={{ color: colors.gray500, fontSize: "0.78rem" }}>on {articleTitle}</span>
            </div>
            {parent && (
              <div className="flex items-center gap-1.5 mt-1" style={{ color: colors.violet700, fontSize: "0.75rem" }}>
                <CornerDownRight size={12} />
                <span className="truncate" style={{ maxWidth: "28rem" }}>
                  Replying to {parent.authorName}: &ldquo;{parent.content.slice(0, 60)}{parent.content.length > 60 ? "…" : ""}&rdquo;
                </span>
              </div>
            )}
          </div>
          <StatusBadge status={comment.status} />
        </div>

        <div
          className="rounded-xl p-4 mb-3"
          style={{ backgroundColor: colors.gray50, border: `1px solid ${colors.gray100}` }}
        >
          <p style={{ color: colors.gray700, fontSize: "0.85rem", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>
            {comment.content}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <span style={{ color: colors.gray400, fontSize: "0.7rem" }}>Submitted {date}</span>

          {comment.status === "pending" && (
            <div className="flex gap-2">
              <button
                onClick={() => updateStatus(comment.id, "rejected")}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: colors.red100, color: colors.red800, border: `1px solid ${colors.red300}` }}
              >
                <XCircle size={14} /> Reject
              </button>
              <button
                onClick={() => updateStatus(comment.id, "approved")}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: colors.badgeBgStrong, color: colors.badgeText, border: `1px solid ${colors.badgeBorder}` }}
              >
                <CheckCircle size={14} /> Approve
              </button>
            </div>
          )}

          {comment.status === "approved" && (
            <button
              onClick={() => updateStatus(comment.id, "rejected")}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: colors.red100, color: colors.red800, border: `1px solid ${colors.red300}` }}
              title="Hide this comment from the public page"
            >
              <Ban size={14} /> Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ReviewPanel() {
  const { loading: authLoading } = useAuth();
  const { submissions, updateStatus } = useSubmissions();
  const { comments, updateStatus: updateCommentStatus } = useComments();
  const { allPublished } = usePublishedArticles();
  const { config, updateConfig, loading: configLoading } = useSiteConfig();
  const [checkingSession, setCheckingSession] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [role, setRole] = useState<StaffRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [tab, setTab] = useState<FilterTab>("unverified");
  const [contentType, setContentType] = useState<ContentType>("writings");
  const [showPassword, setShowPassword] = useState(false);
  const [draft, setDraft] = useState<SiteConfig>({ ...config });
  const [saved, setSaved] = useState(false);
  const [phones, setPhones] = useState<Record<string, string>>({});

  // Phone numbers are not readable through normal table access; staff fetch
  // them through a role-checked RPC once signed in.
  useEffect(() => {
    if (!unlocked) return;
    staffSupabase.rpc("get_submission_phones").then(({ data }) => {
      const map: Record<string, string> = {};
      for (const row of (data ?? []) as { id: string; phone: string }[]) map[row.id] = row.phone;
      setPhones(map);
    });
  }, [unlocked, submissions.length]);

  // Re-sync draft when config loads from Supabase (async)
  const configLoaded = useRef(false);
  useEffect(() => {
    if (!configLoading && !configLoaded.current) {
      configLoaded.current = true;
      setDraft({ ...config });
    }
  }, [configLoading, config]);

  function handleSave() {
    updateConfig(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  useEffect(() => {
    getReviewerSession().then((session) => {
      setUnlocked(!!session);
      setCheckingSession(false);
    });
    getReviewerRole().then((r) => {
      setRole(r);
      setRoleLoading(false);
      if (r) {
        const access = REVIEW_ACCESS[r];
        setContentType((prev) => (access.sections.includes(prev) ? prev : access.sections[0]));
        setTab((prev) => (access.writingTabs.includes(prev) ? prev : access.writingTabs[0]));
      }
    });
  }, []);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setSigningIn(true);
    setError(null);
    const { error: signInError } = await signInReviewer(username, password);
    if (signInError) {
      setError(signInError);
      setSigningIn(false);
      return;
    }
    // A full reload (not just local state) re-initializes AuthContext and
    // every other provider from scratch, so the whole site -- not just
    // this panel -- picks up the new staff identity consistently.
    window.location.reload();
  }

  async function handleLogout() {
    await signOutReviewer();
    window.location.reload();
  }

  if (authLoading || checkingSession || (unlocked && roleLoading)) {
    return (
      <div className="max-w-sm mx-auto px-5 pt-32 text-center" style={{ color: colors.gray400 }}>
        Loading...
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="max-w-sm mx-auto px-5 pt-32 pb-20">
        <div
          className="rounded-2xl border p-8 text-center"
          style={{ borderColor: colors.gray200, backgroundColor: colors.surface }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: colors.badgeBg, border: `2px solid ${colors.badgeBorder}` }}
          >
            <Lock size={24} style={{ color: colors.green600 }} />
          </div>
          <h1 style={{ color: colors.heading, fontWeight: 700, fontSize: "1.4rem", marginBottom: "0.4rem" }}>
            Review Panel
          </h1>
          <p style={{ color: colors.gray500, fontSize: "0.85rem", marginBottom: "1.75rem", lineHeight: "1.6" }}>
            This area is for editors and faculty only. Log in with your reviewer account to continue.
          </p>
          <form onSubmit={handleUnlock} className="flex flex-col gap-3">
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(null); }}
              placeholder="Username"
              autoComplete="username"
              style={{
                width: "100%",
                padding: "0.65rem 1rem",
                borderRadius: "0.75rem",
                border: `1px solid ${error ? colors.red300 : colors.green200}`,
                fontSize: "0.875rem",
                outline: "none",
                color: colors.gray900,
              }}
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                placeholder="Password"
                autoComplete="current-password"
                style={{
                  width: "100%",
                  padding: "0.65rem 2.5rem 0.65rem 1rem",
                  borderRadius: "0.75rem",
                  border: `1px solid ${error ? colors.red300 : colors.green200}`,
                  fontSize: "0.875rem",
                  outline: "none",
                  color: colors.gray900,
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", color: colors.gray400 }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {error && (
              <p style={{ color: colors.red600, fontSize: "0.8rem" }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={signingIn}
              className="w-full py-2.5 rounded-xl text-white hover:opacity-90 transition-opacity disabled:opacity-60"
              style={{ backgroundColor: colors.green900, fontWeight: 500 }}
            >
              {signingIn ? "Logging in..." : "Log In"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const counts = {
    unverified:           submissions.filter((s) => s.status === "unverified").length,
    pending:              submissions.filter((s) => s.status === "pending").length,
    waiting_confirmation: submissions.filter((s) => s.status === "waiting_confirmation").length,
    approved:             submissions.filter((s) => s.status === "approved").length,
    rejected:             submissions.filter((s) => s.status === "rejected").length,
  };

  const commentCounts = {
    unverified:           0,
    pending:              comments.filter((c) => c.status === "pending").length,
    waiting_confirmation: 0,
    approved:             comments.filter((c) => c.status === "approved").length,
    rejected:             comments.filter((c) => c.status === "rejected").length,
  };

  const filteredSubmissions = submissions.filter((s) => s.status === tab);
  const filteredComments = comments.filter((c) => c.status === tab);

  const titleByArticleId = new Map(allPublished.map((a) => [a.id, a.title]));
  const commentById = new Map(comments.map((c) => [c.id, c]));

  const submissionTabConfig: { key: FilterTab; label: string; icon: React.ReactNode }[] = [
    { key: "unverified",           label: "Unverified",              icon: <Inbox size={14} /> },
    { key: "pending",              label: "Pending",                 icon: <Clock size={14} /> },
    { key: "waiting_confirmation", label: "Waiting for Confirmation", icon: <Hourglass size={14} /> },
    { key: "approved",             label: "Approved",                icon: <CheckCircle size={14} /> },
    { key: "rejected",             label: "Rejected",                icon: <XCircle size={14} /> },
  ];

  const commentTabConfig: { key: FilterTab; label: string; icon: React.ReactNode }[] = [
    { key: "pending",  label: "Pending",  icon: <Clock size={14} /> },
    { key: "approved", label: "Approved", icon: <CheckCircle size={14} /> },
    { key: "rejected", label: "Rejected", icon: <XCircle size={14} /> },
  ];

  const access = role ? REVIEW_ACCESS[role] : null;

  const tabConfig = (contentType === "writings" ? submissionTabConfig : commentTabConfig).filter(
    (t) => contentType !== "writings" || !access || access.writingTabs.includes(t.key)
  );
  const activeCounts = contentType === "writings" ? counts : commentCounts;

  const allTypeConfig: { key: ContentType; label: string; icon: React.ReactNode; count: number | null }[] = [
    { key: "writings", label: "Writings",       icon: <FileText size={14} />,      count: submissions.length },
    { key: "comments", label: "Comments",       icon: <MessageCircle size={14} />, count: comments.length },
    { key: "theme",    label: "Theme",          icon: <Palette size={14} />,       count: null },
    { key: "choice",   label: "Editor's Choice", icon: <Star size={14} />,         count: null },
    { key: "standings", label: "Standings",     icon: <ClipboardList size={14} />, count: null },
    { key: "votes",    label: "Votes",          icon: <Ban size={14} />,           count: null },
  ];
  const typeConfig = allTypeConfig.filter((t) => !access || access.sections.includes(t.key));

  const isModerationView = contentType === "writings" || contentType === "comments";

  return (
    <div className="max-w-6xl mx-auto px-5 pt-24 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <ClipboardList size={26} style={{ color: colors.green600 }} className="shrink-0" />
            <h1 style={{ color: colors.heading, fontWeight: 700, fontSize: "1.75rem" }}>The Review Panel</h1>
          </div>
          <p style={{ color: colors.gray500, fontSize: "0.875rem" }}>
            Review and action student submissions and comments.
            {role && <span style={{ color: colors.gray400 }}> · Signed in as {ROLE_LABEL[role]}</span>}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {role === "admin" && (
            <Link
              href="/control"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm hover:opacity-90 transition-opacity"
              style={{ backgroundColor: colors.yellow100, color: colors.amber800, border: `1px solid ${colors.amber200}` }}
              title="Admin Control Panel"
            >
              <Settings size={14} /> Control Panel
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: colors.gray100, color: colors.gray700 }}
            title="Log out"
          >
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </div>

      {/* Tabs — same flat pill bar style as the Control Panel, single separating line below */}
      <div className="flex gap-2 flex-wrap mb-8 pb-5 border-b" style={{ borderColor: colors.gray200 }}>
        {typeConfig.map((t) => (
          <button
            key={t.key}
            onClick={() => { setContentType(t.key); if (t.key === "writings" || t.key === "comments") setTab(t.key === "writings" ? "unverified" : "pending"); }}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all active:scale-95"
            style={{
              backgroundColor: contentType === t.key ? colors.green900 : colors.gray100,
              color: contentType === t.key ? colors.white : colors.gray700,
            }}
          >
            {t.icon}
            {t.label}{t.count !== null && ` (${t.count})`}
          </button>
        ))}
      </div>

      <SaveBanner show={saved} />

      {isModerationView && (
        <div className={contentType === "writings" ? "grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8" : "grid grid-cols-3 gap-4 mb-8"}>
          {(contentType === "writings"
            ? [
                { key: "unverified",           label: "Unverified",           count: activeCounts.unverified,           bg: colors.gray100, color: colors.gray700 },
                { key: "pending",              label: "Pending",              count: activeCounts.pending,               bg: colors.yellow100, color: colors.amber800 },
                { key: "waiting_confirmation", label: "Waiting for Confirm.", count: activeCounts.waiting_confirmation,  bg: colors.violet50, color: colors.violet700 },
                { key: "approved",             label: "Approved",             count: activeCounts.approved,              bg: colors.badgeBgStrong, color: colors.badgeText },
                { key: "rejected",             label: "Rejected",             count: activeCounts.rejected,              bg: colors.red100, color: colors.red800 },
              ].filter((s) => !access || access.writingTabs.includes(s.key as WritingTab))
            : [
                { key: "pending",  label: "Pending",  count: activeCounts.pending,  bg: colors.yellow100, color: colors.amber800 },
                { key: "approved", label: "Approved", count: activeCounts.approved, bg: colors.badgeBgStrong, color: colors.badgeText },
                { key: "rejected", label: "Rejected", count: activeCounts.rejected, bg: colors.red100, color: colors.red800 },
              ]
          ).map((s) => (
            <div key={s.label} className="rounded-xl border p-4 text-center" style={{ backgroundColor: s.bg, borderColor: "transparent" }}>
              <p style={{ color: s.color, fontWeight: 700, fontSize: "1.75rem", lineHeight: 1 }}>{s.count}</p>
              <p style={{ color: s.color, fontSize: "0.75rem", marginTop: "0.25rem" }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {isModerationView && (
        <div className="mb-6 -mx-5 px-5 sm:mx-0 sm:px-0 overflow-x-auto">
          <div className="flex gap-2 w-fit">
            {tabConfig.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm transition-all active:scale-95 shrink-0 whitespace-nowrap"
                style={{
                  backgroundColor: tab === t.key ? colors.green900 : colors.gray100,
                  color: tab === t.key ? colors.white : colors.gray700,
                }}
              >
                {t.icon}
                {t.label} ({activeCounts[t.key]})
              </button>
            ))}
          </div>
        </div>
      )}

      {contentType === "writings" ? (
        filteredSubmissions.length === 0 ? (
          <div className="text-center py-16" style={{ color: colors.gray400 }}>
            No {tab} submissions.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredSubmissions.map((sub) => (
              <SubmissionCard
                key={sub.id}
                sub={sub}
                phone={phones[sub.id]}
                updateStatus={updateStatus}
                controllableStatuses={access?.controllableStatuses ?? []}
              />
            ))}
          </div>
        )
      ) : contentType === "comments" ? (
        filteredComments.length === 0 ? (
          <div className="text-center py-16" style={{ color: colors.gray400 }}>
            No {tab} comments.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredComments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                parent={comment.parentId ? commentById.get(comment.parentId) : undefined}
                articleTitle={titleByArticleId.get(comment.articleId) ?? "an article"}
                updateStatus={updateCommentStatus}
              />
            ))}
          </div>
        )
      ) : contentType === "theme" ? (
        <ThemeTab config={config} draft={draft} setDraft={setDraft} updateConfig={updateConfig} handleSave={handleSave} />
      ) : contentType === "choice" ? (
        <ChoiceTab config={config} setDraft={setDraft} updateConfig={updateConfig} allPublished={allPublished} />
      ) : contentType === "standings" ? (
        <StandingsTab />
      ) : (
        <VotesTab canFlag={canFlagVoters(role)} />
      )}
    </div>
  );
}
