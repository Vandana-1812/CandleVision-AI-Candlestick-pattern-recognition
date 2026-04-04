import 'server-only';

import { OHLC } from '@/lib/market-data';

export async function fetchNiftyCandles(
  yahooSymbol: string = '^NSEI',
  range: string = '1mo',
  interval: string = '1h'
): Promise<OHLC[]> {
  const response = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}&includePrePost=false&events=div%2Csplits`,
    { cache: 'no-store' }
  );

  if (!response.ok) {
    throw new Error(`Yahoo Finance request failed with ${response.status}`);
  }

  const payload = await response.json();
  const result = payload?.chart?.result?.[0];
  const timestamps: number[] = result?.timestamp ?? [];
  const quote = result?.indicators?.quote?.[0];

  if (!quote || timestamps.length === 0) {
    throw new Error('Yahoo Finance returned no NIFTY candles');
  }

  const candles = timestamps
    .map((timestamp, index) => {
      const open = Number(quote.open?.[index]);
      const high = Number(quote.high?.[index]);
      const low = Number(quote.low?.[index]);
      const close = Number(quote.close?.[index]);
      const volume = Number(quote.volume?.[index] ?? 0);

      if (![open, high, low, close].every(Number.isFinite)) {
        return null;
      }

      return {
        timestamp: new Date(timestamp * 1000).toISOString(),
        open,
        high,
        low,
        close,
        volume: Number.isFinite(volume) ? volume : 0,
        isSimulated: false,
      } satisfies OHLC;
    })
    .filter(Boolean) as OHLC[];

  if (candles.length === 0) {
    throw new Error('No valid NIFTY candles after cleaning');
  }

  return candles;
}
