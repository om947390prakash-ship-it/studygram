import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import "./AddToDriveModal.css";

function cleanUndefined(val) {
  if (val === undefined) return undefined;
  if (val === null) return null;
  if (Array.isArray(val)) return val.map(cleanUndefined).filter((x) => x !== undefined);
  if (typeof val === "function") return undefined;
  if (typeof val === "object") {
    if (val instanceof Date) return val.toISOString();
    const out = {};
    for (const [k, v] of Object.entries(val)) {
      const c = cleanUndefined(v);
      if (c !== undefined) out[k] = c;
    }
    return out;
  }
  return val;
}

export default function AddToDriveModal({ open, onClose, recap }) {
  const auth = useAuth() || {};
  const user = auth.user;
  const uid = user?.uid;

  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState("root");
  const [newFolder, setNewFolder] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingFolders, setLoadingFolders] = useState(false);

  // reset on close/open
  useEffect(() => {
    if (!open) {
      setBusy(false);
      setNewFolder("");
      setSelectedFolder("root");
      setLoadingFolders(false);
      return;
    }
  }, [open]);

  // load folders when open + uid
  useEffect(() => {
    if (!open) return;

    // ✅ if uid missing, still show UI (root) but no folders
    if (!uid) {
      setFolders([]);
      return;
    }

    (async () => {
      setLoadingFolders(true);
      try {
        const qy = query(
          collection(db, "users", uid, "driveFolders"),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(qy);
        setFolders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("load folders error:", e);
        setFolders([]);
      } finally {
        setLoadingFolders(false);
      }
    })();
  }, [open, uid]);

  async function createFolder() {
    const name = newFolder.trim();
    if (!uid) return alert("Login required");
    if (!name) return alert("Folder name likho");
    if (busy) return;

    setBusy(true);
    try {
      const ref = await addDoc(collection(db, "users", uid, "driveFolders"), {
        name,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // instant UI update
      setFolders((prev) => [{ id: ref.id, name }, ...(prev || [])]);
      setSelectedFolder(ref.id);
      setNewFolder("");
    } catch (e) {
      console.error("createFolder error:", e);
      alert(e?.message || "Folder create failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveToDrive() {
    if (!uid) return alert("Login required");
    if (!recap) return alert("No recap selected");
    if (busy) return;

    setBusy(true);
    try {
      const folderId = selectedFolder || "root";

      const title =
        (recap.title && String(recap.title).trim()) ||
        (recap.caption && String(recap.caption).trim()) ||
        (recap.fileName && String(recap.fileName).trim()) ||
        (recap.type === "photo"
          ? "Image"
          : recap.type === "pdf"
          ? "PDF"
          : recap.type === "text"
          ? "Text Note"
          : "Recap");

      const kind = recap.kind || recap.type || "recap";
      const safePayload = cleanUndefined({ ...recap, title, kind });

      await addDoc(collection(db, "users", uid, "driveItems"), {
        type: "recap",
        title,
        kind,
        recapId: recap.id ? String(recap.id) : String(Date.now()),
        folderId,
        payload: safePayload,
        createdAt: serverTimestamp(),
      });

      setBusy(false);
      onClose?.();
    } catch (e) {
      console.error("saveToDrive error:", e);
      setBusy(false);
      alert(e?.message || "Save failed");
    }
  }

  if (!open) return null;

  return (
    <div className="driveOverlay" onClick={() => !busy && onClose?.()}>
      <div className="driveSheet" onClick={(e) => e.stopPropagation()}>
        <div className="driveHead">
          <div>
            <div className="driveTitle">Save to Recap Drive</div>
            <div className="driveSub">Choose folder or create new</div>
          </div>
          <button className="xBtn" type="button" onClick={() => !busy && onClose?.()}>
            ✕
          </button>
        </div>

        {/* ✅ FOLDERS SECTION (always visible) */}
        <div className="driveSection">
          <div className="label">Folders</div>

          <div className="folderRow">
            <button
              type="button"
              className={`folderPill ${selectedFolder === "root" ? "active" : ""}`}
              onClick={() => setSelectedFolder("root")}
              disabled={busy}
            >
              Root
            </button>

            {loadingFolders ? (
              <span style={{ opacity: 0.7, padding: "8px 4px", color: "#fff" }}>
                Loading...
              </span>
            ) : (
              folders.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`folderPill ${selectedFolder === f.id ? "active" : ""}`}
                  onClick={() => setSelectedFolder(f.id)}
                  disabled={busy}
                >
                  📁 {f.name}
                </button>
              ))
            )}
          </div>

          {!uid ? (
            <div style={{ marginTop: 8, opacity: 0.75, fontSize: 12, color: "#fff" }}>
              (Login required to see your folders)
            </div>
          ) : null}
        </div>

        {/* ✅ NEW FOLDER SECTION (always visible) */}
        <div className="driveSection">
          <div className="label">New folder</div>
          <div className="row">
            <input
              className="input"
              value={newFolder}
              onChange={(e) => setNewFolder(e.target.value)}
              placeholder="e.g., Chemistry"
              disabled={busy || !uid}
            />
            <button
              className="btnSecondary"
              type="button"
              onClick={createFolder}
              disabled={busy || !uid}
            >
              Create
            </button>
          </div>
        </div>

        <button className="btnPrimary full" type="button" onClick={saveToDrive} disabled={busy || !uid}>
          {busy ? "Saving..." : "Save to Drive"}
        </button>
      </div>
    </div>
  );
}