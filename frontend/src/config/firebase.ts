import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage, ref, uploadBytes, getDownloadURL, uploadString } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'kopargov-ai',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let isFirebaseConfigured = false;

try {
  const isRealApiKey =
    Boolean(firebaseConfig.apiKey) &&
    !firebaseConfig.apiKey.includes('SyntheticDemoApiKey') &&
    !firebaseConfig.apiKey.includes('<REAL_');

  if (isRealApiKey && firebaseConfig.projectId) {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    isFirebaseConfigured = true;
  } else {
    console.info('[Firebase] Client SDK waiting for real credentials in frontend/.env.local');
  }
} catch (error) {
  console.warn('[Firebase] Client SDK initialization note:', error);
}

export { app, auth, db, storage, isFirebaseConfigured };

/**
 * Upload a complaint or resolution photo to Firebase Storage with base64 fallback.
 */
export async function uploadEvidencePhoto(
  fileOrBase64: File | string,
  path = 'complaints'
): Promise<string> {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const filename = `${path}/${timestamp}_${randomSuffix}.jpg`;

  if (storage && isFirebaseConfigured) {
    try {
      const storageRef = ref(storage, filename);
      if (typeof fileOrBase64 === 'string') {
        if (fileOrBase64.startsWith('data:')) {
          await uploadString(storageRef, fileOrBase64, 'data_url');
        } else {
          await uploadString(storageRef, fileOrBase64, 'raw');
        }
      } else {
        await uploadBytes(storageRef, fileOrBase64);
      }
      return await getDownloadURL(storageRef);
    } catch (storageErr) {
      console.warn('[Firebase Storage] Upload failed, falling back to data URL:', storageErr);
    }
  }

  // Fallback to data URL
  if (typeof fileOrBase64 === 'string') {
    return fileOrBase64;
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(fileOrBase64);
  });
}
