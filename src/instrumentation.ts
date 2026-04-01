import { runStartupChecks } from '@/lib/startup-checks';

export async function register() {
  runStartupChecks();
}
