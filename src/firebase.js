import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const envConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const firebaseConfig = {
  apiKey: envConfig.apiKey || "AIzaSyCgWu2_s-3tkPCBBbtEb-IvVjc2ECZZrzo",
  authDomain: envConfig.authDomain || "cashflow-bb84f.firebaseapp.com",
  projectId: envConfig.projectId || "cashflow-bb84f",
  storageBucket: envConfig.storageBucket || "cashflow-bb84f.appspot.com",
  messagingSenderId: envConfig.messagingSenderId || "721197561737",
  appId: envConfig.appId || "1:721197561737:web:353a5ca968f085b3e95358",
  measurementId: envConfig.measurementId || "G-GJPCJ6XW4G"
};

const missingFirebaseConfig = ["apiKey", "authDomain", "projectId", "appId"].filter(
  (key) => !firebaseConfig[key]
);
if (missingFirebaseConfig.length > 0) {
  throw new Error(
    `Faltan variables de configuración de Firebase: ${missingFirebaseConfig.join(", ")}`
  );
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    throw new Error(error?.message || "No se pudo iniciar sesión con Google.");
  }
};

const logout = () => signOut(auth);

export { db, auth, loginWithGoogle, logout };
