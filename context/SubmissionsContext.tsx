"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useSupabaseRealtime } from "@/lib/useSupabaseRealtime";
import { useAuth } from "@/context/AuthContext";

export interface Submission {
  id: string;
  name: string;
  studentCode: string;
  grade: string;
  category: string;
  theme: string;
  title: string;
  content: string;
  submittedAt: string;
  status: "unverified" | "pending" | "waiting_confirmation" | "writing_confirmation" | "approved" | "rejected";
  writerId?: string;
  /** Contact number. Only ever sent on submit -- never returned by public reads
   *  (column SELECT is revoked); staff get it via the get_submission_phones() RPC. */
  phone?: string;
  /** Free-text notes an editor leaves when editing at the Pending, Waiting for Confirmation, or
   *  Writing for Confirmation stage -- what they changed, and any instructions for whoever
   *  reviews it next. A single box that gets overwritten on each edit, not a running log. */
  editorNotes?: string;
}

interface SubmissionsContextType {
  submissions: Submission[];
  addSubmission: (sub: Omit<Submission, "id" | "submittedAt" | "status">) => Promise<string>;
  updateStatus: (id: string, status: Submission["status"]) => void;
  updateSubmission: (
    id: string,
    edits: { title: string; content: string; name: string; studentCode: string; grade: string; editorNotes?: string },
    status: Submission["status"]
  ) => Promise<void>;
  loading: boolean;
}

const SubmissionsContext = createContext<SubmissionsContextType | null>(null);

// Explicit list (not "*"): the phone column is not SELECT-able by the API roles.
const SUBMISSION_COLUMNS =
  "id, writer_id, user_id, name, student_code, grade, category, theme, title, content, submitted_at, status, editor_notes";

function getWriterId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("cwc_writer_id");
}

function saveWriterId(id: string): void {
  if (typeof window !== "undefined") localStorage.setItem("cwc_writer_id", id);
}

function mapRow(r: Record<string, unknown>): Submission {
  return {
    id: r.id as string,
    name: r.name as string,
    studentCode: r.student_code as string,
    grade: r.grade as string,
    category: r.category as string,
    theme: r.theme as string,
    title: r.title as string,
    content: r.content as string,
    submittedAt: r.submitted_at as string,
    status: r.status as Submission["status"],
    writerId: r.writer_id as string | undefined,
    editorNotes: (r.editor_notes as string | null) ?? undefined,
  };
}

export function SubmissionsProvider({ children }: { children: ReactNode }) {
  const { identity } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchAll(): Promise<void> {
    // Reading anonymously (the default `supabase` client) is RLS-limited to
    // status = 'approved' -- fine for the public site, but it means the
    // Review/Control Panel would never see unverified/pending/etc rows
    // unless the read itself carries the reviewer's authenticated session.
    const client = identity?.client ?? supabase;
    const { data } = await client
      .from("submissions")
      .select(SUBMISSION_COLUMNS)
      .order("submitted_at", { ascending: false });
    if (data) setSubmissions(data.map(mapRow));
  }

  useEffect(() => {
    fetchAll().finally(() => setLoading(false));
  }, [identity]);

  useSupabaseRealtime("submissions_realtime", "submissions", () => {
    fetchAll();
  });

  const addSubmission = useCallback(
    async (sub: Omit<Submission, "id" | "submittedAt" | "status">): Promise<string> => {
      // Submitting requires the visitor's identity to have finished
      // loading -- RLS enforces the real requirement server-side, this is
      // just the friendlier client-side message for the rare case where
      // the silent anonymous sign-in hasn't resolved yet.
      if (!identity) throw new Error("Still setting things up -- please try again in a moment.");

      let writerId = getWriterId();

      if (writerId) {
        // The cached writerId may point at a row that's since been
        // deleted (e.g. during cleanup) -- localStorage has no way to
        // know that, so confirm it still exists before trusting it.
        const { data: existingWriter } = await identity.client
          .from("writers")
          .select("id")
          .eq("id", writerId)
          .maybeSingle();

        if (!existingWriter) {
          writerId = null;
        }
      }

      if (!writerId) {
        const { data: writer, error: writerError } = await identity.client
          .from("writers")
          .insert({ name: sub.name, grade: sub.grade, student_code: sub.studentCode })
          .select("id")
          .single();

        if (writerError || !writer) throw new Error("Failed to create writer profile");
        writerId = writer.id as string;
        saveWriterId(writerId);
      } else {
        await identity.client
          .from("writers")
          .update({ name: sub.name, grade: sub.grade })
          .eq("id", writerId);
      }

      const id = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const submittedAt = new Date().toISOString();

      // Goes through the caller's own authenticated client (public or
      // staff) so RLS sees a real auth.uid() -- required for the
      // "logged in users can insert unverified submissions" policy.
      const { error } = await identity.client.from("submissions").insert({
        id,
        writer_id: writerId,
        user_id: identity.userId,
        name: sub.name,
        student_code: sub.studentCode,
        grade: sub.grade,
        phone: sub.phone,
        category: sub.category,
        theme: sub.theme,
        title: sub.title,
        content: sub.content,
        submitted_at: submittedAt,
        status: "unverified",
      });

      if (error) {
        if (error.message?.includes("DAILY_SUBMISSION_LIMIT_REACHED")) {
          throw new Error("You've reached the limit of 2 submissions per day. Please try again tomorrow.");
        }
        throw new Error("Failed to save submission");
      }

      const { phone: _phone, ...publicSub } = sub;
      void _phone;
      const newSub: Submission = { ...publicSub, id, submittedAt, status: "unverified", writerId };
      setSubmissions((prev) => [newSub, ...prev]);
      return id;
    },
    [identity]
  );

  // Staff-only actions (used from ReviewPanel/ReviewEditPage) -- must go
  // through the staff-auth client, not the read-only `supabase` client,
  // or RLS will see them as anonymous and reject them.
  const updateStatus = useCallback(async (id: string, status: Submission["status"]) => {
    const { staffSupabase } = await import("@/lib/staffSupabase");
    await staffSupabase.from("submissions").update({ status }).eq("id", id);
    setSubmissions((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  }, []);

  const updateSubmission = useCallback(
    async (
      id: string,
      edits: { title: string; content: string; name: string; studentCode: string; grade: string; editorNotes?: string },
      status: Submission["status"]
    ): Promise<void> => {
      const { staffSupabase } = await import("@/lib/staffSupabase");
      const { error } = await staffSupabase
        .from("submissions")
        .update({
          title: edits.title,
          content: edits.content,
          name: edits.name,
          student_code: edits.studentCode,
          grade: edits.grade,
          editor_notes: edits.editorNotes ?? null,
          status,
        })
        .eq("id", id);

      if (error) throw new Error("Failed to save changes");

      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...edits, status } : s))
      );
    },
    []
  );

  return (
    <SubmissionsContext.Provider
      value={{ submissions, addSubmission, updateStatus, updateSubmission, loading }}
    >
      {children}
    </SubmissionsContext.Provider>
  );
}

export function useSubmissions() {
  const ctx = useContext(SubmissionsContext);
  if (!ctx) throw new Error("useSubmissions must be used inside SubmissionsProvider");
  return ctx;
}

export function useWriterIdentity(): string | null {
  const [writerId, setWriterIdState] = useState<string | null>(null);
  useEffect(() => { setWriterIdState(getWriterId()); }, []);
  return writerId;
}
