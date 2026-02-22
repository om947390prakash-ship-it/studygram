import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";
import { useAuth } from "../context/AuthContext";
import { getMyProfile } from "../services/userService";

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

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

export default function Profile() {
  const nav = useNavigate();
  const { user, loading } = useAuth() || {};
  const uid = user?.uid;

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState(() => loadLS(POSTS_KEY, []));
  const [saathi, setSaathi] = useState(() => loadLS(SAATHI_KEY, []));

  const [activePost, setActivePost] = useState(null);

  // Load profile from firestore
  useEffect(() => {
    if (loading) return;
    if (!uid) return;

    (async () => {
      const p = await getMyProfile(uid);
      if (p) setProfile(p);
      else {
        const fallbackHandle = user?.email ? user.email.split("@")[0] : "you";
        setProfile({
          name: "You",
          handle: fallbackHandle,
          bio: "",
          photoURL: user?.photoURL || "",
        });
      }
    })();
  }, [uid, loading, user?.email, user?.photoURL]);

  // keep posts live (in case uploads page updates localstorage)
  useEffect(() => {
    const onStorage = () => setPosts(loadLS(POSTS_KEY, []));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const myHandle = useMemo(() => {
    const h = profile?.handle || (user?.email ? user.email.split("@")[0] : "you");
    return String(h).replace("@", "");
  }, [profile?.handle, user?.email]);

  const myPosts = useMemo(() => {
    const h = myHandle.toLowerCase();
    return (posts || []).filter((p) => {
      const ph = (p.author?.handle || "@you").replace("@", "").toLowerCase();
      return ph === h;
    });
  }, [posts, myHandle]);

  const stats = useMemo(() => {
    const uploads = myPosts.length;
    const likes = myPosts.reduce((s, p) => s + (p.likes || 0), 0);
    const saathiCount = (saathi || []).length;
    return { uploads, likes, saathiCount };
  }, [myPosts, saathi]);

  const gridPosts = useMemo(() => {
    // newest first
    return [...myPosts].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [myPosts]);

  if (loading) return <div className="profileWrap">Loading...</div>;
  if (!uid) return <div className="profileWrap">Please login to view profile.</div>;

  const displayName = profile?.name || "You";
  const displayHandle = myHandle;
  const bio = profile?.bio || "";

  return (
    <div className="profileWrap">
      {/* Insta-style header card */}
      <div className="profileCard">
        <div className="profileTop">
          <div className="avatarBig">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="profile" />
            ) : (
              <span>{displayName.slice(0, 1).toUpperCase()}</span>
            )}
          </div>

          <div
  className="profileInfo clickable"
  role="button"
  tabIndex={0}
  onClick={() => nav("/edit-profile")}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") nav("/edit-profile");
  }}
  title="Edit profile"
>
            <div className="nameRow">
              <div>
                <div className="pName">{displayName}</div>
                <div className="pHandle">@{displayHandle}</div>
              </div>

              <button className="btnPrimary" type="button" onClick={() => nav("/edit-profile")}>
                Edit Profile
              </button>
            </div>

            {bio ? <div className="pBio">{bio}</div> : <div className="pBio dim">Add a bio to look pro ✨</div>}

            <div className="statsRow">
              <div className="stat">
                <div className="k">Uploads</div>
                <div className="v">{stats.uploads}</div>
              </div>
              <div className="stat">
                <div className="k">Likes</div>
                <div className="v">{stats.likes}</div>
              </div>
              <div className="stat">
                <div className="k">Saathi</div>
                <div className="v">{stats.saathiCount}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts grid */}
      <div className="gridHead">
        <div className="gridTitle">Your Uploads</div>
        <div className="gridSub">Tap to preview</div>
      </div>

      {gridPosts.length === 0 ? (
        <div className="emptyGrid">
          <div className="emptyTitle">No uploads yet</div>
          <div className="emptySub">Go to Uploads and share your first note 📌</div>
          <button className="btnGhost" onClick={() => nav("/uploads")} type="button">
            Open Uploads
          </button>
        </div>
      ) : (
        <div className="postGrid">
          {gridPosts.map((p) => (
            <button
              key={p.id || p.createdAt}
              className="gridItem"
              type="button"
              onClick={() => setActivePost(p)}
              title={p.caption || p.fileName || "Open"}
            >
              {/* thumbnail */}
              {p.type === "photo" && p.src ? (
                <img className="thumb" src={p.src} alt="thumb" />
              ) : p.type === "pdf" ? (
                <div className="thumbPdf">
                  <div className="pdfBadge">PDF</div>
                  <div className="pdfName">{p.fileName || "PDF File"}</div>
                </div>
              ) : (
                <div className="thumbText">
                  <div className="tBadge">TXT</div>
                  <div className="tPreview">{(p.text || "Text").slice(0, 90)}</div>
                </div>
              )}

              <div className="gridMeta">
                <span>♥ {p.likes || 0}</span>
                <span className="dot">•</span>
                <span>{formatTime(p.createdAt)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Preview modal */}
      {activePost ? (
        <div className="pModalOverlay" onClick={() => setActivePost(null)}>
          <div className="pModal" onClick={(e) => e.stopPropagation()}>
            <button className="pClose" type="button" onClick={() => setActivePost(null)}>
              ✕
            </button>

            <div className="pModalHead">
              <div className="pModalTitle">{activePost.caption || activePost.fileName || "Post"}</div>
              <div className="pModalSub">{formatTime(activePost.createdAt)}</div>
            </div>

            {activePost.type === "photo" && activePost.src ? (
              <div className="pMedia">
                <img src={activePost.src} alt="full" />
              </div>
            ) : null}

            {activePost.type === "pdf" ? (
              <div className="pPdf">
                <div className="pdfBadge big">PDF</div>
                <div style={{ fontWeight: 800 }}>{activePost.fileName || "PDF"}</div>
                {activePost.url ? (
                  <a className="pdfOpenLink" href={activePost.url} target="_blank" rel="noreferrer">
                    Open PDF
                  </a>
                ) : (
                  <div className="dim">PDF link not available (objectURL can break on refresh)</div>
                )}
              </div>
            ) : null}

            {activePost.type === "text" ? (
              <div className="pText">
                {activePost.text || ""}
              </div>
            ) : null}

            {activePost.caption ? <div className="pCaption">{activePost.caption}</div> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}