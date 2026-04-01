"use client"

import React, { useEffect, useMemo, useState } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Shield, Database, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useDoc, useFirestore, useUser } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { sendPasswordResetEmail, updateProfile } from 'firebase/auth';

type UserSettings = {
  hapticFeedback: boolean;
  audioCues: boolean;
};

type UserProfileDetails = {
  dateOfBirth: string;
  gender: string;
  phone: string;
  country: string;
  timezone: string;
  bio: string;
};

const DEFAULT_SETTINGS: UserSettings = {
  hapticFeedback: true,
  audioCues: false,
};

const DEFAULT_PROFILE_DETAILS: UserProfileDetails = {
  dateOfBirth: '',
  gender: '',
  phone: '',
  country: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  bio: '',
};

const COUNTRY_OPTIONS = [
  'Australia',
  'Brazil',
  'Canada',
  'France',
  'Germany',
  'India',
  'Indonesia',
  'Japan',
  'Netherlands',
  'Singapore',
  'South Africa',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
];

const FALLBACK_TIMEZONE_OPTIONS = [
  'UTC',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Australia/Sydney',
];

export default function SettingsPage() {
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  const userRef = useMemo(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);

  const { data: profile, loading: profileLoading } = useDoc(userRef);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [profileDetails, setProfileDetails] = useState<UserProfileDetails>(DEFAULT_PROFILE_DETAILS);
  const [saving, setSaving] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [purging, setPurging] = useState(false);
  const [purgeConfirmText, setPurgeConfirmText] = useState('');

  const timezoneOptions = useMemo(() => {
    try {
      if (typeof Intl.supportedValuesOf === 'function') {
        return Intl.supportedValuesOf('timeZone');
      }
    } catch {
      // Ignore unsupported Intl environments and use fallback list.
    }
    return FALLBACK_TIMEZONE_OPTIONS;
  }, []);

  useEffect(() => {
    if (!user) return;

    const profileData = (profile as any) ?? {};
    setDisplayName(profileData.displayName || user.displayName || '');
    setEmail(profileData.email || user.email || '');
    setSettings({
      hapticFeedback: profileData.settings?.hapticFeedback ?? DEFAULT_SETTINGS.hapticFeedback,
      audioCues: profileData.settings?.audioCues ?? DEFAULT_SETTINGS.audioCues,
    });
    setProfileDetails({
      dateOfBirth: profileData.profileDetails?.dateOfBirth ?? DEFAULT_PROFILE_DETAILS.dateOfBirth,
      gender: profileData.profileDetails?.gender ?? DEFAULT_PROFILE_DETAILS.gender,
      phone: profileData.profileDetails?.phone ?? DEFAULT_PROFILE_DETAILS.phone,
      country: profileData.profileDetails?.country ?? DEFAULT_PROFILE_DETAILS.country,
      timezone: profileData.profileDetails?.timezone ?? DEFAULT_PROFILE_DETAILS.timezone,
      bio: profileData.profileDetails?.bio ?? DEFAULT_PROFILE_DETAILS.bio,
    });
  }, [profile, user]);

  const updateProfileField = <K extends keyof UserProfileDetails>(field: K, value: UserProfileDetails[K]) => {
    setProfileDetails((current) => ({ ...current, [field]: value }));
  };

  const handleSaveChanges = async () => {
    if (!db || !user) return;

    setSaving(true);
    try {
      const trimmedName = displayName.trim();
      if (profileDetails.dateOfBirth) {
        const dob = new Date(profileDetails.dateOfBirth);
        if (Number.isNaN(dob.getTime()) || dob.getTime() > Date.now()) {
          throw new Error('Date of birth must be a valid past date.');
        }
      }

      if (auth?.currentUser && trimmedName && trimmedName !== auth.currentUser.displayName) {
        await updateProfile(auth.currentUser, { displayName: trimmedName });
      }

      await setDoc(
        doc(db, 'users', user.uid),
        {
          uid: user.uid,
          email: email || user.email || '',
          displayName: trimmedName || user.displayName || 'Operator',
          profileDetails,
          settings,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      toast({
        title: 'Settings saved',
        description: 'Profile and preferences are now synced to your account.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Save failed',
        description: error?.message || 'Unable to save settings right now.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!auth || !email) return;

    setSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'Reset email sent',
        description: `Password reset instructions were sent to ${email}.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Reset failed',
        description: error?.message || 'Unable to send reset email.',
      });
    } finally {
      setSendingReset(false);
    }
  };

  const purgeAccountData = async () => {
    if (!db || !user) return;
    if (purgeConfirmText.trim().toUpperCase() !== 'PURGE') {
      toast({
        variant: 'destructive',
        title: 'Confirmation required',
        description: 'Type PURGE before deleting your account data.',
      });
      return;
    }

    setPurging(true);
    try {
      const signalsRef = collection(db, 'users', user.uid, 'signals');
      const signalsSnapshot = await getDocs(signalsRef);
      await Promise.all(signalsSnapshot.docs.map((signalDoc) => deleteDoc(signalDoc.ref)));

      const backtestsRef = collection(db, 'users', user.uid, 'backtests');
      const backtestsSnapshot = await getDocs(backtestsRef);
      await Promise.all(backtestsSnapshot.docs.map((backtestDoc) => deleteDoc(backtestDoc.ref)));

      const competitionStateRef = doc(db, 'users', user.uid, 'competition', 'competition-state');
      await deleteDoc(competitionStateRef).catch(() => undefined);

      await setDoc(
        doc(db, 'users', user.uid),
        {
          displayName: displayName.trim() || user.displayName || 'Operator',
          email: email || user.email || '',
          virtualBalance: 10000,
          tradesCount: 0,
          winRate: 0,
          profileDetails,
          settings,
          dataPurgedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setPurgeConfirmText('');
      toast({
        title: 'Account data purged',
        description: 'Signals, backtests, and competition state have been reset.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Purge failed',
        description: error?.message || 'Could not purge account data.',
      });
    } finally {
      setPurging(false);
    }
  };

  if (!user || profileLoading) {
    return (
      <div className="flex h-screen bg-background overflow-hidden">
        <SidebarNav />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

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
                    <Input
                      placeholder="John Doe"
                      className="bg-white/5 border-white/10"
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email ID</Label>
                    <Input
                      disabled
                      value={email}
                      className="bg-white/5 border-white/10 opacity-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      className="bg-white/5 border-white/10"
                      value={profileDetails.dateOfBirth}
                      onChange={(event) => updateProfileField('dateOfBirth', event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={profileDetails.gender || 'not-specified'}
                      onValueChange={(value) =>
                        updateProfileField('gender', value === 'not-specified' ? '' : value)
                      }
                    >
                      <SelectTrigger id="gender" className="bg-white/5 border-white/10">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not-specified">Select gender</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="non-binary">Non-binary</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      placeholder="+1 555 000 0000"
                      className="bg-white/5 border-white/10"
                      value={profileDetails.phone}
                      onChange={(event) => updateProfileField('phone', event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      list="country-options"
                      placeholder="India"
                      className="bg-white/5 border-white/10"
                      value={profileDetails.country}
                      onChange={(event) => updateProfileField('country', event.target.value)}
                    />
                    <datalist id="country-options">
                      {COUNTRY_OPTIONS.map((country) => (
                        <option key={country} value={country} />
                      ))}
                    </datalist>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input
                      id="timezone"
                      list="timezone-options"
                      placeholder="Asia/Kolkata"
                      className="bg-white/5 border-white/10"
                      value={profileDetails.timezone}
                      onChange={(event) => updateProfileField('timezone', event.target.value)}
                    />
                    <datalist id="timezone-options">
                      {timezoneOptions.map((zone) => (
                        <option key={zone} value={zone} />
                      ))}
                    </datalist>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about your trading goals and experience..."
                      className="bg-white/5 border-white/10 min-h-24"
                      value={profileDetails.bio}
                      onChange={(event) => updateProfileField('bio', event.target.value)}
                    />
                  </div>
                </div>

                <Button
                  className="bg-primary hover:bg-primary/80"
                  onClick={handleSaveChanges}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'SAVE CHANGES'}
                </Button>
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
                <Button
                  variant="outline"
                  className="border-white/10"
                  onClick={handlePasswordReset}
                  disabled={sendingReset || !email}
                >
                  {sendingReset ? 'SENDING...' : 'SEND PASSWORD RESET EMAIL'}
                </Button>
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
                   <Switch
                     checked={settings.hapticFeedback}
                     onCheckedChange={(checked) => setSettings((current) => ({ ...current, hapticFeedback: checked }))}
                   />
                 </div>
                 <div className="flex items-center justify-between border-t border-white/5 pt-4">
                   <div className="space-y-0.5">
                     <p className="text-sm font-medium">Audio Cues</p>
                     <p className="text-xs text-muted-foreground">Terminal voice synthesis</p>
                   </div>
                   <Switch
                     checked={settings.audioCues}
                     onCheckedChange={(checked) => setSettings((current) => ({ ...current, audioCues: checked }))}
                   />
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
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  This removes your signals, backtests, and competition state, and resets core profile stats.
                </p>
                <Input
                  value={purgeConfirmText}
                  onChange={(event) => setPurgeConfirmText(event.target.value)}
                  placeholder="Type PURGE to confirm"
                  className="bg-background/40 border-destructive/30"
                />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full"
                      disabled={purging || purgeConfirmText.trim().toUpperCase() !== 'PURGE'}
                    >
                      {purging ? 'PURGING...' : 'PURGE ACCOUNT DATA'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm data purge</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action will delete your signals, backtests, and competition state, and reset profile stats.
                        This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={purgeAccountData}
                      >
                        Confirm purge
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
