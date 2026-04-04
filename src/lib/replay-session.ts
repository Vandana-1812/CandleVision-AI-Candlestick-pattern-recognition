import { doc, type DocumentReference, type Firestore, serverTimestamp } from 'firebase/firestore';
import type { MarketDataFetchMeta } from './market-data';

export interface ReplayPositionSnapshot {
  side: 'long' | 'short';
  entryPrice: number;
  quantity: number;
  investedAmount: number;
  openedAt: string;
}

export interface ReplayTradeSnapshot {
  id: number;
  side: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  investedAmount: number;
  pnl: number;
  openedAt: string;
  closedAt: string;
}

export interface ReplaySessionSnapshot {
  sessionId: string;
  currentIndex: number;
  speed: number;
  tradeSize: number;
  balance: number;
  position: ReplayPositionSnapshot | null;
  completedTrades: ReplayTradeSnapshot[];
  actionFeedback: string | null;
  marketMeta: MarketDataFetchMeta | null;
  replayStartIndex: number;
  updatedAt?: ReturnType<typeof serverTimestamp>;
}

export const REPLAY_SESSION_DOC_ID = 'active';

export function createReplaySessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `replay-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getReplaySessionDocRef(db: Firestore, userId: string): DocumentReference<ReplaySessionSnapshot> {
  return doc(db, 'users', userId, 'replaySessions', REPLAY_SESSION_DOC_ID) as DocumentReference<ReplaySessionSnapshot>;
}

export function buildReplaySessionSnapshot(input: {
  sessionId: string;
  currentIndex: number;
  speed: number;
  tradeSize: number;
  balance: number;
  position: ReplayPositionSnapshot | null;
  completedTrades: ReplayTradeSnapshot[];
  actionFeedback: string | null;
  marketMeta: MarketDataFetchMeta | null;
  replayStartIndex: number;
}): ReplaySessionSnapshot {
  return {
    ...input,
    updatedAt: serverTimestamp(),
  };
}