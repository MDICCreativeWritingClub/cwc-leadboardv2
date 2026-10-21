"use client";

import { AuthorLink } from "@/components/AuthorLink";
import { getAvatarColor, getInitials } from "@/lib/avatar";
import { colors } from "@/lib/theme";

interface AuthorBylineProps {
  name: string;
  studentCode?: string;
  size?: number;
  textStyle?: React.CSSProperties;
  className?: string;
}

/**
 * Small avatar + author name, for use anywhere a piece of writing lists
 * who wrote it (article cards, listings, recent pieces) — not just the
 * full article page header, which has its own larger version of this.
 */
export function AuthorByline({ name, studentCode, size = 22, textStyle, className }: AuthorBylineProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className ?? ""}`}>
      <span
        className="rounded-full flex items-center justify-center text-white shrink-0"
        style={{
          width: size,
          height: size,
          backgroundColor: getAvatarColor(name),
          fontFamily: "var(--font-display)",
          fontWeight: 600,
          fontSize: size * 0.4,
        }}
      >
        {getInitials(name)}
      </span>
      <AuthorLink name={name} studentCode={studentCode} style={{ color: colors.gray700, fontWeight: 500, ...textStyle }} />
    </span>
  );
}
