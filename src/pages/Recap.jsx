import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PostsFeed from "../components/PostsFeed";
import AddToDriveModal from "../components/AddToDriveModal";
import "./Recap.css";
import { useAuth } from "../context/AuthContext";
import { createPublicPost } from "../services/postService";

const LS_KEY = "studygram_uploads_posts_v1";

function loadLS() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function inferTitleFromPost(post) {
  if (!post) return "Recap";
  return (
    (post.caption && post.caption.trim()) ||
    (post.title && post.title.trim()) ||
    (post.fileName && post.fileName.trim()) ||
    (post.type === "text" && post.text
      ? post.text.trim().slice(0, 50) + (post.text.trim().length > 50 ? "..." : "")
      : "") ||
    (post.type === "photo" ? "Image" : "") ||
    (post.type === "pdf" ? "PDF" : "") ||
    "Recap"
  );
}

function toPayload(post) {
  // Normalize shape for Drive + Public Post
  const title = inferTitleFromPost(post);

  return {
    ...post,
    id: post.id || post._id || String(post.createdAt || post.timestamp || Date.now()),
    title,
    kind: post.type || "recap",
    type: post.type || "recap",
    // keep everything as payload too (useful in public feed)
    payload: {
      ...post,
      title,
    },
  };
}

export default function Recap() {
  const [posts, setPosts] = useState(() => loadLS());
  const nav = useNavigate();
  const { user, loading } = useAuth() || {};

  const [driveOpen, setDriveOpen] = useState(false);
  const [activeRecap, setActiveRecap] = useState(null);

  const [busy, setBusy] = useState(false);

  // ✅ persist local posts (like/save/comment etc)
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(posts || []));
    } catch {}
  }, [posts]);

  // ✅ Save -> open modal
  function openDriveForPost(post) {
    const recapPayload = toPayload(post);
    setActiveRecap(recapPayload);
    setDriveOpen(true);
  }

  // ✅ NEW: Share Public (Firestore /posts)
  async function sharePublic(post) {
    if (loading) return;
    if (!user) {
      alert("Login required to share publicly");
      nav("/login");
      return;
    }

    const p = toPayload(post);

    // Map local post shape -> public post service
    // If your local post has file object, pass as `file`.
    // Usually local saved post has:
    //  - photo: post.src
    //  - pdf: post.url
    //  - text: post.text
    // We'll pass it through `payload` so it still shows.
    try {
      setBusy(true);

      // If you have direct file (rare in LS), you can pass p.file
      const id = await createPublicPost({
        file: p.file || null, // optional
        title: p.title,
        folder: p.folder || "Root",
        payload: {
          type: p.type,
          caption: p.caption || "",
          text: p.text || "",
          src: p.src || "",
          url: p.url || p.payload?.url || "",
          fileName: p.fileName || "",
          // keep original for debugging
          original: p,
        },
      });

      alert("Public recap posted ✅ ID: " + id);
    } catch (e) {
      console.error("sharePublic error:", e);
      alert(e?.message || "Public share failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="recapWrap">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>Recap</h2>
          <div style={{ opacity: 0.7 }}>
            Save to Drive (private) or Share Public (everyone can view)
          </div>
        </div>

        <button className="btnSecondary" type="button" onClick={() => nav("/public-recap")} disabled={busy}>
          Public Feed →
        </button>
      </div>

      <PostsFeed
        posts={posts}
        setPosts={setPosts}
        showComposer={false}
        allowEditDelete={false}
        showActions={true}
        disabledActions={busy}
        navigateToProfile={(handle) =>
          nav(`/u/${encodeURIComponent((handle || "").replace("@", ""))}`)
        }
        onSaveToDrive={openDriveForPost}
        onSharePublic={sharePublic}   // ✅ NEW prop
      />

      <AddToDriveModal
        open={driveOpen}
        onClose={() => setDriveOpen(false)}
        recap={activeRecap}
      />
    </div>
  );
}