import { NextRequest, NextResponse } from 'next/server';
import { trainNiftyModel } from '@/lib/training/nifty-trainer';

function parseNumber(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const includeArtifact = searchParams.get('includeArtifact') === 'true';
  const interval = searchParams.get('interval') ?? '1h';
  const range = searchParams.get('range') ?? '1mo';
  const horizonCandles = parseNumber(searchParams.get('horizonCandles'), 6);
  const thresholdPct = parseNumber(searchParams.get('thresholdPct'), 0.35);

  try {
    const report = await trainNiftyModel(
      {
        interval,
        range,
        horizonCandles,
        thresholdPct,
      },
      includeArtifact
    );

    return NextResponse.json(report);
  } catch (error) {
    console.error('NIFTY training route failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Training failed' },
      { status: 500 }
    );
  }
}
