"use client";

import { colors } from "@/lib/theme";

import Link from "next/link";
import { AuthorLink } from "@/components/AuthorLink";
import { AuthorByline } from "@/components/AuthorByline";
import { useRouter } from "next/navigation";
import { Trophy, ThumbsUp, ArrowRight, BookOpen, Archive, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { articles, type Article } from "@/data/articles";
import { useVotes } from "@/context/VoteContext";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { usePublishedArticles } from "@/hooks/usePublishedArticles";
import { useLeaderboard } from "@/hooks/useLeaderboard";

import { getActiveNotices, headingSizeStyles, isNewNotice } from "@/lib/notices";
import type { Notice } from "@/context/SiteConfigContext";
import { VoteButton } from "@/components/VoteButton";

import { getInitials, getAvatarColor } from "@/lib/avatar";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span
        style={{ color: colors.gray500, fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em" }}
      >
        {children}
      </span>
      <div style={{ height: "1px", flex: 1, backgroundColor: colors.gray200 }} />
    </div>
  );
}

// Rotating hero photography — swap these for real campus / event photos.
const heroImages = [
  "https://picsum.photos/seed/cwc-library/1600/900",
  "https://picsum.photos/seed/cwc-writing/1600/900",
  "https://picsum.photos/seed/cwc-campus/1600/900",
  "https://picsum.photos/seed/cwc-reading/1600/900",
];

function NoticeButtonEl({ button }: { button: Notice["buttons"][number] }) {
  const isExternal = /^https?:\/\//.test(button.url);
  const baseStyle: React.CSSProperties = {
    primary: { backgroundColor: colors.surface, color: colors.heading },
    secondary: { backgroundColor: colors.green600, color: colors.white },
    outline: { backgroundColor: "transparent", color: colors.white, border: "1px solid rgba(255,255,255,0.5)" },
  }[button.style];

  const className = "px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 hover:-translate-y-0.5 active:scale-95 transition-all";

  if (!button.url) return null;

  return isExternal ? (
    <a
      href={button.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={className}
      style={baseStyle}
    >
      {button.label}
    </a>
  ) : (
    <Link href={button.url} onClick={(e) => e.stopPropagation()} className={className} style={baseStyle}>
      {button.label}
    </Link>
  );
}

function Hero() {
  const { config } = useSiteConfig();
  const [active, setActive] = useState(0);
  const router = useRouter();

  const notices = useMemo(() => getActiveNotices(config.notices ?? []), [config.notices]);
  const hasNotices = notices.length > 0;
  const slideCount = hasNotices ? notices.length : heroImages.length;

  useEffect(() => {
    setActive(0);
  }, [hasNotices]);

  useEffect(() => {
    const id = setInterval(() => setActive((i) => (i + 1) % slideCount), 6000);
    return () => clearInterval(id);
  }, [slideCount]);

  const noticeImages = notices.map((n) => n.imageUrl).filter(Boolean);
  const allBackgrounds = Array.from(new Set([...heroImages, ...noticeImages]));

  const currentNotice = hasNotices ? notices[active % notices.length] : null;
  const currentImage = currentNotice?.imageUrl || heroImages[active % heroImages.length];

  // Only download images as they're about to be needed, instead of firing
  // off every hero/notice image at once on mount. The current slide is
  // always loaded; we also warm the *next* slide one step ahead so the
  // crossfade never has to wait on a fresh network request.
  const nextImage =
    allBackgrounds[(allBackgrounds.indexOf(currentImage) + 1) % allBackgrounds.length];
  const [loadedImages, setLoadedImages] = useState<Set<string>>(
    () => new Set([currentImage, nextImage].filter(Boolean))
  );

  useEffect(() => {
    setLoadedImages((prev) => {
      if (prev.has(currentImage) && prev.has(nextImage)) return prev;
      const next = new Set(prev);
      next.add(currentImage);
      if (nextImage) next.add(nextImage);
      return next;
    });
  }, [currentImage, nextImage]);

  function handleCardClick() {
    if (currentNotice?.openDetailPage) {
      router.push(`/notice/${currentNotice.id}`);
    }
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl min-h-[460px] sm:h-[500px]"
      style={{ border: `1px solid ${colors.gray200}`, cursor: currentNotice?.openDetailPage ? "pointer" : "default" }}
      onClick={hasNotices ? handleCardClick : undefined}
    >
      {allBackgrounds
        .filter((src) => loadedImages.has(src))
        .map((src) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt=""
            loading={src === currentImage ? "eager" : "lazy"}
            fetchPriority={src === currentImage ? "high" : "low"}
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[1500ms] ease-in-out"
            style={{ opacity: src === currentImage ? 1 : 0 }}
          />
        ))}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.15) 40%, rgba(10,20,15,0.85) 100%)" }}
      />

      <div className="relative min-h-[460px] sm:h-full flex flex-col justify-end px-5 sm:px-12 py-8 sm:pb-14 sm:py-0">
        {currentNotice ? (
          <div key={currentNotice.id} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span
                className="inline-block px-2.5 py-0.5 rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.12)", color: colors.green200, fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.1em", border: "1px solid rgba(255,255,255,0.25)" }}
              >
                NOTICE {currentNotice.isPermanent ? "" : `· UNTIL ${new Date(currentNotice.expiryDate + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
              </span>
              {isNewNotice(currentNotice) && (
                <span
                  className="inline-block px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: colors.yellow400, color: colors.green900, fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.05em" }}
                >
                  NEW
                </span>
              )}
            </div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                color: colors.white,
                fontWeight: 600,
                maxWidth: "38rem",
                ...headingSizeStyles[currentNotice.headingSize],
              }}
            >
              {currentNotice.heading}
            </h1>
            {currentNotice.body && (
              <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.92rem", lineHeight: 1.65, marginTop: "0.85rem", maxWidth: "32rem" }}>
                {currentNotice.body}
              </p>
            )}
            {(currentNotice.buttons.length > 0 || currentNotice.openDetailPage) && (
              <div className="flex flex-wrap items-center gap-3 mt-6">
                {currentNotice.buttons.map((btn) => (
                  <NoticeButtonEl key={btn.id} button={btn} />
                ))}
                {currentNotice.openDetailPage && (
                  <span
                    className="flex items-center gap-1.5 text-sm"
                    style={{ color: "rgba(255,255,255,0.75)" }}
                  >
                    Click to read more <ArrowRight size={14} />
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            <span style={{ color: colors.green300, fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.12em", marginBottom: "0.75rem" }}>
              MANARAT CREATIVE WRITING CLUB
            </span>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                color: colors.white,
                fontSize: "clamp(1.6rem, 6vw, 3rem)",
                lineHeight: 1.15,
                fontWeight: 600,
                maxWidth: "36rem",
              }}
            >
              Where student voices find the page
            </h1>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem", lineHeight: 1.65, marginTop: "0.85rem", maxWidth: "32rem" }}>
              Poetry, prose and criticism from students across campus — discover this month&apos;s{" "}
              {config.themeName?.toLowerCase() || "featured"} pieces.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <Link
                href="/hub"
                className="px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 hover:-translate-y-0.5 active:scale-95 transition-all"
                style={{ backgroundColor: colors.surface, color: colors.heading }}
              >
                Browse the Hub
              </Link>
              <Link
                href="/submit"
                className="px-5 py-2.5 rounded-full text-sm font-medium hover:-translate-y-0.5 active:scale-95 transition-all"
                style={{ color: colors.white, border: "1px solid rgba(255,255,255,0.4)" }}
              >
                Submit Your Work
              </Link>
            </div>
          </>
        )}
      </div>

      {slideCount > 1 && (
        <div className="absolute bottom-5 right-6 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {Array.from({ length: slideCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Show slide ${i + 1}`}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === active ? "1.3rem" : "0.4rem",
                backgroundColor: i === active ? colors.white : "rgba(255,255,255,0.45)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WriterOfMonth() {
  const { votes } = useVotes();
  const { config } = useSiteConfig();
  const { allPublished } = usePublishedArticles();

  if (!config.womVisible) return null;

  const voteCount = allPublished
    .filter((a) => a.author === config.womName)
    .reduce((sum, a) => sum + (votes[a.id] ?? (a as any).votes ?? 0), 0);
  const article = allPublished.find((a) => a.id === config.womArticleId);

  return (
    <div className="p-6 sm:p-7 rounded-2xl" style={{ backgroundColor: colors.green900 }}>
      <div className="flex items-start gap-4">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
          style={{
            backgroundColor: getAvatarColor(config.womName || "?"),
            color: colors.white,
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "0.85rem",
            border: "2px solid rgba(255,255,255,0.35)",
          }}
        >
          {getInitials(config.womName || "?")}
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ color: colors.yellow400, fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.35rem" }}>
            Writer of the Month
          </p>
          <h2 style={{ fontFamily: "var(--font-display)", color: colors.white, fontWeight: 600, fontSize: "1.3rem" }}>
            <AuthorLink name={config.womName} studentCode={article?.studentCode} />
          </h2>
          <p style={{ color: colors.green300, fontSize: "0.78rem", marginTop: "0.1rem" }}>{config.womGrade}</p>
        </div>
        <div className="text-right shrink-0">
          <div style={{ color: colors.green400, fontWeight: 700, fontSize: "1.4rem", lineHeight: 1 }}>{voteCount}</div>
          <div style={{ color: colors.green300, fontSize: "0.68rem" }}>votes</div>
        </div>
      </div>
      <p style={{ color: colors.green200, fontSize: "0.88rem", lineHeight: "1.7", marginTop: "1.1rem" }}>
        {config.womBio}
      </p>
      {article && (
        <Link
          href={`/article/${config.womArticleId}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity mt-4"
          style={{ backgroundColor: colors.green600, color: colors.white }}
        >
          Read their work <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}

function ThemeBanner() {
  const { config } = useSiteConfig();

  if (!config.themeVisible) return null;

  return (
    <div className="p-6 sm:p-7 rounded-2xl flex flex-col" style={{ backgroundColor: colors.yellow50, border: `1px solid ${colors.amber200}` }}>
      <p style={{ color: colors.amber700, fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.35rem" }}>
        {config.themeMonth} Theme
      </p>
      <h3 style={{ fontFamily: "var(--font-display)", color: colors.amber900, fontWeight: 600, fontSize: "1.3rem", marginBottom: "0.6rem" }}>
        {config.themeName}
      </h3>
      <p style={{ color: colors.amber800, fontSize: "0.88rem", lineHeight: "1.7", flex: 1 }}>
        {config.themeDescription}
      </p>
      <Link
        href="/submit"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity mt-4 self-start"
        style={{ backgroundColor: colors.amber600, color: colors.white }}
      >
        Submit now <ArrowRight size={14} />
      </Link>
    </div>
  );
}

function EditorChoiceCard({ piece, isLast }: { piece: (typeof articles)[0]; isLast?: boolean }) {
  const { votes } = useVotes();
  const voteCount = votes[piece.id] ?? piece.votes;

  return (
    <div
      className="p-6 rounded-2xl relative overflow-hidden shadow-sm"
      style={{
        backgroundColor: colors.badgeBg,
        border: `1px solid ${colors.green200}`,
        borderLeft: `4px solid ${colors.green900}`,
      }}
    >
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
          style={{ backgroundColor: colors.green900, color: colors.white }}
        >
          <Star size={11} fill={colors.white} /> Editor&apos;s Choice
        </span>
        <span
          className="inline-block px-2.5 py-0.5 rounded-full text-xs"
          style={{ backgroundColor: colors.surface, color: colors.badgeText, border: `1px solid ${colors.green200}` }}
        >
          {piece.category}
        </span>
      </div>
      <Link href={`/article/${piece.id}`}>
        <h2
          style={{ fontFamily: "var(--font-display)", color: colors.heading, fontWeight: 600, fontSize: "1.55rem", lineHeight: "1.3", margin: "0.6rem 0 0.7rem" }}
          className="hover:underline cursor-pointer"
        >
          {piece.title}
        </h2>
      </Link>
      <p style={{ color: colors.gray600, lineHeight: "1.8", marginBottom: "1.1rem", fontSize: "0.92rem" }}>
        {piece.excerpt}
      </p>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div style={{ color: colors.heading, fontWeight: 500, fontSize: "0.875rem" }}>
            <AuthorByline name={piece.author} studentCode={piece.studentCode} size={20} textStyle={{ fontSize: "0.875rem" }} />
          </div>
          <div style={{ color: colors.gray400, fontSize: "0.75rem" }}>{piece.grade}</div>
        </div>
        <div className="flex items-center gap-3">
          <VoteButton articleId={piece.id} count={voteCount} size="sm" />
          <Link
            href={`/article/${piece.id}`}
            className="flex items-center gap-1 text-sm hover:underline"
            style={{ color: colors.green600 }}
          >
            Read <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function EditorChoice() {
  const { config } = useSiteConfig();
  const { allPublished } = usePublishedArticles();

  if (!config.editorChoiceVisible) return null;

  const ids = config.editorChoiceIds?.length
    ? config.editorChoiceIds
    : articles.filter((a) => a.isEditorChoice).map((a) => a.id);

  const pieces = ids
    .map((id) => allPublished.find((a) => a.id === id))
    .filter((a): a is (typeof articles)[0] => Boolean(a));

  if (pieces.length === 0) return null;

  return (
    <div>
      <SectionLabel>Editor&apos;s Choice — {config.themeMonth}</SectionLabel>
      <div className="flex flex-col gap-4">
        {pieces.map((piece, i) => (
          <EditorChoiceCard key={piece.id} piece={piece} isLast={i === pieces.length - 1} />
        ))}
      </div>
    </div>
  );
}

function SideLeaderboard() {
  const { rows } = useLeaderboard("points", true, 5);

  return (
    <div className="flex flex-col gap-4">
      <div style={{ border: `1px solid ${colors.gray200}`, borderRadius: "1rem" }} className="overflow-hidden">
        <div className="px-5 py-4" style={{ backgroundColor: colors.green900 }}>
          <div className="flex items-center gap-2">
            <Trophy size={16} style={{ color: colors.yellow400 }} />
            <span style={{ fontFamily: "var(--font-display)", color: colors.white, fontWeight: 600, fontSize: "0.9rem" }}>Top Writings This Month</span>
          </div>
        </div>
        <div className="bg-white dark:bg-[var(--token-white)] divide-y" style={{ borderColor: colors.gray100 }}>
          {rows.length === 0 && (
            <p className="px-5 py-4" style={{ color: colors.gray400, fontSize: "0.8rem" }}>No writings ranked yet.</p>
          )}
          {rows.map((row, i) => (
            <Link key={row.articleId} href={`/article/${row.articleId}`} className="px-5 py-3.5 flex items-center gap-3">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                style={{
                  backgroundColor: i === 0 ? colors.yellow100 : i === 1 ? colors.gray100 : i === 2 ? colors.red50 : colors.gray50,
                  color: i === 0 ? colors.amber600 : i === 1 ? colors.gray500 : i === 2 ? colors.red600 : colors.gray400,
                  boxShadow: i < 3 ? `0 0 0 2px ${i === 0 ? "rgba(250,204,21,0.25)" : i === 1 ? "rgba(148,163,184,0.2)" : "rgba(251,146,60,0.2)"}` : undefined,
                }}
              >
                {i < 3 ? <span style={{ fontSize: "0.72rem" }}>{["🥇", "🥈", "🥉"][i]}</span> : i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div style={{ color: colors.heading, fontWeight: 500, fontSize: "0.82rem" }} className="truncate">{row.title}</div>
                <div style={{ color: colors.gray400, fontSize: "0.7rem" }} className="truncate">{row.writerName}</div>
              </div>
              {row.displayValue !== null && (
                <span className="shrink-0" style={{ color: colors.badgeText, fontSize: "0.8rem", fontWeight: 600 }}>{row.displayValue} pts</span>
              )}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2" style={{ border: `1px solid ${colors.gray200}`, borderRadius: "1rem" }} >
        <div className="p-5 flex flex-col gap-1">
          <Link
            href="/hub"
            className="flex items-center gap-3 py-2.5"
          >
            <BookOpen size={15} style={{ color: colors.gray400 }} />
            <span style={{ color: colors.heading, fontSize: "0.85rem", fontWeight: 500 }}>Browse All Pieces</span>
          </Link>
          <Link
            href="/archive"
            className="flex items-center gap-3 py-2.5"
          >
            <Archive size={15} style={{ color: colors.gray400 }} />
            <span style={{ color: colors.heading, fontSize: "0.85rem", fontWeight: 500 }}>The Archive</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function RecentCard({ article }: { article: (typeof articles)[0] }) {
  const { votes } = useVotes();
  const voteCount = votes[article.id] ?? article.votes;

  return (
    <div className="p-5 rounded-2xl" style={{ border: `1px solid ${colors.gray200}` }}>
      <span
        className="inline-block px-2.5 py-0.5 rounded-full text-xs"
        style={{ backgroundColor: colors.badgeBg, color: colors.badgeText, border: `1px solid ${colors.badgeBorder}` }}
      >
        {article.category}
      </span>
      <Link href={`/article/${article.id}`}>
        <h3
          style={{ fontFamily: "var(--font-display)", color: colors.heading, fontWeight: 600, fontSize: "1.05rem", lineHeight: "1.4", margin: "0.5rem 0 0.5rem" }}
          className="hover:underline cursor-pointer"
        >
          {article.title}
        </h3>
      </Link>
      <p style={{ color: colors.gray500, fontSize: "0.82rem", lineHeight: "1.7", marginBottom: "0.9rem" }}>{article.excerpt}</p>
      <div className="flex items-center justify-between">
        <div>
          <div style={{ color: colors.gray700, fontSize: "0.8rem", fontWeight: 500 }}>
            <AuthorByline name={article.author} studentCode={article.studentCode} size={18} textStyle={{ fontSize: "0.8rem" }} />
          </div>
          <div style={{ color: colors.gray400, fontSize: "0.7rem" }}>
            {article.date
              ? new Date(article.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
              : article.month}
          </div>
        </div>
        <VoteButton articleId={article.id} count={voteCount} size="sm" />
      </div>
    </div>
  );
}

function RecentPieces() {
  const { allPublished } = usePublishedArticles();

  const recent = useMemo(
    () =>
      [...allPublished]
        .filter((a) => !a.isEditorChoice)
        .sort((a, b) => {
          const da = a.date ?? "0000-00-00";
          const db = b.date ?? "0000-00-00";
          return db.localeCompare(da);
        })
        .slice(0, 4),
    [allPublished],
  );

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {recent.map((article) => (
        <RecentCard key={article.id} article={article as Article} />
      ))}
    </div>
  );
}

function QuoteTicker() {
  const { allPublished } = usePublishedArticles();
  const { votes } = useVotes();
  const [index, setIndex] = useState(0);

  const topQuotes = useMemo(() => {
    return [...allPublished]
      .filter((a) => a.excerpt && a.excerpt.trim().length > 0)
      .sort((a, b) => (votes[b.id] ?? b.votes ?? 0) - (votes[a.id] ?? a.votes ?? 0))
      .slice(0, 8);
  }, [allPublished, votes]);

  useEffect(() => {
    if (topQuotes.length < 2) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % topQuotes.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [topQuotes.length]);

  if (topQuotes.length === 0) return null;

  const current = topQuotes[index % topQuotes.length];

  return (
    <div
      className="flex items-center gap-4 px-5 py-4 rounded-2xl mb-10 overflow-hidden"
      style={{ backgroundColor: colors.green900 }}
    >
      <span style={{ fontFamily: "var(--font-display)", color: colors.green400, fontSize: "2rem", lineHeight: 1, flexShrink: 0 }}>
        &ldquo;
      </span>
      <div key={current.id} className="flex-1 min-w-0 animate-fade-slide-in">
        <Link href={`/article/${current.id}`} className="hover:underline">
          <p
            style={{
              fontFamily: "var(--font-reading)",
              color: colors.green100,
              fontSize: "0.92rem",
              lineHeight: "1.6",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {current.excerpt}
          </p>
        </Link>
        <p style={{ color: colors.green400, fontSize: "0.72rem", marginTop: "0.3rem" }}>
          — {current.title}, {current.author}
        </p>
      </div>
      {topQuotes.length > 1 && (
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          {topQuotes.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setIndex(i)}
              aria-label={`Show quote ${i + 1}`}
              className="rounded-full transition-all"
              style={{
                width: i === index ? "1.1rem" : "0.4rem",
                height: "0.4rem",
                backgroundColor: i === index ? colors.green400 : colors.green600,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Home() {
  return (
    <div className="max-w-6xl mx-auto px-5 pt-24 pb-16">
      <div className="mb-12">
        <Hero />
      </div>

      <QuoteTicker />

      <div className="grid lg:grid-cols-2 gap-5 mb-14">
        <WriterOfMonth />
        <ThemeBanner />
      </div>

      <div className="flex gap-14">
        <div className="flex-1 min-w-0">
          <EditorChoice />

          <div className="mt-12">
            <SectionLabel>Recent Pieces</SectionLabel>
            <RecentPieces />
            <div className="mt-6">
              <Link
                href="/hub"
                className="inline-flex items-center gap-1.5 text-sm font-medium hover:gap-2.5 transition-all"
                style={{ color: colors.badgeText }}
              >
                Browse all pieces <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        <div className="hidden lg:block w-64 shrink-0">
          <SideLeaderboard />
        </div>
      </div>
    </div>
  );
}
