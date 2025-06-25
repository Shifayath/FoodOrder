// firebaseAdmin.js
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(), // uses environment vars on Vercel
  });
}

export const db = admin.firestore();
