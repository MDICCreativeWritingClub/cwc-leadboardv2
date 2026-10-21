"use client";

import { colors } from "@/lib/theme";

import { useState } from "react";
import Link from "next/link";
import { HelpCircle, Upload, Star, BookOpen, Shield, ChevronDown } from "lucide-react";

type SectionKey = "submit" | "editors" | "archive" | "rules";

const sections: {
  key: SectionKey;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}[] = [
  {
    key: "submit",
    title: "Submitting Your Work",
    icon: <Upload size={16} />,
    content: (
      <div className="space-y-4">
        <p style={{ color: colors.gray700, lineHeight: "1.8", fontSize: "0.95rem" }}>
          Click the <strong style={{ color: colors.heading }}>Submit Work</strong> button in the
          navbar to submit a piece of writing. You can submit poems, short stories, essays, or any
          creative writing you&apos;d like to share with the club.
        </p>
        <ul className="space-y-2" style={{ color: colors.gray700, fontSize: "0.9rem" }}>
          {[
            "Fill in your name, grade, and the title of your piece.",
            "Select a category: Poetry, Fiction, Non-Fiction, or Essay etc.",
            "Paste your writing into the content box.",
            "Hit Submit — our team will review it before it goes live.",
            "Daily submissions are restricted to only 2 per day.",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span
                className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 text-white"
                style={{ backgroundColor: colors.green600 }}
              >
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ul>
        <p style={{ color: colors.gray500, fontSize: "0.82rem" }}>
          Once reviewed and approved by a club manager, your work will appear in the{" "}
          <Link href="/hub" style={{ color: colors.green600 }} className="hover:underline">
            Literary Hub
          </Link>{" "}
          for everyone to read and vote on.
        </p>
      </div>
    ),
  },
  {
    key: "editors",
    title: "Editor's Choice",
    icon: <Star size={16} />,
    content: (
      <p style={{ color: colors.gray700, lineHeight: "1.8", fontSize: "0.95rem" }}>
        Each month, our editors select standout pieces that demonstrate exceptional creativity,
        craft, or originality. These are marked with a special badge and featured prominently across
        the site and in the archive.
      </p>
    ),
  },
  {
    key: "archive",
    title: "The Archive",
    icon: <BookOpen size={16} />,
    content: (
      <p style={{ color: colors.gray700, lineHeight: "1.8", fontSize: "0.95rem" }}>
        At the end of each month, the top pieces are saved to the{" "}
        <Link href="/archive" style={{ color: colors.green600 }} className="hover:underline">
          Archive
        </Link>
        . This is a permanent record of the club&apos;s history — every month&apos;s best writers and
        winning pieces are preserved here for everyone to look back on.
      </p>
    ),
  },
  {
    key: "rules",
    title: "A Few Ground Rules",
    icon: <Shield size={16} />,
    content: (
      <ul className="space-y-2.5" style={{ color: colors.gray700, fontSize: "0.9rem", lineHeight: "1.7" }}>
        {[
          "Submissions must be your own original work.",
          "Keep content respectful and school-appropriate.",
          "You may submit multiple pieces per month.",
          "Votes are limited to one per reader per piece.",
          "The editors' decisions on featured picks and approvals are final.",
        ].map((rule, i) => (
          <li key={i} className="flex items-start gap-2">
            <span style={{ color: colors.green600, fontWeight: 700, marginTop: "0.1rem" }}>·</span>
            {rule}
          </li>
        ))}
      </ul>
    ),
  },
];

export function InfoPage() {
  const [open, setOpen] = useState<SectionKey | null>("submit");

  return (
    <div className="max-w-4xl mx-auto px-5 pt-28 pb-20">
      <h1
        className="flex items-center gap-3"
        style={{
          fontFamily: "var(--font-display)",
          color: colors.heading,
          fontWeight: 600,
          fontSize: "2.1rem",
          lineHeight: "1.2",
          marginBottom: "0.5rem",
        }}
      >
        <HelpCircle size={32} style={{ color: colors.green600 }} />
        How It Works
      </h1>
      <p style={{ color: colors.gray500, fontSize: "0.95rem", marginBottom: "2.5rem" }}>
        Everything you need to know about submitting your work and how we score it.
      </p>

      <div className="flex flex-col gap-3">
        {sections.map((section) => {
          const isOpen = open === section.key;
          return (
            <div
              key={section.key}
              className="rounded-2xl overflow-hidden transition-colors"
              style={{
                border: `1px solid ${isOpen ? colors.badgeBorder : colors.gray200}`,
                backgroundColor: isOpen ? colors.badgeBg : colors.surface,
              }}
            >
              <button
                onClick={() => setOpen(isOpen ? null : section.key)}
                className="w-full flex items-center gap-3 p-5 text-left"
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors"
                  style={{ backgroundColor: colors.badgeBgStrong, color: colors.badgeText }}
                >
                  {section.icon}
                </div>
                <h2 style={{ fontFamily: "var(--font-display)", color: colors.heading, fontWeight: 600, fontSize: "1.15rem", flex: 1 }}>
                  {section.title}
                </h2>
                <ChevronDown
                  size={18}
                  style={{
                    color: colors.gray400,
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.25s ease",
                  }}
                />
              </button>
              <div
                style={{
                  maxHeight: isOpen ? "40rem" : "0",
                  transition: "max-height 0.35s ease",
                  overflow: "hidden",
                }}
              >
                <div className="px-5 pb-5 pl-[4.25rem]">{section.content}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <p style={{ color: colors.gray500, fontSize: "0.85rem", marginBottom: "1rem" }}>
          Ready to share your writing?
        </p>
        <Link
          href="/submit"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white text-sm hover:opacity-90 transition-all active:scale-95"
          style={{ backgroundColor: colors.green600 }}
        >
          <Upload size={15} /> Submit Your Work
        </Link>
      </div>
    </div>
  );
}
