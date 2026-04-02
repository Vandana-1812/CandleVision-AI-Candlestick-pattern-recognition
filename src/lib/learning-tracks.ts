export type LearningLesson = {
  id: string;
  title: string;
  duration: string;
  url: string;
  focus: string;
  checkpoint: string;
  category: 'foundation' | 'patterns' | 'levels' | 'indicators' | 'execution';
};

export const zerodhaTechnicalAnalysisTrack = {
  title: 'Technical Analysis Track',
  provider: 'Zerodha Varsity',
  totalDuration: '2h 1m 36s',
  lessonsCount: 12,
  sourceUrl: 'https://zerodha.com/varsity/video-modules/',
  moduleUrl: 'https://zerodha.com/varsity/module/technical-analysis-video-series/',
  playlistUrl: 'https://zerodha.com/varsity/module/technical-analysis/',
  lessons: [
    {
      id: 'fundamental-vs-technical',
      title: 'Technical Analysis vs Fundamental Analysis',
      duration: '05m 41s',
      url: 'https://zerodha.com/varsity/chapter/fundamental-analysis-vs-technical-analysis/',
      focus: 'Understand when price-based decision making is more useful than business-value analysis.',
      checkpoint: 'Explain in one sentence when you would prefer a chart decision over a fundamentals decision.',
      category: 'foundation',
    },
    {
      id: 'setting-expectations',
      title: 'Setting Expectations',
      duration: '04m 23s',
      url: 'https://zerodha.com/varsity/chapter/setting-realistic-expectations/',
      focus: 'Calibrate what technical analysis can and cannot do for trade planning.',
      checkpoint: 'Write down one realistic outcome and one unrealistic expectation from using indicators.',
      category: 'foundation',
    },
    {
      id: 'chart-types',
      title: 'Chart Types',
      duration: '07m 29s',
      url: 'https://zerodha.com/varsity/chapter/types-of-charts/',
      focus: 'Compare line, bar, and candlestick charts and know why candles dominate trading screens.',
      checkpoint: 'Identify which chart type gives you the cleanest decision context and why.',
      category: 'foundation',
    },
    {
      id: 'timeframes',
      title: 'Timeframes',
      duration: '10m 51s',
      url: 'https://zerodha.com/varsity/chapter/timeframes/',
      focus: 'Match trade duration with the right chart timeframe instead of forcing one chart on every setup.',
      checkpoint: 'Choose one timeframe for entry and one for context in your current trading style.',
      category: 'foundation',
    },
    {
      id: 'key-assumption',
      title: 'Key Assumption of Technical Analysis',
      duration: '04m 26s',
      url: 'https://zerodha.com/varsity/chapter/key-assumption-of-technical-analysis/',
      focus: 'Learn the market-behavior assumptions underneath pattern and indicator usage.',
      checkpoint: 'State the assumption that lets past price structure matter for a current trade.',
      category: 'foundation',
    },
    {
      id: 'understanding-candlesticks',
      title: 'Understanding Candlestick Patterns',
      duration: '03m 45s',
      url: 'https://zerodha.com/varsity/chapter/understanding-candlestick-patterns/',
      focus: 'Read candle bodies and wicks as signs of conviction, rejection, and imbalance.',
      checkpoint: 'Describe what a long wick tells you about the failed side of the market.',
      category: 'patterns',
    },
    {
      id: 'single-candlestick',
      title: 'Single Candlestick Patterns',
      duration: '16m 21s',
      url: 'https://zerodha.com/varsity/chapter/single-candlestick-patterns/',
      focus: 'Recognize the few single-candle signals worth using without overfitting every candle.',
      checkpoint: 'Name one bullish and one bearish single-candle signal you would actually trade.',
      category: 'patterns',
    },
    {
      id: 'multiple-candlestick',
      title: 'Multiple Candlestick Patterns',
      duration: '22m 42s',
      url: 'https://zerodha.com/varsity/chapter/multiple-candlestick-patterns/',
      focus: 'See how two- and three-candle structures confirm reversals or continuation more reliably.',
      checkpoint: 'Pick one multi-candle pattern and define the confirmation you would need before entry.',
      category: 'patterns',
    },
    {
      id: 'support-resistance',
      title: 'Support and Resistance',
      duration: '13m 49s',
      url: 'https://zerodha.com/varsity/chapter/support-and-resistance/',
      focus: 'Mark the price zones where reactions matter more than perfect lines.',
      checkpoint: 'Mark one support zone and one resistance zone before opening the replay tool.',
      category: 'levels',
    },
    {
      id: 'technical-indicators',
      title: 'Technical Indicators',
      duration: '19m 36s',
      url: 'https://zerodha.com/varsity/chapter/technical-indicators/',
      focus: 'Use indicators as filters and context tools instead of replacing price action.',
      checkpoint: 'Write one rule for when an indicator confirms your setup and one rule for when it does not.',
      category: 'indicators',
    },
    {
      id: 'moving-averages',
      title: 'Moving Averages',
      duration: '07m 44s',
      url: 'https://zerodha.com/varsity/chapter/moving-averages-2/',
      focus: 'Read moving averages as trend and dynamic support tools without turning them into lag traps.',
      checkpoint: 'Choose the moving average role you care about most: trend filter, pullback guide, or crossover trigger.',
      category: 'indicators',
    },
    {
      id: 'trading-checklist',
      title: 'Your Trading Checklist',
      duration: '04m 49s',
      url: 'https://zerodha.com/varsity/chapter/your-trading-checklist/',
      focus: 'Turn the module into a repeatable pre-trade checklist you can carry into replay and competitions.',
      checkpoint: 'Draft a 4-point checklist using direction, level, risk, and trigger.',
      category: 'execution',
    },
  ] satisfies LearningLesson[],
};

export const indicatorSprint = {
  title: 'Indicators Sprint',
  totalDuration: '46m 09s',
  description:
    'A focused subset for traders who want the indicator-heavy lessons first without losing chart context.',
  lessonIds: ['support-resistance', 'technical-indicators', 'moving-averages', 'trading-checklist'],
};
