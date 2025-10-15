import admin from 'firebase-admin';

// Check if the service account key is available in environment variables
if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set. Please add it to your environment variables.');
}

// Check if the app is already initialized to prevent errors
if (!admin.apps.length) {
  try {
    // Parse the service account key from the environment variable
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // Add your Firebase project's storage bucket URL here
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    });
  } catch (error) {
    console.error('Firebase Admin Initialization Error:', error);
    throw new Error('Could not initialize Firebase Admin SDK. Verify your FIREBASE_SERVICE_ACCOUNT_KEY.');
  }
}

const adminDb = admin.firestore();
const adminStorage = admin.storage();

export { adminDb, adminStorage };
