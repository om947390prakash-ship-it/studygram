import { db, storage, auth } from "../firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

function isBlobUrl(u) {
  return typeof u === "string" && u.startsWith("blob:");
}

function safeName(name) {
  return String(name || "file").replace(/[^a-zA-Z0-9._-]/g, "_");
}

/**
 * ✅ Public post create (login required)
 * Supports:
 * - TEXT posts (no file/url needed)
 * - PHOTO/PDF posts (file upload recommended)
 * - Fallback url/src allowed (but blocks blob:)
 */
export async function createPublicPost({ file = null, title, folder = "Root", payload = {} }) {
  const user = auth.currentUser;
  if (!user) throw new Error("Login required");
  if (!title?.trim()) throw new Error("Title required");

  const type = payload?.type || (file?.type?.startsWith("image/") ? "photo" : file?.type === "application/pdf" ? "pdf" : "");
  const isText = type === "text";

  let fileUrl = "";
  let filePath = "";
  let fileType = file?.type || payload?.fileType || type || "";

  // ✅ TEXT post: allowed without any file/url
  if (isText) {
    const txt = String(payload?.text || "").trim();
    if (!txt) throw new Error("Text is empty");
  } else if (file) {
    // ✅ Upload file to Storage
    filePath = `publicRecaps/${user.uid}/${Date.now()}-${safeName(file.name)}`;
    const fileRef = ref(storage, filePath);

    const snap = await uploadBytes(fileRef, file, { contentType: file.type || "" });
    fileUrl = await getDownloadURL(snap.ref);
  } else {
    // ✅ Fallback: if you already have a non-blob url/src (photo dataURL ok)
    const candidate = payload?.fileUrl || payload?.url || payload?.src || "";
    if (!candidate) throw new Error("No file/url to post");

    if (isBlobUrl(candidate)) {
      // blob: URLs work only on same device session; not public
      throw new Error("PDF blob link public nahi hota. Actual PDF file upload karo.");
    }

    fileUrl = candidate;
    filePath = payload?.filePath || "";
  }

  const docRef = await addDoc(collection(db, "posts"), {
    title: title.trim(),
    folder: folder || "Root",
    fileUrl,     // empty for text posts (OK)
    filePath,    // empty for text posts (OK)
    fileType,
    payload: {
      ...payload,
      type: type || payload?.type || "",
      title: title.trim(),
    },
    author: {
      uid: user.uid,
      email: user.email || "",
      name: user.displayName || "User",
      photoURL: user.photoURL || "",
    },
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

/**
 * ✅ Real-time public posts listener
 */
export function listenPublicPosts(setter) {
  const qy = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  return onSnapshot(qy, (snap) => {
    setter(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}