'use client';

import React, { createContext, useContext } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { getSupabaseBrowserClient } from '@/lib/supabase';

interface FirebaseContextProps {
  app: FirebaseApp | null;
  db: Firestore | null;
  auth: unknown | null;
}

const FirebaseContext = createContext<FirebaseContextProps | null>(null);

export function FirebaseProvider({
  children,
  firebaseApp,
  firestore,
  auth,
}: {
  children: React.ReactNode;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: unknown | null;
}) {
  return (
    <FirebaseContext.Provider value={{ app: firebaseApp, db: firestore, auth }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error('useFirebase must be used within FirebaseProvider');
  return context;
};

export const useFirebaseApp = () => useFirebase().app;
export const useFirestore = () => useFirebase().db;
export const useAuth = () => getSupabaseBrowserClient();
