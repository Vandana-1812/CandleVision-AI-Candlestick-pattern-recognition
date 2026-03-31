export type CompetitionChallenge = {
  id: string;
  name: string;
  style: string;
  participants: number;
  reward: string;
  timeLeft: string;
  difficulty: string;
  focus: string;
  symbol: string;
  format: string;
  objective: string;
  duration: string;
  task: string;
  deliverables: string[];
  evaluation: string[];
};

export const activeChallenges: CompetitionChallenge[] = [
  {
    id: 'btc-sprint',
    name: 'Alpha Extraction: BTC/USDT',
    style: 'Momentum Sprint',
    participants: 18,
    reward: '+180 pts',
    timeLeft: '26m',
    difficulty: 'Medium',
    focus: 'Call the next breakout direction',
    symbol: 'BTC',
    format: 'Micro challenge',
    objective: 'Look at the current BTC structure and decide whether the next valid trade is long, short, or no trade.',
    duration: '12 min',
    task: 'State your trade direction for the next setup, then define one clean entry, stop loss, and target.',
    deliverables: [
      'Choose one: long, short, or no trade.',
      'Write one exact entry level and one exact stop level.',
      'Give one short reason based on structure, momentum, or support/resistance.',
    ],
    evaluation: [
      'Clear direction is better than vague market commentary.',
      'Risk-to-reward should be at least 1:1.5 if you choose a trade.',
      'The strongest answer uses the current chart, not general BTC opinion.',
    ],
  },
  {
    id: 'macro-gauntlet',
    name: 'Macro Gauntlet: Multi-Asset',
    style: 'Cross-Market Rotation',
    participants: 11,
    reward: '+220 pts',
    timeLeft: '54m',
    difficulty: 'Hard',
    focus: 'Pick the safest instrument today',
    symbol: 'BTC, ETH, TSLA',
    format: 'Scenario challenge',
    objective: 'Choose the one market that offers the cleanest setup right now and explain why the other two are weaker.',
    duration: '15 min',
    task: 'Select the best instrument to trade between BTC, ETH, and TSLA, then explain your ranking from strongest to weakest.',
    deliverables: [
      'Name the one asset you would trade first.',
      'Rank the other two assets below it.',
      'Give one reason for your top pick and one risk to avoid.',
    ],
    evaluation: [
      'Your top pick should have the clearest trend or cleanest invalidation.',
      'Ranking should show relative strength, not random ordering.',
      'A concise risk note matters as much as the setup choice.',
    ],
  },
  {
    id: 'stealth-ladder',
    name: 'Stealth Ladder: Low Drawdown',
    style: 'Risk Discipline',
    participants: 7,
    reward: '+140 pts',
    timeLeft: '18m',
    difficulty: 'Easy',
    focus: 'Find the safest no-rush setup',
    symbol: 'BTC',
    format: 'Quick decision',
    objective: 'Decide whether the chart offers a safe setup now or whether the correct answer is to wait.',
    duration: '10 min',
    task: 'Give the lowest-risk action you would take right now: buy, sell, or stay out, then justify it in one or two sentences.',
    deliverables: [
      'Choose buy, sell, or stay out.',
      'Name the level or condition that would confirm your idea.',
      'Explain how you are keeping risk small.',
    ],
    evaluation: [
      'The best answer protects capital first.',
      'Waiting is a valid answer if the setup is weak.',
      'Simple, disciplined reasoning beats overcomplicated analysis.',
    ],
  },
];

export function getChallengeById(challengeId: string) {
  return activeChallenges.find((challenge) => challenge.id === challengeId);
}
