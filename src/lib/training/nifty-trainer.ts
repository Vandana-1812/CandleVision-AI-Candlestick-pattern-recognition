import 'server-only';

import { buildFeatureRows, FEATURE_NAMES } from '@/lib/training/features';
import { buildTrainingExamples } from '@/lib/training/labels';
import { fetchNiftyCandles } from '@/lib/training/nifty-data';
import { fitSoftmaxModel, predictLabel, predictProbabilities } from '@/lib/training/softmax-model';
import { FeatureImportanceRow, SignalClass, SoftmaxModelArtifact, TrainingExample, TrainingJobConfig, TrainingMetrics, TrainingReport } from '@/lib/training/types';

const DEFAULT_CONFIG: TrainingJobConfig = {
  symbol: 'NIFTY 50',
  yahooSymbol: '^NSEI',
  range: '1mo',
  interval: '1h',
  horizonCandles: 6,
  thresholdPct: 0.35,
  testSplit: 0.3,
  epochs: 300,
  learningRate: 0.08,
  l2: 0.001,
};

function round(value: number, places: number = 4) {
  return Number(value.toFixed(places));
}

function createEmptyConfusionMatrix(): Record<SignalClass, Record<SignalClass, number>> {
  return {
    Sell: { Sell: 0, Hold: 0, Buy: 0 },
    Hold: { Sell: 0, Hold: 0, Buy: 0 },
    Buy: { Sell: 0, Hold: 0, Buy: 0 },
  };
}

function evaluateExamples(model: SoftmaxModelArtifact, examples: TrainingExample[]): TrainingMetrics {
  const confusionMatrix = createEmptyConfusionMatrix();
  let correct = 0;

  for (const example of examples) {
    const predicted = predictLabel(model, example.features);
    confusionMatrix[example.label][predicted] += 1;
    if (predicted === example.label) correct += 1;
  }

  const f1Scores = (['Sell', 'Hold', 'Buy'] as SignalClass[]).map((className) => {
    const tp = confusionMatrix[className][className];
    const fp = (['Sell', 'Hold', 'Buy'] as SignalClass[]).reduce((sum, actual) =>
      actual === className ? sum : sum + confusionMatrix[actual][className], 0);
    const fn = (['Sell', 'Hold', 'Buy'] as SignalClass[]).reduce((sum, predicted) =>
      predicted === className ? sum : sum + confusionMatrix[className][predicted], 0);

    const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
    const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
    return precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  });

  return {
    accuracy: examples.length === 0 ? 0 : round(correct / examples.length),
    macroF1: examples.length === 0 ? 0 : round(f1Scores.reduce((sum, score) => sum + score, 0) / f1Scores.length),
    confusionMatrix,
    sampleCount: examples.length,
  };
}

function buildFeatureImportance(model: SoftmaxModelArtifact): FeatureImportanceRow[] {
  return model.classes.map((className, classIndex) => {
    const pairs = model.featureNames.map((feature, featureIndex) => ({
      feature,
      weight: round(model.weights[classIndex][featureIndex]),
    }));

    const strongestPositive = [...pairs]
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5);
    const strongestNegative = [...pairs]
      .sort((a, b) => a.weight - b.weight)
      .slice(0, 5);

    return {
      className,
      strongestPositive,
      strongestNegative,
    };
  });
}

function classDistribution(examples: TrainingExample[]) {
  return examples.reduce<Record<SignalClass, number>>((acc, example) => {
    acc[example.label] += 1;
    return acc;
  }, { Sell: 0, Hold: 0, Buy: 0 });
}

export async function trainNiftyModel(options: Partial<TrainingJobConfig> = {}, includeArtifact: boolean = false): Promise<TrainingReport> {
  const config = { ...DEFAULT_CONFIG, ...options };
  const candles = await fetchNiftyCandles(config.yahooSymbol, config.range, config.interval);
  const featureRows = buildFeatureRows(candles);
  const examples = buildTrainingExamples(candles, featureRows, config.horizonCandles, config.thresholdPct);

  if (examples.length < 30) {
    throw new Error('Not enough labeled NIFTY examples to train the model');
  }

  const splitIndex = Math.max(20, Math.floor(examples.length * (1 - config.testSplit)));
  const trainExamples = examples.slice(0, splitIndex);
  const testExamples = examples.slice(splitIndex);
  const model = fitSoftmaxModel(trainExamples, [...FEATURE_NAMES], config.epochs, config.learningRate, config.l2);
  const latestExample = examples[examples.length - 1];
  const probabilities = predictProbabilities(model, latestExample.features);
  const predictedLabel = predictLabel(model, latestExample.features);

  return {
    config,
    dataset: {
      candles: candles.length,
      examples: examples.length,
      trainExamples: trainExamples.length,
      testExamples: testExamples.length,
      from: candles[0].timestamp,
      to: candles[candles.length - 1].timestamp,
      latestClose: round(candles[candles.length - 1].close, 2),
    },
    classDistribution: classDistribution(examples),
    trainMetrics: evaluateExamples(model, trainExamples),
    testMetrics: evaluateExamples(model, testExamples),
    recentInference: {
      timestamp: latestExample.timestamp,
      close: round(latestExample.close, 2),
      probabilities: {
        Sell: round(probabilities.Sell),
        Hold: round(probabilities.Hold),
        Buy: round(probabilities.Buy),
      },
      predictedLabel,
    },
    featureImportance: buildFeatureImportance(model),
    artifact: includeArtifact ? model : undefined,
  };
}
