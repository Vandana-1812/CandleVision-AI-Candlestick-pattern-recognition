import {
  Firestore,
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';

export type SignalRecordInput = {
  symbol: string;
  signal: 'Buy' | 'Sell' | 'Hold';
  inferenceModel?: 'CNN' | 'LSTM' | 'YOLO' | 'FALLBACK';
  entryPrice: number;
  confidenceScore: number;
  reasoning: string;
  patternDetected?: string;
  patternConfidence?: number;
  technicalAlignment?: number;
  detectedPatterns?: Array<{
    name: string;
    confidence: number;
    signal: 'Buy' | 'Sell' | 'Hold';
    direction: 'bullish' | 'bearish' | 'neutral';
    patternId?: number;
    isStrongSignal?: boolean;
  }>;
  patternSummary?: {
    dominantSignal: 'Buy' | 'Sell' | 'Hold';
    confidence: number;
    totalPatterns: number;
    bullishPatterns: Array<{ name: string; confidence: number }>;
    bearishPatterns: Array<{ name: string; confidence: number }>;
    neutralPatterns: Array<{ name: string; confidence: number }>;
    strongSignals: Array<{ name: string; confidence: number }>;
  };
  technicalSummary?: {
    rsi?: number;
    macd?: {
      line?: number;
      signal?: number;
      histogram?: number;
    };
    bollingerBands?: {
      upper?: number;
      middle?: number;
      lower?: number;
    };
    momentum?: 'Bullish' | 'Bearish' | 'Neutral';
    alignmentScore?: number;
  };
  explanationDetails?: string[];
  signalContractVersion?: string;
};

export type SignalRecord = SignalRecordInput & {
  id: string;
};

export async function saveSignalRecord(db: Firestore, uid: string, input: SignalRecordInput) {
  const signalsRef = collection(db, 'users', uid, 'signals');
  const docRef = await addDoc(signalsRef, {
    ...input,
    timestamp: serverTimestamp(),
    isVerified: false,
    predictionResult: 'pending',
    assetSymbol: input.symbol,
    modelSignalContractVersion: input.signalContractVersion ?? 'v1',
  });

  return docRef.id;
}

export async function listSignalRecords(db: Firestore, uid: string): Promise<SignalRecord[]> {
  const signalsRef = collection(db, 'users', uid, 'signals');
  const signalsQuery = query(signalsRef, orderBy('timestamp', 'desc'));
  const snapshot = await getDocs(signalsQuery);

  return snapshot.docs.map((item) => {
    const data = item.data() as Omit<SignalRecord, 'id'>;
    return {
      id: item.id,
      ...data,
    };
  });
}
