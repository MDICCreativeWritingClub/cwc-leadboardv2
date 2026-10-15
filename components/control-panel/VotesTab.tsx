"use client";

import { useState } from "react";
import { Ban } from "lucide-react";
import { colors } from "@/lib/theme";
import { staffSupabase } from "@/lib/staffSupabase";
import { inputStyle, labelStyle } from "./shared";

interface BurstRow {
  user_id: string;
  votes_in_window: number;
  window_start: string;
  total_votes: number;
}

interface VotesTabProps {
  /** Admin and EIC can flag voters; editors can only look. */
  canFlag: boolean;
}

function errorMessage(message: string | undefined): string {
  if (message?.includes("NOT_AUTHORIZED")) return "Your account can't do this.";
  return "Something went wrong. Try again.";
}

export function VotesTab({ canFlag }: VotesTabProps) {
  const [minutes, setMinutes] = useState("10");
  const [minVotes, setMinVotes] = useState("5");
  const [rows, setRows] = useState<BurstRow[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [undoId, setUndoId] = useState("");

  async function search() {
    const m = Number(minutes);
    const v = Number(minVotes);
    if (!Number.isInteger(m) || m < 1 || m > 1440 || !Number.isInteger(v) || v < 2) {
      setNotice({ kind: "error", text: "Use whole numbers: 1 to 1440 minutes and at least 2 votes." });
      return;
    }
    setSearching(true);
    setNotice(null);
    const { data, error } = await staffSupabase.rpc("list_burst_voters", {
      p_window: `${m} minutes`,
      p_min_votes: v,
    });
    setSearching(false);
    if (error) {
      setNotice({ kind: "error", text: errorMessage(error.message) });
      return;
    }
    setRows((data ?? []) as BurstRow[]);
  }

  async function setFlag(userId: string, flagged: boolean) {
    setBusy(userId);
    setNotice(null);
    const { data, error } = await staffSupabase.rpc("flag_voter", { p_user_id: userId, p_flagged: flagged });
    setBusy(null);
    setConfirming(null);
    if (error) {
      setNotice({ kind: "error", text: errorMessage(error.message) });
      return;
    }
    const n = Number(data ?? 0);
    setNotice({
      kind: "ok",
      text: flagged ? `Flagged ${n} vote${n === 1 ? "" : "s"}. They no longer count.` : `Restored ${n} vote${n === 1 ? "" : "s"}.`,
    });
    if (flagged) setRows((prev) => (prev ? prev.filter((r) => r.user_id !== userId) : prev));
  }

  const th: React.CSSProperties = { color: colors.gray500, fontSize: "0.7rem", fontWeight: 500, textAlign: "left", padding: "0.5rem 0.75rem", whiteSpace: "nowrap" };
  const td: React.CSSProperties = { color: colors.gray700, fontSize: "0.8rem", padding: "0.6rem 0.75rem", whiteSpace: "nowrap" };

  return (
    <div className="max-w-3xl flex flex-col gap-5">
      <div className="rounded-xl p-4 border" style={{ backgroundColor: colors.yellow50, borderColor: colors.amber200 }}>
        <p style={{ color: colors.amber800, fontSize: "0.8rem" }}>
          Find accounts that cast many votes in a short time. A burst is a hint, not proof, so check before flagging.
          Flagging removes all of that account&apos;s votes from the count. {canFlag ? "You can undo it at any time." : "Only Admin and Editor in Chief can flag."}
        </p>
      </div>

      <div className="flex items-end gap-3 flex-wrap">
        <div>
          <label style={labelStyle} htmlFor="burst-minutes">Within (minutes)</label>
          <input id="burst-minutes" type="number" min={1} max={1440} style={{ ...inputStyle, width: "8rem" }} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="burst-votes">At least (votes)</label>
          <input id="burst-votes" type="number" min={2} style={{ ...inputStyle, width: "8rem" }} value={minVotes} onChange={(e) => setMinVotes(e.target.value)} />
        </div>
        <button
          onClick={search}
          disabled={searching}
          className="px-5 py-2.5 rounded-xl text-sm text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          style={{ backgroundColor: colors.green900 }}
        >
          {searching ? "Searching…" : "Find burst voters"}
        </button>
      </div>

      {notice && (
        <p style={{ color: notice.kind === "ok" ? colors.green700 : colors.red600, fontSize: "0.8rem" }}>{notice.text}</p>
      )}

      {rows && (
        rows.length === 0 ? (
          <div className="text-center py-10" style={{ color: colors.gray400 }}>No accounts match these settings.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: colors.gray200, backgroundColor: colors.surface }}>
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.gray200}` }}>
                  <th style={th}>Account</th>
                  <th style={th}>Votes in window</th>
                  <th style={th}>Started</th>
                  <th style={th}>All votes</th>
                  {canFlag && <th style={th} />}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.user_id} style={{ borderBottom: `1px solid ${colors.gray100}` }}>
                    <td style={td} title={r.user_id}>{r.user_id.slice(0, 8)}…</td>
                    <td style={td}>{r.votes_in_window}</td>
                    <td style={td}>{new Date(r.window_start).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                    <td style={td}>{r.total_votes}</td>
                    {canFlag && (
                      <td style={{ ...td, textAlign: "right" }}>
                        {confirming === r.user_id ? (
                          <span className="inline-flex gap-2">
                            <button
                              onClick={() => setFlag(r.user_id, true)}
                              disabled={busy === r.user_id}
                              className="px-3 py-1 rounded-full text-xs text-white disabled:opacity-50"
                              style={{ backgroundColor: colors.red600 }}
                            >
                              {busy === r.user_id ? "Flagging…" : "Confirm flag"}
                            </button>
                            <button
                              onClick={() => setConfirming(null)}
                              className="px-3 py-1 rounded-full text-xs"
                              style={{ backgroundColor: colors.gray100, color: colors.gray700 }}
                            >
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setConfirming(r.user_id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all active:scale-95"
                            style={{ backgroundColor: colors.red50, color: colors.red600 }}
                          >
                            <Ban size={12} /> Flag
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {canFlag && (
        <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ borderColor: colors.gray200, backgroundColor: colors.surface }}>
          <label style={{ ...labelStyle, marginBottom: 0 }} htmlFor="undo-id">Restore a flagged account</label>
          <div className="flex gap-2 flex-wrap">
            <input
              id="undo-id"
              style={{ ...inputStyle, flex: 1, minWidth: "16rem" }}
              placeholder="Paste the full account ID"
              value={undoId}
              onChange={(e) => setUndoId(e.target.value)}
            />
            <button
              onClick={() => { const id = undoId.trim(); if (id) { setFlag(id, false); setUndoId(""); } }}
              disabled={!undoId.trim() || busy !== null}
              className="px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ backgroundColor: colors.gray100, color: colors.gray700 }}
            >
              Restore votes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
