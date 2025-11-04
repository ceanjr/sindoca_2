import { initializeApp, getApps, getApp } from 'firebase/app'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const isConfigValid = Object.values(firebaseConfig).every((value) => typeof value === 'string' && value.length > 0)

if (!isConfigValid) {
  // Helps identifying missing configuration without crashing the client render.
  console.warn('Firebase config is incomplete. Check your NEXT_PUBLIC_FIREBASE_* env vars.')
}

const app = isConfigValid ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null
const storage = app ? getStorage(app) : null

export { app, storage }
