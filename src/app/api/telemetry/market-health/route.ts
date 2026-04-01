import { NextRequest, NextResponse } from 'next/server';
import {
  getMarketDataHealthSnapshot,
  MarketDataProviderHealth,
  MarketDataProviderId,
} from '@/lib/market-data';
import { reportServerError, reportServerTelemetry } from '@/lib/telemetry';

type HealthSummary = {
  totalProviders: number;
  healthy: number;
  degraded: number;
  down: number;
  unknown: number;
  degradedProviders: MarketDataProviderId[];
  downProviders: MarketDataProviderId[];
};

type HealthSnapshotEntry = {
  timestamp: string;
  providers: Record<MarketDataProviderId, MarketDataProviderHealth>;
  summary: HealthSummary;
};

const MAX_HISTORY = 720;
const ALERT_COOLDOWN_MS = 5 * 60 * 1000;

const healthHistory: HealthSnapshotEntry[] = [];
const lastDownAlertByProvider = new Map<MarketDataProviderId, number>();

function buildSummary(
  providers: Record<MarketDataProviderId, MarketDataProviderHealth>
): HealthSummary {
  const values = Object.values(providers);
  const degradedProviders = values
    .filter((provider) => provider.status === 'degraded')
    .map((provider) => provider.providerId);
  const downProviders = values
    .filter((provider) => provider.status === 'down')
    .map((provider) => provider.providerId);

  return {
    totalProviders: values.length,
    healthy: values.filter((provider) => provider.status === 'healthy').length,
    degraded: degradedProviders.length,
    down: downProviders.length,
    unknown: values.filter((provider) => provider.status === 'unknown').length,
    degradedProviders,
    downProviders,
  };
}

function captureHealthSnapshot(): HealthSnapshotEntry {
  const providers = getMarketDataHealthSnapshot();
  const summary = buildSummary(providers);

  const entry: HealthSnapshotEntry = {
    timestamp: new Date().toISOString(),
    providers,
    summary,
  };

  healthHistory.push(entry);
  if (healthHistory.length > MAX_HISTORY) {
    healthHistory.splice(0, healthHistory.length - MAX_HISTORY);
  }

  return entry;
}

function emitDownAlerts(entry: HealthSnapshotEntry) {
  const now = Date.now();

  for (const providerId of entry.summary.downProviders) {
    const lastAlertAt = lastDownAlertByProvider.get(providerId) ?? 0;
    if (now - lastAlertAt < ALERT_COOLDOWN_MS) {
      continue;
    }

    const provider = entry.providers[providerId];
    reportServerTelemetry(
      'telemetry.market-health.down',
      `Market data provider ${providerId} is DOWN`,
      'warn',
      {
        providerId,
        consecutiveFailures: provider.consecutiveFailures,
        lastError: provider.lastError,
        lastFailureAt: provider.lastFailureAt,
        averageLatencyMs: provider.averageLatencyMs,
      }
    );

    lastDownAlertByProvider.set(providerId, now);
  }
}

export async function GET(request: NextRequest) {
  try {
    const includeHistory = request.nextUrl.searchParams.get('includeHistory') === 'true';
    const limitParam = Number.parseInt(request.nextUrl.searchParams.get('limit') || '60', 10);
    const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(limitParam, MAX_HISTORY)) : 60;

    const latest = captureHealthSnapshot();
    emitDownAlerts(latest);

    if (latest.summary.degraded > 0 && latest.summary.down === 0) {
      reportServerTelemetry(
        'telemetry.market-health.degraded',
        'One or more market data providers are degraded',
        'info',
        {
          degradedProviders: latest.summary.degradedProviders,
        }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        latest,
        history: includeHistory ? healthHistory.slice(-limit) : undefined,
        retention: {
          maxEntries: MAX_HISTORY,
          alertCooldownMs: ALERT_COOLDOWN_MS,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    reportServerError('api.telemetry.market-health', error);
    return NextResponse.json({ ok: false, error: 'Unable to capture market health snapshot.' }, { status: 500 });
  }
}
