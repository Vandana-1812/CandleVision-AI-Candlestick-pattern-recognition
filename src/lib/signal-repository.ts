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
  entryPrice: number;
  confidenceScore: number;
  reasoning: string;
  pattern?: string;
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
