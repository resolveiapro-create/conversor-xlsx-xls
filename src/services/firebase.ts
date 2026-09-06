import AsyncStorage from '@react-native-async-storage/async-storage';
import { type FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { type Auth, initializeAuth } from 'firebase/auth';
// getReactNativePersistence existe no bundle React Native do Firebase, mas os tipos
// publicados pelo pacote não o declaram (problema conhecido do SDK). O app funciona
// normalmente em tempo de execução. Ver firebase/firebase-js-sdk#8332.
// @ts-expect-error - getReactNativePersistence não está nos tipos publicados de firebase/auth.
import { getReactNativePersistence } from 'firebase/auth';

// Preencha estes valores com os dados do SEU projeto Firebase (gratuito).
// Veja o passo a passo completo em docs/AUTENTICACAO.md.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

let auth: Auth | undefined;

if (isFirebaseConfigured) {
  const app: FirebaseApp = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export { auth };
