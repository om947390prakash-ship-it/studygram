import { useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import PostsFeed from "../components/PostsFeed";
import "./Uploads.css";

const POSTS_KEY = "studygram_uploads_posts_v1";
const SAATHI_KEY = "studygram_saathi_v1";

function loadLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function saveLS(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

export default function PublicProfile() {
  const { handle } = useParams();
  const [posts, setPosts] = useState([]);
  const [saathi, setSaathi] = useState(() => loadLS(SAATHI_KEY, []));

  useEffect(() => {
    setPosts(loadLS(POSTS_KEY, []));
  }, []);

  useEffect(() => {
    saveLS(SAATHI_KEY, saathi);
  }, [saathi]);

  const normalizedHandle = useMemo(
    () => (handle || "").replace("@", "").toLowerCase(),
    [handle]
  );

  const userPosts = useMemo(() => {
    return posts.filter((p) => {
      const ph = (p.author?.handle || "@you").replace("@", "").toLowerCase();
      return ph === normalizedHandle;
    });
  }, [posts, normalizedHandle]);

  const profile = useMemo(() => {
    const first = userPosts[0]?.author;
    const name = first?.name || normalizedHandle || "User";
    const h = first?.handle?.replace("@", "") || normalizedHandle;
    const avatarInitial = (name || h || "U").slice(0, 1).toUpperCase();
    return { name, handle: h, avatarInitial };
  }, [userPosts, normalizedHandle]);

  const stats = useMemo(() => {
    const total = userPosts.length;
    const likes = userPosts.reduce((s, p) => s + (p.likes || 0), 0);
    return { total, likes };
  }, [userPosts]);

  const already = useMemo(() => {
    return saathi.some((x) => (x.handle || "").toLowerCase() === normalizedHandle);
  }, [saathi, normalizedHandle]);

  function toggleSaathi() {
    if (!normalizedHandle) return;

    if (already) {
      // remove
      setSaathi((prev) =>
        prev.filter((x) => (x.handle || "").toLowerCase() !== normalizedHandle)
      );
      alert("Saathi removed ❌");
      return;
    }

    setSaathi((prev) => [
      {
        handle: normalizedHandle,
        name: profile.name,
        avatarInitial: profile.avatarInitial,
        addedAt: Date.now(),
      },
      ...prev,
    ]);

    alert("Saathi added 🤝");
  }

  return (
    <div className="publicProfileWrap">
      <div className="uploadHero">
        <div className="heroLeft">
          <div className="heroAvatar">{profile.avatarInitial}</div>
          <div>
            <div className="heroName">{profile.name}</div>
            <div className="heroHandle">@{profile.handle}</div>
            <div className="heroLine">Public Study Profile</div>
          </div>
        </div>

        <div className="heroBadges">
          <div className="badge">
            <div className="k">Uploads</div>
            <div className="v">{stats.total}</div>
          </div>
          <div className="badge">
            <div className="k">Likes</div>
            <div className="v">{stats.likes}</div>
          </div>

          <div className="badge" style={{ display: "grid", placeItems: "center" }}>
            <button className="btnPrimary" onClick={toggleSaathi}>
              {already ? "Remove Saathi" : "Add Saathi"}
            </button>
            {already && (
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                Saathi✅
              </div>
            )}
          </div>
        </div>
      </div>

      <PostsFeed
        posts={userPosts}
        setPosts={() => {}}
        showComposer={false}
        allowEditDelete={false}
        showActions={true}
      />
    </div>
  );
}