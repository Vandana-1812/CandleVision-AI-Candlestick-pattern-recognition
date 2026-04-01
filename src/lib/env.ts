import { z } from 'zod';

const clientEnvSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
});

const serverEnvSchema = z.object({
  GOOGLE_API_KEY: z.string().min(1),
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().min(1),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
});

export type EnvValidationReport = {
  valid: boolean;
  missingClientVars: string[];
  missingServerVars: string[];
};

function missingKeys<T extends Record<string, unknown>>(schema: z.ZodType<T>, source: Record<string, unknown>) {
  const parsed = schema.safeParse(source);
  if (parsed.success) {
    return [] as string[];
  }

  return parsed.error.issues
    .map((issue) => issue.path[0])
    .filter((key): key is string => typeof key === 'string');
}

export function getEnvValidationReport(): EnvValidationReport {
  const env = process.env as Record<string, unknown>;

  const missingClientVars = missingKeys(clientEnvSchema, env);
  const missingServerVars = missingKeys(serverEnvSchema, env);

  return {
    valid: missingClientVars.length === 0 && missingServerVars.length === 0,
    missingClientVars,
    missingServerVars,
  };
}

export function assertServerEnvironment() {
  const env = process.env as Record<string, unknown>;
  return serverEnvSchema.parse(env);
}
