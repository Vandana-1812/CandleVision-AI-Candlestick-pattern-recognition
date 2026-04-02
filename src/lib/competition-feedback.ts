import { CompetitionChallenge } from '@/lib/competition-data';

export type CompetitionFeedback = {
  score: number;
  verdict: string;
  summary: string;
  strengths: string[];
  improvements: string[];
};

function hasNumber(text: string) {
  return /\d/.test(text);
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

export function evaluateCompetitionAnswer(
  challenge: CompetitionChallenge,
  answer: string
): CompetitionFeedback {
  const normalized = answer.toLowerCase().trim();
  const strengths: string[] = [];
  const improvements: string[] = [];
  let score = 35;

  if (normalized.length >= 18) {
    score += 10;
    strengths.push('You gave enough detail to judge the idea.');
  } else {
    improvements.push('Write a slightly fuller answer so your idea is easier to evaluate.');
  }

  if (challenge.id === 'macro-gauntlet') {
    const mentionsAssets = ['btc', 'eth', 'tsla'].filter((term) => normalized.includes(term)).length;
    const hasRankingLanguage = includesAny(normalized, ['first', 'second', 'third', 'strongest', 'weakest', 'rank']);
    const hasRiskLanguage = includesAny(normalized, ['risk', 'invalid', 'avoid', 'stop', 'volatility']);

    if (mentionsAssets >= 2) {
      score += 20;
      strengths.push('You compared multiple assets instead of talking about only one.');
    } else {
      improvements.push('Compare the assets directly so the ranking is clear.');
    }

    if (hasRankingLanguage || mentionsAssets === 3) {
      score += 15;
      strengths.push('Your answer shows a relative ranking, which fits this challenge.');
    } else {
      improvements.push('State the strongest asset first, then rank the others below it.');
    }

    if (hasRiskLanguage) {
      score += 10;
      strengths.push('You included a risk note, which makes the answer more complete.');
    } else {
      improvements.push('Add one risk or invalidation point for your top pick.');
    }
  } else {
    const hasDirection = includesAny(normalized, ['long', 'short', 'buy', 'sell', 'stay out', 'no trade', 'wait']);
    const hasLevels = hasNumber(normalized);
    const hasRisk = includesAny(normalized, ['stop', 'risk', 'invalid', 'loss']);
    const hasReason = includesAny(normalized, ['because', 'reason', 'support', 'resistance', 'breakout', 'trend', 'momentum']);

    if (hasDirection) {
      score += 15;
      strengths.push('You made a clear directional choice.');
    } else {
      improvements.push('Choose one clear action such as long, short, or stay out.');
    }

    if (hasLevels) {
      score += 15;
      strengths.push('You included levels, which makes the trade idea actionable.');
    } else {
      improvements.push('Add a specific level or condition to confirm the setup.');
    }

    if (hasRisk) {
      score += 10;
      strengths.push('You included some risk control in the setup.');
    } else {
      improvements.push('Mention a stop, invalidation, or risk limit.');
    }

    if (hasReason) {
      score += 10;
      strengths.push('You gave a reason behind the trade instead of only naming a direction.');
    } else {
      improvements.push('Explain why the setup is valid using structure or momentum.');
    }
  }

  score = Math.max(0, Math.min(100, score));

  let verdict = 'Needs work';
  let summary = 'The answer has a base idea, but it needs clearer structure before it feels competition-ready.';

  if (score >= 80) {
    verdict = 'Strong answer';
    summary = 'This is a solid challenge response with clear decision-making and useful detail.';
  } else if (score >= 60) {
    verdict = 'Good start';
    summary = 'The idea is understandable, but a few missing details are stopping it from being a strong submission.';
  }

  if (strengths.length === 0) {
    strengths.push('You submitted an answer, which is better than leaving the challenge blank.');
  }

  if (improvements.length === 0) {
    improvements.push('Tighten the wording so the answer stays short and easy to judge.');
  }

  return {
    score,
    verdict,
    summary,
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 3),
  };
}
