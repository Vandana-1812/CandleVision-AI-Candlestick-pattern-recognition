import { OHLC } from '@/lib/market-data';
import { EngineeredFeatureRow, SignalClass, TrainingExample } from '@/lib/training/types';

function classifyReturn(futureReturnPct: number, thresholdPct: number): { label: SignalClass; labelIndex: number } {
  if (futureReturnPct > thresholdPct) return { label: 'Buy', labelIndex: 2 };
  if (futureReturnPct < -thresholdPct) return { label: 'Sell', labelIndex: 0 };
  return { label: 'Hold', labelIndex: 1 };
}

export function buildTrainingExamples(
  candles: OHLC[],
  featureRows: EngineeredFeatureRow[],
  horizonCandles: number,
  thresholdPct: number
): TrainingExample[] {
  const examples: TrainingExample[] = [];

  for (let index = 0; index < featureRows.length - horizonCandles; index++) {
    const featureRow = featureRows[index];
    if (!featureRow.isReady) continue;

    const currentClose = candles[index].close;
    const futureClose = candles[index + horizonCandles].close;
    const futureReturnPct = currentClose !== 0 ? ((futureClose - currentClose) / currentClose) * 100 : 0;
    const { label, labelIndex } = classifyReturn(futureReturnPct, thresholdPct);

    examples.push({
      timestamp: featureRow.timestamp,
      close: currentClose,
      futureClose,
      futureReturnPct,
      features: featureRow.features,
      label,
      labelIndex,
    });
  }

  return examples;
}
