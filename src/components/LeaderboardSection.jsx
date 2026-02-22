import { useMemo, useState } from "react";
import "./LeaderboardSection.css";

export default function LeaderboardSection({ myName = "Om Prakash", myScore = 64 }) {
  const [range, setRange] = useState("weekly"); // daily | weekly | monthly

  const data = useMemo(() => {
    const base = [
      { id: "1", name: "Aarav", handle: "@aarav", score: 92, trend: "+8", badge: "🔥" },
      { id: "2", name: "Nisha", handle: "@nisha", score: 86, trend: "+5", badge: "⚡" },
      { id: "3", name: myName, handle: "@studygram_user", score: myScore, trend: "+3", badge: "💎", me: true },
      { id: "4", name: "Riya", handle: "@riya", score: 58, trend: "+1", badge: "🎯" },
      { id: "5", name: "Kunal", handle: "@kunal", score: 49, trend: "-2", badge: "📌" },
    ];

    const mul = range === "daily" ? 1 : range === "weekly" ? 1.2 : 1.5;
    return base
      .map((x) => ({ ...x, score: Math.round(x.score * mul) }))
      .sort((a, b) => b.score - a.score)
      .map((x, idx) => ({ ...x, rank: idx + 1 }));
  }, [range, myName, myScore]);

  const myRank = data.find((x) => x.me)?.rank ?? 0;
  const top = data.slice(0, 3);
  const rest = data.slice(3);

  return (
    <section className="lbWrap">
      <div className="lbHead">
        <div>
          <div className="lbTitleRow">
            <h3 className="lbTitle">Leaderboard</h3>
            <span className="lbPro">PRO</span>
          </div>
          <p className="lbSub">Targets completion + focus score based ranking</p>
        </div>

        <div className="lbTabs">
          <button className={`lbTab ${range === "daily" ? "active" : ""}`} onClick={() => setRange("daily")}>
            Today
          </button>
          <button className={`lbTab ${range === "weekly" ? "active" : ""}`} onClick={() => setRange("weekly")}>
            Weekly
          </button>
          <button className={`lbTab ${range === "monthly" ? "active" : ""}`} onClick={() => setRange("monthly")}>
            Monthly
          </button>
        </div>
      </div>

      <div className="lbPodium">
        {top.map((u) => (
          <div key={u.id} className={`podCard ${u.me ? "me" : ""}`}>
            <div className="podRank">#{u.rank}</div>
            <div className="podAvatar">{u.name.slice(0, 1).toUpperCase()}</div>
            <div className="podName">{u.name}</div>
            <div className="podHandle">{u.handle}</div>

            <div className="podScoreRow">
              <div className="podScore">{u.score}</div>
              <div className={`podTrend ${u.trend.startsWith("-") ? "down" : "up"}`}>{u.trend}</div>
            </div>

            <div className="podBadge">{u.badge}</div>
          </div>
        ))}
      </div>

      <div className="lbList">
        {rest.map((u) => (
          <div key={u.id} className={`lbRow ${u.me ? "me" : ""}`}>
            <div className="lbRank">{u.rank}</div>
            <div className="lbAvatar">{u.name.slice(0, 1).toUpperCase()}</div>

            <div className="lbMeta">
              <div className="lbName">{u.name}</div>
              <div className="lbHandle">{u.handle}</div>
            </div>

            <div className="lbRight">
              <div className="lbScore">{u.score}</div>
              <div className={`lbTrend ${u.trend.startsWith("-") ? "down" : "up"}`}>{u.trend}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="lbFooter">
        <div className="lbMe">
          <div className="lbMeTitle">Your position</div>
          <div className="lbMeRow">
            <span className="lbMeChip">#{myRank || "-"}</span>
            <span className="lbMeName">{myName}</span>
            <span className="lbMeScore">{myScore} pts</span>
          </div>
        </div>

        <button className="lbInviteBtn" type="button">
          Invite friends
        </button>
      </div>
    </section>
  );
}