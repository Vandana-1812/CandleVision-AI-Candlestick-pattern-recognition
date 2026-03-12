"use client"

import React from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, PlayCircle, BookOpen, Award } from 'lucide-react';

const modules = [
  { title: "Intro to Candlesticks", progress: 100, icon: BookOpen },
  { title: "Advanced Patterns", progress: 65, icon: Target },
  { title: "Psychology of Trading", progress: 20, icon: BrainCircuit },
  { title: "Risk Management", progress: 0, icon: ShieldCheck },
];

import { BrainCircuit, ShieldCheck, Target } from 'lucide-react';

export default function LearningPage() {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <SidebarNav />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <header>
          <h1 className="text-3xl font-headline font-bold glow-blue">LEARNING HUB</h1>
          <p className="text-muted-foreground font-body">Master the markets with immersive holographic lessons.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modules.map((m) => (
            <Card key={m.title} className="holographic-card group hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <m.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="font-headline text-lg">{m.title}</CardTitle>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">{m.progress}% COMPLETE</p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-primary transition-all duration-500" style={{ width: `${m.progress}%` }} />
                </div>
                <button className="flex items-center gap-2 text-sm font-headline text-primary hover:text-white transition-colors" suppressHydrationWarning>
                  <PlayCircle className="w-4 h-4" />
                  RESUME SESSION
                </button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="holographic-card border-accent/20 bg-accent/5">
          <CardHeader>
            <CardTitle className="font-headline text-sm text-accent flex items-center gap-2 uppercase tracking-tighter">
              <Award className="w-4 h-4" />
              Next Milestone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">Earn the 'Pattern Recognition Expert' Badge</p>
            <p className="text-sm text-muted-foreground">Complete 3 more sessions to unlock your next certification.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
