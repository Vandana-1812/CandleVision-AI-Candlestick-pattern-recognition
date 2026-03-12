
export interface OHLC {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Fetches real-time OHLC data from Binance Public API.
 * @param symbol Trading pair (e.g., BTCUSDT, AAPL - if available on Binance as wrapped or similar)
 * @param interval Timeframe (e.g., 1h, 1m, 1d)
 * @param limit Number of candles
 */
export async function fetchRealOHLC(symbol: string = 'BTCUSDT', interval: string = '1h', limit: number = 60): Promise<OHLC[]> {
  // Clean symbol (remove slash if present)
  // Binance needs symbols like BTCUSDT
  let cleanSymbol = symbol.replace('/', '').toUpperCase();
  
  // Binance common patterns fix
  if (cleanSymbol === 'BTC') cleanSymbol = 'BTCUSDT';
  if (cleanSymbol === 'ETH') cleanSymbol = 'ETHUSDT';
  if (cleanSymbol === 'SOL') cleanSymbol = 'SOLUSDT';

  const url = `https://api.binance.com/api/v3/klines?symbol=${cleanSymbol}&interval=${interval}&limit=${limit}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      // Try adding USDT if it's missing (fallback for users searching just 'BTC')
      if (!cleanSymbol.endsWith('USDT')) {
        return fetchRealOHLC(cleanSymbol + 'USDT', interval, limit);
      }
      throw new Error('Symbol not found on exchange');
    }
    const data = await response.json();

    return data.map((d: any) => ({
      timestamp: new Date(d[0]).toISOString(),
      open: parseFloat(d[1]),
      high: parseFloat(d[2]),
      low: parseFloat(d[3]),
      close: parseFloat(d[4]),
      volume: parseFloat(d[5]),
    }));
  } catch (error) {
    console.error("Market data fetch error for symbol:", cleanSymbol, error);
    return [];
  }
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
