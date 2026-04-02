export type CompetitionSubmissionRecord = {
  id: string;
  challengeId: string;
  challengeName: string;
  userId: string;
  operator: string;
  score: number;
  verdict: string;
  submittedAtMs: number;
};

export type LeaderboardRow = {
  rank: number;
  userId: string;
  operator: string;
  score: number;
  pnlPercent: number;
  trades: number;
  streak: number;
  badge: string;
};

function badgeForScore(score: number) {
  if (score >= 7000) return 'Legend';
  if (score >= 5000) return 'Surging';
  if (score >= 3000) return 'Climber';
  return 'Rising';
}

function streakForSubmissions(submissions: CompetitionSubmissionRecord[]) {
  if (submissions.length === 0) return 0;

  const sorted = [...submissions].sort((a, b) => b.submittedAtMs - a.submittedAtMs);
  let streak = 0;
  for (const item of sorted) {
    if (item.score >= 80) streak += 1;
    else break;
  }
  return streak;
}

export function buildLeaderboard(records: CompetitionSubmissionRecord[]): LeaderboardRow[] {
  const grouped = new Map<string, CompetitionSubmissionRecord[]>();

  for (const record of records) {
    const existing = grouped.get(record.userId) ?? [];
    existing.push(record);
    grouped.set(record.userId, existing);
  }

  const rows = Array.from(grouped.entries()).map(([userId, submissions]) => {
    const bestByChallenge = new Map<string, CompetitionSubmissionRecord>();
    for (const submission of submissions) {
      const current = bestByChallenge.get(submission.challengeId);
      if (!current || submission.score > current.score) {
        bestByChallenge.set(submission.challengeId, submission);
      }
    }

    const score = Array.from(bestByChallenge.values()).reduce((sum, item) => sum + item.score, 0);
    const trades = submissions.length;
    const pnlPercent = Number(((score / 100) * 1.4).toFixed(1));

    return {
      rank: 0,
      userId,
      operator: submissions[0]?.operator || 'Operator',
      score,
      pnlPercent,
      trades,
      streak: streakForSubmissions(submissions),
      badge: badgeForScore(score),
    };
  });

  rows.sort((a, b) => b.score - a.score || b.pnlPercent - a.pnlPercent);

  return rows.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}

