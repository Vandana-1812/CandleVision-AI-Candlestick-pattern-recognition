import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { NextRequest, NextResponse } from 'next/server';

const execFileAsync = promisify(execFile);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RawPredictResponse = {
  stock?: string;
  pattern?: string;
  confidence?: number;
  signal?: string;
  error?: string;
};

function normalizeAppSignal(signal: string | undefined) {
  const normalized = (signal ?? 'HOLD').toUpperCase();
  if (normalized === 'BUY') return 'Buy' as const;
  if (normalized === 'SELL') return 'Sell' as const;
  return 'Hold' as const;
}

function buildReasoning(pattern: string, signal: string) {
  if (signal === 'Buy') {
    return `Detected ${pattern} on the latest daily candlestick setup.`;
  }
  if (pattern === 'None') {
    return 'No strong candlestick reversal pattern detected in the latest setup.';
  }
  return `Detected ${pattern}, but the setup remains neutral.`;
}

function extractJsonPayload(stdout: string): RawPredictResponse {
  const trimmed = stdout.trim();
  if (!trimmed) {
    throw new Error('Prediction script returned empty output.');
  }

  try {
    return JSON.parse(trimmed) as RawPredictResponse;
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}$/);
    if (!match) {
      throw new Error('Prediction script returned invalid JSON.');
    }
    return JSON.parse(match[0]) as RawPredictResponse;
  }
}

async function runRemotePrediction(symbol: string) {
  const baseUrl = process.env.ML_SERVICE_URL?.trim();
  if (!baseUrl) {
    return null;
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol }),
    cache: 'no-store',
  });

  const payload = (await response.json()) as RawPredictResponse;
  if (!response.ok) {
    if (response.status === 400 && payload.error) {
      return payload;
    }
    throw new Error(payload.error ?? 'Remote ML service failed');
  }

  return payload;
}

async function runLocalPrediction(symbol: string) {
  const { stdout } = await execFileAsync(
    'python',
    ['ml/predict.py', symbol],
    {
      cwd: process.cwd(),
      timeout: 120000,
      windowsHide: true,
    }
  );

  return extractJsonPayload(stdout);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const symbol = String(body?.symbol ?? '').trim();

    if (!symbol) {
      return NextResponse.json({ error: 'Stock symbol is required' }, { status: 400 });
    }

    const prediction = (await runRemotePrediction(symbol)) ?? (await runLocalPrediction(symbol));
    if (prediction.error) {
      return NextResponse.json({ error: prediction.error }, { status: 400 });
    }

    const pattern = prediction.pattern ?? 'None';
    const confidence = Number(prediction.confidence ?? 0);
    const signal = normalizeAppSignal(prediction.signal);

    return NextResponse.json({
      stock: prediction.stock ?? symbol.toUpperCase(),
      pattern,
      confidence,
      confidenceScore: Math.round(confidence * 100),
      signal,
      reasoning: buildReasoning(pattern, signal),
    });
  } catch (error) {
    console.error('ML signal route failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'ML inference failed' },
      { status: 500 }
    );
  }
}
