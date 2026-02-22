import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Saathi.css";

const SAATHI_KEY = "studygram_saathi_v1";
const POSTS_KEY = "studygram_uploads_posts_v1";

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

export default function Saathi() {
  const nav = useNavigate();
  const [query, setQuery] = useState("");
  const [saathi, setSaathi] = useState(() => loadLS(SAATHI_KEY, []));
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    setPosts(loadLS(POSTS_KEY, []));
  }, []);

  useEffect(() => {
    saveLS(SAATHI_KEY, saathi);
  }, [saathi]);

  // build “discover users” list from posts authors (demo)
  const allUsers = useMemo(() => {
    const map = new Map();
    for (const p of posts) {
      const h = (p.author?.handle || "@you").replace("@", "").toLowerCase();
      if (!map.has(h)) {
        map.set(h, {
          handle: h,
          name: p.author?.name || h,
        });
      }
    }
    return Array.from(map.values());
  }, [posts]);

  const filtered = useMemo(() => {
    const q = query.trim().replace("@", "").toLowerCase();
    if (!q) return [];
    return allUsers.filter(
      (u) => u.handle.includes(q) || (u.name || "").toLowerCase().includes(q)
    );
  }, [query, allUsers]);

  function add(u) {
    const exists = saathi.some((x) => x.handle === u.handle);
    if (exists) return;

    setSaathi((prev) => [{ ...u, addedAt: Date.now() }, ...prev]);
  }

  function remove(handle) {
    setSaathi((prev) => prev.filter((x) => x.handle !== handle));
  }

  // simple “leaderboard” from posts: likes sum per handle
  const leaderboard = useMemo(() => {
    const scoreMap = new Map();
    for (const p of posts) {
      const h = (p.author?.handle || "@you").replace("@", "").toLowerCase();
      const prev = scoreMap.get(h) || 0;
      scoreMap.set(h, prev + (p.likes || 0));
    }
    const rows = saathi.map((s) => ({
      ...s,
      score: scoreMap.get(s.handle) || 0,
    }));
    rows.sort((a, b) => b.score - a.score);
    return rows;
  }, [saathi, posts]);

  return (
    <div className="saathiWrap">
      <div className="saathiHead">
        <div>
          <h1>Saathi</h1>
          <p>Connect friends locally (demo) — leaderboard by total likes.</p>
        </div>
      </div>

      {/* Search */}
      <div className="saathiCard">
        <div className="row">
          <input
            className="in"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or @handle"
          />
        </div>

        {filtered.length > 0 && (
          <div className="results">
            {filtered.map((u) => {
              const already = saathi.some((x) => x.handle === u.handle);
              return (
                <div className="uRow" key={u.handle}>
                  <div className="uLeft" onClick={() => nav(`/u/${encodeURIComponent(u.handle)}`)} style={{ cursor: "pointer" }}>
                    <div className="ava">{(u.name || "U").slice(0, 1).toUpperCase()}</div>
                    <div>
                      <div className="uName">{u.name}</div>
                      <div className="uHandle">@{u.handle}</div>
                    </div>
                  </div>

                  <div className="uBtns">
                    <button className="btnG" onClick={() => nav(`/u/${encodeURIComponent(u.handle)}`)}>View</button>
                    <button className={already ? "btnD" : "btnP"} onClick={() => add(u)} disabled={already}>
                      {already ? "Connected" : "Add"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {query.trim() && filtered.length === 0 ? (
          <div className="hint">No match (demo users come from posts authors).</div>
        ) : (
          <div className="hint">Tip: demo search works for users who have posts.</div>
        )}
      </div>

      {/* My Saathi */}
      <div className="saathiCard">
        <div className="cardTop">
          <h2>My Saathi</h2>
          <div className="mini">{saathi.length} connected</div>
        </div>

        {saathi.length === 0 ? (
          <div className="saathiEmpty">No saathi yet. Open a profile and tap “Add Saathi”.</div>
        ) : (
          <div className="grid">
            {saathi.map((u) => (
              <div className="miniCard" key={u.handle}>
                <div className="miniTop" onClick={() => nav(`/u/${encodeURIComponent(u.handle)}`)}>
                  <div className="ava2">{(u.name || "U").slice(0, 1).toUpperCase()}</div>
                  <div>
                    <div className="uName">{u.name}</div>
                    <div className="uHandle">@{u.handle}</div>
                  </div>
                </div>

                <div className="scoreRow">
                  <div className="k">Added</div>
                  <div className="v">{new Date(u.addedAt).toLocaleDateString()}</div>
                </div>

                <div className="uBtns">
                  <button className="btnG" onClick={() => nav(`/u/${encodeURIComponent(u.handle)}`)}>Open</button>
                  <button className="btnD" onClick={() => remove(u.handle)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leaderboard */}
      <div className="saathiCard">
        <div className="cardTop">
          <h2>Leaderboard</h2>
          <div className="mini">Score = total likes (demo)</div>
        </div>

        {leaderboard.length === 0 ? (
          <div className="saathiEmpty">Add saathi to see leaderboard.</div>
        ) : (
          <div className="lb">
            {leaderboard.map((u, idx) => (
              <div className="lbRow" key={u.handle}>
                <div className="rank">{idx + 1}</div>
                <div className="lbMid" onClick={() => nav(`/u/${encodeURIComponent(u.handle)}`)}>
                  <div className="lbName">{u.name}</div>
                  <div className="lbHandle">@{u.handle}</div>
                </div>
                <div className="lbScore">{u.score}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}