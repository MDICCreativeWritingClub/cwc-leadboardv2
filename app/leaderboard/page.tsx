import { colors } from "@/lib/theme";
import { Leaderboard } from "@/components/Leaderboard";
import { Trophy } from "lucide-react";

export default function LeaderboardPage() {
  return (
    <div className="max-w-5xl mx-auto px-5 pt-24 pb-16">
      <div className="mb-8">
        <h1 className="flex items-center gap-2.5" style={{ color: colors.heading, fontWeight: 700, fontSize: "1.75rem" }}>
          <Trophy size={26} style={{ color: colors.green600 }} />
          Leaderboard
        </h1>
        <p style={{ color: colors.gray500, fontSize: "0.9rem" }}>
          Points combine staff scoring with community votes. Filter by any score.
        </p>
      </div>
      <Leaderboard />
    </div>
  );
}
