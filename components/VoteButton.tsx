"use client";

import { useEffect, useRef, useState } from "react";
import { ThumbsUp } from "lucide-react";
import { colors } from "@/lib/theme";
import { useVotes } from "@/context/VoteContext";
import { useAuth } from "@/context/AuthContext";
import { useCountUp } from "@/lib/useCountUp";
import { fireConfetti } from "@/lib/confetti";

interface VoteButtonProps {
  articleId: string;
  count: number;
  size?: "sm" | "md";
  className?: string;
}

const REACTION_EMOJIS = ["👍", "❤️", "😂", "👏", "😮", "😢"];

const SIZES = {
  sm: { padding: "0.35rem 0.7rem", fontSize: "0.72rem", iconSize: 12, gap: "0.35rem" },
  md: { padding: "0.5rem 1rem", fontSize: "0.85rem", iconSize: 15, gap: "0.5rem" },
};

function getVoteEmoji(articleId: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`cwc_vote_emoji_${articleId}`);
}

function setVoteEmoji(articleId: string, emoji: string) {
  localStorage.setItem(`cwc_vote_emoji_${articleId}`, emoji);
}

/**
 * Shared vote button used on the article page, Literary Hub cards, and
 * homepage cards. Clicking opens an emoji picker (same reaction set as
 * comments, plus a like icon); whichever emoji is picked becomes this
 * user's "voted" icon for this article going forward -- purely visual.
 * Requires the visitor's (silent, account-less) identity to have finished
 * loading -- there's no login to route to anymore, voting is open to
 * everyone.
 */
export function VoteButton({ articleId, count, size = "md", className = "" }: VoteButtonProps) {
  const { voted, castVote, ready } = useVotes();
  const { identity } = useAuth();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [chosenEmoji, setChosenEmoji] = useState<string | null>(null);
  const [justPicked, setJustPicked] = useState(false);
  const displayCount = useCountUp(count);
  const isVoted = voted[articleId];
  const s = SIZES[size];
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setChosenEmoji(getVoteEmoji(articleId));
  }, [articleId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    if (pickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [pickerOpen]);

  function handleButtonClick() {
    if (isVoted || !ready || !identity) return;
    setPickerOpen((v) => !v);
  }

  async function handlePick(e: React.MouseEvent<HTMLButtonElement>, emoji: string) {
    e.stopPropagation();
    if (isVoted || !ready || !identity) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setVoteEmoji(articleId, emoji);
    setChosenEmoji(emoji);
    setPickerOpen(false);

    const { error } = await castVote(articleId);
    // Any error other than "already voted" means the context already
    // reverted the optimistic increment -- don't fire confetti for it.
    if (error && error !== "ALREADY_VOTED") return;

    fireConfetti(rect.left + rect.width / 2, rect.top, { count: 50, speed: 0.75, spreadUp: true });

    setJustPicked(true);
    setTimeout(() => setJustPicked(false), 1200);
  }

  return (
    <div ref={wrapperRef} className={`relative inline-block ${className}`}>
      <button
        onClick={handleButtonClick}
        disabled={isVoted || !ready}
        className={`flex items-center justify-center rounded-full shrink-0 transition-all active:scale-90 w-full ${justPicked ? "animate-vote-pulse" : ""}`}
        style={{
          padding: s.padding,
          fontSize: s.fontSize,
          gap: s.gap,
          backgroundColor: isVoted ? colors.green900 : colors.badgeBg,
          color: isVoted ? colors.white : colors.badgeText,
          border: `1px solid ${colors.green200}`,
          cursor: isVoted || !ready ? "default" : "pointer",
          opacity: !isVoted && !ready ? 0.6 : 1,
        }}
      >
        {isVoted && chosenEmoji ? (
          <span style={{ fontSize: s.iconSize + 3, lineHeight: 1 }}>{chosenEmoji}</span>
        ) : (
          <ThumbsUp size={s.iconSize} />
        )}
        <span>{displayCount}</span>
      </button>

      {pickerOpen && !isVoted && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex items-center gap-1 px-2 py-1.5 rounded-full shadow-lg z-20 animate-fade-slide-in"
          style={{ backgroundColor: colors.white, border: `1px solid ${colors.gray200}` }}
        >
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={(e) => handlePick(e, emoji)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:scale-125 active:scale-95 transition-transform text-lg"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
