"use client";

import { Star, Trash2 } from "lucide-react";
import type { Article } from "@/data/articles";
import type { SiteConfig } from "@/context/SiteConfigContext";
import { colors } from "@/lib/theme";

interface ContentTabProps {
  allPublished: Article[];
  config: SiteConfig;
  updateConfig: (partial: Partial<SiteConfig>) => void;
  setDraft: React.Dispatch<React.SetStateAction<SiteConfig>>;
  votes: Record<string, number>;
}

export function ContentTab({ allPublished, config, updateConfig, setDraft, votes }: ContentTabProps) {
  const visible = allPublished.filter((a) => !(config.removedArticleIds ?? []).includes(a.id));

  function removeArticle(a: Article) {
    if (confirm(`Permanently remove "${a.title}" from the site? This cannot be undone.`)) {
      const updated = [...(config.removedArticleIds ?? []), a.id];
      updateConfig({ removedArticleIds: updated });
      setDraft((d) => ({ ...d, removedArticleIds: updated }));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p style={{ color: colors.gray400, fontSize: "0.75rem", marginBottom: "0.5rem" }}>
        {visible.length} pieces published across the site
      </p>
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: colors.gray200 }}>
        {/* Header row: table headers only shown from sm: up, where the grid layout applies */}
        <div
          className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] px-5 py-2.5 border-b gap-4"
          style={{ backgroundColor: colors.gray50, borderColor: colors.gray200 }}
        >
          {["Title / Author", "Category", "Votes", "Flags", "Actions"].map((h) => (
            <span key={h} style={{ color: colors.gray500, fontSize: "0.75rem", fontWeight: 500 }}>{h}</span>
          ))}
        </div>

        <div className="divide-y bg-white dark:bg-[var(--token-white)]">
          {visible.map((a) => {
            const isEC = a.isEditorChoice || (config.editorChoiceIds ?? []).includes(a.id);
            return (
              <div key={a.id}>
                {/* Mobile card layout (below sm:) */}
                <div className="sm:hidden flex flex-col gap-3 px-4 py-4">
                  <div className="min-w-0">
                    <p style={{ color: colors.heading, fontSize: "0.9rem", fontWeight: 600 }} className="truncate">{a.title}</p>
                    <p style={{ color: colors.gray400, fontSize: "0.78rem" }}>{a.author} · {a.grade.split("—")[0].trim()}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs whitespace-nowrap"
                        style={{ backgroundColor: colors.badgeBg, color: colors.badgeText, border: `1px solid ${colors.badgeBorder}` }}
                      >
                        {a.category}
                      </span>
                      {isEC && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs whitespace-nowrap"
                          style={{ backgroundColor: colors.badgeBgStrong, color: colors.badgeText, border: `1px solid ${colors.badgeBorder}` }}
                        >
                          <Star size={10} fill={colors.badgeText} style={{ color: colors.badgeText }} /> EC
                        </span>
                      )}
                      <span style={{ color: colors.heading, fontWeight: 600, fontSize: "0.85rem" }}>
                        {votes[a.id] ?? a.votes} votes
                      </span>
                    </div>
                    <button
                      onClick={() => removeArticle(a)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs hover:opacity-80 transition-opacity shrink-0"
                      style={{ backgroundColor: colors.red50, color: colors.red600, border: `1px solid ${colors.red200}` }}
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                </div>

                {/* Table row layout (sm: and up) */}
                <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] items-center px-5 py-3.5 gap-4">
                  <div className="min-w-0">
                    <p style={{ color: colors.heading, fontSize: "0.85rem", fontWeight: 500 }} className="truncate">{a.title}</p>
                    <p style={{ color: colors.gray400, fontSize: "0.75rem" }}>{a.author} · {a.grade.split("—")[0].trim()}</p>
                  </div>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs whitespace-nowrap"
                    style={{ backgroundColor: colors.badgeBg, color: colors.badgeText, border: `1px solid ${colors.badgeBorder}` }}
                  >
                    {a.category}
                  </span>
                  <span style={{ color: colors.heading, fontWeight: 600, fontSize: "0.875rem", minWidth: "2.5rem", textAlign: "right" }}>
                    {votes[a.id] ?? a.votes}
                  </span>
                  <div className="flex gap-1.5 justify-end">
                    {isEC ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                        style={{ backgroundColor: colors.badgeBgStrong, color: colors.badgeText, border: `1px solid ${colors.badgeBorder}` }}
                      >
                        <Star size={10} fill={colors.badgeText} style={{ color: colors.badgeText }} /> EC
                      </span>
                    ) : null}
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => removeArticle(a)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: colors.red50, color: colors.red600, border: `1px solid ${colors.red200}` }}
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
