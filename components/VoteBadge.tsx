"use client";

import { ThumbsUp } from "lucide-react";
import { colors } from "@/lib/theme";
import { useCountUp } from "@/lib/useCountUp";

interface VoteBadgeProps {
  count: number;
  size?: "sm" | "md";
  className?: string;
}

const SIZES = {
  sm: { padding: "0.35rem 0.7rem", fontSize: "0.72rem", iconSize: 12, gap: "0.35rem" },
  md: { padding: "0.5rem 1rem", fontSize: "0.85rem", iconSize: 15, gap: "0.5rem" },
};

/**
 * Read-only stand-in for VoteButton. This forum variant of the site has
 * no voting — pieces still show their vote count (it's meaningful
 * context and feeds the leaderboard), but it's a plain badge, not a
 * clickable control.
 */
export function VoteBadge({ count, size = "md", className = "" }: VoteBadgeProps) {
  const displayCount = useCountUp(count);
  const s = SIZES[size];

  return (
    <div
      className={`flex items-center justify-center rounded-full shrink-0 w-full ${className}`}
      style={{
        padding: s.padding,
        fontSize: s.fontSize,
        gap: s.gap,
        backgroundColor: colors.badgeBg,
        color: colors.badgeText,
        border: `1px solid ${colors.green200}`,
      }}
    >
      <ThumbsUp size={s.iconSize} />
      <span>{displayCount}</span>
    </div>
  );
}
