import { type SupabaseClient, type User as SupabaseUser } from '@supabase/supabase-js';
import { Firestore, doc, serverTimestamp, setDoc } from 'firebase/firestore';

const AUTH_REQUEST_TIMEOUT_MS = 15000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, context: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${context} timed out. Please check network/firewall and try again.`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }) as Promise<T>;
}

type EmailAuthInput = {
  auth: SupabaseClient;
  db: Firestore | null;
  email: string;
  password: string;
  mode: 'login' | 'register';
};

type GoogleAuthInput = {
  auth: SupabaseClient;
  db: Firestore | null;
};

type PasswordResetInput = {
  auth: SupabaseClient;
  email: string;
};

type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
};

type AuthResult = {
  user: AuthUser | null;
};

function toAuthUser(user: SupabaseUser): AuthUser {
  return {
    uid: user.id,
    email: user.email ?? null,
    displayName:
      (user.user_metadata?.display_name as string | undefined) ||
      (user.user_metadata?.full_name as string | undefined) ||
      null,
  };
}

async function upsertUserProfile(db: Firestore, user: AuthUser, fallbackDisplayName: string) {
  const userRef = doc(db, 'users', user.uid);
  const profileData = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || fallbackDisplayName,
    virtualBalance: 10000,
    createdAt: serverTimestamp(),
    tradesCount: 0,
    winRate: 0,
  };

  await withTimeout(setDoc(userRef, profileData, { merge: true }), AUTH_REQUEST_TIMEOUT_MS, 'Profile setup');
}

export async function syncSupabaseUserProfile(db: Firestore, user: AuthUser, fallbackDisplayName: string) {
  await upsertUserProfile(db, user, fallbackDisplayName);
}

export async function authenticateWithEmail(input: EmailAuthInput) {
  const { auth, db, email, password, mode } = input;

  const result =
    mode === 'register'
      ? await withTimeout(auth.auth.signUp({ email, password }), AUTH_REQUEST_TIMEOUT_MS, 'Account creation')
      : await withTimeout(auth.auth.signInWithPassword({ email, password }), AUTH_REQUEST_TIMEOUT_MS, 'Login');

  if (result.error) {
    throw result.error;
  }

  const user = result.data.user ? toAuthUser(result.data.user) : null;

  if (mode === 'register' && db && user) {
    void upsertUserProfile(db, user, email.split('@')[0] || 'Operator').catch((error) => {
      console.warn('[auth-service] profile sync after register failed', error);
    });
  }

  return { user } satisfies AuthResult;
}

export async function authenticateWithGoogle(input: GoogleAuthInput) {
  const { auth } = input;
  const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;

  const result = await withTimeout(
    auth.auth.signInWithOAuth({
      provider: 'google',
      options: redirectTo ? { redirectTo } : undefined,
    }),
    AUTH_REQUEST_TIMEOUT_MS,
    'Google login'
  );

  if (result.error) {
    throw result.error;
  }

  // signInWithOAuth performs browser redirect by default.

  return { user: null } satisfies AuthResult;
}

export async function requestPasswordReset(input: PasswordResetInput) {
  const { auth, email } = input;
  const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth?mode=login` : undefined;

  const result = await withTimeout(
    auth.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined),
    AUTH_REQUEST_TIMEOUT_MS,
    'Password reset'
  );

  if (result.error) {
    throw result.error;
  }
}
