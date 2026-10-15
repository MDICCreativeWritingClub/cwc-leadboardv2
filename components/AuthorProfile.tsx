"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ThumbsUp, Trophy, Star, BookOpen } from "lucide-react";
import { colors } from "@/lib/theme";
import { supabase } from "@/lib/supabase";
import { renderFormattedText } from "@/lib/richText";
import { getAvatarColor, getInitials } from "@/lib/avatar";

interface Piece {
  id: string;
  title: string;
  category: string;
  submittedAt: string;
  votes: number;
}

interface ProfileData {
  name: string;
  grade: string;
  pieces: Piece[];
  totalVotes: number;
  womWins: number;
  editorsChoiceWins: number;
}

export function AuthorProfile({ studentCode }: { studentCode: string }) {
  const [data, setData] = useState<ProfileData | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: subs } = await supabase
        .from("submissions")
        .select("id, title, category, name, grade, submitted_at")
        .eq("student_code", studentCode)
        .eq("status", "approved")
        .order("submitted_at", { ascending: false });

      if (!subs || subs.length === 0) {
        if (!cancelled) setData(null);
        return;
      }

      const ids = subs.map((s) => s.id as string);

      const { data: voteRows } = await supabase
        .from("votes")
        .select("article_id, count")
        .in("article_id", ids);

      const voteMap = new Map<string, number>();
      for (const v of voteRows ?? []) voteMap.set(v.article_id as string, Number(v.count));

      const { data: wins } = await supabase
        .from("recognitions")
        .select("category")
        .eq("student_code", studentCode);

      const womWins = (wins ?? []).filter((w) => w.category === "wom").length;
      const editorsChoiceWins = (wins ?? []).filter((w) => w.category === "editors_choice").length;

      const pieces: Piece[] = subs.map((s) => ({
        id: s.id as string,
        title: s.title as string,
        category: s.category as string,
        submittedAt: s.submitted_at as string,
        votes: voteMap.get(s.id as string) ?? 0,
      }));

      const totalVotes = pieces.reduce((sum, p) => sum + p.votes, 0);

      if (!cancelled) {
        setData({
          name: subs[0].name as string,
          grade: subs[0].grade as string,
          pieces,
          totalVotes,
          womWins,
          editorsChoiceWins,
        });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [studentCode]);

  if (data === undefined) {
    return <div className="max-w-2xl mx-auto px-5 pt-32 text-center" style={{ color: colors.gray400 }}>Loading...</div>;
  }

  if (data === null) {
    return (
      <div className="max-w-sm mx-auto px-5 pt-32 pb-20 text-center">
        <p style={{ color: colors.gray500, fontSize: "0.9rem", marginBottom: "1.25rem" }}>
          No published writer found for that code.
        </p>
        <Link
          href="/author"
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-white text-sm hover:opacity-90 transition-opacity"
          style={{ backgroundColor: colors.green900 }}
        >
          <ArrowLeft size={14} /> Back to search
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-5 pt-24 pb-16">
      <Link
        href="/author"
        className="flex items-center gap-1.5 text-sm hover:opacity-70 transition-opacity mb-6"
        style={{ color: colors.gray500 }}
      >
        <ArrowLeft size={16} /> Back to search
      </Link>

      <div className="mb-8 flex items-start gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-white shrink-0"
          style={{ backgroundColor: getAvatarColor(data.name), fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.5rem" }}
        >
          {getInitials(data.name)}
        </div>
        <div>
        <h1 style={{ fontFamily: "var(--font-display)", color: colors.heading, fontWeight: 700, fontSize: "2rem" }}>
          {data.name}
        </h1>
        <p style={{ color: colors.gray500, fontSize: "0.9rem", marginTop: "0.25rem" }}>{data.grade}</p>

        {(data.womWins > 0 || data.editorsChoiceWins > 0 || data.pieces.length >= 5) && (
          <div className="flex items-center gap-2 flex-wrap mt-3">
            {data.womWins > 0 && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: colors.yellow400, color: colors.green900 }}
              >
                🏆 Writer of the Month{data.womWins > 1 ? ` ×${data.womWins}` : ""}
              </span>
            )}
            {data.editorsChoiceWins > 0 && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: colors.green900, color: colors.white }}
              >
                ⭐ Editor&apos;s Choice{data.editorsChoiceWins > 1 ? ` ×${data.editorsChoiceWins}` : ""}
              </span>
            )}
            {data.pieces.length >= 10 ? (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: colors.badgeBg, color: colors.badgeText, border: `1px solid ${colors.badgeBorder}` }}
              >
                🌟 Veteran Writer
              </span>
            ) : data.pieces.length >= 5 ? (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: colors.badgeBg, color: colors.badgeText, border: `1px solid ${colors.badgeBorder}` }}
              >
                📚 Prolific Writer
              </span>
            ) : null}
          </div>
        )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {[
          { label: "Pieces", value: data.pieces.length, icon: BookOpen },
          { label: "Total Votes", value: data.totalVotes, icon: ThumbsUp },
          { label: "Writer of the Month", value: data.womWins, icon: Trophy },
          { label: "Editor's Choice", value: data.editorsChoiceWins, icon: Star },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl p-4 text-center"
            style={{ border: `1px solid ${colors.badgeBorder}`, backgroundColor: colors.badgeBg }}
          >
            <Icon size={16} style={{ color: colors.badgeText, margin: "0 auto 0.4rem" }} />
            <p style={{ color: colors.badgeText, fontWeight: 700, fontSize: "1.4rem" }}>{value}</p>
            <p style={{ color: colors.gray500, fontSize: "0.7rem" }}>{label}</p>
          </div>
        ))}
      </div>

      <h2 style={{ fontFamily: "var(--font-display)", color: colors.heading, fontWeight: 600, fontSize: "1.2rem", marginBottom: "1rem" }}>
        Published Pieces
      </h2>
      <div className="flex flex-col gap-3">
        {data.pieces.map((p) => (
          <Link
            key={p.id}
            href={`/article/${p.id}`}
            className="flex items-center justify-between p-4 rounded-xl hover:opacity-80 transition-opacity"
            style={{ border: `1px solid ${colors.gray200}` }}
          >
            <div>
              <p style={{ color: colors.heading, fontWeight: 600, fontSize: "0.95rem" }}>
                {renderFormattedText(p.title)}
              </p>
              <p style={{ color: colors.gray400, fontSize: "0.78rem" }}>
                {p.category} · {new Date(p.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
            <span className="flex items-center gap-1" style={{ color: colors.gray500, fontSize: "0.8rem" }}>
              <ThumbsUp size={13} /> {p.votes}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
