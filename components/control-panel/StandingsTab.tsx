"use client";

import { useEffect, useState } from "react";
import { colors } from "@/lib/theme";
import { staffSupabase } from "@/lib/staffSupabase";

interface StandingRow {
  rank: number;
  article_id: string;
  title: string;
  writer_name: string;
  judges: number;
  avg_theme: number | null;
  avg_writing: number | null;
  avg_voice: number | null;
  avg_structure: number | null;
  judge_score: number | null;
  valid_votes: number;
  vote_points: number;
  points: number | null;
}

function fmt(n: number | null | undefined): string {
  return n === null || n === undefined ? "—" : String(Number(n));
}

export function StandingsTab() {
  const [rows, setRows] = useState<StandingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error: rpcError } = await staffSupabase.rpc("get_leaderboard_staff");
    if (rpcError) {
      setError("Couldn't load the standings.");
    } else {
      setRows((data ?? []) as StandingRow[]);
      setError(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const th: React.CSSProperties = { color: colors.gray500, fontSize: "0.7rem", fontWeight: 500, textAlign: "right", padding: "0.5rem 0.6rem", whiteSpace: "nowrap" };
  const td: React.CSSProperties = { color: colors.gray700, fontSize: "0.8rem", textAlign: "right", padding: "0.55rem 0.6rem", whiteSpace: "nowrap" };

  return (
    <div className="max-w-5xl flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p style={{ color: colors.gray500, fontSize: "0.8rem" }}>
          Averages across all judges. Votes count only unflagged votes.
        </p>
        <button
          onClick={load}
          disabled={loading}
          className="px-4 py-1.5 rounded-full text-xs transition-all active:scale-95 disabled:opacity-50"
          style={{ backgroundColor: colors.gray100, color: colors.gray700 }}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      {error && <p style={{ color: colors.red600, fontSize: "0.8rem" }}>{error}</p>}
      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: colors.gray200, backgroundColor: colors.surface }}>
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${colors.gray200}` }}>
              <th style={{ ...th, textAlign: "left" }}>#</th>
              <th style={{ ...th, textAlign: "left" }}>Writing</th>
              <th style={th}>Judges</th>
              <th style={th}>Theme</th>
              <th style={th}>Writing</th>
              <th style={th}>Voice</th>
              <th style={th}>Structure</th>
              <th style={th}>Judge total</th>
              <th style={th}>Votes</th>
              <th style={th}>Vote pts</th>
              <th style={th}>Points</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={11} style={{ ...td, textAlign: "center", color: colors.gray400, padding: "1.5rem" }}>No approved writings yet.</td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.article_id} style={{ borderBottom: `1px solid ${colors.gray100}` }}>
                <td style={{ ...td, textAlign: "left" }}>{r.rank}</td>
                <td style={{ ...td, textAlign: "left", whiteSpace: "normal", minWidth: "12rem" }}>
                  <span style={{ color: colors.heading, fontWeight: 500 }}>{r.title}</span>
                  <br />
                  <span style={{ color: colors.gray400, fontSize: "0.7rem" }}>{r.writer_name}</span>
                </td>
                <td style={td}>{r.judges}</td>
                <td style={td}>{fmt(r.avg_theme)}</td>
                <td style={td}>{fmt(r.avg_writing)}</td>
                <td style={td}>{fmt(r.avg_voice)}</td>
                <td style={td}>{fmt(r.avg_structure)}</td>
                <td style={td}>{fmt(r.judge_score)}</td>
                <td style={td}>{r.valid_votes}</td>
                <td style={td}>{fmt(r.vote_points)}</td>
                <td style={{ ...td, color: colors.heading, fontWeight: 700 }}>{fmt(r.points)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
