"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useSupabaseRealtime } from "@/lib/useSupabaseRealtime";
import { useAuth } from "@/context/AuthContext";
import type { StaffRole } from "@/lib/roles";

export interface Comment {
  id: string;
  articleId: string;
  parentId: string | null;
  authorName: string;
  staffRole: StaffRole | null;
  content: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  reactions: Record<string, number>;
}

interface AddCommentInput {
  articleId: string;
  content: string;
  parentId?: string | null;
  /** Typed by the poster every time -- there are no locked account names
   *  anymore now that login is gone. Staff get their role label attached
   *  automatically from their session; everyone else posts as a plain
   *  guest name. */
  authorName: string;
}

interface CommentsContextType {
  comments: Comment[];
  myReactions: Record<string, string>;
  addComment: (input: AddCommentInput) => Promise<void>;
  updateStatus: (id: string, status: "approved" | "rejected") => Promise<void>;
  reactToComment: (commentId: string, emoji: string) => Promise<void>;
  loading: boolean;
}

const CommentsContext = createContext<CommentsContextType | null>(null);

function mapRow(r: Record<string, unknown>): Comment {
  return {
    id: r.id as string,
    articleId: r.article_id as string,
    parentId: (r.parent_id as string | null) ?? null,
    authorName: r.author_name as string,
    staffRole: (r.staff_role as StaffRole | null) ?? null,
    content: r.content as string,
    submittedAt: r.created_at as string,
    status: r.status as "pending" | "approved" | "rejected",
    reactions: (r.reactions as Record<string, number>) ?? {},
  };
}

export function CommentsProvider({ children }: { children: ReactNode }) {
  const { identity } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [myReactions, setMyReactions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  async function fetchAll(): Promise<void> {
    const { data } = await supabase
      .from("comments")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setComments(data.map(mapRow));
  }

  useEffect(() => {
    fetchAll().finally(() => setLoading(false));
  }, []);

  useSupabaseRealtime("comments_realtime", "comments", () => {
    fetchAll();
  });

  // Which comments the CURRENT identity has already reacted to. Re-runs
  // whenever the active identity changes (login/logout/switch).
  useEffect(() => {
    async function loadMyReactions() {
      if (!identity) {
        setMyReactions({});
        return;
      }
      const { data } = await identity.client
        .from("comment_reactions")
        .select("comment_id, emoji")
        .eq("user_id", identity.userId);

      const map: Record<string, string> = {};
      for (const row of (data ?? []) as { comment_id: string; emoji: string }[]) {
        map[row.comment_id] = row.emoji;
      }
      setMyReactions(map);
    }
    loadMyReactions();
  }, [identity]);

  const addComment = useCallback(
    async (input: AddCommentInput): Promise<void> => {
      if (!identity) throw new Error("Still setting things up -- please try again in a moment.");

      const authorName = input.authorName.trim();
      if (!authorName) throw new Error("MISSING_NAME");

      const staffRole = identity.kind === "staff" ? identity.staffRole : null;
      const id = `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const createdAt = new Date().toISOString();

      const { error } = await identity.client.from("comments").insert({
        id,
        article_id: input.articleId,
        parent_id: input.parentId ?? null,
        author_name: authorName,
        staff_role: staffRole,
        content: input.content,
        created_at: createdAt,
        status: "pending",
        user_id: identity.userId,
      });

      if (error) throw new Error("Failed to post comment");

      setComments((prev) => [
        {
          id,
          articleId: input.articleId,
          parentId: input.parentId ?? null,
          authorName,
          staffRole,
          content: input.content,
          submittedAt: createdAt,
          status: "pending",
          reactions: {},
        },
        ...prev,
      ]);
    },
    [identity]
  );

  // Moderation is a staff-only write -- must go through the staff-auth
  // client, not the read-only public `supabase` client, or RLS will see
  // it as anonymous and reject it. Dynamically imported so the public
  // bundle (readers who never touch the Review Panel) doesn't ship it.
  const updateStatus = useCallback(async (id: string, status: "approved" | "rejected") => {
    const { staffSupabase } = await import("@/lib/staffSupabase");
    await staffSupabase.from("comments").update({ status }).eq("id", id);
    setComments((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  }, []);

  const reactToComment = useCallback(
    async (commentId: string, emoji: string) => {
      if (!identity) throw new Error("Still setting things up -- please try again in a moment.");

      const { data, error } = await identity.client.rpc("react_to_comment", {
        p_comment_id: commentId,
        p_emoji: emoji,
      });

      if (error) {
        if (error.message?.includes("ALREADY_REACTED")) throw new Error("ALREADY_REACTED");
        throw error;
      }

      if (data) {
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, reactions: data as Record<string, number> } : c))
        );
        setMyReactions((prev) => ({ ...prev, [commentId]: emoji }));
      }
    },
    [identity]
  );

  return (
    <CommentsContext.Provider
      value={{ comments, myReactions, addComment, updateStatus, reactToComment, loading }}
    >
      {children}
    </CommentsContext.Provider>
  );
}

export function useComments() {
  const ctx = useContext(CommentsContext);
  if (!ctx) throw new Error("useComments must be used inside CommentsProvider");
  return ctx;
}
