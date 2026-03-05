import { apiGet } from "@/lib/api";
import { DataTable } from "@/components/data-table";
import { SectionHeader } from "@/components/section-header";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const leaderboard = await apiGet<Array<{ user: { email: string }; score: number; accuracy: number }>>("/v1/leaderboard?period=7d");

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Leaderboard"
        title="Top forecasters over the last seven days."
        description="Scores reflect resolved market performance and consistency, using serious scoring rules rather than gamified point inflation."
        className="subtle-grid"
      />
      <DataTable
        title="Scoreboard"
        columns={["Analyst", "Score", "Resolved Markets"]}
        rows={leaderboard.map((row) => [
          row.user.email,
          formatNumber(row.score),
          formatNumber(row.accuracy)
        ])}
      />
    </div>
  );
}
