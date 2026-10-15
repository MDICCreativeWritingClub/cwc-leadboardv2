"use client";

import { colors } from "@/lib/theme";

import { useState } from "react";
import Link from "next/link";
import { AuthorByline } from "@/components/AuthorByline";
import { Trophy, ThumbsUp } from "lucide-react";
import { useLeaderboard, type LeaderboardSort } from "@/hooks/useLeaderboard";

const FILTERS: { key: LeaderboardSort; label: string }[] = [
  { key: "points", label: "Points" },
  { key: "likes", label: "Likes" },
  { key: "theme", label: "Theme" },
  { key: "structure", label: "Structure" },
  { key: "voice", label: "Voice" },
  { key: "writing", label: "Writing" },
];

const MEDALS = ["🥇", "🥈", "🥉"];
const TOP3_GLOW = ["rgba(250,204,21,0.35)", "rgba(148,163,184,0.3)", "rgba(251,146,60,0.3)"];

/** Subtle border/shadow highlight applied to the whole row for ranks 1-3. */
function topRowStyle(rank: number): React.CSSProperties {
  if (rank >= 3) return { border: `1px solid ${colors.gray200}` };
  return {
    border: `1px solid ${TOP3_GLOW[rank]}`,
    boxShadow: `0 0 0 1px ${TOP3_GLOW[rank]}, 0 2px 10px -4px ${TOP3_GLOW[rank]}`,
  };
}

function RankBadge({ rank }: { rank: number }) {
  const isTop3 = rank < 3;
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
      style={{
        backgroundColor: rank === 0 ? colors.yellow100 : rank === 1 ? colors.gray100 : rank === 2 ? colors.red50 : colors.gray50,
        color: rank === 0 ? colors.amber600 : rank === 1 ? colors.gray500 : rank === 2 ? colors.red600 : colors.gray400,
        boxShadow: isTop3 ? `0 0 0 3px ${rank === 0 ? "rgba(250,204,21,0.25)" : rank === 1 ? "rgba(148,163,184,0.2)" : "rgba(251,146,60,0.2)"}` : undefined,
      }}
    >
      {isTop3 ? <span style={{ fontSize: "0.85rem" }}>{MEDALS[rank]}</span> : rank + 1}
    </div>
  );
}

export function Leaderboard() {
  const [sort, setSort] = useState<LeaderboardSort>("points");
  const [monthOnly, setMonthOnly] = useState(true);
  const { rows, loading, error } = useLeaderboard(sort, monthOnly, 20);

  const activeLabel = FILTERS.find((f) => f.key === sort)?.label ?? "Points";
  const caption =
    sort === "points" ? "Ranked by total points."
    : sort === "likes" ? "Ranked by likes."
    : `Ranked by ${activeLabel} score.`;

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: colors.green200, backgroundColor: colors.surface }}>
      <div className="px-5 py-3.5 flex items-center justify-between gap-3" style={{ backgroundColor: colors.green900 }}>
        <div className="flex items-center gap-2">
          <Trophy size={16} style={{ color: colors.yellow400 }} />
          <span style={{ fontFamily: "var(--font-display)", color: colors.white, fontWeight: 600, fontSize: "0.95rem" }}>Leaderboard</span>
        </div>
        <div className="flex gap-1">
          {[{ v: true, label: "This month" }, { v: false, label: "All time" }].map((p) => (
            <button
              key={p.label}
              onClick={() => setMonthOnly(p.v)}
              className="px-3 py-1 rounded-full text-xs transition-all active:scale-95"
              style={{
                backgroundColor: monthOnly === p.v ? colors.white : "transparent",
                color: monthOnly === p.v ? colors.green900 : colors.white,
                border: `1px solid ${monthOnly === p.v ? colors.white : "rgba(255,255,255,0.35)"}`,
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 p-2 border-b overflow-x-auto" style={{ borderColor: colors.gray200 }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setSort(f.key)}
            className="px-3.5 py-1.5 rounded-lg text-xs transition-all active:scale-95 shrink-0"
            style={{
              backgroundColor: sort === f.key ? colors.green900 : colors.gray100,
              color: sort === f.key ? colors.white : colors.gray700,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        <p style={{ color: colors.gray400, fontSize: "0.72rem", marginBottom: "0.75rem" }}>{caption}</p>

        {error && rows.length === 0 ? (
          <p style={{ color: colors.red600, fontSize: "0.8rem", textAlign: "center", padding: "1rem" }}>{error}</p>
        ) : loading && rows.length === 0 ? (
          <p style={{ color: colors.gray400, fontSize: "0.8rem", textAlign: "center", padding: "1rem" }}>Loading…</p>
        ) : rows.length === 0 ? (
          <p style={{ color: colors.gray400, fontSize: "0.8rem", textAlign: "center", padding: "1rem" }}>
            {monthOnly ? "No writings published this month yet." : "No writings published yet."}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {rows.map((row, i) => (
              <Link
                key={row.articleId}
                href={`/article/${row.articleId}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-[var(--token-gray100)] transition-all hover:-translate-y-0.5 hover:shadow-sm"
                style={topRowStyle(i)}
              >
                <RankBadge rank={i} />
                <div className="flex-1 min-w-0">
                  <p style={{ color: colors.heading, fontWeight: 500, fontSize: "0.85rem" }} className="truncate">{row.title}</p>
                  <p style={{ color: colors.gray400, fontSize: "0.7rem" }} className="flex items-center gap-1.5 flex-wrap">
                    <AuthorByline name={row.writerName} studentCode={row.studentCode} size={16} textStyle={{ fontSize: "0.7rem" }} />
                    <span>{row.grade}</span>
                  </p>
                </div>
                {sort === "points" && (
                  <span className="shrink-0" style={{ color: row.displayValue === null ? colors.gray400 : colors.badgeText, fontSize: row.displayValue === null ? "0.72rem" : "0.85rem", fontWeight: 600 }}>
                    {row.displayValue === null ? "Not scored yet" : `${row.displayValue} pts`}
                  </span>
                )}
                {sort === "likes" && (
                  <div className="flex items-center gap-1 shrink-0">
                    <ThumbsUp size={12} style={{ color: colors.green600 }} />
                    <span style={{ color: colors.badgeText, fontSize: "0.85rem", fontWeight: 600 }}>{row.displayValue ?? 0}</span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
