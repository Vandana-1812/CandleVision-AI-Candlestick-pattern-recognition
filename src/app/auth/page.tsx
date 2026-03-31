"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { isConfigValid } from '@/firebase/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Zap, LogIn, AlertCircle, Loader2, Info, UserPlus, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    setIsRegistering(searchParams.get('mode') === 'signup');
  }, [searchParams]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorDetails(null);

    if (!auth || !isConfigValid) {
      toast({
        variant: 'destructive',
        title: 'Setup Required',
        description: 'Please configure your Firebase API keys in the environment variables.',
      });
      return;
    }

    setIsLoading(true);
    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        if (db) {
          const userRef = doc(db, 'users', userCredential.user.uid);
          const profileData = {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            displayName: email.split('@')[0],
            virtualBalance: 10000,
            createdAt: serverTimestamp(),
            tradesCount: 0,
            winRate: 0,
          };

          setDoc(userRef, profileData, { merge: true }).catch(async () => {
            const permissionError = new FirestorePermissionError({
              path: userRef.path,
              operation: 'write',
              requestResourceData: profileData,
            });
            errorEmitter.emit('permission-error', permissionError);
          });
        }

        toast({ title: 'Account created', description: 'Welcome to CandleVision!' });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: 'Signed in successfully' });
      }
      router.push('/');
    } catch (error: any) {
      let message = error.message;

      if (error.code === 'auth/operation-not-allowed') {
        message = 'Login Provider Disabled';
        setErrorDetails(
          'The Email/Password sign-in provider is not enabled in your Firebase Console. Go to Authentication > Sign-in method to enable it.'
        );
      } else if (error.code === 'auth/invalid-credential') {
        message = 'Invalid access credentials.';
        setErrorDetails(
          "Ensure your password is correct. If you haven't created an account yet, click 'Initialize New Operator Account' below."
        );
      } else if (error.code === 'auth/email-already-in-use') {
        message = 'Operator ID already exists.';
        setErrorDetails('This email is already registered. Please try logging in instead.');
      } else if (error.code === 'auth/weak-password') {
        message = 'Access key too weak.';
        setErrorDetails('Password should be at least 6 characters long.');
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
    if (!auth || !isConfigValid) return;
    setIsLoading(true);
    setErrorDetails(null);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);

      if (db) {
        const userRef = doc(db, 'users', userCredential.user.uid);
        const profileData = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          virtualBalance: 10000,
          createdAt: serverTimestamp(),
          tradesCount: 0,
          winRate: 0,
        };

        setDoc(userRef, profileData, { merge: true }).catch(async () => {
          const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'write',
            requestResourceData: profileData,
          });
          errorEmitter.emit('permission-error', permissionError);
        });
      }

      router.push('/');
    } catch (error: any) {
      if (error.code === 'auth/operation-not-allowed') {
        setErrorDetails(
          "Google sign-in is not enabled. Enable 'Google' in your Firebase Console under Authentication > Sign-in method."
        );
      }
      toast({
        variant: 'destructive',
        title: 'Google Sync Error',
        description: error.message,
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
          {!isConfigValid && (
            <Alert variant="destructive" className="border-destructive/20 bg-destructive/10">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Configuration Missing</AlertTitle>
              <AlertDescription className="text-xs">
                Firebase API keys are missing. Please check your .env variables.
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
                disabled={!isConfigValid || isLoading}
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
                disabled={!isConfigValid || isLoading}
                className="border-white/10 bg-background/50"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary font-headline text-white hover:bg-primary/80"
              disabled={isLoading || !isConfigValid}
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
            disabled={!isConfigValid || isLoading}
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
            disabled={!isConfigValid || isLoading}
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
