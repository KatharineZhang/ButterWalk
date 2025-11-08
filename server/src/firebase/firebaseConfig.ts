import admin from "firebase-admin";
import * as dotenv from "dotenv";
dotenv.config()

if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  throw new Error(
    "FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set."
  );
}

let serviceAccount: admin.ServiceAccount;

try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
} catch (e) {
  console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_JSON:", e);
  throw new Error("Failed to parse service account JSON from env var.");
}

const adminApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const firestore = adminApp.firestore();
const auth = adminApp.auth();

export { admin, firestore, auth };