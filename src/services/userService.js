import { db, storage } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * ✅ Ensure user document exists.
 * Supports BOTH calling styles:
 *  1) ensureUserDoc(userObject)
 *  2) ensureUserDoc(uid, defaults)
 */
export async function ensureUserDoc(arg1, defaults = {}) {
  // Determine input type
  const user =
    typeof arg1 === "string"
      ? { uid: arg1, ...defaults }
      : arg1;

  if (!user?.uid) return;

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  const fallbackHandle = user?.email
    ? user.email.split("@")[0].toLowerCase()
    : "user";

  if (!snap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      name: user.displayName || user.name || "User",
      handle: user.handle || `@${fallbackHandle}`,
      bio: "",
      photoURL: user.photoURL || "",
      score: 0,
      focusMinutes: 0,
      completionPct: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    // Only touch updatedAt (do not overwrite profile fields)
    await updateDoc(userRef, { updatedAt: serverTimestamp() });
  }
}

/**
 * ✅ Get user profile by uid
 */
export async function getMyProfile(uid) {
  if (!uid) return null;
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * ✅ Update profile (safe merge)
 * - preserves createdAt automatically
 * - updates updatedAt always
 */
export async function upsertMyProfile(uid, data) {
  if (!uid) throw new Error("Missing uid");
  const userRef = doc(db, "users", uid);

  // Ensure exists first so createdAt is set once
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...data,
    });
    return;
  }

  // Update existing (do not touch createdAt)
  await updateDoc(userRef, {
    ...data,
    uid,
    updatedAt: serverTimestamp(),
  });
}

/**
 * ✅ Upload profile photo to Storage, return downloadURL
 */
export async function uploadProfilePhoto(uid, file) {
  if (!uid) throw new Error("Missing uid");
  if (!file) throw new Error("No file selected");

  const safeName = String(file.name || "photo").replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileRef = ref(
    storage,
    `profilePhotos/${uid}/${Date.now()}-${safeName}`
  );

  const snap = await uploadBytes(fileRef, file, {
    contentType: file.type || "image/jpeg",
  });

  const url = await getDownloadURL(snap.ref);

  // Optional: save photoURL in user doc automatically
  // await updateDoc(doc(db, "users", uid), { photoURL: url, updatedAt: serverTimestamp() });

  return url;
}