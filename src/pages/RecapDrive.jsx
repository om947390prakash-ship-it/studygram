import { useEffect, useMemo, useState } from "react";
import "./Recap.css";
import { db } from "../firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

export default function RecapDrive() {
  const { user, loading } = useAuth() || {};
  const uid = user?.uid;

  const [folders, setFolders] = useState([]);
  const [items, setItems] = useState([]);
  const [activeFolderId, setActiveFolderId] = useState("root"); // ✅ root

  const [search, setSearch] = useState("");
  const [newFolder, setNewFolder] = useState("");
  const [busy, setBusy] = useState(false);

  async function fetchFolders() {
    if (!uid) return;
    const snap = await getDocs(collection(db, "users", uid, "driveFolders"));
    const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    arr.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    setFolders(arr);
  }

  async function fetchItems(folderId) {
    if (!uid) return;
    const col = collection(db, "users", uid, "driveItems");
    const qy = query(col, where("folderId", "==", folderId || "root"));
    const snap = await getDocs(qy);

    const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    arr.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    setItems(arr);
  }

  useEffect(() => {
    if (loading) return;
    if (!uid) return;
    fetchFolders();
    fetchItems("root");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, loading]);

  async function createFolder() {
    const name = newFolder.trim();
    if (!uid) return alert("Login required");
    if (!name) return alert("Folder name likho");

    setBusy(true);
    try {
      await addDoc(collection(db, "users", uid, "driveFolders"), {
        name,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setNewFolder("");
      await fetchFolders();
      alert("Folder created ✅");
    } catch (e) {
      console.error("createFolder error:", e);
      alert(e?.message || "Folder create failed");
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(itemId) {
    if (!uid) return;
    setBusy(true);
    try {
      await deleteDoc(doc(db, "users", uid, "driveItems", itemId));
      await fetchItems(activeFolderId);
    } catch (e) {
      console.error("removeItem error:", e);
      alert(e?.message || "Remove failed");
    } finally {
      setBusy(false);
    }
  }

  async function deleteFolderCascade(folderId) {
    if (!uid) return;
    if (!folderId || folderId === "root") return;

    const folderName = folders.find((f) => f.id === folderId)?.name || "this folder";
    const ok = window.confirm(
      `Delete "${folderName}" folder?\n\nAll materials inside will also be deleted.`
    );
    if (!ok) return;

    setBusy(true);
    try {
      const itemsCol = collection(db, "users", uid, "driveItems");
      const qy = query(itemsCol, where("folderId", "==", folderId));
      const snap = await getDocs(qy);

      let docs = snap.docs;
      while (docs.length) {
        const batch = writeBatch(db);
        const chunk = docs.slice(0, 450);
        chunk.forEach((d) => batch.delete(d.ref));
        await batch.commit();
        docs = docs.slice(450);
      }

      await deleteDoc(doc(db, "users", uid, "driveFolders", folderId));

      setActiveFolderId("root");
      await fetchItems("root");
      await fetchFolders();
      alert("Folder + materials deleted ✅");
    } catch (e) {
      console.error("deleteFolderCascade error:", e);
      alert(e?.message || "Folder delete failed");
    } finally {
      setBusy(false);
    }
  }

  function openFolder(folderId) {
    const fid = folderId || "root";
    setActiveFolderId(fid);
    fetchItems(fid);
  }

  function openRoot() {
    setActiveFolderId("root");
    fetchItems("root");
  }

  const activeFolderName = useMemo(() => {
    if (!activeFolderId || activeFolderId === "root") return "Root";
    return folders.find((f) => f.id === activeFolderId)?.name || "Folder";
  }, [activeFolderId, folders]);

  const filteredItems = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return items;
    return items.filter((x) => {
      const payload = x.payload || {};
      const title = String(x.title || "").toLowerCase();
      const cap = String(payload.caption || "").toLowerCase();
      const fn = String(payload.fileName || "").toLowerCase();
      return title.includes(s) || cap.includes(s) || fn.includes(s);
    });
  }, [items, search]);

  if (loading) return <div className="recapWrap">Loading...</div>;
  if (!uid) return <div className="recapWrap">Please login to use Recap Drive.</div>;

  return (
    <div className="recapWrap">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>Recap Drive</h2>
          <div style={{ opacity: 0.7 }}>Folders + saved materials 📁</div>
        </div>

        <button className="btnSecondary" type="button" onClick={openRoot} disabled={busy}>
          {activeFolderId !== "root" ? "← Back to Root" : "Root"}
        </button>
      </div>

      <div style={{ marginTop: 14 }}>
        <input
          className="captionInput"
          placeholder={`Search in ${activeFolderName}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <input
          className="captionInput"
          placeholder="New folder name (e.g., Physics)"
          value={newFolder}
          onChange={(e) => setNewFolder(e.target.value)}
        />
        <button className="btnPrimary" type="button" onClick={createFolder} disabled={busy}>
          + Folder
        </button>
      </div>

      <div style={{ marginTop: 18 }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>Folders</div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button
            className={activeFolderId === "root" ? "actBtn saved" : "actBtn"}
            type="button"
            onClick={openRoot}
            disabled={busy}
          >
            📁 Root
          </button>

          {folders.map((f) => (
            <button
              key={f.id}
              className={activeFolderId === f.id ? "actBtn saved" : "actBtn"}
              type="button"
              onClick={() => openFolder(f.id)}
              disabled={busy}
            >
              📁 {f.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontWeight: 900 }}>
            Materials • <span style={{ opacity: 0.7 }}>{activeFolderName}</span>
          </div>

          {activeFolderId !== "root" && (
            <button
              className="btnSecondary"
              type="button"
              disabled={busy}
              onClick={() => deleteFolderCascade(activeFolderId)}
            >
              Delete Folder
            </button>
          )}
        </div>

        {filteredItems.length === 0 ? (
          <div className="emptyFeed">
            <div className="emptyTitle">No materials here</div>
            <div className="emptySub">Recap page pe Save dabao → folder choose/create → yaha aa jayega ✅</div>
          </div>
        ) : (
          <div className="feed">
            {filteredItems.map((it) => (
              <DriveItemCard key={it.id} item={it} onRemove={() => removeItem(it.id)} busy={busy} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DriveItemCard({ item, onRemove, busy }) {
  const payload = item?.payload || {};
  const title = item?.title || payload?.title || payload?.caption || payload?.fileName || "Untitled";
  const kind = item?.kind || payload?.kind || payload?.type || item?.type || "recap";

  return (
    <div className="postCard">
      <div className="postTop" style={{ justifyContent: "space-between" }}>
        <div>
          <div style={{ fontWeight: 900 }}>{title}</div>
          <div style={{ opacity: 0.7, fontSize: 12 }}>{kind}</div>
        </div>

        <button className="menuBtn danger" type="button" onClick={onRemove} disabled={busy}>
          Remove
        </button>
      </div>

      {payload.type === "photo" && payload.src ? (
        <div className="mediaBox">
          <img className="photo" src={payload.src} alt="saved" />
        </div>
      ) : null}

      {payload.type === "pdf" && payload.url ? (
        <div className="pdfBox">
          <div className="pdfIcon">PDF</div>
          <div className="pdfInfo">
            <div className="pdfName">{payload.fileName || "PDF"}</div>
            <a className="pdfOpen" href={payload.url} target="_blank" rel="noreferrer">
              Open
            </a>
          </div>
        </div>
      ) : null}

      {payload.type === "text" && payload.text ? (
        <div className="textBox">
          <div className="textContent">{payload.text}</div>
        </div>
      ) : null}

      {payload.caption ? <div className="caption">{payload.caption}</div> : null}
    </div>
  );
}