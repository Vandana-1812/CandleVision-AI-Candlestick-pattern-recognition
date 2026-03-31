"use client";

import React from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';

const STORAGE_KEY = 'candlevision-competition-roster-v1';
const COMPETITION_ROSTER_DOC = 'competition-state';

type CompetitionRosterDocument = {
  joinedChallenges?: string[];
  updatedAt?: unknown;
};

export function useCompetitionRoster() {
  const db = useFirestore();
  const { user } = useUser();
  const [joinedChallenges, setJoinedChallenges] = React.useState<string[]>([]);
  const [hydrated, setHydrated] = React.useState(false);
  const localRosterRef = React.useRef<string[]>([]);
  const cloudResolvedRef = React.useRef(false);

  const persistLocalRoster = React.useCallback((roster: string[]) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(roster));
    } catch (error) {
      console.error('Failed to persist competition roster:', error);
    }
  }, []);

  const persistCloudRoster = React.useCallback(async (roster: string[]) => {
    if (!db || !user) return;

    try {
      await setDoc(
        doc(db, 'users', user.uid, 'competition', COMPETITION_ROSTER_DOC),
        {
          joinedChallenges: roster,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Failed to sync competition roster:', error);
    }
  }, [db, user]);

  React.useEffect(() => {
    try {
      const rawRoster = window.localStorage.getItem(STORAGE_KEY);
      if (rawRoster) {
        const parsedRoster = JSON.parse(rawRoster);
        if (Array.isArray(parsedRoster)) {
          const normalizedRoster = parsedRoster.filter((item): item is string => typeof item === 'string');
          localRosterRef.current = normalizedRoster;
          setJoinedChallenges(normalizedRoster);
        }
      }
    } catch (error) {
      console.error('Failed to load competition roster:', error);
    } finally {
      setHydrated(true);
    }
  }, []);

  React.useEffect(() => {
    if (!hydrated || !db || !user) return;

    const rosterRef = doc(db, 'users', user.uid, 'competition', COMPETITION_ROSTER_DOC);

    return onSnapshot(rosterRef, async (snapshot) => {
      cloudResolvedRef.current = true;

      if (snapshot.exists()) {
        const payload = snapshot.data() as CompetitionRosterDocument;
        const nextRoster = Array.isArray(payload.joinedChallenges)
          ? payload.joinedChallenges.filter((item): item is string => typeof item === 'string')
          : [];

        localRosterRef.current = nextRoster;
        setJoinedChallenges(nextRoster);
        persistLocalRoster(nextRoster);
        return;
      }

      if (localRosterRef.current.length > 0) {
        await persistCloudRoster(localRosterRef.current);
      }
    }, (error) => {
      console.error('Competition roster subscription failed:', error);
    });
  }, [db, hydrated, persistCloudRoster, persistLocalRoster, user]);

  const isJoined = React.useCallback(
    (challengeId: string) => joinedChallenges.includes(challengeId),
    [joinedChallenges]
  );

  const joinChallenge = React.useCallback((challengeId: string) => {
    setJoinedChallenges((current) => {
      if (current.includes(challengeId)) {
        return current;
      }

      const nextRoster = [...current, challengeId];
      localRosterRef.current = nextRoster;
      persistLocalRoster(nextRoster);
      void persistCloudRoster(nextRoster);
      return nextRoster;
    });
  }, [persistCloudRoster, persistLocalRoster]);

  const leaveChallenge = React.useCallback((challengeId: string) => {
    setJoinedChallenges((current) => {
      const nextRoster = current.filter((item) => item !== challengeId);
      localRosterRef.current = nextRoster;
      persistLocalRoster(nextRoster);
      void persistCloudRoster(nextRoster);
      return nextRoster;
    });
  }, [persistCloudRoster, persistLocalRoster]);

  return {
    hydrated,
    cloudResolved: cloudResolvedRef.current,
    joinedChallenges,
    isJoined,
    joinChallenge,
    leaveChallenge,
  };
}
