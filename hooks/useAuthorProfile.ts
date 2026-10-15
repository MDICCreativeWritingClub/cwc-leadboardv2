"use client";

import { useMemo } from "react";
import { usePublishedArticles } from "@/hooks/usePublishedArticles";
import { useAwardHistory } from "@/hooks/useAwardHistory";
import { useVotes } from "@/context/VoteContext";
import type { Article } from "@/data/articles";

export interface AuthorDirectoryEntry {
  studentCode: string;
  name: string;
  grade: string;
}

/**
 * Every writer we can identify by student_code — one entry per code, built
 * from published pieces (primary source of name/grade) and topped up from
 * award_history for writers whose win predates/lacks a matched submission.
 * Used to power the "find a writer" search on the Archive page.
 */
export function useAuthorDirectory(): AuthorDirectoryEntry[] {
  const { allPublished } = usePublishedArticles();
  const { entries: awardHistory } = useAwardHistory();

  return useMemo(() => {
    const byCode = new Map<string, AuthorDirectoryEntry>();

    for (const article of allPublished) {
      if (!article.studentCode) continue;
      if (!byCode.has(article.studentCode)) {
        byCode.set(article.studentCode, {
          studentCode: article.studentCode,
          name: article.author,
          grade: article.grade,
        });
      }
    }

    for (const award of awardHistory) {
      if (!award.studentCode) continue;
      if (!byCode.has(award.studentCode)) {
        byCode.set(award.studentCode, {
          studentCode: award.studentCode,
          name: award.writerName,
          grade: award.grade ?? "",
        });
      }
    }

    return Array.from(byCode.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allPublished, awardHistory]);
}

export interface AuthorProfile {
  found: boolean;
  studentCode: string;
  name: string;
  grade: string;
  articles: (Article & { currentVotes: number })[];
  totalVotes: number;
  wins: {
    wom: number;
    editorsChoice: number;
    total: number;
  };
  awards: ReturnType<typeof useAwardHistory>["entries"];
  loading: boolean;
}

/**
 * Aggregates everything known about one writer, keyed by student_code:
 * their published pieces (with live vote counts), total votes, and their
 * Writer of the Month / Editor's Choice win history and counts.
 */
export function useAuthorProfile(studentCode: string): AuthorProfile {
  const { allPublished } = usePublishedArticles();
  const { votes } = useVotes();
  const { entries: awardHistory, countsFor, loading } = useAwardHistory();

  return useMemo(() => {
    const articles = allPublished
      .filter((a) => a.studentCode === studentCode)
      .map((a) => ({ ...a, currentVotes: votes[a.id] ?? a.votes }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    const awards = awardHistory
      .filter((a) => a.studentCode === studentCode)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    const totalVotes = articles.reduce((sum, a) => sum + a.currentVotes, 0);

    // Name/grade: prefer the most recent published piece, fall back to the
    // most recent award record for writers who won but have no matched
    // submission (e.g. name-matching failed when the win was recorded).
    const name = articles[0]?.author ?? awards[0]?.writerName ?? "";
    const grade = articles[0]?.grade ?? awards[0]?.grade ?? "";

    return {
      found: articles.length > 0 || awards.length > 0,
      studentCode,
      name,
      grade,
      articles,
      totalVotes,
      wins: countsFor(studentCode),
      awards,
      loading,
    };
  }, [allPublished, votes, awardHistory, countsFor, loading, studentCode]);
}
