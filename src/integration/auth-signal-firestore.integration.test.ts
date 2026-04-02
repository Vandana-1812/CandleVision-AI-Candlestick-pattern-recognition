import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authenticateWithEmail } from '@/lib/auth-service';
import { listSignalRecords, saveSignalRecord } from '@/lib/signal-repository';
import { generateTradingSignals } from '@/ai/flows/generate-trading-signals';

const authMocks = vi.hoisted(() => ({
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: vi.fn(),
}));

const firestoreMocks = vi.hoisted(() => ({
  setDoc: vi.fn(),
  addDoc: vi.fn(),
  getDocs: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(() => ({ __type: 'serverTimestamp' })),
  doc: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: authMocks.createUserWithEmailAndPassword,
  signInWithEmailAndPassword: authMocks.signInWithEmailAndPassword,
  signInWithPopup: authMocks.signInWithPopup,
  GoogleAuthProvider: authMocks.GoogleAuthProvider,
}));

vi.mock('firebase/firestore', () => ({
  setDoc: firestoreMocks.setDoc,
  addDoc: firestoreMocks.addDoc,
  getDocs: firestoreMocks.getDocs,
  collection: firestoreMocks.collection,
  query: firestoreMocks.query,
  orderBy: firestoreMocks.orderBy,
  serverTimestamp: firestoreMocks.serverTimestamp,
  doc: firestoreMocks.doc,
}));

vi.mock('@/ai/flows/generate-trading-signals', () => ({
  generateTradingSignals: vi.fn(),
}));

describe('integration: auth + signal generation + firestore write/read', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    firestoreMocks.doc.mockImplementation((_db, ...segments: string[]) => ({
      path: segments.join('/'),
    }));

    firestoreMocks.collection.mockImplementation((_db, ...segments: string[]) => ({
      path: segments.join('/'),
      segments,
    }));

    firestoreMocks.orderBy.mockReturnValue({});
    firestoreMocks.query.mockImplementation((collectionRef) => collectionRef);

    authMocks.createUserWithEmailAndPassword.mockResolvedValue({
      user: {
        uid: 'user-123',
        email: 'operator@candlevision.io',
        displayName: null,
      },
    });

    authMocks.signInWithEmailAndPassword.mockResolvedValue({
      user: {
        uid: 'user-123',
        email: 'operator@candlevision.io',
      },
    });

    firestoreMocks.addDoc.mockResolvedValue({ id: 'signal-1' });

    firestoreMocks.getDocs.mockResolvedValue({
      docs: [
        {
          id: 'signal-1',
          data: () => ({
            symbol: 'BTCUSDT',
            signal: 'Buy',
            entryPrice: 68000,
            confidenceScore: 87,
            reasoning: 'Bullish momentum and RSI support.',
          }),
        },
      ],
    });

    vi.mocked(generateTradingSignals).mockResolvedValue({
      signal: 'Buy',
      confidenceScore: 87,
      reasoning: 'Bullish momentum and RSI support.',
    });
  });

  it('registers user, generates signal, writes signal, then reads signal history', async () => {
    const fakeAuth = {} as any;
    const fakeDb = {} as any;

    const userCredential = await authenticateWithEmail({
      auth: fakeAuth,
      db: fakeDb,
      email: 'operator@candlevision.io',
      password: 'secret-123',
      mode: 'register',
    });

    expect(userCredential.user.uid).toBe('user-123');
    expect(authMocks.createUserWithEmailAndPassword).toHaveBeenCalledTimes(1);
    expect(firestoreMocks.setDoc).toHaveBeenCalledTimes(1);

    const generated = await generateTradingSignals({
      symbol: 'BTCUSDT',
      interval: '1h',
      ohlcData: [
        {
          timestamp: new Date().toISOString(),
          open: 67900,
          high: 68200,
          low: 67850,
          close: 68000,
          volume: 1000,
        },
      ],
      technicalIndicators: {
        rsi: 72,
        macd: {
          line: 1.2,
          signal: 0.9,
          histogram: 0.3,
        },
      },
      currentPrice: 68000,
    });

    const signalId = await saveSignalRecord(fakeDb, userCredential.user.uid, {
      symbol: 'BTCUSDT',
      signal: generated.signal,
      entryPrice: 68000,
      confidenceScore: generated.confidenceScore,
      reasoning: generated.reasoning,
    });

    expect(signalId).toBe('signal-1');
    expect(firestoreMocks.addDoc).toHaveBeenCalledTimes(1);

    const savedSignals = await listSignalRecords(fakeDb, userCredential.user.uid);

    expect(savedSignals).toHaveLength(1);
    expect(savedSignals[0]?.id).toBe('signal-1');
    expect(savedSignals[0]?.signal).toBe('Buy');
    expect(firestoreMocks.getDocs).toHaveBeenCalledTimes(1);
  });

  it('logs in existing user without profile bootstrap write', async () => {
    const fakeAuth = {} as any;
    const fakeDb = {} as any;

    await authenticateWithEmail({
      auth: fakeAuth,
      db: fakeDb,
      email: 'operator@candlevision.io',
      password: 'secret-123',
      mode: 'login',
    });

    expect(authMocks.signInWithEmailAndPassword).toHaveBeenCalledTimes(1);
    expect(firestoreMocks.setDoc).not.toHaveBeenCalled();
  });
});
