import { db, storage } from "../firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * ✅ Create user doc if not exists (Login.jsx is using this)
 */
export async function ensureUserDoc(user) {
  if (!user?.uid) return;

  const refDoc = doc(db, "users", user.uid);
  const snap = await getDoc(refDoc);

  if (!snap.exists()) {
    const fallbackHandle = user?.email ? user.email.split("@")[0] : "you";
    await setDoc(refDoc, {
      uid: user.uid,
      name: user.displayName || "You",
      handle: fallbackHandle,
      bio: "",
      photoURL: user.photoURL || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    // keep updatedAt fresh (optional)
    await setDoc(
      refDoc,
      { updatedAt: serverTimestamp() },
      { merge: true }
    );
  }
}

/**
 * ✅ Get profile
 */
export async function getMyProfile(uid) {
  const refDoc = doc(db, "users", uid);
  const snap = await getDoc(refDoc);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * ✅ Update/insert profile
 */
export async function upsertMyProfile(uid, data) {
  const refDoc = doc(db, "users", uid);

  await setDoc(
    refDoc,
    {
      ...data,
      uid,
      updatedAt: serverTimestamp(),
      // createdAt keep if already exists
      createdAt: data?.createdAt || serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * ✅ Upload profile photo to Storage, return downloadURL
 */
export async function uploadProfilePhoto(uid, file) {
  const fileRef = ref(storage, `profilePhotos/${uid}-${Date.now()}-${file.name}`);
  const snap = await uploadBytes(fileRef, file);
  const url = await getDownloadURL(snap.ref);
  return url;
}