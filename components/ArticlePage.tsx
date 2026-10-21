"use client";

import { colors } from "@/lib/theme";
import { renderFormattedText } from "@/lib/richText";
import { AuthorLink } from "@/components/AuthorLink";
import { getAvatarColor, getInitials } from "@/lib/avatar";
import { CommentSection } from "@/components/CommentSection";
import { VoteButton } from "@/components/VoteButton";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { useVotes } from "@/context/VoteContext";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { usePublishedArticles } from "@/hooks/usePublishedArticles";

/** Format an ISO date string (YYYY-MM-DD) as "5 June 2026" */
function formatDate(date: string | undefined, fallback: string): string {
  if (!date) return fallback;
  const d = new Date(date + "T00:00:00"); // force local midnight
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/** Seeded shuffle — deterministic per (articleId + pool length) so it doesn't jump on re-render */
function seededShuffle<T>(arr: T[], seed: string): T[] {
  const copy = [...arr];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  for (let i = copy.length - 1; i > 0; i--) {
    h = (Math.imul(h ^ (h >>> 15), 0x85ebca6b)) | 0;
    h = (Math.imul(h ^ (h >>> 13), 0xc2b2ae35)) | 0;
    h ^= h >>> 16;
    const j = Math.abs(h) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Rough reading time estimate from word count. */
function readingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function ArticlePage({ id }: { id: string }) {
  const { allPublished } = usePublishedArticles();
  const { votes } = useVotes();
  const { config } = useSiteConfig();

  const article = allPublished.find((a) => a.id === id);

  // Pick 2 random suggestions from the full corpus, excluding the current article.
  const suggestions = useMemo(() => {
    const pool = allPublished.filter((a) => a.id !== id);
    return seededShuffle(pool, id + pool.length).slice(0, 2);
  }, [allPublished, id]);

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto px-5 pt-32 text-center">
        <p style={{ color: colors.gray500 }}>Article not found.</p>
        <Link href="/" style={{ color: colors.green600 }} className="text-sm hover:underline mt-2 inline-block">
          ← Back to home
        </Link>
      </div>
    );
  }

  const voteCount = votes[article.id] ?? article.votes;
  const paragraphs = article.content.split("\n\n").filter(Boolean);
  const displayDate = formatDate(article.date, article.month);
  const minutes = readingTime(article.content);
  const isEditorChoice = article.isEditorChoice || (config.editorChoiceIds ?? []).includes(article.id);

  return (
    <article className="max-w-3xl mx-auto px-5 pt-24 pb-24">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm mb-8 hover:gap-2.5 transition-all"
        style={{ color: colors.green600 }}
      >
        <ArrowLeft size={15} /> Back to all pieces
      </Link>

      <div className="flex items-center gap-2 flex-wrap mb-5">
        <span
          className="inline-block px-3 py-0.5 rounded-full text-xs font-medium"
          style={{ backgroundColor: colors.badgeBg, color: colors.badgeText, border: `1px solid ${colors.badgeBorder}` }}
        >
          {article.category}
        </span>
        {isEditorChoice && (
          <span
            className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: colors.green900, color: colors.white }}
          >
            <Star size={11} fill={colors.white} /> Editor&apos;s Choice
          </span>
        )}
      </div>

      <h1
        style={{
          fontFamily: "var(--font-display)",
          color: colors.heading,
          fontWeight: 600,
          fontSize: "clamp(1.9rem, 4.5vw, 2.5rem)",
          lineHeight: "1.2",
          marginBottom: "1.75rem",
        }}
      >
        {article.title}
      </h1>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-7 mb-12 border-b" style={{ borderColor: colors.gray200 }}>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-white shrink-0"
            style={{ backgroundColor: getAvatarColor(article.author), fontFamily: "var(--font-display)", fontWeight: 600 }}
          >
            {getInitials(article.author)}
          </div>
          <div className="flex-1 min-w-0">
            <div style={{ color: colors.gray900, fontWeight: 500, fontSize: "0.9rem" }}>
              <AuthorLink name={article.author} studentCode={article.studentCode} />
            </div>
            <div style={{ color: colors.gray400, fontSize: "0.775rem" }}>
              {article.grade} · {displayDate} · {minutes} min read
            </div>
          </div>
        </div>
        <VoteButton articleId={article.id} count={voteCount} size="md" className="w-full sm:w-auto" />
      </div>

      <div className="space-y-5">
        {paragraphs.map((para, i) => (
          <p
            key={i}
            style={{
              fontFamily: "var(--font-reading)",
              color: colors.gray800,
              lineHeight: "1.9",
              fontSize: "1.1rem",
            }}
          >
            {renderFormattedText(para)}
          </p>
        ))}
      </div>

      <div
        className="mt-12 pt-8 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ borderColor: colors.gray200 }}
      >
        <div>
          <p style={{ color: colors.gray500, fontSize: "0.8rem" }}>Written by</p>
          <p style={{ fontFamily: "var(--font-display)", color: colors.heading, fontWeight: 600, fontSize: "1.05rem" }}>
            <AuthorLink name={article.author} studentCode={article.studentCode} />
          </p>
          <p style={{ color: colors.gray400, fontSize: "0.775rem" }}>{article.grade}</p>
        </div>
        <VoteButton articleId={article.id} count={voteCount} size="md" />
      </div>

      {suggestions.length > 0 && (
        <div className="mt-14">
          <div className="flex items-center gap-3 mb-6">
            <span style={{ color: colors.gray500, fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em" }}>
              More to Read
            </span>
            <div style={{ height: "1px", flex: 1, backgroundColor: colors.gray200 }} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {suggestions.map((a) => (
              <Link
                key={a.id}
                href={`/article/${a.id}`}
                className="block p-5 rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ border: `1px solid ${colors.gray200}` }}
              >
                <span
                  className="inline-block text-xs px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: colors.badgeBg, color: colors.badgeText, border: `1px solid ${colors.badgeBorder}` }}
                >
                  {a.category}
                </span>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    color: colors.heading,
                    fontWeight: 600,
                    fontSize: "1rem",
                    lineHeight: "1.4",
                    margin: "0.6rem 0 0.3rem",
                  }}
                >
                  {a.title}
                </p>
                <p style={{ color: colors.gray400, fontSize: "0.78rem" }}>{a.author}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <CommentSection articleId={article.id} />
    </article>
  );
}
