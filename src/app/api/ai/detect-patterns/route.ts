/**
 * API Endpoint: Detect Candlestick Patterns using YOLOv8
 * POST /api/ai/detect-patterns
 * 
 * Accepts OHLCV data, generates candlestick chart, detects patterns using YOLOv8
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { detectCandlestickPatterns, PatternDetectionResponseSchema } from '@/lib/pattern-detection';

const DetectPatternsRequestSchema = z.object({
  symbol: z.string(),
  ohlcData: z.array(
    z.object({
      timestamp: z.string(),
      open: z.number(),
      high: z.number(),
      low: z.number(),
      close: z.number(),
      volume: z.number().optional(),
    })
  ).min(1).max(100),
  interval: z.string().optional(),
  modelPath: z.string().optional(),
  modelType: z.enum(['cnn', 'lstm', 'yolo']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const reqData = DetectPatternsRequestSchema.parse(body);
    const response = await detectCandlestickPatterns({
      symbol: reqData.symbol,
      interval: reqData.interval ?? '1h',
      ohlcData: reqData.ohlcData,
      modelPath: reqData.modelPath,
      modelType: reqData.modelType ?? 'cnn',
    });

    return NextResponse.json(PatternDetectionResponseSchema.parse(response));

  } catch (error) {
    console.error('Pattern detection error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Pattern detection failed' },
      { status: 500 }
    );
  }
}
