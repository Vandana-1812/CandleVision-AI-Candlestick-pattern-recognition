export interface OHLC {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function generateMockOHLC(count: number = 50, symbol: string = 'BTC/USD'): OHLC[] {
  let lastClose = 45000 + Math.random() * 5000;
  const data: OHLC[] = [];
  const now = new Date();

  for (let i = count; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    const volatility = lastClose * 0.02;
    const open = lastClose;
    const close = open + (Math.random() - 0.5) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = Math.random() * 1000 + 500;

    data.push({
      timestamp: time.toISOString(),
      open,
      high,
      low,
      close,
      volume,
    });
    lastClose = close;
  }
  return data;
}

export function calculateRSI(data: OHLC[], period: number = 14): number[] {
  const rsi: number[] = new Array(data.length).fill(50);
  if (data.length <= period) return rsi;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff > 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgGain / avgLoss;
    rsi[i] = 100 - 100 / (1 + rs);
  }
  return rsi;
}

export function calculateSMA(data: OHLC[], period: number): number[] {
  const sma: number[] = new Array(data.length).fill(0);
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((acc, bar) => acc + bar.close, 0);
    sma[i] = sum / period;
  }
  return sma;
}