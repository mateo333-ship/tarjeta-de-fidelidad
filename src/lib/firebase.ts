"use client";

// Client-side Firebase SDK. Safe to import from client components — the
// values below are all NEXT_PUBLIC_* (public by design, same as any web
// app's Firebase config) and carry no privileges on their own; access is
// enforced by Firestore security rules (see /firestore.rules) and by the
// server-only Admin SDK in src/lib/firebaseAdmin.ts.
//
// `getAuthClient()`/`getDbClient()` are lazy on purpose: Next.js still
// renders "use client" pages once on the server to produce the initial
// HTML (and, without real env vars, to prerender them at build time).
// `getAuth()` validates the API key immediately, so calling it at module
// scope would crash that server render whenever the Firebase config is
// missing or wrong. Call these only from effects/event handlers (never
// from a component body) and that render never touches Firebase at all.
import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let cachedDb: Firestore | null = null;

function getFirebaseApp(): FirebaseApp {
  if (cachedApp) return cachedApp;
  const existing = getApps();
  cachedApp = existing.length ? existing[0] : initializeApp(firebaseConfig);
  return cachedApp;
}

export function getAuthClient(): Auth {
  if (!cachedAuth) cachedAuth = getAuth(getFirebaseApp());
  return cachedAuth;
}

export function getDbClient(): Firestore {
  if (!cachedDb) cachedDb = getFirestore(getFirebaseApp());
  return cachedDb;
}
