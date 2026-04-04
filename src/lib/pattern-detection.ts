import { spawn } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { z } from 'zod';

export const PatternDetectionRequestSchema = z.object({
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

export const PatternDetectionResponseSchema = z.object({
  symbol: z.string(),
  interval: z.string(),
  chartGenerated: z.boolean(),
  chartPath: z.string(),
  modelPath: z.string(),
  dominantSignal: z.enum(['Buy', 'Sell', 'Hold']),
  confidence: z.number(),
  avgConfidence: z.number(),
  totalPatterns: z.number(),
  bullishPatterns: z.array(z.object({ name: z.string(), confidence: z.number() })),
  bearishPatterns: z.array(z.object({ name: z.string(), confidence: z.number() })),
  neutralPatterns: z.array(z.object({ name: z.string(), confidence: z.number() })).optional(),
  strongSignals: z.array(z.object({ name: z.string(), confidence: z.number() })),
  detections: z.array(
    z.object({
      name: z.string(),
      patternId: z.number(),
      confidence: z.number(),
      boundingBox: z.array(z.number()),
      isStrongSignal: z.boolean(),
      signal: z.string(),
    })
  ),
  technicalAlignment: z.number().optional(),
  lstmSignal: z
    .object({
      direction: z.enum(['Buy', 'Sell', 'Hold']),
      confidence: z.number(),
      classProbabilities: z.object({
        sell: z.number(),
        hold: z.number(),
        buy: z.number(),
      }),
      sequenceLength: z.number(),
    })
    .optional(),
});

export type PatternDetectionRequest = z.infer<typeof PatternDetectionRequestSchema>;
export type PatternDetectionResponse = z.infer<typeof PatternDetectionResponseSchema>;

type PythonInvocation = {
  executable: string;
  preArgs: string[];
};

function resolvePythonTimeoutMs(): number {
  const raw = process.env.CANDLEVISION_PYTHON_TIMEOUT_MS;
  const parsed = raw ? Number(raw) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) {
    // Avoid overly aggressive values that cause intermittent false timeouts.
    return Math.max(60000, Math.floor(parsed));
  }
  // TensorFlow model loading can be expensive on the first call.
  return 120000;
}

function resolvePythonInvocation(): PythonInvocation {
  const envExecutable = process.env.CANDLEVISION_PYTHON_EXECUTABLE || process.env.PYTHON_EXECUTABLE;
  if (envExecutable && envExecutable.trim()) {
    return { executable: envExecutable, preArgs: [] };
  }

  const cwd = process.cwd();
  const pythonCandidates = [
    path.join(cwd, '.venv312', 'Scripts', 'python.exe'),
    path.join(cwd, 'training-assets', 'backend', '.venv', 'Scripts', 'python.exe'),
    path.join(cwd, 'training-assets', 'backend', 'venv', 'Scripts', 'python.exe'),
    path.join(cwd, '.venv', 'Scripts', 'python.exe'),
  ];

  for (const candidate of pythonCandidates) {
    if (existsSync(candidate)) {
      return { executable: candidate, preArgs: [] };
    }
  }

  if (process.platform === 'win32') {
    return { executable: 'py', preArgs: ['-3.12'] };
  }

  return { executable: 'python3', preArgs: [] };
}

export function detectCandlestickPatterns(payload: PatternDetectionRequest): Promise<PatternDetectionResponse> {
  const backendRoot = path.join(
    process.cwd(),
    'training-assets',
    'backend'
  );
  const moduleName = 'app.services.ai_models.pattern_inference';

  return new Promise((resolve, reject) => {
    const pythonInvocation = resolvePythonInvocation();
    const pythonPath = process.env.PYTHONPATH
      ? `${backendRoot}${path.delimiter}${process.env.PYTHONPATH}`
      : backendRoot;

    const child = spawn(pythonInvocation.executable, [...pythonInvocation.preArgs, '-m', moduleName], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: backendRoot,
      env: {
        ...process.env,
        PYTHONPATH: pythonPath,
      },
    });

    let settled = false;
    const timeoutMs = resolvePythonTimeoutMs();
    const timeout = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      child.kill();
      reject(
        new Error(
          `Pattern detection timed out after ${timeoutMs}ms. Set CANDLEVISION_PYTHON_TIMEOUT_MS to tune this limit.`
        )
      );
    }, timeoutMs);

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (err) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      reject(err);
    });

    child.on('close', (code) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);

      if (code !== 0) {
        reject(new Error(stderr || `Python inference exited with code ${code}`));
        return;
      }

      try {
        const parsed = JSON.parse(stdout);
        resolve(PatternDetectionResponseSchema.parse(parsed));
      } catch (error) {
        reject(error);
      }
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
}
