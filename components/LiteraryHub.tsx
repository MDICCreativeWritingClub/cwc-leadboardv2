"use client";

import { colors } from "@/lib/theme";

import { useState, useMemo } from "react";
import Link from "next/link";
import { AuthorByline } from "@/components/AuthorByline";
import { ThumbsUp, BookOpen, Search, User, Type } from "lucide-react";
import { categories, type Category, type Article } from "@/data/articles";
import { useVotes } from "@/context/VoteContext";
import { usePublishedArticles } from "@/hooks/usePublishedArticles";
import { VoteButton } from "@/components/VoteButton";

function ArticleCard({ article }: { article: Article }) {
  const { votes } = useVotes();
  const voteCount = votes[article.id] ?? article.votes;

  return (
      <div
        className="rounded-2xl border bg-white dark:bg-[var(--token-white)] flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-md"
        style={{ borderColor: colors.gray200 }}
      >
      <div className="p-5 flex flex-col flex-1">
        <span
          className="inline-block px-2.5 py-0.5 rounded-full text-xs mb-3 self-start"
          style={{ backgroundColor: colors.badgeBg, color: colors.badgeText, border: `1px solid ${colors.badgeBorder}` }}
        >
          {article.category}
        </span>
        <Link href={`/article/${article.id}`}>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              color: colors.heading,
              fontWeight: 600,
              fontSize: "1.05rem",
              lineHeight: "1.4",
              marginBottom: "0.5rem",
            }}
            className="hover:underline cursor-pointer"
          >
            {article.title}
          </h3>
        </Link>
        <p style={{ color: colors.gray500, fontSize: "0.8rem", lineHeight: "1.7", flex: 1 }}>
          {article.excerpt}
        </p>
      </div>
      <div
        className="px-5 py-3 flex items-center justify-between border-t"
        style={{ borderColor: colors.gray100 }}
      >
        <div>
          <div style={{ color: colors.gray700, fontSize: "0.8rem", fontWeight: 500 }}>
            <AuthorByline name={article.author} studentCode={article.studentCode} size={20} textStyle={{ fontSize: "0.8rem" }} />
          </div>
          <div style={{ color: colors.gray400, fontSize: "0.7rem" }}>
            {article.grade.split("—")[0].trim()}
          </div>
        </div>
        <VoteButton articleId={article.id} count={voteCount} size="sm" />
      </div>
      </div>
  );
}

type SearchMode = "title" | "author";

export function LiteraryHub() {
  const [active, setActive] = useState<Category>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("title");
  const { currentIssue } = usePublishedArticles();

  const availableCategories = useMemo(() => {
    const inUse = new Set(currentIssue.map((a) => a.category));
    return categories.filter((c) => c === "All" || inUse.has(c));
  }, [currentIssue]);

  const filtered = useMemo(() => {
    const byCategory =
      active === "All" ? currentIssue : currentIssue.filter((a) => a.category === active);

    if (!searchQuery.trim()) return byCategory;

    const q = searchQuery.trim().toLowerCase();
    return byCategory.filter((a) =>
      searchMode === "title"
        ? a.title.toLowerCase().includes(q)
        : a.author.toLowerCase().includes(q)
    );
  }, [currentIssue, active, searchQuery, searchMode]);

  function toggleSearchMode() {
    setSearchMode((prev) => (prev === "title" ? "author" : "title"));
    setSearchQuery("");
  }

  const placeholder =
    searchMode === "title" ? "Search by story title…" : "Search by writer name…";

  return (
    <div className="max-w-7xl mx-auto px-5 pt-24 pb-16">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen size={22} style={{ color: colors.green600 }} />
          <h1 style={{ fontFamily: "var(--font-display)", color: colors.heading, fontWeight: 600, fontSize: "1.9rem" }}>
            The Literary Hub
          </h1>
        </div>
        <p style={{ color: colors.gray500, fontSize: "0.9rem" }}>
          Browse every piece published by Manarat CWC — filtered by category.
        </p>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-2 mb-6">
        <div
          className="flex items-center flex-1 min-w-0 gap-2 px-3 py-2 rounded-xl border bg-white dark:bg-[var(--token-white)]"
          style={{ borderColor: colors.emerald100 }}
        >
          <Search size={15} style={{ color: colors.gray400, flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholder}
            className="flex-1 min-w-0 bg-transparent outline-none text-sm"
            style={{ color: colors.gray900 }}
          />
        </div>

        {/* Mode toggle button */}
        <button
          onClick={toggleSearchMode}
          title={`Switch to search by ${searchMode === "title" ? "writer" : "title"}`}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0"
          style={{
            backgroundColor: colors.green900,
            color: colors.white,
            border: `1px solid ${colors.green900}`,
          }}
        >
          {searchMode === "title" ? (
            <>
              <Type size={14} />
              By Title
            </>
          ) : (
            <>
              <User size={14} />
              By Writer
            </>
          )}
        </button>
      </div>

      {/* Category filter */}
      <div
        className="flex items-center gap-2 flex-wrap mb-8 pb-5 border-b"
        style={{ borderColor: colors.gray200 }}
      >
        {availableCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className="px-4 py-1.5 rounded-full text-sm transition-all active:scale-95 hover:-translate-y-0.5"
            style={{
              backgroundColor: active === cat ? colors.green900 : colors.badgeBg,
              color: active === cat ? colors.white : colors.badgeText,
              border: `1px solid ${active === cat ? colors.green900 : colors.badgeBorder}`,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20" style={{ color: colors.gray400 }}>
          {searchQuery.trim()
            ? `No pieces found matching "${searchQuery}".`
            : "No pieces in this category yet."}
        </div>
      ) : (
        <>
          <p style={{ color: colors.gray400, fontSize: "0.75rem", marginBottom: "1.25rem" }}>
            {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
            {active !== "All" ? ` in ${active}` : ""}
            {searchQuery.trim()
              ? ` matching "${searchQuery}" by ${searchMode === "title" ? "title" : "writer"}`
              : ""}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
