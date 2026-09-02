import { initializeApp, FirebaseOptions } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyBe3tXvJdhP8u4rZoxCdzkRJVg-BWHD13s",
  authDomain: "vittaflow-60465.firebaseapp.com",
  projectId: "vittaflow-60465",
  storageBucket: "vittaflow-60465.firebasestorage.app",
  messagingSenderId: "691607291127",
  appId: "1:691607291127:web:5550dceed1d41534143ff2",
};

const app = initializeApp(firebaseConfig);

export const auth: Auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db: Firestore = getFirestore(app);