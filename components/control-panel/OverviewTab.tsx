"use client";

import { FileText, ThumbsUp, Users } from "lucide-react";
import type { Article } from "@/data/articles";
import type { SiteConfig } from "@/context/SiteConfigContext";
import { colors } from "@/lib/theme";
import { StatCard } from "./shared";

interface OverviewTabProps {
  allPublished: Article[];
  votes: Record<string, number>;
  totalVotes: number;
  pendingCount: number;
  approvedCount: number;
  uniqueWriters: number;
  config: SiteConfig;
  setShowWritersModal: (show: boolean) => void;
}

export function OverviewTab({
  allPublished,
  votes,
  totalVotes,
  pendingCount,
  approvedCount,
  uniqueWriters,
  config,
  setShowWritersModal,
}: OverviewTabProps) {
  return (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<FileText size={15} />} label="Published"   value={allPublished.length} sub="total pieces" />
                <StatCard icon={<ThumbsUp size={15} />} label="Total Votes" value={totalVotes} sub="across all pieces" />
                <StatCard icon={<FileText size={15} />} label="Submissions" value={pendingCount} sub={`${approvedCount} approved`} />
                <StatCard
                  icon={<Users size={15} />}
                  label="Writers"
                  value={uniqueWriters}
                  sub="unique authors — click to view"
                  onClick={() => setShowWritersModal(true)}
                />
              </div>

              <div className="rounded-xl border overflow-hidden" style={{ borderColor: colors.gray200 }}>
                <div className="px-5 py-3 border-b" style={{ backgroundColor: colors.gray50, borderColor: colors.gray200 }}>
                  <p style={{ color: colors.gray700, fontWeight: 600, fontSize: "0.875rem" }}>Top 5 by votes this issue</p>
                </div>
                <div className="divide-y bg-white dark:bg-[var(--token-white)]">
                  {[...allPublished]
                    .sort((a, b) => (votes[b.id] ?? b.votes) - (votes[a.id] ?? a.votes))
                    .slice(0, 5)
                    .map((a, i) => (
                      <div key={a.id} className="flex items-center gap-4 px-5 py-3">
                        <span style={{ color: colors.gray400, fontSize: "0.8rem", width: "1.2rem" }}>{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p style={{ color: colors.heading, fontSize: "0.85rem", fontWeight: 500 }} className="truncate">{a.title}</p>
                          <p style={{ color: colors.gray400, fontSize: "0.75rem" }}>{a.author}</p>
                        </div>
                        <span
                          className="px-2.5 py-0.5 rounded-full text-xs"
                          style={{ backgroundColor: colors.badgeBg, color: colors.badgeText, border: `1px solid ${colors.badgeBorder}` }}
                        >
                          {a.category}
                        </span>
                        <span style={{ color: colors.heading, fontWeight: 600, fontSize: "0.875rem", minWidth: "2.5rem", textAlign: "right" }}>
                          {votes[a.id] ?? a.votes}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-xl border p-5" style={{ borderColor: colors.gray200, backgroundColor: colors.surface }}>
                  <p style={{ color: colors.gray500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>
                    Active Theme
                  </p>
                  <p style={{ color: colors.heading, fontWeight: 700, fontSize: "1.2rem" }}>{config.themeName}</p>
                  <p style={{ color: colors.gray500, fontSize: "0.8rem" }}>{config.themeMonth}</p>
                </div>
                <div className="rounded-xl border p-5" style={{ borderColor: colors.gray200, backgroundColor: colors.surface }}>
                  <p style={{ color: colors.gray500, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>
                    Writer of the Month
                  </p>
                  <p style={{ color: colors.heading, fontWeight: 700, fontSize: "1.2rem" }}>{config.womName}</p>
                  <p style={{ color: colors.gray500, fontSize: "0.8rem" }}>{config.womGrade}</p>
                </div>
              </div>
            </div>
      
  );
}
