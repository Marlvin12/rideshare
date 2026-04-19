import admin from 'firebase-admin';
import logger from './logger.js';

const initializeFirebase = () => {
  try {
    if (!admin.apps.length && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
      logger.info('Firebase Admin initialized');
    } else {
      logger.warn('Firebase credentials not found, Firebase auth disabled');
    }
  } catch (error) {
    if (process.env.FIREBASE_CLIENT_EMAIL) {
      throw new Error(`Firebase init failed: ${error.message}`);
    }
  }
};

export default initializeFirebase;
export { admin };
