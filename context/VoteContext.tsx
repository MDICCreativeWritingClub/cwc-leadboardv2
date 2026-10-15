"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useSupabaseRealtime } from "@/lib/useSupabaseRealtime";
import { articles as initialArticles } from "@/data/articles";
import { useAuth } from "@/context/AuthContext";

interface VoteContextType {
  votes: Record<string, number>;
  voted: Record<string, boolean>;
  castVote: (id: string) => Promise<{ error: string | null }>;
  ready: boolean;
}

const VoteContext = createContext<VoteContextType | null>(null);

export function VoteProvider({ children }: { children: ReactNode }) {
  const { identity, loading: authLoading } = useAuth();

  const [votes, setVotes] = useState<Record<string, number>>(() =>
    Object.fromEntries(initialArticles.map((a) => [a.id, a.votes ?? 0]))
  );
  const [voted, setVoted] = useState<Record<string, boolean>>({});

  // Load vote counts (public data, no auth needed)
  useEffect(() => {
    async function load() {
      const { data: voteData } = await supabase.from("votes").select("article_id, count");
      if (voteData) {
        const map: Record<string, number> = Object.fromEntries(
          initialArticles.map((a) => [a.id, a.votes ?? 0])
        );
        for (const row of voteData) {
          map[row.article_id] = Number(row.count);
        }
        setVotes(map);
      }
    }
    load();
  }, []);

  // Which articles the CURRENT identity has already voted on. Re-runs
  // whenever the active identity changes (login/logout/switch).
  useEffect(() => {
    async function loadVoted() {
      if (!identity) {
        setVoted({});
        return;
      }
      const { data } = await identity.client
        .from("user_votes")
        .select("article_id")
        .eq("user_id", identity.userId);

      const map: Record<string, boolean> = {};
      for (const row of data ?? []) {
        map[row.article_id as string] = true;
      }
      setVoted(map);
    }
    loadVoted();
  }, [identity]);

  useSupabaseRealtime("votes_realtime", "votes", (payload) => {
    const row = payload.new as Record<string, unknown>;
    const articleId = row?.article_id as string | undefined;
    if (articleId) {
      setVotes((prev) => ({ ...prev, [articleId]: Number(row.count) }));
    }
  });

  const castVote = useCallback(
    async (id: string): Promise<{ error: string | null }> => {
      if (!identity) return { error: "NOT_LOGGED_IN" };
      if (voted[id]) return { error: null };

      // Optimistic update -- reverted below if the server rejects the vote.
      setVotes((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
      setVoted((prev) => ({ ...prev, [id]: true }));

      const { data, error } = await identity.client.rpc("cast_vote", { p_article_id: id });

      if (error) {
        setVotes((prev) => ({ ...prev, [id]: Math.max((prev[id] ?? 1) - 1, 0) }));
        const isAlready = error.message?.includes("ALREADY_VOTED");
        if (!isAlready) {
          setVoted((prev) => ({ ...prev, [id]: false }));
        }
        return { error: isAlready ? "ALREADY_VOTED" : error.message };
      }

      if (typeof data === "number") {
        setVotes((prev) => ({ ...prev, [id]: data }));
      }
      return { error: null };
    },
    [identity, voted]
  );

  return (
    <VoteContext.Provider value={{ votes, voted, castVote, ready: !authLoading }}>
      {children}
    </VoteContext.Provider>
  );
}

export function useVotes() {
  const ctx = useContext(VoteContext);
  if (!ctx) throw new Error("useVotes must be used inside VoteProvider");
  return ctx;
}
