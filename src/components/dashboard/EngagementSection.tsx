"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  BookOpen, 
  Users, 
  Flame, 
  Lightbulb, 
  Target,
  ArrowRight,
  Zap,
  Medal,
  Brain
} from 'lucide-react';
import Link from 'next/link';

export const EngagementSection: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Start Competition Card */}
        <Card className="holographic-card border-primary/20 hover:border-primary/40 transition-all cursor-pointer group">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium font-headline uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Trophy className="w-4 h-4 text-accent" />
                Join Competition
              </CardTitle>
              <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Compete against traders worldwide and win prizes. Real trades, real rewards.
            </p>
            <Link href="/competitions">
              <Button className="w-full bg-accent hover:bg-accent/90 text-background font-headline h-8 text-xs uppercase tracking-wider">
                View Competitions
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Learning Path Card */}
        <Card className="holographic-card border-primary/20 hover:border-primary/40 transition-all cursor-pointer group">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium font-headline uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                Start Learning
              </CardTitle>
              <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Master candlestick patterns and trading signals with AI-guided lessons.
            </p>
            <Link href="/learning">
              <Button className="w-full border border-primary/30 hover:bg-primary/10 text-primary font-headline h-8 text-xs uppercase tracking-wider">
                Explore Courses
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* View Leaderboard Card */}
        <Card className="holographic-card border-primary/20 hover:border-primary/40 transition-all cursor-pointer group md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium font-headline uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Medal className="w-4 h-4 text-yellow-500" />
                Leaderboard
              </CardTitle>
              <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              See who's dominating the charts and learn from top traders.
            </p>
            <Link href="/competitions">
              <Button className="w-full border border-primary/30 hover:bg-primary/10 text-primary font-headline h-8 text-xs uppercase tracking-wider">
                View Rankings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Highlights Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Daily Challenge */}
        <Card className="holographic-card border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-accent/20 rounded-lg">
                <Flame className="w-4 h-4 text-accent" />
              </div>
              <div>
                <CardTitle className="text-sm font-headline uppercase tracking-wider text-accent">Daily Challenge</CardTitle>
                <p className="text-[10px] text-muted-foreground">Complete 5 trades today</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Progress</span>
                <span className="text-xs font-headline font-bold text-accent">0/5</span>
              </div>
              <div className="w-full bg-accent/10 rounded-full h-2">
                <div className="bg-accent h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
              <p className="text-[10px] text-muted-foreground pt-1">Complete trades to earn bonus XP</p>
            </div>
          </CardContent>
        </Card>

        {/* Trading Tip */}
        <Card className="holographic-card border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Lightbulb className="w-4 h-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm font-headline uppercase tracking-wider text-primary">Pro Tip</CardTitle>
                <p className="text-[10px] text-muted-foreground">Trading wisdom</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground leading-relaxed italic">
              "Wait for confirmation. The best traders never rush into a position. Always wait for multiple candlestick confirmations before entering a trade."
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Featured Achievements */}
      <Card className="holographic-card border-primary/20">
        <CardHeader>
          <CardTitle className="font-headline text-lg uppercase tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent" />
            Your Achievements
          </CardTitle>
          <p className="text-xs text-muted-foreground font-body mt-1">Unlock badges by completing milestones</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Target, label: 'First Trade', unlocked: true },
              { icon: Brain, label: 'Pattern Master', unlocked: false },
              { icon: Trophy, label: '100% Win Rate', unlocked: false },
              { icon: Users, label: 'Community Helper', unlocked: false },
            ].map((achievement, idx) => {
              const Icon = achievement.icon;
              return (
                <div 
                  key={idx} 
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                    achievement.unlocked 
                      ? 'border-accent/40 bg-accent/5' 
                      : 'border-muted/20 bg-muted/5 opacity-50'
                  }`}
                >
                  <Icon className={`w-6 h-6 mb-2 ${achievement.unlocked ? 'text-accent' : 'text-muted-foreground'}`} />
                  <span className="text-[10px] font-headline text-center">{achievement.label}</span>
                  {achievement.unlocked && (
                    <span className="text-[8px] text-accent font-bold mt-1">✓ Unlocked</span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
