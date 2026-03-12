
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { isConfigValid } from '@/firebase/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Zap, LogIn, AlertCircle, Loader2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorDetails(null);

    if (!auth || !isConfigValid) {
      toast({ 
        variant: "destructive", 
        title: "Setup Required", 
        description: "Please configure your Firebase API keys in the environment variables." 
      });
      return;
    }
    
    setIsLoading(true);
    try {
      let userCredential;
      if (isRegistering) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Initialize user profile in Firestore
        if (db) {
          const userRef = doc(db, 'users', userCredential.user.uid);
          const profileData = {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            displayName: email.split('@')[0],
            virtualBalance: 10000,
            createdAt: serverTimestamp(),
          };

          setDoc(userRef, profileData, { merge: true })
            .catch(async (error) => {
              const permissionError = new FirestorePermissionError({
                path: userRef.path,
                operation: 'write',
                requestResourceData: profileData,
              });
              errorEmitter.emit('permission-error', permissionError);
            });
        }
        
        toast({ title: "Account created", description: "Welcome to CandleVision!" });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Signed in successfully" });
      }
      router.push('/');
    } catch (error: any) {
      console.error("Auth Error:", error.code, error.message);
      let message = error.message;
      
      if (error.code === 'auth/operation-not-allowed') {
        message = "Login Provider Disabled";
        setErrorDetails("The Email/Password sign-in provider is not enabled in your Firebase Console. Go to Authentication > Sign-in method to enable it.");
      } else if (error.code === 'auth/invalid-credential') {
        message = "Invalid credentials. Please check your terminal ID and access key.";
      } else if (error.code === 'auth/email-already-in-use') {
        message = "Operator ID already exists. Try logging in instead.";
      }
      
      toast({ 
        variant: "destructive", 
        title: "Authentication Failure", 
        description: message 
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
        };

        setDoc(userRef, profileData, { merge: true })
          .catch(async (error) => {
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
        setErrorDetails("Google sign-in is not enabled. Enable 'Google' in your Firebase Console under Authentication > Sign-in method.");
      }
      toast({ 
        variant: "destructive", 
        title: "Google Sync Error", 
        description: error.message 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #2a5a9f 0%, transparent 100%)' }} />
      
      <Card className="w-full max-w-md holographic-card border-primary/30 z-10" suppressHydrationWarning>
        <CardHeader className="space-y-4 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(42,90,159,0.8)]">
            <Zap className="text-white fill-current" />
          </div>
          <div>
            <CardTitle className="font-headline text-2xl glow-blue tracking-tighter">
              CANDLE<span className="text-primary">VISION</span>
            </CardTitle>
            <CardDescription className="uppercase text-[10px] tracking-[0.2em] mt-1 text-muted-foreground">
              Intelligent Market Terminal
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!isConfigValid && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Configuration Missing</AlertTitle>
              <AlertDescription className="text-xs">
                Firebase API keys are missing. Please check your <code>.env</code> variables.
              </AlertDescription>
            </Alert>
          )}

          {errorDetails && (
            <Alert className="bg-primary/10 border-primary/20 text-primary">
              <Info className="h-4 w-4" />
              <AlertTitle className="text-xs uppercase font-headline">Console Setup Required</AlertTitle>
              <AlertDescription className="text-[11px] leading-tight">
                {errorDetails}
              </AlertDescription>
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
                className="bg-background/50 border-white/10"
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
                className="bg-background/50 border-white/10"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/80 text-white font-headline"
              disabled={isLoading || !isConfigValid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  PROCESSING...
                </>
              ) : (
                <>
                  {isRegistering ? "CREATE ACCOUNT" : "AUTHORIZE ACCESS"}
                  <LogIn className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <div className="relative w-full py-2">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10"></span></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or Synchronize Via</span></div>
          </div>

          <Button 
            type="button" 
            variant="outline" 
            className="w-full border-white/10 hover:bg-white/5 font-headline text-xs"
            onClick={handleGoogleSignIn}
            disabled={!isConfigValid || isLoading}
          >
            GOOGLE TERMINAL
          </Button>

          <button 
            type="button"
            className="text-xs text-muted-foreground hover:text-primary transition-colors mt-2 outline-none"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setErrorDetails(null);
            }}
            disabled={!isConfigValid || isLoading}
            suppressHydrationWarning
          >
            {isRegistering ? "Back to Login" : "Initialize New Operator Account"}
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}
