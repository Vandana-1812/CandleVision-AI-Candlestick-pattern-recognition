"use client";

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { isSupabaseConfigValid } from '../../lib/supabase-config';
import {
  authenticateWithEmail,
  authenticateWithGoogle,
  requestPasswordReset,
  syncSupabaseUserProfile,
} from '@/lib/auth-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Zap, LogIn, AlertCircle, Loader2, Info, UserPlus, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function AuthContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const auth = useAuth();
  const db = useFirestore();
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    setIsRegistering(searchParams.get('mode') === 'signup');
  }, [searchParams]);

  useEffect(() => {
    if (!userLoading && user) {
      router.replace('/');
    }
  }, [router, user, userLoading]);

  useEffect(() => {
    if (!db || !user) return;

    void syncSupabaseUserProfile(
      db,
      {
        uid: user.id,
        email: user.email ?? null,
        displayName:
          (user.user_metadata?.display_name as string | undefined) ||
          (user.user_metadata?.full_name as string | undefined) ||
          null,
      },
      user.email?.split('@')[0] || 'Operator'
    ).catch((error: unknown) => {
      console.warn('[auth-page] non-blocking profile sync failed', error);
    });
  }, [db, user]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorDetails(null);

    if (!auth || !isSupabaseConfigValid) {
      toast({
        variant: 'destructive',
        title: 'Setup Required',
        description: 'Please configure your Supabase URL and anon key in the environment variables.',
      });
      return;
    }

    setIsLoading(true);
    try {
      if (isRegistering) {
        await authenticateWithEmail({ auth, db, email, password, mode: 'register' });

        toast({ title: 'Account created', description: 'Check your email if confirmation is required.' });
      } else {
        await authenticateWithEmail({ auth, db, email, password, mode: 'login' });
        toast({ title: 'Signed in successfully' });
      }
    } catch (error: unknown) {
      let message = error instanceof Error ? error.message : 'Authentication request failed';

      if (message.toLowerCase().includes('timed out')) {
        message = 'Authentication timed out.';
        setErrorDetails('Network request timed out. Check internet/firewall or Supabase availability, then try again.');
      } else if (message.toLowerCase().includes('invalid login credentials')) {
        message = 'Invalid access credentials.';
        setErrorDetails(
          "Ensure your email/password are correct. If you haven't created an account yet, switch to sign up."
        );
      } else if (message.toLowerCase().includes('user already registered')) {
        message = 'Operator ID already exists.';
        setErrorDetails('This email is already registered. Please try logging in instead.');
      } else if (message.toLowerCase().includes('password should be at least')) {
        message = 'Access key too weak.';
        setErrorDetails('Password should be at least 6 characters long.');
      } else if (message.toLowerCase().includes('internal server error')) {
        message = 'Authentication service error.';
        setErrorDetails('Supabase returned an internal error. Retry in 10-20 seconds. If it persists, verify Auth settings and provider configuration in Supabase dashboard.');
      }

      toast({
        variant: 'destructive',
        title: 'Authentication Failure',
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth || !isSupabaseConfigValid) return;
    setIsLoading(true);
    setErrorDetails(null);
    try {
      await authenticateWithGoogle({ auth, db });
      setErrorDetails('Redirecting to Google sign-in...');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown authentication error';
      if (errorMessage.toLowerCase().includes('timed out')) {
        setErrorDetails('Google login timed out. Check internet/firewall and try again.');
      } else if (errorMessage.toLowerCase().includes('provider')) {
        setErrorDetails('Google provider is not enabled in your Supabase authentication settings.');
      } else if (errorMessage.toLowerCase().includes('redirect')) {
        setErrorDetails('Google redirect sign-in could not start. Check the configured redirect URLs in Supabase.');
      } else if (errorMessage.toLowerCase().includes('internal server error')) {
        setErrorDetails('Supabase OAuth returned an internal error. Verify Google provider client ID/secret and allowed redirect URLs in Supabase Auth settings.');
      }
      toast({
        variant: 'destructive',
        title: 'Google Sync Error',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setErrorDetails(null);

    if (!auth || !isSupabaseConfigValid) {
      toast({
        variant: 'destructive',
        title: 'Setup Required',
        description: 'Please configure your Supabase URL and anon key in the environment variables.',
      });
      return;
    }

    if (!email.trim()) {
      toast({
        variant: 'destructive',
        title: 'Email Required',
        description: 'Enter your login email first, then click Forgot password.',
      });
      return;
    }

    setIsLoading(true);
    try {
      await requestPasswordReset({ auth, email: email.trim() });
      setErrorDetails('Password reset email sent. Check your inbox and spam folder.');
      toast({
        title: 'Reset Link Sent',
        description: 'If that email exists, a password reset link has been sent.',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Password reset request failed';
      setErrorDetails('Unable to send reset email right now. Please retry in a few moments.');
      toast({
        variant: 'destructive',
        title: 'Reset Failed',
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #2a5a9f 0%, transparent 100%)' }}
      />

      <Card className="z-10 w-full max-w-md border-primary/30 holographic-card" suppressHydrationWarning>
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-[0_0_20px_rgba(42,90,159,0.8)]">
            <Zap className="fill-current text-white" />
          </div>
          <div>
            <CardTitle className="font-headline text-2xl tracking-tighter glow-blue">
              CANDLE<span className="text-primary">VISION</span>
            </CardTitle>
            <CardDescription className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Intelligent Market Terminal
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {!isSupabaseConfigValid && (
            <Alert variant="destructive" className="border-destructive/20 bg-destructive/10">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Configuration Missing</AlertTitle>
              <AlertDescription className="text-xs">
                Supabase URL and anon key are missing. Please check your .env variables.
              </AlertDescription>
            </Alert>
          )}

          {errorDetails && (
            <Alert className="border-primary/20 bg-primary/10 text-primary">
              <Info className="h-4 w-4" />
              <AlertTitle className="font-headline text-xs uppercase">Action Required</AlertTitle>
              <AlertDescription className="text-[11px] leading-tight">{errorDetails}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Terminal ID (Email)</Label>
              <Input
                id="email"
                type="email"
                placeholder="operator@candlevision.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={!isSupabaseConfigValid || isLoading}
                className="border-white/10 bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Access Key (Password)</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={!isSupabaseConfigValid || isLoading}
                className="border-white/10 bg-background/50"
              />
              {!isRegistering && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-[11px] text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
                    onClick={handleForgotPassword}
                    disabled={!isSupabaseConfigValid || isLoading}
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-primary font-headline text-white hover:bg-primary/80"
              disabled={isLoading || !isSupabaseConfigValid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  PROCESSING...
                </>
              ) : isRegistering ? (
                <>
                  CREATE ACCOUNT
                  <UserPlus className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  AUTHORIZE ACCESS
                  <LogIn className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <div className="relative w-full py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or Synchronize Via</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-white/10 font-headline text-xs hover:bg-white/5"
            onClick={handleGoogleSignIn}
            disabled={!isSupabaseConfigValid || isLoading}
          >
            GOOGLE TERMINAL
          </Button>

          <button
            type="button"
            className="mt-2 text-xs text-muted-foreground transition-colors hover:text-primary"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setErrorDetails(null);
            }}
            disabled={!isSupabaseConfigValid || isLoading}
            suppressHydrationWarning
          >
            {isRegistering ? 'Back to Login' : 'Initialize New Operator Account'}
          </button>

          <Button asChild variant="ghost" className="w-full text-muted-foreground hover:text-white">
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Platform Overview
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
          <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #2a5a9f 0%, transparent 100%)' }} />
          <Card className="z-10 w-full max-w-md border-primary/30">
            <CardContent className="flex min-h-[200px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
