const EVALUATION_WINDOW_HOURS = 1;
const EVALUATION_WINDOW_MS = EVALUATION_WINDOW_HOURS * 60 * 60 * 1000;
const HOLD_MOVE_THRESHOLD = 0.0025; // 0.25%
const NOTIONAL_USD = 1000;

const cryptoMap: Record<string, string> = {
  BTC: 'BTCUSDT',
  ETH: 'ETHUSDT',
  SOL: 'SOLUSDT',
  BNB: 'BNBUSDT',
  XRP: 'XRPUSDT',
  ADA: 'ADAUSDT',
  DOGE: 'DOGEUSDT',
};

export type PendingSignalPayload = {
  id: string;
  symbol: string;
  signal: string;
  entryPrice: number;
  entryTimeMs: number;
};

export type VerificationResult = {
  signalId: string;
  isVerified: boolean;
  predictionResult: 'correct' | 'incorrect';
  profitLoss: number;
  exitPrice: number;
  evaluationWindowHours: number;
  exitLogic: string;
  verificationBasis: string;
  resultSource: string;
};

function normalizeSymbol(symbol: string) {
  const cleanSymbol = symbol.replace('/', '').toUpperCase();
  return cryptoMap[cleanSymbol] || (cleanSymbol.endsWith('USDT') ? cleanSymbol : `${cleanSymbol}USDT`);
}

export function getEvaluationWindowMs() {
  return EVALUATION_WINDOW_MS;
}

export function getEvaluationWindowHours() {
  return EVALUATION_WINDOW_HOURS;
}

export async function fetchExitPrice(symbol: string, targetTimeMs: number): Promise<number | null> {
  const pair = normalizeSymbol(symbol);
  const url = `https://api.binance.com/api/v3/klines?symbol=${pair}&interval=1h&limit=1&startTime=${targetTimeMs}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 0 },
      cache: 'no-store',
    });

    if (!response.ok) return null;

    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length === 0) return null;

    const candle = rows[0];
    const close = Number.parseFloat(candle?.[4]);
    return Number.isFinite(close) ? close : null;
  } catch {
    return null;
  }
}

export function computeResult(signal: PendingSignalPayload, exitPrice: number): VerificationResult {
  const move = (exitPrice - signal.entryPrice) / signal.entryPrice;
  const tradeSignal = signal.signal.toLowerCase();

  let isCorrect = false;
  let pnl = 0;

  if (tradeSignal === 'buy') {
    isCorrect = move > 0;
    pnl = move * NOTIONAL_USD;
  } else if (tradeSignal === 'sell') {
    isCorrect = move < 0;
    pnl = -move * NOTIONAL_USD;
  } else {
    isCorrect = Math.abs(move) <= HOLD_MOVE_THRESHOLD;
    pnl = 0;
  }

  return {
    signalId: signal.id,
    isVerified: true,
    predictionResult: isCorrect ? 'correct' : 'incorrect',
    profitLoss: Number(pnl.toFixed(2)),
    exitPrice: Number(exitPrice.toFixed(2)),
    evaluationWindowHours: EVALUATION_WINDOW_HOURS,
    exitLogic: '1h-close-after-entry',
    verificationBasis: 'market-price-move',
    resultSource: 'binance-klines-1h',
  };
}