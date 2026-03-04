import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Prefer Vite env vars, but fall back to the same config used in `knote-firebase.html`
// so the game keeps working out-of-the-box in this repo.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyANzJq_Kbbrbkf_DyTPUHUiNDY2ocM5uJI',
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'knote-game.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'knote-game',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    'knote-game.firebasestorage.app',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1073978487442',
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    '1:1073978487442:web:33bd8f24ac05ca29f6ec4b',
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
