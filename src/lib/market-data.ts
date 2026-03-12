export interface OHLC {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isSimulated?: boolean;
}

/**
 * Fetches real-time OHLC data from Binance for crypto, 
 * or generates high-fidelity simulated data for stocks/forex.
 */
export async function fetchRealOHLC(symbol: string = 'BTCUSDT', interval: string = '1h', limit: number = 60): Promise<OHLC[]> {
  const cleanSymbol = symbol.replace('/', '').toUpperCase();
  
  // Normalization for common crypto tickers
  const cryptoMap: Record<string, string> = {
    'BTC': 'BTCUSDT',
    'ETH': 'ETHUSDT',
    'SOL': 'SOLUSDT',
    'BNB': 'BNBUSDT',
    'XRP': 'XRPUSDT',
    'ADA': 'ADAUSDT',
    'DOGE': 'DOGEUSDT',
  };

  const targetSymbol = cryptoMap[cleanSymbol] || (cleanSymbol.length <= 5 && !cleanSymbol.endsWith('USDT') ? cleanSymbol + 'USDT' : cleanSymbol);

  try {
    const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${targetSymbol}&interval=${interval}&limit=${limit}`);
    
    if (response.ok) {
      const data = await response.json();
      return data.map((d: any) => ({
        timestamp: new Date(d[0]).toISOString(),
        open: parseFloat(d[1]),
        high: parseFloat(d[2]),
        low: parseFloat(d[3]),
        close: parseFloat(d[4]),
        volume: parseFloat(d[5]),
        isSimulated: false
      }));
    }
  } catch (e) {
    // Fall through to simulation if network fails or symbol is not crypto
  }

  // Simulation Fallback for Stocks/Forex (demo purposes)
  return generateSimulatedData(cleanSymbol, limit);
}

function generateSimulatedData(symbol: string, limit: number): OHLC[] {
  const data: OHLC[] = [];
  let currentPrice = symbol.length > 4 ? 50 : 150; // Random starting point based on ticker length
  const now = Date.now();
  const intervalMs = 3600000; // 1h

  for (let i = limit; i >= 0; i--) {
    const volatility = currentPrice * 0.02;
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
      volume: Math.random() * 1000000,
      isSimulated: true
    });
    
    currentPrice = close;
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
