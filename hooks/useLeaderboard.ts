"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type LeaderboardSort = "points" | "likes" | "theme" | "structure" | "voice" | "writing";

export interface LeaderboardRow {
  rank: number;
  articleId: string;
  title: string;
  writerName: string;
  studentCode?: string;
  grade: string;
  /** Rounded points for "points", the like count for "likes", null for category sorts and unscored writings. */
  displayValue: number | null;
}

interface RawRow {
  rank: number;
  article_id: string;
  title: string;
  writer_name: string;
  student_code: string | null;
  grade: string;
  display_value: number | string | null;
}

const POLL_MS = 30_000;

/** First day of the current month in Dhaka, as YYYY-MM-01. */
export function currentMonthStart(): string {
  const yearMonth = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
  return `${yearMonth}-01`;
}

/**
 * Live leaderboard from the server-side get_leaderboard() function. Ranking
 * and points are computed in the database; this hook only fetches and
 * refreshes the result every 30 seconds while the tab is visible.
 */
export function useLeaderboard(sort: LeaderboardSort, monthOnly: boolean, limit = 20) {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error: rpcError } = await supabase.rpc("get_leaderboard", {
        p_sort: sort,
        p_limit: limit,
        p_month: monthOnly ? currentMonthStart() : null,
      });
      if (cancelled) return;
      if (rpcError) {
        setError("Couldn't load the leaderboard. Try again in a moment.");
        setLoading(false);
        return;
      }
      setRows(
        ((data ?? []) as RawRow[]).map((r) => ({
          rank: r.rank,
          articleId: r.article_id,
          title: r.title,
          writerName: r.writer_name,
          studentCode: r.student_code ?? undefined,
          grade: r.grade,
          displayValue: r.display_value === null ? null : Number(r.display_value),
        }))
      );
      setError(null);
      setLoading(false);
    }

    setLoading(true);
    load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [sort, monthOnly, limit]);

  return { rows, loading, error };
}
