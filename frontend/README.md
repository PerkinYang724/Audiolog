# AudioLog Frontend

React frontend for the AudioLog application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Update Firebase configuration in `src/firebaseConfig.js` with your actual Firebase project credentials.

3. Start the development server:
```bash
npm run dev
```

The app will be available at **http://localhost:3000**

## Firebase Emulators

Make sure to start the Firebase emulators before running the frontend:

```bash
# From the project root
firebase emulators:start
```

This will start:
- **Firebase Emulator UI**: http://localhost:4000
- **Functions Emulator**: http://localhost:5001
- **Firestore Emulator**: http://localhost:8080
- **Auth Emulator**: http://localhost:9099

## Configuration

- Update `USE_BACKEND` in `src/App.jsx` to `true` when you deploy Cloud Functions
- Add your Gemini API key to `apiKey` in `src/App.jsx` for demo mode
- Update Firebase config in `src/firebaseConfig.js` with your project settings
