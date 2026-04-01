export type AssetClass = 'crypto' | 'stock' | 'forex';

export type MarketDataProviderId =
  | 'binance'
  | 'coinbase'
  | 'yahoo'
  | 'alphavantage-stock'
  | 'alphavantage-forex'
  | 'simulated';

export interface OHLC {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isSimulated?: boolean;
  providerId?: MarketDataProviderId;
  assetClass?: AssetClass;
}

export interface MarketDataFetchMeta {
  assetClass: AssetClass;
  resolvedSymbol: string;
  requestedSymbol: string;
  interval: string;
  limit: number;
  providerId: MarketDataProviderId;
  fallbackChain: MarketDataProviderId[];
  isSimulated: boolean;
}

export interface MarketDataFetchResult {
  candles: OHLC[];
  meta: MarketDataFetchMeta;
}

export interface MarketDataProviderHealth {
  providerId: MarketDataProviderId;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  consecutiveFailures: number;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastLatencyMs: number | null;
  averageLatencyMs: number | null;
  lastError: string | null;
}

type ProviderAttemptResult = {
  candles: OHLC[];
  resolvedSymbol: string;
};

type ProviderContext = {
  symbol: string;
  interval: string;
  limit: number;
  assetClass: AssetClass;
};

type MarketDataProvider = {
  id: MarketDataProviderId;
  supports: AssetClass[];
  fetch: (ctx: ProviderContext) => Promise<ProviderAttemptResult>;
};

type InternalProviderHealth = {
  consecutiveFailures: number;
  lastSuccessAt: number | null;
  lastFailureAt: number | null;
  lastLatencyMs: number | null;
  averageLatencyMs: number | null;
  lastError: string | null;
};

const FIAT_CODES = new Set([
  'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'SEK', 'NOK', 'DKK',
  'SGD', 'HKD', 'INR', 'CNY', 'MXN', 'BRL', 'ZAR', 'TRY', 'PLN',
]);

const CRYPTO_ALIASES: Record<string, string> = {
  BTC: 'BTCUSDT',
  ETH: 'ETHUSDT',
  SOL: 'SOLUSDT',
  BNB: 'BNBUSDT',
  XRP: 'XRPUSDT',
  ADA: 'ADAUSDT',
  DOGE: 'DOGEUSDT',
};

const providerHealthState = new Map<MarketDataProviderId, InternalProviderHealth>();

function toISO(ts: number | string) {
  return new Date(ts).toISOString();
}

function normalizeOHLC(candles: OHLC[], providerId: MarketDataProviderId, assetClass: AssetClass): OHLC[] {
  return candles
    .filter(
      (bar) =>
        Number.isFinite(bar.open) &&
        Number.isFinite(bar.high) &&
        Number.isFinite(bar.low) &&
        Number.isFinite(bar.close) &&
        Number.isFinite(bar.volume)
    )
    .map((bar) => ({
      ...bar,
      providerId,
      assetClass,
      isSimulated: providerId === 'simulated',
    }))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

function clampLimit(limit: number) {
  return Math.max(10, Math.min(500, Math.floor(limit)));
}

function inferAssetClass(inputSymbol: string): AssetClass {
  const raw = inputSymbol.trim().toUpperCase();
  const clean = raw.replace(/\s/g, '');

  if (clean.endsWith('USDT') || CRYPTO_ALIASES[clean]) {
    return 'crypto';
  }

  const slashPair = clean.split('/');
  if (slashPair.length === 2 && FIAT_CODES.has(slashPair[0]) && FIAT_CODES.has(slashPair[1])) {
    return 'forex';
  }

  const compactPair = clean.match(/^([A-Z]{3})([A-Z]{3})$/);
  if (compactPair && FIAT_CODES.has(compactPair[1])) {
    return 'forex';
  }

  if (clean.endsWith('=X')) {
    return 'forex';
  }

  return 'stock';
}

function normalizeForBinance(symbol: string) {
  const clean = symbol.replace('/', '').toUpperCase();
  if (CRYPTO_ALIASES[clean]) return CRYPTO_ALIASES[clean];
  if (clean.endsWith('USDT')) return clean;
  if (/^[A-Z]{3,6}$/.test(clean)) return `${clean}USDT`;
  return clean;
}

function normalizeForCoinbase(symbol: string) {
  const clean = symbol.replace('/', '').toUpperCase();
  if (clean.endsWith('USDT')) {
    return `${clean.slice(0, -4)}-USD`;
  }
  if (clean.endsWith('USD')) {
    return `${clean.slice(0, -3)}-USD`;
  }
  if (/^[A-Z]{3,6}$/.test(clean)) {
    return `${clean}-USD`;
  }
  return clean.includes('-') ? clean : `${clean}-USD`;
}

function normalizeForYahoo(symbol: string, assetClass: AssetClass) {
  const clean = symbol.replace('/', '').toUpperCase();
  if (assetClass === 'crypto') {
    const binance = normalizeForBinance(clean);
    if (binance.endsWith('USDT')) {
      return `${binance.slice(0, -4)}-USD`;
    }
    if (binance.endsWith('USD')) {
      return `${binance.slice(0, -3)}-USD`;
    }
    return `${binance}-USD`;
  }

  if (assetClass === 'forex') {
    if (clean.endsWith('=X')) return clean;
    if (clean.includes('/')) {
      const [base, quote] = clean.split('/');
      return `${base}${quote}=X`;
    }
    const pair = clean.match(/^([A-Z]{3})([A-Z]{3})$/);
    if (pair) return `${pair[1]}${pair[2]}=X`;
    return `${clean}=X`;
  }

  return clean;
}

function mapToYahooInterval(interval: string) {
  const normalized = interval.toLowerCase();
  if (['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d'].includes(normalized)) {
    if (normalized === '1h') return '60m';
    return normalized;
  }
  return '60m';
}

function mapToYahooRange(interval: string, limit: number) {
  const normalized = interval.toLowerCase();
  if (normalized === '1d') {
    if (limit <= 30) return '1mo';
    if (limit <= 90) return '3mo';
    if (limit <= 180) return '6mo';
    return '1y';
  }
  if (limit <= 48) return '5d';
  if (limit <= 240) return '1mo';
  return '3mo';
}

function intervalToMs(interval: string) {
  const match = interval.toLowerCase().match(/^(\d+)(m|h|d)$/);
  if (!match) return 60 * 60 * 1000;
  const amount = Number(match[1]);
  const unit = match[2];
  if (unit === 'm') return amount * 60 * 1000;
  if (unit === 'h') return amount * 60 * 60 * 1000;
  return amount * 24 * 60 * 60 * 1000;
}

async function fetchWithTimeout(url: string, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function alphaVantageKey() {
  const key = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;
  return typeof key === 'string' && key.trim() ? key.trim() : null;
}

const binanceProvider: MarketDataProvider = {
  id: 'binance',
  supports: ['crypto'],
  async fetch(ctx) {
    const symbol = normalizeForBinance(ctx.symbol);
    const response = await fetchWithTimeout(
      `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(ctx.interval)}&limit=${ctx.limit}`
    );

    if (!response.ok) {
      throw new Error(`Binance request failed (${response.status})`);
    }

    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) {
      throw new Error('Binance payload was not an array');
    }

    const candles = payload.map((d) => ({
      timestamp: toISO((d as any)[0]),
      open: Number.parseFloat((d as any)[1]),
      high: Number.parseFloat((d as any)[2]),
      low: Number.parseFloat((d as any)[3]),
      close: Number.parseFloat((d as any)[4]),
      volume: Number.parseFloat((d as any)[5]),
    }));

    return { candles, resolvedSymbol: symbol };
  },
};

const coinbaseProvider: MarketDataProvider = {
  id: 'coinbase',
  supports: ['crypto'],
  async fetch(ctx) {
    const symbol = normalizeForCoinbase(ctx.symbol);
    const granularityMap: Record<string, number> = {
      '1m': 60,
      '5m': 300,
      '15m': 900,
      '30m': 1800,
      '1h': 3600,
      '6h': 21600,
      '1d': 86400,
    };
    const granularity = granularityMap[ctx.interval.toLowerCase()] ?? 3600;
    const response = await fetchWithTimeout(
      `https://api.exchange.coinbase.com/products/${encodeURIComponent(symbol)}/candles?granularity=${granularity}`
    );

    if (!response.ok) {
      throw new Error(`Coinbase request failed (${response.status})`);
    }

    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) {
      throw new Error('Coinbase payload was not an array');
    }

    // Coinbase returns newest-first; normalizeOHLC will re-sort chronologically.
    const candles = (payload as any[]).slice(0, ctx.limit).map((row) => ({
      timestamp: toISO(Number(row[0]) * 1000),
      low: Number(row[1]),
      high: Number(row[2]),
      open: Number(row[3]),
      close: Number(row[4]),
      volume: Number(row[5]),
    }));

    return { candles, resolvedSymbol: symbol };
  },
};

const yahooProvider: MarketDataProvider = {
  id: 'yahoo',
  supports: ['crypto', 'stock', 'forex'],
  async fetch(ctx) {
    const symbol = normalizeForYahoo(ctx.symbol, ctx.assetClass);
    const yahooInterval = mapToYahooInterval(ctx.interval);
    const range = mapToYahooRange(ctx.interval, ctx.limit);

    const response = await fetchWithTimeout(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${encodeURIComponent(yahooInterval)}&range=${encodeURIComponent(range)}&includePrePost=false`
    );

    if (!response.ok) {
      throw new Error(`Yahoo request failed (${response.status})`);
    }

    const payload = (await response.json()) as any;
    const result = payload?.chart?.result?.[0];
    const timestamps: number[] = result?.timestamp ?? [];
    const quote = result?.indicators?.quote?.[0];

    if (!timestamps.length || !quote) {
      throw new Error('Yahoo payload missing expected chart series');
    }

    const candles = timestamps.map((ts, idx) => ({
      timestamp: toISO(ts * 1000),
      open: Number(quote.open?.[idx]),
      high: Number(quote.high?.[idx]),
      low: Number(quote.low?.[idx]),
      close: Number(quote.close?.[idx]),
      volume: Number(quote.volume?.[idx] ?? 0),
    }));

    const bounded = candles.slice(Math.max(0, candles.length - ctx.limit));
    return { candles: bounded, resolvedSymbol: symbol };
  },
};

const alphaVantageStockProvider: MarketDataProvider = {
  id: 'alphavantage-stock',
  supports: ['stock'],
  async fetch(ctx) {
    const key = alphaVantageKey();
    if (!key) {
      throw new Error('Alpha Vantage stock provider is not configured');
    }

    const symbol = ctx.symbol.toUpperCase();
    const response = await fetchWithTimeout(
      `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${encodeURIComponent(symbol)}&interval=60min&outputsize=full&apikey=${encodeURIComponent(key)}`,
      12000
    );

    if (!response.ok) {
      throw new Error(`Alpha Vantage stock request failed (${response.status})`);
    }

    const payload = (await response.json()) as any;
    const series = payload?.['Time Series (60min)'];
    if (!series || typeof series !== 'object') {
      throw new Error('Alpha Vantage stock payload missing time series');
    }

    const candles = Object.entries(series).map(([timestamp, row]) => ({
      timestamp: new Date(`${timestamp}Z`).toISOString(),
      open: Number((row as any)['1. open']),
      high: Number((row as any)['2. high']),
      low: Number((row as any)['3. low']),
      close: Number((row as any)['4. close']),
      volume: Number((row as any)['5. volume'] ?? 0),
    }));

    const bounded = candles.sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp)).slice(-ctx.limit);
    return { candles: bounded, resolvedSymbol: symbol };
  },
};

const alphaVantageForexProvider: MarketDataProvider = {
  id: 'alphavantage-forex',
  supports: ['forex'],
  async fetch(ctx) {
    const key = alphaVantageKey();
    if (!key) {
      throw new Error('Alpha Vantage forex provider is not configured');
    }

    const clean = ctx.symbol.replace('/', '').toUpperCase();
    const match = clean.match(/^([A-Z]{3})([A-Z]{3})/);
    if (!match) {
      throw new Error(`Unrecognized forex symbol format: ${ctx.symbol}`);
    }

    const from = match[1];
    const to = match[2];
    const response = await fetchWithTimeout(
      `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=${encodeURIComponent(from)}&to_symbol=${encodeURIComponent(to)}&interval=60min&outputsize=full&apikey=${encodeURIComponent(key)}`,
      12000
    );

    if (!response.ok) {
      throw new Error(`Alpha Vantage forex request failed (${response.status})`);
    }

    const payload = (await response.json()) as any;
    const series = payload?.['Time Series FX (60min)'];
    if (!series || typeof series !== 'object') {
      throw new Error('Alpha Vantage forex payload missing time series');
    }

    const candles = Object.entries(series).map(([timestamp, row]) => ({
      timestamp: new Date(`${timestamp}Z`).toISOString(),
      open: Number((row as any)['1. open']),
      high: Number((row as any)['2. high']),
      low: Number((row as any)['3. low']),
      close: Number((row as any)['4. close']),
      volume: 0,
    }));

    const bounded = candles.sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp)).slice(-ctx.limit);
    return { candles: bounded, resolvedSymbol: `${from}${to}` };
  },
};

function generateSimulatedData(symbol: string, limit: number, interval: string, assetClass: AssetClass): OHLC[] {
  const data: OHLC[] = [];
  const now = Date.now();
  const intervalMs = intervalToMs(interval);

  let currentPrice = 100;
  if (assetClass === 'crypto') currentPrice = 65000;
  if (assetClass === 'forex') currentPrice = 1.09;
  if (assetClass === 'stock') currentPrice = symbol.length > 4 ? 50 : 150;

  for (let i = limit - 1; i >= 0; i--) {
    const baseVolatility = assetClass === 'forex' ? 0.004 : assetClass === 'crypto' ? 0.025 : 0.015;
    const volatility = currentPrice * baseVolatility;
    const change = (Math.random() - 0.5) * volatility;

    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + Math.random() * (volatility * 0.5);
    const low = Math.min(open, close) - Math.random() * (volatility * 0.5);

    data.push({
      timestamp: new Date(now - i * intervalMs).toISOString(),
      open,
      high,
      low,
      close,
      volume: assetClass === 'forex' ? 0 : Math.random() * 1000000,
      isSimulated: true,
      providerId: 'simulated',
      assetClass,
    });

    currentPrice = close;
  }

  return data;
}

function providerPriority(assetClass: AssetClass): MarketDataProvider[] {
  switch (assetClass) {
    case 'crypto':
      return [binanceProvider, coinbaseProvider, yahooProvider];
    case 'stock':
      return [yahooProvider, alphaVantageStockProvider];
    case 'forex':
      return [yahooProvider, alphaVantageForexProvider];
    default:
      return [yahooProvider];
  }
}

function ensureHealthState(providerId: MarketDataProviderId): InternalProviderHealth {
  const existing = providerHealthState.get(providerId);
  if (existing) return existing;

  const created: InternalProviderHealth = {
    consecutiveFailures: 0,
    lastSuccessAt: null,
    lastFailureAt: null,
    lastLatencyMs: null,
    averageLatencyMs: null,
    lastError: null,
  };

  providerHealthState.set(providerId, created);
  return created;
}

function recordProviderSuccess(providerId: MarketDataProviderId, latencyMs: number) {
  const health = ensureHealthState(providerId);
  health.consecutiveFailures = 0;
  health.lastSuccessAt = Date.now();
  health.lastLatencyMs = latencyMs;
  health.lastError = null;
  health.averageLatencyMs =
    health.averageLatencyMs === null
      ? latencyMs
      : Number((health.averageLatencyMs * 0.7 + latencyMs * 0.3).toFixed(2));
}

function recordProviderFailure(providerId: MarketDataProviderId, latencyMs: number, error: unknown) {
  const health = ensureHealthState(providerId);
  health.consecutiveFailures += 1;
  health.lastFailureAt = Date.now();
  health.lastLatencyMs = latencyMs;
  health.lastError = error instanceof Error ? error.message : String(error);
  health.averageLatencyMs =
    health.averageLatencyMs === null
      ? latencyMs
      : Number((health.averageLatencyMs * 0.7 + latencyMs * 0.3).toFixed(2));
}

function toHealthStatus(health: InternalProviderHealth): MarketDataProviderHealth['status'] {
  if (health.lastSuccessAt === null && health.lastFailureAt === null) return 'unknown';
  if (health.consecutiveFailures >= 3) return 'down';
  if (health.consecutiveFailures >= 1) return 'degraded';
  return 'healthy';
}

export function getMarketDataHealthSnapshot(): Record<MarketDataProviderId, MarketDataProviderHealth> {
  const ids: MarketDataProviderId[] = [
    'binance',
    'coinbase',
    'yahoo',
    'alphavantage-stock',
    'alphavantage-forex',
    'simulated',
  ];

  return ids.reduce((acc, id) => {
    const health = ensureHealthState(id);
    acc[id] = {
      providerId: id,
      status: toHealthStatus(health),
      consecutiveFailures: health.consecutiveFailures,
      lastSuccessAt: health.lastSuccessAt ? new Date(health.lastSuccessAt).toISOString() : null,
      lastFailureAt: health.lastFailureAt ? new Date(health.lastFailureAt).toISOString() : null,
      lastLatencyMs: health.lastLatencyMs,
      averageLatencyMs: health.averageLatencyMs,
      lastError: health.lastError,
    };
    return acc;
  }, {} as Record<MarketDataProviderId, MarketDataProviderHealth>);
}

export async function fetchMarketOHLC(
  symbol: string = 'BTCUSDT',
  interval: string = '1h',
  limit: number = 60,
  options?: { assetClass?: AssetClass }
): Promise<MarketDataFetchResult> {
  const normalizedLimit = clampLimit(limit);
  const cleanSymbol = symbol.trim().toUpperCase();
  const assetClass = options?.assetClass ?? inferAssetClass(cleanSymbol);

  const chain = providerPriority(assetClass);
  const fallbackChain: MarketDataProviderId[] = [];

  for (const provider of chain) {
    if (!provider.supports.includes(assetClass)) {
      continue;
    }

    const start = Date.now();
    fallbackChain.push(provider.id);

    try {
      const attempt = await provider.fetch({
        symbol: cleanSymbol,
        interval,
        limit: normalizedLimit,
        assetClass,
      });
      const latencyMs = Date.now() - start;
      const normalized = normalizeOHLC(attempt.candles, provider.id, assetClass).slice(-normalizedLimit);

      if (!normalized.length) {
        throw new Error(`Provider ${provider.id} returned no valid candles`);
      }

      recordProviderSuccess(provider.id, latencyMs);

      return {
        candles: normalized,
        meta: {
          assetClass,
          requestedSymbol: cleanSymbol,
          resolvedSymbol: attempt.resolvedSymbol,
          interval,
          limit: normalizedLimit,
          providerId: provider.id,
          fallbackChain,
          isSimulated: false,
        },
      };
    } catch (error) {
      const latencyMs = Date.now() - start;
      recordProviderFailure(provider.id, latencyMs, error);
      console.warn(`[market-data] provider ${provider.id} failed for ${cleanSymbol}. Trying fallback.`, error);
    }
  }

  const simulated = normalizeOHLC(
    generateSimulatedData(cleanSymbol, normalizedLimit, interval, assetClass),
    'simulated',
    assetClass
  );

  recordProviderSuccess('simulated', 0);

  return {
    candles: simulated,
    meta: {
      assetClass,
      requestedSymbol: cleanSymbol,
      resolvedSymbol: cleanSymbol,
      interval,
      limit: normalizedLimit,
      providerId: 'simulated',
      fallbackChain: [...fallbackChain, 'simulated'],
      isSimulated: true,
    },
  };
}

/**
 * Backward-compatible wrapper used by existing pages.
 */
export async function fetchRealOHLC(symbol: string = 'BTCUSDT', interval: string = '1h', limit: number = 60): Promise<OHLC[]> {
  const result = await fetchMarketOHLC(symbol, interval, limit);
  return result.candles;
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

export interface MACDResult {
  macd: number;
  signal: number;
  histogram: number;
}

function calculateEMA(values: number[], period: number): number[] {
  const ema: number[] = new Array(values.length).fill(0);
  if (values.length < period) return ema;
  const k = 2 / (period + 1);

  let sum = 0;
  for (let i = 0; i < period; i++) sum += values[i];
  const seed = sum / period;
  for (let i = 0; i < period; i++) ema[i] = seed;

  for (let i = period; i < values.length; i++) {
    ema[i] = values[i] * k + ema[i - 1] * (1 - k);
  }
  return ema;
}

export function calculateMACD(
  data: OHLC[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult[] {
  const closes = data.map((d) => d.close);
  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);

  const macdLine = closes.map((_, i) => fastEMA[i] - slowEMA[i]);
  const signalLine = calculateEMA(macdLine, signalPeriod);

  return macdLine.map((macd, i) => ({
    macd,
    signal: signalLine[i],
    histogram: macd - signalLine[i],
  }));
}

export interface BollingerBandsResult {
  upper: number;
  middle: number;
  lower: number;
}

export function calculateBollingerBands(
  data: OHLC[],
  period: number = 20,
  stdDevMultiplier: number = 2
): BollingerBandsResult[] {
  return data.map((_, i) => {
    if (i < period - 1) {
      const mid = data[i].close;
      return { upper: mid, middle: mid, lower: mid };
    }

    const slice = data.slice(i - period + 1, i + 1).map((d) => d.close);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((acc, val) => acc + (val - mean) ** 2, 0) / period;
    const std = Math.sqrt(variance);

    return {
      upper: mean + stdDevMultiplier * std,
      middle: mean,
      lower: mean - stdDevMultiplier * std,
    };
  });
}
