import {
  Auth,
  GoogleAuthProvider,
  UserCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { Firestore, doc, serverTimestamp, setDoc } from 'firebase/firestore';

type EmailAuthInput = {
  auth: Auth;
  db: Firestore | null;
  email: string;
  password: string;
  mode: 'login' | 'register';
};

type GoogleAuthInput = {
  auth: Auth;
  db: Firestore | null;
};

async function upsertUserProfile(db: Firestore, userCredential: UserCredential, fallbackDisplayName: string) {
  const userRef = doc(db, 'users', userCredential.user.uid);
  const profileData = {
    uid: userCredential.user.uid,
    email: userCredential.user.email,
    displayName: userCredential.user.displayName || fallbackDisplayName,
    virtualBalance: 10000,
    createdAt: serverTimestamp(),
    tradesCount: 0,
    winRate: 0,
  };

  await setDoc(userRef, profileData, { merge: true });
}

export async function authenticateWithEmail(input: EmailAuthInput) {
  const { auth, db, email, password, mode } = input;

  const userCredential =
    mode === 'register'
      ? await createUserWithEmailAndPassword(auth, email, password)
      : await signInWithEmailAndPassword(auth, email, password);

  if (mode === 'register' && db) {
    await upsertUserProfile(db, userCredential, email.split('@')[0] || 'Operator');
  }

  return userCredential;
}

export async function authenticateWithGoogle(input: GoogleAuthInput) {
  const { auth, db } = input;

  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);

  if (db) {
    await upsertUserProfile(db, userCredential, 'Operator');
  }

  return userCredential;
}
