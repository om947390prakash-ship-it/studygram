import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PostsFeed from "../components/PostsFeed";
import AddToDriveModal from "../components/AddToDriveModal";
import "./Recap.css";

const LS_KEY = "studygram_uploads_posts_v1";

function loadLS() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function Recap() {
  const [posts, setPosts] = useState(() => loadLS());
  const nav = useNavigate();

  const [driveOpen, setDriveOpen] = useState(false);
  const [activeRecap, setActiveRecap] = useState(null);

  // ✅ persist (like/save/comment etc)
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(posts || []));
    } catch {}
  }, [posts]);

  // ✅ Save -> open modal (with strong title)
  function openDriveForPost(post) {
    if (!post) return;

    const title =
      (post.caption && post.caption.trim()) ||
      (post.title && post.title.trim()) ||
      (post.fileName && post.fileName.trim()) ||
      (post.type === "text" && post.text
        ? (post.text.trim().slice(0, 50) + (post.text.trim().length > 50 ? "..." : ""))
        : "") ||
      (post.type === "photo" ? "Image" : "") ||
      (post.type === "pdf" ? "PDF" : "") ||
      "Recap";

    const recapPayload = {
      ...post,
      id: post.id || post._id || String(post.createdAt || post.timestamp || Date.now()),
      title,
      kind: post.type || "recap",
      type: post.type || "recap",
    };

    setActiveRecap(recapPayload);
    setDriveOpen(true);
  }

  return (
    <div className="recapWrap">
      <h2 style={{ marginBottom: 12 }}>Recap</h2>

      <PostsFeed
        posts={posts}
        setPosts={setPosts}
        showComposer={false}
        allowEditDelete={false}
        showActions={true}
        navigateToProfile={(handle) =>
          nav(`/u/${encodeURIComponent((handle || "").replace("@", ""))}`)
        }
        onSaveToDrive={openDriveForPost}
      />

      <AddToDriveModal
        open={driveOpen}
        onClose={() => setDriveOpen(false)}
        recap={activeRecap}
      />
    </div>
  );
}