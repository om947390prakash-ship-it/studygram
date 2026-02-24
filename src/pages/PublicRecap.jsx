import { useEffect, useState } from "react";
import "./Recap.css";
import { listenPublicPosts } from "../services/postService";

export default function PublicRecap() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const unsub = listenPublicPosts(setItems);
    return () => unsub();
  }, []);

  return (
    <div className="recapWrap">
      <h2 style={{ marginBottom: 4 }}>Public Recaps</h2>
      <div style={{ opacity: 0.7 }}>Everyone can view • Login required to post</div>

      <div style={{ marginTop: 18 }} className="feed">
        {items.length === 0 ? (
          <div className="emptyFeed">
            <div className="emptyTitle">No public recaps yet</div>
            <div className="emptySub">Upload/Share a recap to see it here ✅</div>
          </div>
        ) : (
          items.map((it) => (
            <div key={it.id} className="postCard">
              <div className="postTop" style={{ justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 900 }}>{it.title}</div>
                  <div style={{ opacity: 0.7, fontSize: 12 }}>
                    {it.folder || "Root"} • {it.author?.email || it.author?.uid}
                  </div>
                </div>

                <a className="btnSecondary" href={it.fileUrl} target="_blank" rel="noreferrer">
                  Open
                </a>
              </div>

              {it.payload?.caption ? <div className="caption">{it.payload.caption}</div> : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}