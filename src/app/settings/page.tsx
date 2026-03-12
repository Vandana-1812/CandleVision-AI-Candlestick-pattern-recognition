"use client"

import React from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, User, Bell, Shield, Database } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <SidebarNav />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <header>
          <h1 className="text-3xl font-headline font-bold glow-blue">TERMINAL SETTINGS</h1>
          <p className="text-muted-foreground font-body">Configure your operative environment.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="holographic-card">
              <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Profile Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Operator Display Name</Label>
                    <Input placeholder="John Doe" className="bg-white/5 border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email ID</Label>
                    <Input disabled value="operator@candlevision.io" className="bg-white/5 border-white/10 opacity-50" />
                  </div>
                </div>
                <Button className="bg-primary hover:bg-primary/80">SAVE CHANGES</Button>
              </CardContent>
            </Card>

            <Card className="holographic-card">
              <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-accent" />
                  Security & Access
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Change your access key or enable multi-factor authentication.</p>
                <Button variant="outline" className="border-white/10">UPDATE ACCESS KEY</Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
             <Card className="holographic-card">
              <CardHeader>
                <CardTitle className="font-headline text-sm uppercase">Quick Toggle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex items-center justify-between">
                   <div className="space-y-0.5">
                     <p className="text-sm font-medium">Haptic Feedback</p>
                     <p className="text-xs text-muted-foreground">Tactile alerts on signals</p>
                   </div>
                   <div className="w-8 h-4 bg-primary rounded-full" />
                 </div>
                 <div className="flex items-center justify-between border-t border-white/5 pt-4">
                   <div className="space-y-0.5">
                     <p className="text-sm font-medium">Audio Cues</p>
                     <p className="text-xs text-muted-foreground">Terminal voice synthesis</p>
                   </div>
                   <div className="w-8 h-4 bg-muted rounded-full" />
                 </div>
              </CardContent>
            </Card>

            <Card className="holographic-card border-destructive/20 bg-destructive/5">
              <CardHeader>
                <CardTitle className="font-headline text-sm text-destructive flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" className="w-full">PURGE ACCOUNT DATA</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
