import { describe, expect, it, vi } from 'vitest';

vi.mock('@/ai/genkit', () => ({
  ai: {
    definePrompt: () => async ({ technicalDataJSON }: { technicalDataJSON: string }) => {
      const parsed = JSON.parse(technicalDataJSON) as {
        indicators?: {
          rsi?: number;
          macd?: {
            histogram?: number;
          };
        };
      };

      const rsi = parsed.indicators?.rsi;
      const histogram = parsed.indicators?.macd?.histogram;

      if (typeof rsi === 'number' && typeof histogram === 'number' && rsi >= 70 && histogram > 0) {
        return {
          output: {
            signal: 'Buy' as const,
            confidenceScore: 85,
            reasoning: 'Bullish momentum and strong RSI.',
          },
        };
      }

      if (typeof rsi === 'number' && typeof histogram === 'number' && rsi <= 30 && histogram < 0) {
        return {
          output: {
            signal: 'Sell' as const,
            confidenceScore: 84,
            reasoning: 'Bearish momentum and weak RSI.',
          },
        };
      }

      return {
        output: {
          signal: 'Hold' as const,
          confidenceScore: 62,
          reasoning: 'Mixed or neutral indicators.',
        },
      };
    },
    defineFlow: (_config: unknown, impl: (input: unknown) => Promise<unknown>) => impl,
  },
}));

import { generateTradingSignals, GenerateTradingSignalInput } from './generate-trading-signals';

describe('generateTradingSignals', () => {
  it('should return a buy signal with high confidence', async () => {
    const input: GenerateTradingSignalInput = {
      symbol: 'BTC/USD',
      interval: '1d',
      ohlcData: [
        {
          timestamp: '2023-10-26T00:00:00.000Z',
          open: 34000,
          high: 34500,
          low: 33800,
          close: 34200,
          volume: 1000
        }
      ],
      technicalIndicators: {
        rsi: 75,
        macd: {
          line: 150,
          signal: 120,
          histogram: 30
        }
      },
      currentPrice: 34300
    };

    const result = await generateTradingSignals(input);

    expect(result.signal).toBe('Buy');
    expect(result.confidenceScore).toBeGreaterThan(70);
    expect(result.reasoning).toBeTruthy();
  });

  it('should return a sell signal with high confidence', async () => {
    const input: GenerateTradingSignalInput = {
      symbol: 'ETH/USD',
      interval: '4h',
      ohlcData: [
        {
          timestamp: '2023-10-26T00:00:00.000Z',
          open: 1800,
          high: 1820,
          low: 1780,
          close: 1790,
          volume: 2000
        }
      ],
      technicalIndicators: {
        rsi: 25,
        macd: {
          line: -50,
          signal: -20,
          histogram: -30
        }
      },
      currentPrice: 1785
    };

    const result = await generateTradingSignals(input);

    expect(result.signal).toBe('Sell');
    expect(result.confidenceScore).toBeGreaterThan(70);
    expect(result.reasoning).toBeTruthy();
  });

  it('should return a hold signal when indicators are neutral', async () => {
    const input: GenerateTradingSignalInput = {
      symbol: 'ADA/USD',
      interval: '1h',
      ohlcData: [
        {
          timestamp: '2023-10-26T00:00:00.000Z',
          open: 0.25,
          high: 0.255,
          low: 0.245,
          close: 0.25,
          volume: 500
        }
      ],
      technicalIndicators: {
        rsi: 50,
        macd: {
          line: 0,
          signal: 0,
          histogram: 0
        }
      },
      currentPrice: 0.251
    };

    const result = await generateTradingSignals(input);

    expect(result.signal).toBe('Hold');
    expect(result.confidenceScore).toBeDefined();
    expect(result.reasoning).toBeTruthy();
  });
});