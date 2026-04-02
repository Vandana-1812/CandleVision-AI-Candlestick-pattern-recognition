import { OHLC } from '@/lib/market-data';

export type SignalClass = 'Sell' | 'Hold' | 'Buy';

export interface TrainingJobConfig {
  symbol: string;
  yahooSymbol: string;
  range: string;
  interval: string;
  horizonCandles: number;
  thresholdPct: number;
  testSplit: number;
  epochs: number;
  learningRate: number;
  l2: number;
}

export interface EngineeredFeatureRow {
  timestamp: string;
  close: number;
  features: number[];
  isReady: boolean;
}

export interface TrainingExample {
  timestamp: string;
  close: number;
  futureClose: number;
  futureReturnPct: number;
  features: number[];
  labelIndex: number;
  label: SignalClass;
}

export interface NormalizationStats {
  means: number[];
  stdDevs: number[];
}

export interface SoftmaxModelArtifact {
  featureNames: string[];
  classes: SignalClass[];
  weights: number[][];
  biases: number[];
  normalization: NormalizationStats;
}

export interface TrainingMetrics {
  accuracy: number;
  macroF1: number;
  confusionMatrix: Record<SignalClass, Record<SignalClass, number>>;
  sampleCount: number;
}

export interface FeatureImportanceRow {
  className: SignalClass;
  strongestPositive: Array<{ feature: string; weight: number }>;
  strongestNegative: Array<{ feature: string; weight: number }>;
}

export interface TrainingReport {
  config: TrainingJobConfig;
  dataset: {
    candles: number;
    examples: number;
    trainExamples: number;
    testExamples: number;
    from: string;
    to: string;
    latestClose: number;
  };
  classDistribution: Record<SignalClass, number>;
  trainMetrics: TrainingMetrics;
  testMetrics: TrainingMetrics;
  recentInference: {
    timestamp: string;
    close: number;
    probabilities: Record<SignalClass, number>;
    predictedLabel: SignalClass;
  };
  featureImportance: FeatureImportanceRow[];
  artifact?: SoftmaxModelArtifact;
}

export type CandleSeries = OHLC[];
