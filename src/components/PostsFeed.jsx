import { useMemo, useRef, useState } from "react";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function formatTime(ts) {
  return new Date(ts).toLocaleString();
}

function fileToDataUrl(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

async function sharePost(post) {
  const text = `Check this StudyGram post 🚀`;
  const url = window.location.href;
  try {
    if (navigator.share) await navigator.share({ title: "StudyGram Post", text, url });
    else {
      await navigator.clipboard.writeText(url);
      alert("Link copied 🔗");
    }
  } catch (e) {
    console.log("Share cancelled/error:", e);
  }
}

function normId(x) {
  return String(x ?? "");
}

export default function PostsFeed({
  posts,
  setPosts,
  navigateToProfile,
  showComposer = false,
  showActions = true,
  allowEditDelete = false,

  // ✅ persistence support
  persistKey,

  // ✅ when user clicks Save button for Drive (opens modal)
  onSaveToDrive,

  // ✅ NEW: share publicly to Firestore /posts
  onSharePublic,

  // ✅ NEW: disable action buttons while busy
  disabledActions = false,
}) {
  const sortedPosts = useMemo(
    () => [...(posts || [])].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    [posts]
  );

  function persist(next) {
    if (!persistKey) return;
    try {
      localStorage.setItem(persistKey, JSON.stringify(next || []));
    } catch {}
  }

  function addPost(p) {
    setPosts((prev) => {
      const next = [p, ...(prev || [])];
      persist(next);
      return next;
    });
  }

  function updatePost(id, patch) {
    const target = normId(id);
    setPosts((prev) => {
      const next = (prev || []).map((p) =>
        normId(p.id) === target ? { ...p, ...patch, editedAt: Date.now() } : p
      );
      persist(next);
      return next;
    });
  }

  function removePost(id) {
    const target = normId(id);
    setPosts((prev) => {
      const next = (prev || []).filter((p) => normId(p.id) !== target);
      persist(next);
      return next;
    });
  }

  function toggleLike(id) {
    const target = normId(id);
    setPosts((prev) => {
      const next = (prev || []).map((p) => {
        if (normId(p.id) !== target) return p;
        const liked = !p.liked;
        return {
          ...p,
          liked,
          likes: liked ? (p.likes || 0) + 1 : Math.max(0, (p.likes || 0) - 1),
        };
      });
      persist(next);
      return next;
    });
  }

  function toggleSave(id) {
    const target = normId(id);
    setPosts((prev) => {
      const next = (prev || []).map((p) =>
        normId(p.id) === target ? { ...p, saved: !p.saved } : p
      );
      persist(next);
      return next;
    });
  }

  function addComment(postId, commentText) {
    const txt = (commentText || "").trim();
    if (!txt) return;
    const target = normId(postId);

    setPosts((prev) => {
      const next = (prev || []).map((p) =>
        normId(p.id) === target
          ? {
              ...p,
              comments: [
                ...(p.comments || []),
                { id: uid(), text: txt, createdAt: Date.now(), editedAt: null },
              ],
            }
          : p
      );
      persist(next);
      return next;
    });
  }

  function editComment(postId, commentId, newText) {
    const txt = (newText || "").trim();
    if (!txt) return;
    const pid = normId(postId);
    const cid = normId(commentId);

    setPosts((prev) => {
      const next = (prev || []).map((p) =>
        normId(p.id) !== pid
          ? p
          : {
              ...p,
              comments: (p.comments || []).map((c) =>
                normId(c.id) === cid ? { ...c, text: txt, editedAt: Date.now() } : c
              ),
            }
      );
      persist(next);
      return next;
    });
  }

  function deleteComment(postId, commentId) {
    const pid = normId(postId);
    const cid = normId(commentId);

    setPosts((prev) => {
      const next = (prev || []).map((p) =>
        normId(p.id) !== pid
          ? p
          : { ...p, comments: (p.comments || []).filter((c) => normId(c.id) !== cid) }
      );
      persist(next);
      return next;
    });
  }

  return (
    <div>
      {showComposer && <Composer onAdd={addPost} />}

      <div className="feed">
        {sortedPosts.length === 0 ? (
          <div className="emptyFeed">
            <div className="emptyTitle">No posts yet</div>
            <div className="emptySub">Uploads will show here.</div>
          </div>
        ) : (
          sortedPosts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              onOpenProfile={() => navigateToProfile?.(p.author?.handle || "@user")}
              onLike={() => toggleLike(p.id)}
              onSave={() => toggleSave(p.id)}
              onSaveToDrive={() => onSaveToDrive?.(p)}
              onSharePublic={() => onSharePublic?.(p)}   // ✅ NEW
              onComment={(txt) => addComment(p.id, txt)}
              onDelete={() => removePost(p.id)}
              onEditPost={(patch) => updatePost(p.id, patch)}
              onEditComment={(commentId, newText) => editComment(p.id, commentId, newText)}
              onDeleteComment={(commentId) => deleteComment(p.id, commentId)}
              showActions={showActions}
              allowEditDelete={allowEditDelete}
              disabledActions={disabledActions}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ------------ Composer ------------- */
function Composer({ onAdd }) {
  const [activeTab, setActiveTab] = useState("photo"); // photo | pdf | text
  const [caption, setCaption] = useState("");
  const [textPost, setTextPost] = useState("");
  const fileRef = useRef(null);

  async function handleShare() {
    if (activeTab === "text") {
      const body = textPost.trim();
      if (!body) return;

      onAdd({
        id: uid(),
        type: "text",
        caption: caption.trim(),
        text: body,
        createdAt: Date.now(),
        editedAt: null,
        likes: 0,
        liked: false,
        saved: false,
        comments: [],
        author: { name: "You", handle: "@you" },
      });

      setTextPost("");
      setCaption("");
      return;
    }

    const f = fileRef.current?.files?.[0];
    if (!f) return;

    if (activeTab === "photo") {
      if (!f.type.startsWith("image/")) return;
      const dataUrl = await fileToDataUrl(f);

      onAdd({
        id: uid(),
        type: "photo",
        caption: caption.trim(),
        src: dataUrl,
        fileName: f.name,
        createdAt: Date.now(),
        editedAt: null,
        likes: 0,
        liked: false,
        saved: false,
        comments: [],
        author: { name: "You", handle: "@you" },
      });
    }

    if (activeTab === "pdf") {
      if (f.type !== "application/pdf") return;
      const objectUrl = URL.createObjectURL(f);

      onAdd({
        id: uid(),
        type: "pdf",
        caption: caption.trim(),
        fileName: f.name,
        url: objectUrl,
        createdAt: Date.now(),
        editedAt: null,
        likes: 0,
        liked: false,
        saved: false,
        comments: [],
        author: { name: "You", handle: "@you" },
      });
    }

    if (fileRef.current) fileRef.current.value = "";
    setCaption("");
  }

  return (
    <div className="uploadCard">
      <div className="uploadHeader">
        <div>
          <h2>Upload</h2>
          <p>Share Doubts, PDFs & Study notes</p>
        </div>
      </div>

      <div className="tabsRow">
        <button className={activeTab === "photo" ? "tab active" : "tab"} onClick={() => setActiveTab("photo")} type="button">
          Photo
        </button>
        <button className={activeTab === "pdf" ? "tab active" : "tab"} onClick={() => setActiveTab("pdf")} type="button">
          PDF
        </button>
        <button className={activeTab === "text" ? "tab active" : "tab"} onClick={() => setActiveTab("text")} type="button">
          Text
        </button>
      </div>

      <div className="composer">
        {(activeTab === "photo" || activeTab === "pdf") && (
          <div className="fileRow">
            <input
              ref={fileRef}
              className="fileInput"
              type="file"
              accept={activeTab === "photo" ? "image/*" : "application/pdf"}
            />
            <div className="hint">
              {activeTab === "photo" ? "Select an image (jpg/png/webp)" : "Select a PDF file"}
            </div>
          </div>
        )}

        {activeTab === "text" && (
          <textarea
            className="textArea"
            value={textPost}
            onChange={(e) => setTextPost(e.target.value)}
            placeholder="Write your study note / tip / question..."
            rows={4}
          />
        )}

        <input
          className="captionInput"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Caption (optional)..."
        />

        <div className="composerActions">
          <button className="primaryBtn" type="button" onClick={handleShare}>
            Share
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------ PostCard ------------- */
function PostCard({
  post,
  onOpenProfile,
  onLike,
  onSave,
  onSaveToDrive,
  onSharePublic,        // ✅ NEW
  onComment,
  onDelete,
  onEditPost,
  onEditComment,
  onDeleteComment,
  showActions,
  allowEditDelete,
  disabledActions = false,
}) {
  const [cmt, setCmt] = useState("");
  const [editingPost, setEditingPost] = useState(false);
  const [editCaption, setEditCaption] = useState(post.caption || "");
  const [editText, setEditText] = useState(post.text || "");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");

  function savePostEdit() {
    const patch = { caption: editCaption.trim() };
    if (post.type === "text") patch.text = editText.trim();
    onEditPost(patch);
    setEditingPost(false);
  }

  return (
    <div className="postCard">
      <div className="postTop">
        <div className="author" style={{ cursor: "pointer" }} onClick={onOpenProfile}>
          <div className="avatar">{(post.author?.name || "U").slice(0, 1).toUpperCase()}</div>
          <div>
            <div className="authorName">{post.author?.name || "User"}</div>
            <div className="authorMeta">
              <span>{post.author?.handle || "@user"}</span>
              <span className="dot">•</span>
              <span>{formatTime(post.createdAt)}</span>
              {post.editedAt ? <span className="editedTag">(edited)</span> : null}
            </div>
          </div>
        </div>

        {allowEditDelete && (
          <div className="postMenu">
            {!editingPost ? (
              <>
                <button className="menuBtn" type="button" onClick={() => setEditingPost(true)} disabled={disabledActions}>
                  Edit
                </button>
                <button className="menuBtn danger" type="button" onClick={onDelete} disabled={disabledActions}>
                  Delete
                </button>
              </>
            ) : (
              <>
                <button className="menuBtn" type="button" onClick={savePostEdit} disabled={disabledActions}>
                  Save
                </button>
                <button
                  className="menuBtn"
                  type="button"
                  disabled={disabledActions}
                  onClick={() => {
                    setEditingPost(false);
                    setEditCaption(post.caption || "");
                    setEditText(post.text || "");
                  }}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {post.type === "photo" && (
        <div className="mediaBox">
          <img className="photo" src={post.src} alt={post.fileName || "photo"} />
        </div>
      )}

      {post.type === "pdf" && (
        <div className="pdfBox">
          <div className="pdfIcon">PDF</div>
          <div className="pdfInfo">
            <div className="pdfName">{post.fileName}</div>
            <a className="pdfOpen" href={post.url} target="_blank" rel="noreferrer">
              Open
            </a>
          </div>
        </div>
      )}

      {post.type === "text" && !editingPost && (
        <div className="textBox">
          <div className="textContent">{post.text}</div>
        </div>
      )}

      {post.type === "text" && editingPost && (
        <div className="textBox">
          <textarea className="textEditArea" value={editText} onChange={(e) => setEditText(e.target.value)} rows={4} />
        </div>
      )}

      {!editingPost ? (
        post.caption ? <div className="caption">{post.caption}</div> : null
      ) : (
        <div className="captionEditWrap">
          <input className="captionEdit" value={editCaption} onChange={(e) => setEditCaption(e.target.value)} />
        </div>
      )}

      {showActions && (
        <div className="actionsRow">
          <button className={post.liked ? "actBtn liked" : "actBtn"} type="button" onClick={onLike} disabled={disabledActions}>
            ♥ {post.likes || 0}
          </button>

          <button className="actBtn" type="button" onClick={() => sharePost(post)} disabled={disabledActions}>
            ↗ Share
          </button>

          {/* ✅ NEW: Share to Public Feed */}
          {onSharePublic ? (
            <button className="actBtn" type="button" onClick={onSharePublic} disabled={disabledActions}>
              📣 Public
            </button>
          ) : null}

          {/* ✅ Recap Drive Save (opens modal) */}
          {onSaveToDrive ? (
            <button className="actBtn" type="button" onClick={onSaveToDrive} disabled={disabledActions}>
              ⤓ Save
            </button>
          ) : (
            <button className={post.saved ? "actBtn saved" : "actBtn"} type="button" onClick={onSave} disabled={disabledActions}>
              ⤓ Save
            </button>
          )}
        </div>
      )}

      <div className="commentArea">
        <div className="commentInputRow">
          <input
            className="commentInput"
            value={cmt}
            onChange={(e) => setCmt(e.target.value)}
            placeholder="Add a comment..."
            disabled={disabledActions}
          />
          <button
            className="commentBtn"
            type="button"
            disabled={disabledActions}
            onClick={() => {
              onComment(cmt);
              setCmt("");
            }}
          >
            Post
          </button>
        </div>

        {post.comments?.length ? (
          <div className="commentsList">
            {post.comments.map((x) => (
              <div key={x.id} className="commentItemRow">
                {editingCommentId === x.id ? (
                  <>
                    <input
                      className="commentEditInput"
                      value={editCommentText}
                      onChange={(e) => setEditCommentText(e.target.value)}
                      disabled={disabledActions}
                    />
                    <button
                      className="miniBtn"
                      type="button"
                      disabled={disabledActions}
                      onClick={() => {
                        onEditComment(x.id, editCommentText);
                        setEditingCommentId(null);
                        setEditCommentText("");
                      }}
                    >
                      Save
                    </button>
                    <button
                      className="miniBtn"
                      type="button"
                      disabled={disabledActions}
                      onClick={() => {
                        setEditingCommentId(null);
                        setEditCommentText("");
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <div className="commentText">
                      <span className="cDot">•</span> {x.text}{" "}
                      {x.editedAt ? <span className="editedMini">(edited)</span> : null}
                    </div>
                    <div className="commentActions">
                      <button
                        className="miniBtn"
                        type="button"
                        disabled={disabledActions}
                        onClick={() => {
                          setEditingCommentId(x.id);
                          setEditCommentText(x.text);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="miniBtn danger"
                        type="button"
                        disabled={disabledActions}
                        onClick={() => onDeleteComment(x.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}