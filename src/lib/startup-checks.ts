import { getEnvValidationReport } from '@/lib/env';
import { reportServerError } from '@/lib/telemetry';

let hasRunStartupChecks = false;

export function runStartupChecks() {
  if (hasRunStartupChecks) return;
  hasRunStartupChecks = true;

  const report = getEnvValidationReport();
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';

  const hasClientIssues = report.missingClientVars.length > 0;
  const hasServerIssues = report.missingServerVars.length > 0;

  // In development, server-only vars may be intentionally absent if related routes are not used.
  if (hasClientIssues || (isProduction && hasServerIssues)) {
    reportServerError('startup.env-validation', new Error('Environment validation failed'), {
      missingClientVars: report.missingClientVars,
      missingServerVars: report.missingServerVars,
      nodeEnv,
      strictMode: isProduction ? 'production' : 'client-only',
    });
    return;
  }

  if (hasServerIssues) {
    console.warn('[startup-checks]', {
      status: 'warning',
      message: 'Missing server environment variables for optional server features in development.',
      missingServerVars: report.missingServerVars,
      nodeEnv,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (!report.valid) {
    reportServerError('startup.env-validation', new Error('Environment validation failed'), {
      missingClientVars: report.missingClientVars,
      missingServerVars: report.missingServerVars,
      nodeEnv,
    });
    return;
  }

  console.info('[startup-checks]', {
    status: 'ok',
    nodeEnv,
    timestamp: new Date().toISOString(),
  });
}
