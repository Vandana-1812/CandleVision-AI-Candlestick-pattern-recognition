'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig, isConfigValid } from './config';
import { reportClientError } from '@/lib/telemetry';

export function initializeFirebase() {
  if (!isConfigValid) {
    reportClientError('firebase.config', new Error('Firebase client configuration missing or invalid'));
    return { app: null, auth: null, db: null };
  }

  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const auth = getAuth(app);
    const db = getFirestore(app);

    return { app, auth, db };
  } catch (error) {
    reportClientError('firebase.initialize', error);
    return { app: null, auth: null, db: null };
  }
}

export * from './provider';
export * from './client-provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './error-emitter';
export * from './errors';
