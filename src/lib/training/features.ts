import { calculateBollingerBands, calculateMACD, calculateRSI, OHLC } from '@/lib/market-data';
import { EngineeredFeatureRow } from '@/lib/training/types';

export const FEATURE_NAMES = [
  'rsi_14',
  'macd_hist_pct',
  'macd_gap_pct',
  'bollinger_position',
  'return_3',
  'return_6',
  'return_12',
  'ema_9_21_gap_pct',
  'distance_from_20_high',
  'distance_from_20_low',
  'volume_ratio_20',
] as const;

function pctChange(from: number, to: number) {
  if (!Number.isFinite(from) || from === 0) return 0;
  return ((to - from) / from) * 100;
}

function calculateEMA(values: number[], period: number): number[] {
  const ema: number[] = new Array(values.length).fill(0);
  if (values.length === 0) return ema;
  const seedEnd = Math.min(values.length, period);
  const seed = values.slice(0, seedEnd).reduce((sum, value) => sum + value, 0) / seedEnd;
  const alpha = 2 / (period + 1);

  for (let i = 0; i < seedEnd; i++) ema[i] = seed;
  for (let i = seedEnd; i < values.length; i++) {
    ema[i] = values[i] * alpha + ema[i - 1] * (1 - alpha);
  }
  return ema;
}

function averageVolume(candles: OHLC[], start: number, end: number) {
  const window = candles.slice(start, end + 1);
  const total = window.reduce((sum, candle) => sum + (candle.volume ?? 0), 0);
  return total / Math.max(window.length, 1);
}

export function buildFeatureRows(candles: OHLC[]): EngineeredFeatureRow[] {
  const closes = candles.map((candle) => candle.close);
  const rsi = calculateRSI(candles);
  const macd = calculateMACD(candles);
  const bands = calculateBollingerBands(candles);
  const ema9 = calculateEMA(closes, 9);
  const ema21 = calculateEMA(closes, 21);

  return candles.map((candle, index) => {
    const start20 = Math.max(0, index - 19);
    const recent20 = candles.slice(start20, index + 1);
    const high20 = recent20.reduce((max, row) => Math.max(max, row.high), Number.NEGATIVE_INFINITY);
    const low20 = recent20.reduce((min, row) => Math.min(min, row.low), Number.POSITIVE_INFINITY);
    const avgVol20 = averageVolume(candles, start20, index);
    const bandWidth = bands[index].upper - bands[index].lower;
    const bollingerPosition = bandWidth > 0 ? (candle.close - bands[index].lower) / bandWidth : 0.5;

    const features = [
      (rsi[index] - 50) / 50,
      candle.close !== 0 ? macd[index].histogram / candle.close : 0,
      candle.close !== 0 ? (macd[index].macd - macd[index].signal) / candle.close : 0,
      bollingerPosition - 0.5,
      index >= 3 ? pctChange(closes[index - 3], candle.close) / 100 : 0,
      index >= 6 ? pctChange(closes[index - 6], candle.close) / 100 : 0,
      index >= 12 ? pctChange(closes[index - 12], candle.close) / 100 : 0,
      candle.close !== 0 ? (ema9[index] - ema21[index]) / candle.close : 0,
      candle.close !== 0 && Number.isFinite(high20) ? pctChange(candle.close, high20) / 100 : 0,
      candle.close !== 0 && Number.isFinite(low20) ? pctChange(low20, candle.close) / 100 : 0,
      avgVol20 > 0 ? (candle.volume ?? 0) / avgVol20 - 1 : 0,
    ];

    return {
      timestamp: candle.timestamp,
      close: candle.close,
      features,
      isReady: index >= 26 && features.every(Number.isFinite),
    };
  });
}
