import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  ReCaptchaV3Provider,
} from 'firebase/app-check';
import { getAuth, signInAnonymously } from 'firebase/auth';
import {
  collection,
  doc,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  setDoc,
  type Firestore,
} from 'firebase/firestore';
import type { IncidentReport } from '@/types/incident';

let cachedApp: FirebaseApp | null = null;
let cachedDb: Firestore | null = null;
let appCheckInitialized = false;
let anonymousAuthPromise: Promise<string | null> | null = null;

export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  );
}

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) {
    return null;
  }

  if (cachedApp) {
    return cachedApp;
  }

  const existing = getApps();
  if (existing.length > 0) {
    cachedApp = existing[0];
  } else {
    cachedApp = initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    });
  }

  if (
    typeof window !== 'undefined' &&
    !appCheckInitialized &&
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
  ) {
    const provider =
      process.env.NEXT_PUBLIC_RECAPTCHA_PROVIDER === 'v3'
        ? new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY)
        : new ReCaptchaEnterpriseProvider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY);

    initializeAppCheck(cachedApp, {
      provider,
      isTokenAutoRefreshEnabled: true,
    });
    appCheckInitialized = true;
  }

  return cachedApp;
}

export function getFirestoreDb(): Firestore | null {
  const app = getFirebaseApp();
  if (!app) {
    return null;
  }

  if (cachedDb) {
    return cachedDb;
  }

  if (typeof window !== 'undefined') {
    cachedDb = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } else {
    cachedDb = initializeFirestore(app, {});
  }

  return cachedDb;
}

export async function ensureAnonymousSession(): Promise<string | null> {
  const app = getFirebaseApp();
  if (!app || typeof window === 'undefined') {
    return null;
  }

  const auth = getAuth(app);
  if (auth.currentUser) {
    return auth.currentUser.uid;
  }

  if (!anonymousAuthPromise) {
    anonymousAuthPromise = signInAnonymously(auth)
      .then((cred) => cred.user.uid)
      .catch(() => null)
      .finally(() => {
        anonymousAuthPromise = null;
      });
  }

  return anonymousAuthPromise;
}

export async function persistIncidentToFirestore(
  incident: IncidentReport
): Promise<boolean> {
  const db = getFirestoreDb();
  if (!db) {
    return false;
  }

  await ensureAnonymousSession();

  const ref = doc(collection(db, 'incidents'), incident.id);
  const { isSyntheticSample: _omitSampleFlag, ...persistable } = incident;
  await setDoc(ref, {
    ...persistable,
    syncStatus: 'SYNCED_FIRESTORE',
  });
  return true;
}
