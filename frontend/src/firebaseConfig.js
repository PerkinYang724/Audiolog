// Firebase configuration for local development
// This will connect to Firebase emulators when running locally

// Default Firebase config - replace with your actual Firebase project config
// You can get this from Firebase Console > Project Settings > General > Your apps
export const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// App ID for the AudioLog app
export const appId = 'audio-log-demo';

// Set to true to use local emulators
export const USE_EMULATORS = true;
