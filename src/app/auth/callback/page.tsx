"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSupabaseBrowserClient } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const completeOAuth = async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        if (isMounted) {
          setError('Supabase client is not configured.');
        }
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const oauthError = params.get('error_description') || params.get('error');
      const code = params.get('code');

      if (oauthError) {
        if (isMounted) {
          setError(decodeURIComponent(oauthError));
        }
        return;
      }

      // For implicit/hash flows, the client can hydrate session from URL automatically.
      const { data: initialSession } = await supabase.auth.getSession();
      if (initialSession.session) {
        router.replace('/');
        router.refresh();
        return;
      }

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          if (isMounted) {
            setError(exchangeError.message);
          }
          return;
        }

        router.replace('/');
        router.refresh();
        return;
      }

      // Some providers return tokens in hash fragment rather than ?code.
      const hash = window.location.hash || '';
      const hasTokenInHash = hash.includes('access_token=') || hash.includes('refresh_token=');

      if (hasTokenInHash) {
        const { data: delayedSession } = await supabase.auth.getSession();
        if (delayedSession.session) {
          router.replace('/');
          router.refresh();
          return;
        }
      }

      if (isMounted) {
        setError('OAuth callback is missing code/token. Start login again from the auth page.');
      }
    };

    void completeOAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <Card className="z-10 w-full max-w-md border-primary/30">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-xl tracking-tight">Google Sign-In</CardTitle>
          <CardDescription>Finalizing your secure terminal access...</CardDescription>
        </CardHeader>
        <CardContent className="flex min-h-[140px] items-center justify-center">
          {error ? (
            <div className="flex flex-col items-center gap-2 text-center text-destructive">
              <AlertCircle className="h-6 w-6" />
              <p className="text-sm">{error}</p>
            </div>
          ) : (
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
