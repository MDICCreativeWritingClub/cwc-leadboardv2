"use client";

import { useCallback, useEffect, useState } from "react";
import { staffSupabase as supabase } from "@/lib/staffSupabase";

export interface AwardHistoryEntry {
  id: string;
  awardType: "wom" | "editors_choice";
  studentCode: string | null;
  writerName: string;
  grade: string | null;
  articleId: string | null;
  articleTitle: string | null;
  votes: number | null;
  monthLabel: string;
  year: number;
  createdAt: string;
}

function mapRow(r: any): AwardHistoryEntry {
  return {
    id: r.id,
    awardType: r.award_type,
    studentCode: r.student_code,
    writerName: r.writer_name,
    grade: r.grade,
    articleId: r.article_id,
    articleTitle: r.article_title,
    votes: r.votes,
    monthLabel: r.month_label,
    year: r.year,
    createdAt: r.created_at,
  };
}

/**
 * Fetches every recorded Writer of the Month / Editor's Choice win.
 * Used by the Archive page (public history) and the author profile page
 * (per-student win counts).
 */
export function useAwardHistory() {
  const [entries, setEntries] = useState<AwardHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("award_history")
      .select("*")
      .order("year", { ascending: false })
      .order("created_at", { ascending: false });

    if (!error && data) {
      setEntries(data.map(mapRow));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function addEntry(entry: {
    awardType: "wom" | "editors_choice";
    studentCode: string | null;
    writerName: string;
    grade: string | null;
    articleId: string | null;
    articleTitle: string | null;
    votes: number | null;
    monthLabel: string;
    year: number;
  }) {
    const { error } = await supabase.from("award_history").insert({
      award_type: entry.awardType,
      student_code: entry.studentCode,
      writer_name: entry.writerName,
      grade: entry.grade,
      article_id: entry.articleId,
      article_title: entry.articleTitle,
      votes: entry.votes,
      month_label: entry.monthLabel,
      year: entry.year,
    });
    if (!error) await refresh();
    return { error };
  }

  async function removeEntry(id: string) {
    const { error } = await supabase.from("award_history").delete().eq("id", id);
    if (!error) await refresh();
    return { error };
  }

  /** Win count for a given student_code, split by award type. */
  function countsFor(studentCode: string) {
    const forStudent = entries.filter((e) => e.studentCode === studentCode);
    return {
      wom: forStudent.filter((e) => e.awardType === "wom").length,
      editorsChoice: forStudent.filter((e) => e.awardType === "editors_choice").length,
      total: forStudent.length,
    };
  }

  return { entries, loading, addEntry, removeEntry, countsFor };
}
