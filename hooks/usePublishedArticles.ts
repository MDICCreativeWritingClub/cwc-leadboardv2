"use client";

import { useMemo } from "react";
import { articles, archiveArticles, type Article, type Category } from "@/data/articles";
import { useSubmissions, type Submission } from "@/context/SubmissionsContext";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { stripFormatMarks } from "@/lib/richText";

/**
 * Maps SubmitPage category labels → Article Category union values.
 * SubmitPage uses human-friendly labels; Article uses short canonical keys.
 */
const CATEGORY_MAP: Record<string, Exclude<Category, "All">> = {
  "Articles":                          "Articles",
  "Argumentative / Descriptive Essays": "Essays",
  "Blogs":                             "Blogs",
  "Fiction / Short Stories":           "Fiction",
  "Poetry":                            "Poetry",
  "Memoir / Personal Narrative":       "Memoir",
  "Magazine / Features":               "Features",
  "Biographies":                       "Biographies",
  "Reviews":                           "Reviews",
};

function submissionToArticle(sub: Submission): Article {
  const d = new Date(sub.submittedAt);
  const month = d.toLocaleString("en-GB", { month: "long", year: "numeric" });
  // ISO date portion (YYYY-MM-DD) for sorting & display
  const date = sub.submittedAt.slice(0, 10);
  const plainContent = stripFormatMarks(sub.content);
  const excerpt =
    plainContent.length > 200
      ? plainContent.slice(0, 200).trimEnd() + "…"
      : plainContent;

  return {
    id: sub.id,
    title: sub.title,
    author: sub.name,
    studentCode: sub.studentCode,
    grade: sub.grade,
    category: CATEGORY_MAP[sub.category] ?? "Articles",
    excerpt,
    content: sub.content,
    votes: 0,
    month,
    date,
    isEditorChoice: false,
  };
}

/**
 * Returns a unified, memoised view of all published content:
 * - `currentIssue`  — static articles + approved submissions (for LiteraryHub)
 * - `allPublished`  — static articles + archive articles + approved submissions (for Archive)
 *
 * Both lists are stable references and only recompute when submissions change.
 */
export function usePublishedArticles() {
  const { submissions } = useSubmissions();
  const { config } = useSiteConfig();
  const removed = new Set(config.removedArticleIds ?? []);

  const approvedFromSubmissions = useMemo(
    () =>
      submissions
        .filter((s) => s.status === "approved")
        .map(submissionToArticle),
    [submissions],
  );

  const currentIssue = useMemo(
    () => [...articles, ...approvedFromSubmissions].filter((a) => !removed.has(a.id)),
    [approvedFromSubmissions, config.removedArticleIds],
  );

  const allPublished = useMemo(
    () => [...articles, ...archiveArticles, ...approvedFromSubmissions].filter((a) => !removed.has(a.id)),
    [approvedFromSubmissions, config.removedArticleIds],
  );

  return { currentIssue, allPublished };
}
