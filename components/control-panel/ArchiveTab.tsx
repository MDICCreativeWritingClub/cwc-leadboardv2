"use client";

import { useState } from "react";
import { Archive, Save, Trash2 } from "lucide-react";
import type { Article } from "@/data/articles";
import type { SiteConfig, ArchiveEntry } from "@/context/SiteConfigContext";
import { colors } from "@/lib/theme";
import { inputStyle, labelStyle } from "./shared";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface ArchiveTabProps {
  allPublished: Article[];
  votes: Record<string, number>;
  config: SiteConfig;
  updateConfig: (partial: Partial<SiteConfig>) => void;
  setSaved: (saved: boolean) => void;
}

export function ArchiveTab({ allPublished, votes, config, updateConfig, setSaved }: ArchiveTabProps) {
  const [archiveMonth, setArchiveMonth] = useState("");
  const [archiveYear, setArchiveYear] = useState(new Date().getFullYear().toString());
  const [showAddArchive, setShowAddArchive] = useState(false);
  const [archiveForm, setArchiveForm] = useState({
    writerName: "",
    writerGrade: "",
    writerVotes: "",
    writingTitle: "",
    writingAuthor: "",
    writingVotes: "",
    writingArticleId: "",
  });

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyArticles = allPublished.filter((a) => {
    const d = new Date(a.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const monthlyWriters = new Map<string, { totalVotes: number; articles: typeof monthlyArticles }>();
  monthlyArticles.forEach((article) => {
    const existing = monthlyWriters.get(article.author);
    if (existing) {
      existing.articles.push(article);
      existing.totalVotes += votes[article.id] ?? article.votes;
    } else {
      monthlyWriters.set(article.author, {
        articles: [article],
        totalVotes: votes[article.id] ?? article.votes,
      });
    }
  });

  const topMonthlyWriters = Array.from(monthlyWriters.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.totalVotes - a.totalVotes)
    .slice(0, 3);

  const topMonthlyWritings = monthlyArticles
    .map((a) => ({ ...a, currentVotes: votes[a.id] ?? a.votes }))
    .sort((a, b) => b.currentVotes - a.currentVotes)
    .slice(0, 3);

  function handleArchiveReset() {
    if (!archiveMonth) {
      alert("Please select a month.");
      return;
    }

    const newArchive: ArchiveEntry = {
      month: archiveMonth,
      year: parseInt(archiveYear),
      monthLabel: `${archiveMonth} ${archiveYear}`,
      topWriters: topMonthlyWriters.map((w, i) => ({
        rank: i + 1,
        name: w.name,
        grade: allPublished.find((a) => a.author === w.name)?.grade ?? "",
        totalVotes: w.totalVotes,
      })),
      topWritings: topMonthlyWritings.map((w, i) => ({
        rank: i + 1,
        title: w.title,
        author: w.author,
        votes: w.currentVotes,
        articleId: w.id,
      })),
    };

    updateConfig({
      archives: [...(config.archives ?? []), newArchive],
    });

    setArchiveMonth("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
            <div className="max-w-3xl flex flex-col gap-6">
              <div className="rounded-xl p-4 border" style={{ backgroundColor: colors.yellow50, borderColor: colors.amber200 }}>
                <p style={{ color: colors.amber800, fontSize: "0.8rem" }}>
                  Archive monthly leaderboards at the end of each month. The top 3 writers and writings will be saved permanently.
                </p>
              </div>

              {/* Monthly Reset Tool */}
              <div className="rounded-xl border p-5" style={{ borderColor: colors.gray200, backgroundColor: colors.surface }}>
                <h3 style={{ color: colors.heading, fontWeight: 600, fontSize: "1rem", marginBottom: "1rem" }}>
                  Monthly Reset & Archive
                </h3>
                <p style={{ color: colors.gray500, fontSize: "0.8rem", marginBottom: "1rem" }}>
                  Current month&apos;s top performers (auto-calculated):
                </p>

                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div className="rounded-lg p-3 min-w-0" style={{ backgroundColor: colors.badgeBg }}>
                    <p style={{ color: colors.heading, fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.5rem" }}>Top Writers This Month</p>
                    {topMonthlyWriters.length === 0 ? (
                      <p style={{ color: colors.gray400, fontSize: "0.75rem" }}>No data yet</p>
                    ) : (
                      topMonthlyWriters.map((w, i) => (
                        <div key={w.name} className="flex items-center gap-2 py-1 min-w-0">
                          <span style={{ color: colors.green600, fontWeight: 600, fontSize: "0.8rem" }} className="shrink-0">#{i + 1}</span>
                          <span style={{ color: colors.gray700, fontSize: "0.8rem" }} className="truncate">{w.name}</span>
                          <span style={{ color: colors.gray400, fontSize: "0.7rem" }} className="shrink-0">({w.totalVotes} votes)</span>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="rounded-lg p-3 min-w-0" style={{ backgroundColor: colors.badgeBg }}>
                    <p style={{ color: colors.heading, fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.5rem" }}>Top Writings This Month</p>
                    {topMonthlyWritings.length === 0 ? (
                      <p style={{ color: colors.gray400, fontSize: "0.75rem" }}>No data yet</p>
                    ) : (
                      topMonthlyWritings.map((w, i) => (
                        <div key={w.id} className="flex items-center gap-2 py-1 min-w-0">
                          <span style={{ color: colors.green600, fontWeight: 600, fontSize: "0.8rem" }} className="shrink-0">#{i + 1}</span>
                          <span style={{ color: colors.gray700, fontSize: "0.8rem" }} className="truncate">{w.title}</span>
                          <span style={{ color: colors.gray400, fontSize: "0.7rem" }} className="shrink-0">({w.currentVotes} votes)</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                  <div className="flex-1">
                    <label style={labelStyle}>Month</label>
                    <select
                      style={{ ...inputStyle, color: colors.gray900 }}
                      value={archiveMonth}
                      onChange={(e) => setArchiveMonth(e.target.value)}
                    >
                      <option value="">Select month</option>
                      {monthNames.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label style={labelStyle}>Year</label>
                    <input
                      style={inputStyle}
                      type="number"
                      value={archiveYear}
                      onChange={(e) => setArchiveYear(e.target.value)}
                      min="2024"
                      max="2030"
                    />
                  </div>
                  <button
                    onClick={handleArchiveReset}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm hover:opacity-90 transition-all active:scale-95 shrink-0 w-full sm:w-auto"
                    style={{ backgroundColor: colors.green900 }}
                  >
                    <Archive size={14} /> Save to Archive
                  </button>
                </div>
              </div>

              {/* Add to Archive Manually */}
              <div className="rounded-xl border p-5" style={{ borderColor: colors.gray200, backgroundColor: colors.surface }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 style={{ color: colors.heading, fontWeight: 600, fontSize: "1rem" }}>
                    Manage Archive Entries
                  </h3>
                </div>

                {showAddArchive && (
                  <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: colors.gray50, border: `1px solid ${colors.gray200}` }}>
                    <p style={{ color: colors.gray700, fontWeight: 500, fontSize: "0.85rem", marginBottom: "0.75rem" }}>Add Archive Entry</p>
                    <div className="grid sm:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label style={labelStyle}>Month</label>
                        <select
                          style={{ ...inputStyle, color: colors.gray900 }}
                          value={archiveForm.writerGrade}
                          onChange={(e) => setArchiveForm((f) => ({ ...f, writerGrade: e.target.value }))}
                        >
                          <option value="">Select month</option>
                          {monthNames.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Year</label>
                        <input
                          style={inputStyle}
                          type="number"
                          value={archiveForm.writingVotes}
                          onChange={(e) => setArchiveForm((f) => ({ ...f, writingVotes: e.target.value }))}
                          placeholder="2026"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowAddArchive(false);
                          setArchiveForm({ writerName: "", writerGrade: "", writerVotes: "", writingTitle: "", writingAuthor: "", writingVotes: "", writingArticleId: "" });
                        }}
                        className="px-4 py-2 rounded-xl text-sm border hover:bg-gray-50 dark:hover:bg-[var(--token-gray100)] transition-all active:scale-95"
                        style={{ borderColor: colors.gray200, color: colors.gray700 }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Archive List */}
                <div className="flex flex-col gap-4">
                  {(config.archives ?? []).length === 0 && (
                    <p style={{ color: colors.gray400, fontSize: "0.8rem" }}>No archives saved yet.</p>
                  )}
                  {(config.archives ?? []).map((archive, idx) => (
                    <div key={idx} className="rounded-xl border overflow-hidden" style={{ borderColor: colors.gray200 }}>
                      <div className="px-5 py-3 flex items-center justify-between" style={{ backgroundColor: colors.gray50 }}>
                        <div className="flex items-center gap-2">
                          <Archive size={14} style={{ color: colors.green600 }} />
                          <span style={{ color: colors.heading, fontWeight: 600, fontSize: "0.9rem" }}>{archive.monthLabel}</span>
                        </div>
                        <button
                          onClick={() => {
                            if (confirm(`Delete archive for ${archive.monthLabel}?`)) {
                              const updated = (config.archives ?? []).filter((_, i) => i !== idx);
                              updateConfig({ archives: updated });
                            }
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs hover:opacity-80"
                          style={{ backgroundColor: colors.red50, color: colors.red600, border: `1px solid ${colors.red200}` }}
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                      <div className="p-5 bg-white dark:bg-[var(--token-white)]">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="min-w-0">
                            <p style={{ color: colors.green600, fontSize: "0.75rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>Top Writers</p>
                            {archive.topWriters.map((w) => (
                              <div key={w.rank} className="flex items-center gap-2 py-1 min-w-0">
                                <span style={{ color: colors.green600, fontWeight: 600, fontSize: "0.8rem" }} className="shrink-0">#{w.rank}</span>
                                <span style={{ color: colors.gray700, fontSize: "0.8rem" }} className="truncate">{w.name}</span>
                                <span style={{ color: colors.gray400, fontSize: "0.7rem" }} className="shrink-0">({w.totalVotes} votes)</span>
                              </div>
                            ))}
                          </div>
                          <div className="min-w-0">
                            <p style={{ color: colors.green600, fontSize: "0.75rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>Top Writings</p>
                            {archive.topWritings.map((w) => (
                              <div key={w.rank} className="flex items-center gap-2 py-1 min-w-0">
                                <span style={{ color: colors.green600, fontWeight: 600, fontSize: "0.8rem" }} className="shrink-0">#{w.rank}</span>
                                <span style={{ color: colors.gray700, fontSize: "0.8rem" }} className="truncate">{w.title}</span>
                                <span style={{ color: colors.gray400, fontSize: "0.7rem" }} className="shrink-0">({w.votes} votes)</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
      
  );
}
