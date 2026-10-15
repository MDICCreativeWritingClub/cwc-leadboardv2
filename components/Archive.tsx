"use client";

import { colors } from "@/lib/theme";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { AuthorLink } from "@/components/AuthorLink";
import {
  Trophy, BookOpen, Archive as ArchiveIcon, Crown, ThumbsUp, Users,
} from "lucide-react";
import type { PastAwardee, StaffMember } from "@/data/articles";
import { usePublishedArticles } from "@/hooks/usePublishedArticles";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { useVotes } from "@/context/VoteContext";
import { supabase } from "@/lib/supabase";

type ArchiveTab = "awardees" | "submissions" | "leaderboards" | "past_members";

const ARCHIVE_TAB_KEY = "cwc_archive_tab";

const monthOrder = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const sectionLabel: Record<StaffMember["type"], string> = {
  teacher: "Executives",
  student: "Editorial Team",
  class_rep: "Class Representatives",
  media: "Media Team",
};

function PastMemberCard({ member }: { member: StaffMember }) {
  return (
    <div
      className="flex items-start gap-4 p-4 rounded-xl border"
      style={{ backgroundColor: colors.gray50, borderColor: colors.gray200, opacity: 0.85 }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white"
        style={{ backgroundColor: colors.gray400 }}
      >
        {member.name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p style={{ color: colors.heading, fontWeight: 600, fontSize: "0.9rem" }}>{member.name}</p>
          {member.isTeacher && (
            <span
              className="px-2 py-0.5 rounded-full text-[0.65rem] font-medium"
              style={{ backgroundColor: colors.gray300, color: colors.gray700 }}
            >
              Teacher
            </span>
          )}
        </div>
        <p style={{ color: colors.gray500, fontSize: "0.8rem" }}>{member.role}</p>
        {member.grade && <p style={{ color: colors.gray400, fontSize: "0.75rem" }}>{member.grade}</p>}
        <p className="sm:hidden mt-1" style={{ color: colors.gray400, fontSize: "0.75rem" }}>{member.period}</p>
      </div>
      <span className="hidden sm:inline-block shrink-0" style={{ color: colors.gray400, fontSize: "0.75rem", whiteSpace: "nowrap" }}>{member.period}</span>
    </div>
  );
}

function AwardeeRow({
  awardee,
  isFirst,
}: {
  awardee: PastAwardee;
  isFirst: boolean;
}) {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-sm"
      style={{
        backgroundColor: isFirst ? colors.badgeBg : colors.surface,
        borderColor: isFirst ? colors.badgeBorder : colors.gray200,
      }}
    >
      <div className="flex items-center gap-4 sm:contents">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{
            backgroundColor: isFirst ? colors.badgeBgStrong : colors.gray100,
            border: isFirst ? `2px solid ${colors.green400}` : "none",
          }}
        >
          {isFirst ? (
            <Crown size={18} style={{ color: colors.green600 }} />
          ) : (
            <Trophy size={16} style={{ color: colors.gray400 }} />
          )}
        </div>
        <div className="flex-1 min-w-0 sm:hidden">
          <p style={{ color: colors.heading, fontWeight: 600, fontSize: "0.9rem" }}>
            <AuthorLink name={awardee.name} studentCode={awardee.studentCode} />
          </p>
          <p style={{ color: colors.gray500, fontSize: "0.75rem" }}>{awardee.grade}</p>
        </div>
      </div>
      <div className="hidden sm:block flex-1 min-w-0">
        <p style={{ color: colors.heading, fontWeight: 600, fontSize: "0.9rem" }}>
          <AuthorLink name={awardee.name} studentCode={awardee.studentCode} />
        </p>
        <p style={{ color: colors.gray500, fontSize: "0.75rem" }}>{awardee.grade}</p>
        <p style={{ color: colors.gray700, fontSize: "0.8rem", marginTop: "0.15rem", fontStyle: "italic" }}>
          &quot;{awardee.title}&quot;
        </p>
      </div>
      <p
        className="sm:hidden"
        style={{ color: colors.gray700, fontSize: "0.8rem", fontStyle: "italic" }}
      >
        &quot;{awardee.title}&quot;
      </p>
      <div className="flex items-center justify-between sm:block sm:text-right shrink-0">
        <span
          className="inline-block px-2.5 py-0.5 rounded-full text-xs mb-1"
          style={{ backgroundColor: colors.badgeBg, color: colors.badgeText, border: `1px solid ${colors.badgeBorder}` }}
        >
          {awardee.category}
        </span>
        <p style={{ color: colors.gray400, fontSize: "0.7rem" }}>
          {awardee.month} {awardee.year}
        </p>
        <p style={{ color: colors.green600, fontSize: "0.8rem", fontWeight: 600 }}>
          {awardee.votes} votes
        </p>
      </div>
    </div>
  );
}

export function Archive() {
  const [tab, setTab] = useState<ArchiveTab>(() => {
    if (typeof window === "undefined") return "awardees";
    const stored = sessionStorage.getItem(ARCHIVE_TAB_KEY);
    if (stored === "submissions" || stored === "awardees" || stored === "leaderboards" || stored === "past_members") return stored;
    return "awardees";
  });
  const { allPublished } = usePublishedArticles();
  const { pastMembers } = useTeamMembers();
  const { config } = useSiteConfig();
  const { votes } = useVotes();
  const [awardees, setAwardees] = useState<PastAwardee[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadAwardees() {
      const { data: wins } = await supabase
        .from("recognitions")
        .select("student_code, name, article_id, awarded_at")
        .eq("category", "wom")
        .order("awarded_at", { ascending: false });

      if (!wins || wins.length === 0) {
        if (!cancelled) setAwardees([]);
        return;
      }

      const articleIds = wins.map((w) => w.article_id).filter((id): id is string => !!id);
      const { data: subs } = await supabase
        .from("submissions")
        .select("id, title, category, grade")
        .in("id", articleIds);

      const subMap = new Map((subs ?? []).map((s) => [s.id as string, s]));

      const { data: voteRows } = await supabase
        .from("votes")
        .select("article_id, count")
        .in("article_id", articleIds);

      const voteMap = new Map((voteRows ?? []).map((v) => [v.article_id as string, Number(v.count)]));

      const mapped: PastAwardee[] = wins.map((w) => {
        const sub = w.article_id ? subMap.get(w.article_id) : undefined;
        const d = new Date(w.awarded_at as string);
        return {
          month: d.toLocaleString("en-GB", { month: "long" }),
          year: d.getFullYear(),
          name: w.name as string,
          studentCode: w.student_code as string,
          grade: (sub?.grade as string) ?? "",
          title: (sub?.title as string) ?? "",
          category: (sub?.category as PastAwardee["category"]) ?? "Articles",
          votes: w.article_id ? voteMap.get(w.article_id) ?? 0 : 0,
        };
      });

      if (!cancelled) setAwardees(mapped);
    }

    loadAwardees();
    return () => {
      cancelled = true;
    };
  }, []);

  const groupedByYear = useMemo(
    () =>
      awardees.reduce<Record<number, PastAwardee[]>>((acc, a) => {
        if (!acc[a.year]) acc[a.year] = [];
        acc[a.year].push(a);
        return acc;
      }, {}),
    [awardees]
  );
  const sortedYears = useMemo(
    () => Object.keys(groupedByYear).map(Number).sort((a, b) => b - a),
    [groupedByYear]
  );

  useEffect(() => {
    sessionStorage.setItem(ARCHIVE_TAB_KEY, tab);
  }, [tab]);

  const sortedPublished = useMemo(
    () =>
      [...allPublished].sort((a, b) => {
        const [aM, aY] = a.month.split(" ");
        const [bM, bY] = b.month.split(" ");
        if (aY !== bY) return Number(bY) - Number(aY);
        return monthOrder.indexOf(bM) - monthOrder.indexOf(aM);
      }),
    [allPublished],
  );

  const groupedPastMembers = useMemo(
    () =>
      pastMembers.reduce<Record<string, StaffMember[]>>((acc, m) => {
        if (!acc[m.type]) acc[m.type] = [];
        acc[m.type].push(m);
        return acc;
      }, {}),
    [pastMembers],
  );

  const tabConfig: { key: ArchiveTab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "awardees",    label: "Writer of the Month", icon: <Trophy size={14} />,       count: awardees.length },
    { key: "leaderboards", label: "Leaderboard Archives", icon: <Crown size={14} />,     count: (config.archives ?? []).length },
    { key: "submissions", label: "All Submissions",      icon: <BookOpen size={14} />,     count: sortedPublished.length },
    { key: "past_members", label: "Past Members",        icon: <Users size={14} />,        count: pastMembers.length },
  ];

  return (
    <div className="max-w-5xl mx-auto px-5 pt-24 pb-16">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ArchiveIcon size={22} style={{ color: colors.green600 }} />
          <h1 style={{ fontFamily: "var(--font-display)", color: colors.heading, fontWeight: 600, fontSize: "1.9rem" }}>The Archive</h1>
        </div>
        <p style={{ color: colors.gray500, fontSize: "0.9rem" }}>
          A record of everyone who has written for, worked on, and been honoured by Manarat CWC.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap mb-8 pb-5 border-b" style={{ borderColor: colors.gray200 }}>
        {tabConfig.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all active:scale-95 hover:-translate-y-0.5"
            style={{
              backgroundColor: tab === t.key ? colors.green900 : colors.gray100,
              color: tab === t.key ? colors.white : colors.gray700,
            }}
          >
            {t.icon}
            {t.label}
            <span
              className="rounded-full px-1.5 py-0.5 text-xs"
              style={{
                backgroundColor: tab === t.key ? colors.green800 : colors.gray200,
                color: tab === t.key ? colors.green200 : colors.gray500,
              }}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Awardees */}
      {tab === "awardees" && (
        <div className="flex flex-col gap-8">
          {sortedYears.map((year) => (
            <div key={year}>
              <div className="flex items-center gap-3 mb-4">
                <h2 style={{ color: colors.heading, fontWeight: 700, fontSize: "1.1rem" }}>{year}</h2>
                <div className="flex-1 h-px" style={{ backgroundColor: colors.gray200 }} />
              </div>
              <div className="flex flex-col gap-3">
                {groupedByYear[year].map((awardee, i) => (
                  <AwardeeRow
                    key={`${awardee.month}-${awardee.year}`}
                    awardee={awardee}
                    isFirst={i === 0 && year === sortedYears[0]}
                  />
                ))}
              </div>
            </div>
          ))}
          {/* <div
            className="text-center py-6 rounded-xl border"
            style={{ borderColor: colors.gray200, backgroundColor: colors.neutral50 }}
          >
            <p style={{ color: colors.gray400, fontSize: "0.8rem" }}>
              Records from June 2025 onward. Earlier editions were published in print.
            </p>
          </div> */}
        </div>
      )}

      {/* Leaderboard Archives */}
      {tab === "leaderboards" && (
        <div className="flex flex-col gap-6">
          {(config.archives ?? []).length === 0 ? (
            <div
              className="text-center py-12 rounded-xl border"
              style={{ borderColor: colors.gray200, backgroundColor: colors.neutral50 }}
            >
              <ArchiveIcon size={32} style={{ color: colors.gray300, margin: "0 auto 1rem" }} />
              <p style={{ color: colors.gray400, fontSize: "0.9rem" }}>No leaderboard archives yet.</p>
              <p style={{ color: colors.gray400, fontSize: "0.8rem", marginTop: "0.25rem" }}>
                Archives are created from the Control Panel at the end of each month.
              </p>
            </div>
          ) : (
            (config.archives ?? []).map((archive, idx) => (
              <div key={idx} className="rounded-2xl border overflow-hidden" style={{ borderColor: colors.gray200 }}>
                <div className="px-6 py-4 flex items-center gap-3" style={{ backgroundColor: colors.green900 }}>
                  <Trophy size={18} style={{ color: colors.yellow400 }} />
                  <div>
                    <h3 style={{ color: colors.white, fontWeight: 700, fontSize: "1.1rem" }}>{archive.monthLabel}</h3>
                    <p style={{ color: colors.green300, fontSize: "0.75rem" }}>Monthly Leaderboard Archive</p>
                  </div>
                </div>
                <div className="p-6 bg-white dark:bg-[var(--token-white)]">
                  <div className="grid sm:grid-cols-2 gap-6">
                    {/* Top Writers */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Crown size={14} style={{ color: colors.green600 }} />
                        <p style={{ color: colors.heading, fontWeight: 600, fontSize: "0.9rem" }}>Top Writers</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {archive.topWriters.map((writer) => (
                          <div
                            key={writer.rank}
                            className="flex items-center gap-3 p-3 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-sm"
                            style={{
                              backgroundColor: writer.rank === 1 ? colors.badgeBg : colors.gray50,
                              border: writer.rank === 1 ? `1px solid ${colors.green200}` : `1px solid ${colors.gray200}`,
                            }}
                          >
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                              style={{
                                backgroundColor: writer.rank === 1 ? colors.badgeBgStrong : writer.rank === 2 ? colors.gray100 : colors.red50,
                                color: writer.rank === 1 ? colors.green600 : writer.rank === 2 ? colors.gray500 : colors.red600,
                              }}
                            >
                              {writer.rank}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p style={{ color: colors.heading, fontWeight: 500, fontSize: "0.85rem" }} className="truncate">{writer.name}</p>
                              <p style={{ color: colors.gray400, fontSize: "0.7rem" }} className="truncate">{writer.grade}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <ThumbsUp size={11} style={{ color: colors.green600 }} />
                              <span style={{ color: colors.badgeText, fontSize: "0.8rem", fontWeight: 600 }}>{writer.totalVotes}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Top Writings */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen size={14} style={{ color: colors.green600 }} />
                        <p style={{ color: colors.heading, fontWeight: 600, fontSize: "0.9rem" }}>Top Writings</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {archive.topWritings.map((writing) => (
                          <Link
                            key={writing.rank}
                            href={`/article/${writing.articleId}`}
                            className="flex items-center gap-3 p-3 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-sm"
                            style={{
                              backgroundColor: writing.rank === 1 ? colors.badgeBg : colors.gray50,
                              border: writing.rank === 1 ? `1px solid ${colors.green200}` : `1px solid ${colors.gray200}`,
                            }}
                          >
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                              style={{
                                backgroundColor: writing.rank === 1 ? colors.badgeBgStrong : writing.rank === 2 ? colors.gray100 : colors.red50,
                                color: writing.rank === 1 ? colors.green600 : writing.rank === 2 ? colors.gray500 : colors.red600,
                              }}
                            >
                              {writing.rank}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p style={{ color: colors.heading, fontWeight: 500, fontSize: "0.85rem" }} className="truncate">{writing.title}</p>
                              <p style={{ color: colors.gray400, fontSize: "0.7rem" }}>{writing.author}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <ThumbsUp size={11} style={{ color: colors.green600 }} />
                              <span style={{ color: colors.badgeText, fontSize: "0.8rem", fontWeight: 600 }}>{votes[writing.articleId] ?? writing.votes}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* All Submissions */}
      {tab === "submissions" && (
        <div className="flex flex-col gap-3">
          <p style={{ color: colors.gray400, fontSize: "0.75rem", marginBottom: "0.5rem" }}>
            {sortedPublished.length} published pieces — current issue and archive
          </p>
          {sortedPublished.map((article) => {
            const isNavigable = !article.id.startsWith("arch-");
            const content = (
              <>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs"
                      style={{ backgroundColor: colors.badgeBg, color: colors.badgeText, border: `1px solid ${colors.badgeBorder}` }}
                    >
                      {article.category}
                    </span>
                    <span style={{ color: colors.gray400, fontSize: "0.7rem" }}>{article.month}</span>

                  </div>
                  <p
                    style={{
                      color: colors.heading,
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      marginBottom: "0.2rem",
                    }}
                  >
                    {article.title}
                  </p>
                  <p style={{ color: colors.gray500, fontSize: "0.8rem" }}>
                    {article.author} · {article.grade.split("—")[0].trim()}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p style={{ color: colors.green600, fontWeight: 600, fontSize: "0.85rem" }}>
                    {votes[article.id] ?? article.votes}
                  </p>
                  <p style={{ color: colors.gray400, fontSize: "0.7rem" }}>votes</p>
                </div>
              </>
            );

            if (isNavigable) {
              return (
                <Link
                  key={article.id}
                  href={`/article/${article.id}`}
                  className="flex items-start gap-4 p-4 rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-sm"
                  style={{ backgroundColor: colors.surface, borderColor: colors.gray200 }}
                >
                  {content}
                </Link>
              );
            }

            return (
              <div
                key={article.id}
                className="flex items-start gap-4 p-4 rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-sm"
                style={{ backgroundColor: colors.surface, borderColor: colors.gray200 }}
              >
                {content}
              </div>
            );
          })}
        </div>
      )}

      {/* Past Members */}
      {tab === "past_members" && (
        <div className="flex flex-col gap-8">
          <p style={{ color: colors.gray400, fontSize: "0.75rem" }}>
            Every member who has ever served on Manarat CWC staff stays on record here — their work and time with the club is never erased.
          </p>
          {pastMembers.length === 0 ? (
            <div
              className="text-center py-12 rounded-xl border"
              style={{ borderColor: colors.gray200, backgroundColor: colors.neutral50 }}
            >
              <Users size={32} style={{ color: colors.gray300, margin: "0 auto 1rem" }} />
              <p style={{ color: colors.gray400, fontSize: "0.9rem" }}>No past members yet.</p>
              <p style={{ color: colors.gray400, fontSize: "0.8rem", marginTop: "0.25rem" }}>
                Everyone currently on staff is still with Manarat CWC.
              </p>
            </div>
          ) : (
            (["teacher", "student", "class_rep", "media"] as StaffMember["type"][]).map((type) =>
              groupedPastMembers[type]?.length ? (
                <div key={type}>
                  <div className="flex items-center gap-3 mb-4">
                    <h2 style={{ color: colors.heading, fontWeight: 700, fontSize: "1.1rem" }}>{sectionLabel[type]}</h2>
                    <div className="flex-1 h-px" style={{ backgroundColor: colors.gray200 }} />
                  </div>
                  <div className="flex flex-col gap-3">
                    {groupedPastMembers[type].map((m) => (
                      <PastMemberCard key={`${m.name}__${m.role}__${m.period}`} member={m} />
                    ))}
                  </div>
                </div>
              ) : null
            )
          )}
        </div>
      )}
    </div>
  );
}
