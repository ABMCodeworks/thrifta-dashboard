/**
 * App-managed storage for each admin's TOTP secret. This is a plain Firestore
 * document (`admin_mfa/{uid}`) — it is NOT Firebase's native MFA and adds no
 * security-rule enforcement on its own. Lock it down later with a rule like:
 *
 *   match /admin_mfa/{uid} {
 *     allow read, write: if request.auth != null && request.auth.uid == uid;
 *   }
 */
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION = "admin_mfa";

/** Returns { enabled, secret, createdAt } — enabled is false when not set up. */
export async function getMfaConfig(uid) {
  if (!uid) return { enabled: false, secret: null };
  const snap = await getDoc(doc(db, COLLECTION, uid));
  if (!snap.exists()) return { enabled: false, secret: null };
  const data = snap.data();
  return {
    enabled: Boolean(data.enabled && data.secret),
    secret: data.secret || null,
    createdAt: data.createdAt?.toDate?.() || null,
  };
}

export async function saveMfaSecret(uid, secret) {
  await setDoc(doc(db, COLLECTION, uid), {
    secret,
    enabled: true,
    createdAt: serverTimestamp(),
  });
}

export async function disableMfa(uid) {
  await deleteDoc(doc(db, COLLECTION, uid));
}
