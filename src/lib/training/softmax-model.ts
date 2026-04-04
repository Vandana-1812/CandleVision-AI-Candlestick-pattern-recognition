import { NormalizationStats, SignalClass, SoftmaxModelArtifact, TrainingExample } from '@/lib/training/types';

const CLASSES: SignalClass[] = ['Sell', 'Hold', 'Buy'];

function zeros(rows: number, cols: number) {
  return Array.from({ length: rows }, () => new Array(cols).fill(0));
}

function dot(a: number[], b: number[]) {
  let total = 0;
  for (let index = 0; index < a.length; index++) total += a[index] * b[index];
  return total;
}

function softmax(logits: number[]) {
  const maxLogit = Math.max(...logits);
  const exps = logits.map((logit) => Math.exp(logit - maxLogit));
  const sum = exps.reduce((total, value) => total + value, 0);
  return exps.map((value) => value / sum);
}

function buildNormalization(features: number[][]): NormalizationStats {
  const featureCount = features[0]?.length ?? 0;
  const means = new Array(featureCount).fill(0);
  const stdDevs = new Array(featureCount).fill(1);

  for (let featureIndex = 0; featureIndex < featureCount; featureIndex++) {
    const column = features.map((row) => row[featureIndex]);
    const mean = column.reduce((sum, value) => sum + value, 0) / Math.max(column.length, 1);
    const variance = column.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(column.length, 1);
    means[featureIndex] = mean;
    stdDevs[featureIndex] = Math.sqrt(variance) || 1;
  }

  return { means, stdDevs };
}

function normalizeVector(features: number[], normalization: NormalizationStats) {
  return features.map((value, index) => (value - normalization.means[index]) / normalization.stdDevs[index]);
}

export function fitSoftmaxModel(
  examples: TrainingExample[],
  featureNames: string[],
  epochs: number,
  learningRate: number,
  l2: number
): SoftmaxModelArtifact {
  if (examples.length === 0) {
    throw new Error('No training examples available for the model');
  }

  const featureCount = featureNames.length;
  const normalization = buildNormalization(examples.map((example) => example.features));
  const normalized = examples.map((example) => ({
    ...example,
    features: normalizeVector(example.features, normalization),
  }));

  const weights = zeros(CLASSES.length, featureCount);
  const biases = new Array(CLASSES.length).fill(0);

  for (let epoch = 0; epoch < epochs; epoch++) {
    const weightGrads = zeros(CLASSES.length, featureCount);
    const biasGrads = new Array(CLASSES.length).fill(0);

    for (const example of normalized) {
      const logits = CLASSES.map((_, classIndex) => dot(weights[classIndex], example.features) + biases[classIndex]);
      const probabilities = softmax(logits);

      for (let classIndex = 0; classIndex < CLASSES.length; classIndex++) {
        const target = example.labelIndex === classIndex ? 1 : 0;
        const error = probabilities[classIndex] - target;
        biasGrads[classIndex] += error;

        for (let featureIndex = 0; featureIndex < featureCount; featureIndex++) {
          weightGrads[classIndex][featureIndex] += error * example.features[featureIndex];
        }
      }
    }

    const sampleCount = normalized.length;
    for (let classIndex = 0; classIndex < CLASSES.length; classIndex++) {
      biases[classIndex] -= learningRate * (biasGrads[classIndex] / sampleCount);

      for (let featureIndex = 0; featureIndex < featureCount; featureIndex++) {
        const gradient = weightGrads[classIndex][featureIndex] / sampleCount + l2 * weights[classIndex][featureIndex];
        weights[classIndex][featureIndex] -= learningRate * gradient;
      }
    }
  }

  return {
    featureNames,
    classes: CLASSES,
    weights,
    biases,
    normalization,
  };
}

export function predictProbabilities(model: SoftmaxModelArtifact, features: number[]) {
  const normalized = normalizeVector(features, model.normalization);
  const logits = model.classes.map((_, classIndex) => dot(model.weights[classIndex], normalized) + model.biases[classIndex]);
  const probabilities = softmax(logits);

  return model.classes.reduce<Record<SignalClass, number>>((acc, className, index) => {
    acc[className] = probabilities[index];
    return acc;
  }, { Sell: 0, Hold: 0, Buy: 0 });
}

export function predictLabel(model: SoftmaxModelArtifact, features: number[]) {
  const probabilities = predictProbabilities(model, features);
  return model.classes.reduce<SignalClass>((best, current) =>
    probabilities[current] > probabilities[best] ? current : best
  , 'Hold');
}
