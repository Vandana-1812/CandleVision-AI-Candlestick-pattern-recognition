'use client';

import React, { useMemo } from 'react';
import { FirebaseProvider } from './provider';
import { initializeFirebase } from './index';

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize Firebase only once on the client
  const { app, auth, db } = useMemo(() => initializeFirebase(), []);

  return (
    <FirebaseProvider firebaseApp={app} firestore={db} auth={auth}>
      {children}
    </FirebaseProvider>
  );
}
