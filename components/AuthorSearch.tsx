"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search, ArrowRight, Sparkles } from "lucide-react";
import { colors } from "@/lib/theme";
import { supabase } from "@/lib/supabase";
import { useAuthorDirectory } from "@/hooks/useAuthorProfile";

interface MatchResult {
  studentCode: string;
  name: string;
  grade: string;
  pieceCount: number;
}

/** Fisher–Yates shuffle — doesn't mutate the input. */
function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const BATCH_SIZE = 12;

export function AuthorSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const directory = useAuthorDirectory();

  // Shuffled once per page load, not on every render, so the order doesn't
  // change as more of it loads in or as the user types into the search box.
  const spotlightOrder = useMemo(() => shuffled(directory), [directory]);

  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const visibleSpotlight = spotlightOrder.slice(0, visibleCount);
  const hasMore = visibleCount < spotlightOrder.length;

  // Infinite scroll: reveal the next batch once the sentinel div at the
  // bottom of the grid scrolls into view.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((c) => Math.min(c + BATCH_SIZE, spotlightOrder.length));
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, spotlightOrder.length]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setSearching(true);
    setError(null);
    setResults(null);

    // Exact student code lookup — a code is expected to be purely
    // numeric, so route straight to that profile without a results
    // list, no ambiguity possible.
    if (/^\d{1,9}$/.test(trimmed)) {
      window.location.href = `/author/${trimmed}`;
      return;
    }

    // Otherwise, fuzzy name search. Grouped by student_code (not
    // name) so a writer whose name was spelled differently across
    // submissions still shows up as one entry, not several.
    const { data, error: queryError } = await supabase
      .from("submissions")
      .select("student_code, name, grade")
      .eq("status", "approved")
      .ilike("name", `%${trimmed}%`);

    if (queryError) {
      setError("Something went wrong searching. Please try again.");
      setSearching(false);
      return;
    }

    const byCode = new Map<string, MatchResult>();
    for (const row of data ?? []) {
      const code = row.student_code as string;
      const existing = byCode.get(code);
      if (existing) {
        existing.pieceCount += 1;
      } else {
        byCode.set(code, {
          studentCode: code,
          name: row.name as string,
          grade: row.grade as string,
          pieceCount: 1,
        });
      }
    }

    setResults(Array.from(byCode.values()));
    setSearching(false);
  }

  return (
    <div className="max-w-2xl sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto px-5 pt-28 pb-20 transition-all">
      <h1
        style={{ fontFamily: "var(--font-display)", color: colors.heading, fontWeight: 700, fontSize: "1.9rem", marginBottom: "0.5rem" }}
      >
        Find a Writer
      </h1>
      <p style={{ color: colors.gray500, fontSize: "0.9rem", marginBottom: "1.75rem" }}>
        Search by name or exact student code to see a writer&apos;s published pieces and stats.
      </p>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name or student code…"
          style={{
            flex: 1,
            minWidth: 0,
            padding: "0.7rem 1rem",
            borderRadius: "0.75rem",
            border: `1px solid ${colors.gray200}`,
            fontSize: "0.9rem",
            outline: "none",
            color: colors.gray900,
          }}
        />
        <button
          type="submit"
          disabled={searching}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-sm hover:opacity-90 transition-opacity disabled:opacity-60 shrink-0"
          style={{ backgroundColor: colors.green900 }}
        >
          <Search size={15} /> {searching ? "Searching..." : "Search"}
        </button>
      </form>

      {error && (
        <p style={{ color: colors.red600, fontSize: "0.85rem", marginBottom: "1rem" }}>{error}</p>
      )}

      {results !== null && results.length === 0 && (
        <p style={{ color: colors.gray400, fontSize: "0.9rem" }}>No writers found matching that name.</p>
      )}

      {results !== null && results.length > 0 && (
        <div className="flex flex-col gap-3">
          {results.map((r) => (
            <Link
              key={r.studentCode}
              href={`/author/${r.studentCode}`}
              className="flex items-center justify-between p-4 rounded-xl hover:opacity-80 transition-opacity"
              style={{ border: `1px solid ${colors.gray200}` }}
            >
              <div>
                <p style={{ color: colors.heading, fontWeight: 600, fontSize: "0.95rem" }}>{r.name}</p>
                <p style={{ color: colors.gray500, fontSize: "0.8rem" }}>
                  {r.grade} · {r.pieceCount} piece{r.pieceCount === 1 ? "" : "s"}
                </p>
              </div>
              <ArrowRight size={16} style={{ color: colors.gray400 }} />
            </Link>
          ))}
        </div>
      )}

      {results === null && spotlightOrder.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={15} style={{ color: colors.green600 }} />
            <p style={{ color: colors.heading, fontWeight: 600, fontSize: "0.9rem" }}>Discover a writer</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {visibleSpotlight.map((a) => (
              <Link
                key={a.studentCode}
                href={`/author/${a.studentCode}`}
                className="flex items-center gap-3 p-4 rounded-xl hover:-translate-y-0.5 hover:shadow-sm transition-all"
                style={{ border: `1px solid ${colors.gray200}`, backgroundColor: colors.surface }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white"
                  style={{ backgroundColor: colors.green900, fontFamily: "var(--font-display)", fontWeight: 600 }}
                >
                  {a.name[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ color: colors.heading, fontWeight: 600, fontSize: "0.9rem" }} className="truncate">{a.name}</p>
                  <p style={{ color: colors.gray500, fontSize: "0.78rem" }}>{a.grade}</p>
                </div>
                <ArrowRight size={14} style={{ color: colors.gray400 }} />
              </Link>
            ))}
          </div>

          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-6">
              <span style={{ color: colors.gray400, fontSize: "0.8rem" }}>Loading more writers…</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
