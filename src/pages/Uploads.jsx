import { useEffect, useState } from "react";
import PostsFeed from "../components/PostsFeed";
import "./Uploads.css";

const LS_KEY = "studygram_uploads_posts_v1";

function loadLS() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function Uploads() {
  // ✅ Lazy init: first render pe hi LS se load (no wipe)
  const [posts, setPosts] = useState(() => loadLS());

  // ✅ Persist whenever posts change
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(posts || []));
    } catch {}
  }, [posts]);

  return (
    <div className="uploadsWrap">
      <PostsFeed
        posts={posts}
        setPosts={setPosts}
        showComposer={true}
        showActions={true}
        allowEditDelete={true}
      />
    </div>
  );
}