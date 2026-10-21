"use client";

import { colors } from "@/lib/theme";

import Link from "next/link";
import { ArrowLeft, CalendarClock } from "lucide-react";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { headingSizeStyles } from "@/lib/notices";

function formatDate(date: string): string {
  return new Date(date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function NoticePage({ id }: { id: string }) {
  const { config } = useSiteConfig();
  const notice = (config.notices ?? []).find((n) => n.id === id);

  if (!notice) {
    return (
      <div className="max-w-2xl mx-auto px-5 pt-32 text-center">
        <p style={{ color: colors.gray500 }}>This notice is no longer available.</p>
        <Link href="/" style={{ color: colors.green600 }} className="text-sm hover:underline mt-2 inline-block">
          ← Back to home
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-2xl mx-auto px-5 pt-24 pb-24">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm mb-8 hover:gap-2.5 transition-all"
        style={{ color: colors.green600 }}
      >
        <ArrowLeft size={15} /> Back to home
      </Link>

      <div className="flex items-center gap-2 flex-wrap mb-5">
        <span
          className="inline-block px-3 py-0.5 rounded-full text-xs font-medium"
          style={{ backgroundColor: colors.badgeBg, color: colors.badgeText, border: `1px solid ${colors.badgeBorder}` }}
        >
          Notice
        </span>
        {!notice.isPermanent && notice.expiryDate && (
          <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: colors.gray400 }}>
            <CalendarClock size={13} /> Active until {formatDate(notice.expiryDate)}
          </span>
        )}
      </div>

      <h1
        style={{
          fontFamily: "var(--font-display)",
          color: colors.heading,
          fontWeight: 600,
          marginBottom: "1.5rem",
          ...headingSizeStyles[notice.headingSize],
        }}
      >
        {notice.heading}
      </h1>

      {notice.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={notice.imageUrl}
          alt=""
          className="w-full rounded-2xl mb-6 object-cover"
          style={{ maxHeight: "26rem", border: `1px solid ${colors.gray200}` }}
        />
      )}

      {notice.body && (
        <p style={{ color: colors.gray700, fontSize: "1.02rem", lineHeight: "1.8", marginBottom: "1.5rem" }}>
          {notice.body}
        </p>
      )}

      {notice.detailContent && (
        <div className="space-y-5 pt-2">
          {notice.detailContent.split("\n\n").filter(Boolean).map((para, i) => (
            <p key={i} style={{ fontFamily: "var(--font-display)", color: colors.gray800, lineHeight: "1.9", fontSize: "1.05rem" }}>
              {para}
            </p>
          ))}
        </div>
      )}

      {notice.buttons.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mt-10 pt-8 border-t" style={{ borderColor: colors.gray200 }}>
          {notice.buttons.map((btn) => {
            const isExternal = /^https?:\/\//.test(btn.url);
            const style: React.CSSProperties = {
              primary: { backgroundColor: colors.green900, color: colors.white },
              secondary: { backgroundColor: colors.badgeBg, color: colors.badgeText, border: `1px solid ${colors.badgeBorder}` },
              outline: { backgroundColor: "transparent", color: colors.heading, border: `1px solid ${colors.gray300}` },
            }[btn.style];
            const className = "px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 hover:-translate-y-0.5 active:scale-95 transition-all";
            if (!btn.url) return null;
            return isExternal ? (
              <a key={btn.id} href={btn.url} target="_blank" rel="noopener noreferrer" className={className} style={style}>
                {btn.label}
              </a>
            ) : (
              <Link key={btn.id} href={btn.url} className={className} style={style}>
                {btn.label}
              </Link>
            );
          })}
        </div>
      )}
    </article>
  );
}
