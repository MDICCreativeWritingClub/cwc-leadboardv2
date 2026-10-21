"use client";

import { useState } from "react";
import { CheckCircle, Users, X, ChevronDown, ChevronUp } from "lucide-react";
import { colors } from "@/lib/theme";
import { usePublishedArticles } from "@/hooks/usePublishedArticles";
import { useVotes } from "@/context/VoteContext";

export type PanelTab = "overview" | "wom" | "content" | "team" | "archive" | "notices" | "confirmation";

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.6rem 1rem",
  borderRadius: "0.75rem",
  border: `1px solid ${colors.gray200}`,
  fontSize: "0.875rem",
  outline: "none",
  backgroundColor: colors.surface,
  color: colors.gray900,
};

export const labelStyle: React.CSSProperties = {
  color: colors.gray700,
  fontSize: "0.8rem",
  fontWeight: 500,
  display: "block",
  marginBottom: "0.4rem",
};

export function SaveBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div
      className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg z-50"
      style={{ backgroundColor: colors.green900, color: colors.white }}
    >
      <CheckCircle size={16} />
      <span style={{ fontSize: "0.875rem" }}>Changes saved</span>
    </div>
  );
}

export function StatCard({ icon, label, value, sub, onClick }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className="rounded-xl border p-5"
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.gray200,
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-3" style={{ color: colors.green600 }}>
        {icon}
        <span style={{ color: colors.gray500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {label}
        </span>
      </div>
      <p style={{ color: colors.heading, fontWeight: 700, fontSize: "1.75rem", lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ color: colors.gray400, fontSize: "0.75rem", marginTop: "0.25rem" }}>{sub}</p>}
    </div>
  );
}

export function WritersListModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { allPublished } = usePublishedArticles();
  const { votes } = useVotes();
  const [expandedWriter, setExpandedWriter] = useState<string | null>(null);

  if (!isOpen) return null;

  const writersMap = new Map<string, { articles: typeof allPublished; totalVotes: number }>();
  allPublished.forEach((article) => {
    const existing = writersMap.get(article.author);
    if (existing) {
      existing.articles.push(article);
      existing.totalVotes += votes[article.id] ?? article.votes;
    } else {
      writersMap.set(article.author, {
        articles: [article],
        totalVotes: votes[article.id] ?? article.votes,
      });
    }
  });

  const writers = Array.from(writersMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.totalVotes - a.totalVotes);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-[var(--token-white)] rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: colors.gray200 }}>
          <div className="flex items-center gap-2">
            <Users size={18} style={{ color: colors.green600 }} />
            <h2 style={{ color: colors.heading, fontWeight: 700, fontSize: "1.2rem" }}>All Writers</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[var(--token-gray100)] transition-all active:scale-90">
            <X size={18} style={{ color: colors.gray500 }} />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[60vh] p-5">
          <div className="flex flex-col gap-3">
            {writers.map((writer) => (
              <div key={writer.name} className="border rounded-xl overflow-hidden" style={{ borderColor: colors.gray200 }}>
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-[var(--token-gray100)]"
                  onClick={() => setExpandedWriter(expandedWriter === writer.name ? null : writer.name)}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: colors.green900 }}
                  >
                    {writer.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: colors.heading, fontWeight: 600, fontSize: "0.9rem" }}>{writer.name}</p>
                    <p style={{ color: colors.gray500, fontSize: "0.75rem" }}>
                      {writer.articles.length} {writer.articles.length === 1 ? "writing" : "writings"} · {writer.totalVotes} votes
                    </p>
                  </div>
                  {expandedWriter === writer.name ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
                {expandedWriter === writer.name && (
                  <div className="border-t bg-gray-50 dark:bg-[var(--token-gray50)] p-4" style={{ borderColor: colors.gray200 }}>
                    {writer.articles.map((article) => (
                      <div key={article.id} className="flex items-center justify-between py-2">
                        <div className="flex-1 min-w-0">
                          <p style={{ color: colors.heading, fontSize: "0.85rem" }} className="truncate">{article.title}</p>
                          <p style={{ color: colors.gray400, fontSize: "0.7rem" }}>{article.category}</p>
                        </div>
                        <span style={{ color: colors.green600, fontWeight: 600, fontSize: "0.85rem" }}>
                          {votes[article.id] ?? article.votes} votes
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
