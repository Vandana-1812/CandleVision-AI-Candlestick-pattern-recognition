"use client";

import React, { useState } from "react";
import { SidebarNav } from "@/components/dashboard/SidebarNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PlayCircle,
  BookOpen,
  Award,
  BrainCircuit,
  ShieldCheck,
  Target,
} from "lucide-react";
import { useRouter } from "next/navigation";

/* MODULES */
const modules = [
  { title: "Intro to Candlesticks", icon: BookOpen },
  { title: "Advanced Patterns", icon: Target },
  { title: "Psychology of Trading", icon: BrainCircuit },
  { title: "Risk Management", icon: ShieldCheck },
];

/* CONTENT */
const moduleContent = {
  "Intro to Candlesticks": {
    image: "/candlestick.webp",
    description:
      "Candlesticks represent price movement and help understand market direction.",
    sections: [
      {
        title: "Basics",
        content: [
          "Open, High, Low, Close define a candle.",
          "Body shows price difference.",
          "Wicks show extremes.",
        ],
      },
      {
        title: "Single Candle Patterns",
        content: [
          "Doji → indecision in market",
          "Hammer → potential reversal after downtrend",
          "Shooting Star → potential reversal after uptrend",
          "Marubozu → strong momentum with no wicks",
        ],
      },
      {
        title: "Bullish Patterns",
        content: [
          "Bullish Engulfing → strong buying pressure",
          "Morning Star → three-candle reversal pattern",
          "Piercing Line → bullish reversal after downtrend",
        ],
      },
      {
        title: "Bearish Patterns",
        content: [
          "Bearish Engulfing → strong selling pressure",
          "Evening Star → three-candle reversal pattern",
          "Dark Cloud Cover → bearish reversal after uptrend",
        ],
      },
      {
        title: "Timeframes",
        content: [
          "Higher timeframes (Daily, Weekly) → major trend direction",
          "Lower timeframes (1min, 5min) → entry timing",
          "Multi-timeframe analysis → alignment for higher probability",
        ],
      },
      {
        title: "Practical Tips",
        content: [
          "Wait for candle close before confirming patterns",
          "Combine candlestick patterns with support/resistance levels",
          "Use volume to confirm pattern strength",
          "Practice identifying patterns on historical charts",
        ],
      },
    ],
  },

  "Advanced Patterns": {
    image: "/patterns.webp",
    description: "Patterns help predict future price movement.",
    sections: [
      {
        title: "Reversal Patterns",
        content: [
          "Head & Shoulders → major trend reversal",
          "Inverse Head & Shoulders → bullish reversal",
          "Double Top → bearish reversal",
          "Double Bottom → bullish reversal",
          "Triple Top/Bottom → stronger reversal signals",
        ],
      },
      {
        title: "Continuation Patterns",
        content: [
          "Bull Flag → pause before upward continuation",
          "Bear Flag → pause before downward continuation",
          "Pennants → symmetrical consolidation before breakout",
          "Cup & Handle → bullish continuation pattern",
          "Ascending/Descending Triangles → breakout direction bias",
        ],
      },
      {
        title: "Pattern Confirmation",
        content: [
          "Volume should increase on breakout",
          "Price should close beyond pattern boundary",
          "Look for retest of broken levels",
          "Higher timeframe alignment increases reliability",
        ],
      },
      {
        title: "Common Mistakes",
        content: [
          "Entering before pattern completes",
          "Ignoring overall market context",
          "Not using stop-losses",
          "Pattern hunting without confirmation",
        ],
      },
      {
        title: "Advanced Concepts",
        content: [
          "Harmonic patterns → Gartley, Bat, Butterfly",
          "Elliott Wave Theory → pattern sequences",
          "Wyckoff accumulation/distribution patterns",
        ],
      },
    ],
  },

  "Psychology of Trading": {
    image: "/psychology.png",
    description: "Emotions affect trading decisions.",
    sections: [
      {
        title: "Common Emotions",
        content: [
          "Fear → early exit, missing opportunities",
          "Greed → overtrading, increasing position size",
          "FOMO → chasing trades, bad entries",
          "Hope → holding losing positions too long",
          "Revenge → trading emotionally after losses",
        ],
      },
      {
        title: "Mental Traps",
        content: [
          "Revenge Trading → chasing losses after a bad trade",
          "Hesitation → missing entries due to doubt",
          "Overconfidence → increasing size after wins",
          "Confirmation Bias → only seeing evidence that supports your trade",
          "Anchoring → fixating on entry price",
          "Endowment Effect → overvaluing current positions",
        ],
      },
      {
        title: "Developing Discipline",
        content: [
          "Follow your trading plan without deviation",
          "Accept losses as part of the process",
          "Take breaks after emotional trades",
          "Meditation and mindfulness techniques",
          "Set daily loss limits",
          "Review trades objectively",
        ],
      },
      {
        title: "Trading Routine",
        content: [
          "Pre-market preparation → analyze key levels",
          "Set alerts for trade setups",
          "Take breaks between trades",
          "Post-market review → journaling",
          "Weekend analysis → review performance",
        ],
      },
      {
        title: "Building Confidence",
        content: [
          "Start with small position sizes",
          "Backtest strategies to build trust",
          "Celebrate process adherence, not just wins",
          "Learn from losses instead of dwelling on them",
        ],
      },
    ],
  },

  "Risk Management": {
    image: "/risk.png",
    description: "Protect your capital.",
    sections: [
      {
        title: "Core Rules",
        content: [
          "Always use a stop-loss",
          "Risk 1-2% maximum per trade",
          "Avoid overtrading",
          "Never risk more than you can afford to lose",
          "Protect profits with trailing stops",
        ],
      },
      {
        title: "Position Sizing",
        content: [
          "Calculate position size based on stop-loss distance",
          "Formula: Risk Amount / (Entry - Stop Loss) = Position Size",
          "Never risk more than 1-2% of account per trade",
          "Scale in and out of positions strategically",
          "Reduce size during losing streaks",
        ],
      },
      {
        title: "Risk-to-Reward Ratio",
        content: [
          "Minimum 1:2 risk-to-reward ratio",
          "1:3 or higher is ideal for consistent profitability",
          "Let winners run, cut losers quickly",
          "Avoid moving stop-loss further from entry",
          "Take partial profits at key levels",
        ],
      },
      {
        title: "Drawdown Management",
        content: [
          "Daily loss limit → stop trading after max loss (e.g., 3% per day)",
          "Weekly loss limit → reassess strategy",
          "Monthly loss limit → take a break and review",
          "Reduce size by 50% after 2 consecutive losses",
        ],
      },
      {
        title: "Advanced Risk Concepts",
        content: [
          "Correlation risk → avoid overexposure to correlated assets",
          "Volatility-based position sizing → smaller size in high volatility",
          "Portfolio diversification → don't put all capital in one strategy",
          "Maximum exposure → never risk more than 10% of account across open trades",
        ],
      },
      {
        title: "Risk Management Tools",
        content: [
          "Trailing stops → lock in profits as price moves",
          "Breakeven stops → eliminate risk after favorable move",
          "Time-based exits → exit if trade doesn't work within expected time",
          "Alert systems → avoid constantly watching charts",
        ],
      },
    ],
  },
};

/* MILESTONE */
const milestoneContent = {
  "Intro to Candlesticks": {
    title: "Move to Patterns",
    description: "Now learn how candles form patterns.",
  },
  "Advanced Patterns": {
    title: "Test in Replay",
    description: "Apply patterns in replay mode.",
  },
  "Psychology of Trading": {
    title: "Control Emotions",
    description: "Practice discipline in replay.",
  },
  "Risk Management": {
    title: "Protect Capital",
    description: "Test strategies safely.",
  },
};

export default function LearningPage() {
  const [selectedModule, setSelectedModule] = useState(null);
  const router = useRouter();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <SidebarNav />

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* HEADER */}
        <header>
          <h1 className="text-3xl font-bold">LEARNING HUB</h1>
          <p className="text-muted-foreground">
            Master the markets step by step.
          </p>
        </header>

        {/* MODULES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modules.map((m) => (
            <div
              key={m.title}
              onClick={() => setSelectedModule(m.title)}
              className="cursor-pointer"
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center gap-4">
                  <m.icon className="w-6 h-6 text-primary" />
                  <CardTitle>{m.title}</CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Click to explore
                  </p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* CONTENT */}
        {selectedModule && moduleContent[selectedModule] && (
          <Card>
            <CardHeader>
              <CardTitle>{selectedModule}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <img
                src={moduleContent[selectedModule].image}
                className="w-full max-h-64 object-contain bg-black rounded"
                alt="module"
              />

              <p className="text-sm text-muted-foreground">
                {moduleContent[selectedModule].description}
              </p>

              {moduleContent[selectedModule].sections.map((section, i) => (
                <div key={i}>
                  <h3 className="font-semibold mt-4">{section.title}</h3>
                  <ul className="text-xs mt-1 space-y-1">
                    {section.content.map((point, j) => (
                      <li key={j}>• {point}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* MILESTONE */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Next Milestone
            </CardTitle>
          </CardHeader>

          <CardContent>
            {selectedModule ? (
              <>
                <p className="font-bold">
                  {milestoneContent[selectedModule]?.title || "Complete Module"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {milestoneContent[selectedModule]?.description || "Keep learning and practicing!"}
                </p>

                <button
                  onClick={() => router.push("/replay")}
                  className="mt-2 flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                >
                  <PlayCircle className="w-4 h-4" />
                  Go to Replay
                </button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a module to continue.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}