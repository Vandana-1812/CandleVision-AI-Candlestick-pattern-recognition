
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Zap, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    
    setIsLoading(true);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({ title: "Account created", description: "Welcome to CandleVision!" });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Signed in successfully" });
      }
      router.push('/');
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Authentication Error", 
        description: error.message 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Google Sign-In Error", 
        description: error.message 
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #2a5a9f 0%, transparent 100%)' }} />
      
      <Card className="w-full max-w-md holographic-card border-primary/30 z-10">
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
        
        <form onSubmit={handleAuth}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Terminal ID (Email)</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="operator@candlevision.io" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background/50 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Access Key (Password)</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background/50 border-white/10"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/80 text-white font-headline"
              disabled={isLoading}
            >
              {isLoading ? "PROCESING..." : (isRegistering ? "CREATE ACCOUNT" : "AUTHORIZE ACCESS")}
              <LogIn className="ml-2 w-4 h-4" />
            </Button>
            
            <div className="relative w-full py-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or Connect Via</span></div>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full border-white/10 hover:bg-white/5 font-headline text-xs"
              onClick={handleGoogleSignIn}
            >
              GOOGLE TERMINAL
            </Button>

            <button 
              type="button"
              className="text-xs text-muted-foreground hover:text-primary transition-colors mt-2"
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering ? "Back to Login" : "Initialize New Operator Account"}
            </button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
