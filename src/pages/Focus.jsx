import { useEffect, useMemo, useRef, useState } from "react";
import "./Focus.css";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

function todayStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function calcLevel(xp) {
  // simple leveling: 300 XP per level
  return Math.floor((xp || 0) / 300) + 1;
}

export default function Focus() {
  const { user, loading } = useAuth() || {};
  const uid = user?.uid;

  // UI inputs
  const [minutes, setMinutes] = useState(25);
  const [subject, setSubject] = useState("General");
  const [goal, setGoal] = useState("");

  // timer state
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [mode, setMode] = useState("ready"); // ready | running | done

  // stats
  const [stats, setStats] = useState(null);
  const [busy, setBusy] = useState(false);

  const tickRef = useRef(null);

  const percent = useMemo(() => {
    const total = minutes * 60;
    if (total <= 0) return 0;
    return Math.max(0, Math.min(100, ((total - secondsLeft) / total) * 100));
  }, [minutes, secondsLeft]);

  // load stats
  useEffect(() => {
    if (!uid) return;
    (async () => {
      const ref = doc(db, "users", uid, "stats", "main");
      const snap = await getDoc(ref);
      if (snap.exists()) setStats(snap.data());
      else {
        const init = {
          totalMinutes: 0,
          xp: 0,
          level: 1,
          currentStreak: 0,
          longestStreak: 0,
          lastStudyDate: null,
          updatedAt: serverTimestamp(),
        };
        await setDoc(ref, init);
        setStats({
          totalMinutes: 0,
          xp: 0,
          level: 1,
          currentStreak: 0,
          longestStreak: 0,
          lastStudyDate: null,
        });
      }
    })();
  }, [uid]);

  // minutes change -> reset timer if not running
  useEffect(() => {
    if (running) return;
    setSecondsLeft(minutes * 60);
  }, [minutes, running]);

  // timer tick
  useEffect(() => {
    if (!running) return;

    tickRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(tickRef.current);
          tickRef.current = null;
          setRunning(false);
          setMode("done");
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [running]);

  function fmt(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function start() {
    if (secondsLeft <= 0) setSecondsLeft(minutes * 60);
    setMode("running");
    setRunning(true);
  }

  function pause() {
    setRunning(false);
  }

  function reset() {
    setRunning(false);
    setMode("ready");
    setSecondsLeft(minutes * 60);
  }

  async function completeSession() {
    if (!uid) return alert("Login required");
    if (!stats) return;

    setBusy(true);
    try {
      const sessionMinutes = minutes;
      const earnedXp = sessionMinutes; // 1 XP per minute (simple)

      // 1) Save session
      await addDoc(collection(db, "users", uid, "focusSessions"), {
        subject,
        goal: goal.trim(),
        minutes: sessionMinutes,
        earnedXp,
        completedAt: serverTimestamp(),
        createdAt: Date.now(), // local fallback
        date: todayStr(),
      });

      // 2) Update streak logic
      const today = todayStr();
      const yday = yesterdayStr();
      const last = stats.lastStudyDate;

      let nextStreak = stats.currentStreak || 0;

      if (last === today) {
        // already studied today => streak same
      } else if (last === yday) {
        nextStreak = nextStreak + 1;
      } else {
        nextStreak = 1;
      }

      const nextLongest = Math.max(stats.longestStreak || 0, nextStreak);

      // 3) Update totals
      const nextTotalMinutes = (stats.totalMinutes || 0) + sessionMinutes;
      const nextXp = (stats.xp || 0) + earnedXp;
      const nextLevel = calcLevel(nextXp);

      // 4) Write stats
      await setDoc(
        doc(db, "users", uid, "stats", "main"),
        {
          totalMinutes: nextTotalMinutes,
          xp: nextXp,
          level: nextLevel,
          currentStreak: nextStreak,
          longestStreak: nextLongest,
          lastStudyDate: today,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setStats((prev) => ({
        ...(prev || {}),
        totalMinutes: nextTotalMinutes,
        xp: nextXp,
        level: nextLevel,
        currentStreak: nextStreak,
        longestStreak: nextLongest,
        lastStudyDate: today,
      }));

      // UI reset
      setMode("ready");
      setSecondsLeft(minutes * 60);
      setGoal("");
      alert(`Session saved ✅ +${earnedXp} XP`);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Failed to save session");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="focusWrap">Loading...</div>;
  if (!uid) return <div className="focusWrap">Please login to use Focus Mode.</div>;

  return (
    <div className="focusWrap">
      <div className="focusTop">
        <div>
          <h2>Focus Mode</h2>
          <p>Pomodoro + Streak + XP</p>
        </div>

        <div className="statsMini">
          <div className="chip">
            <div className="k">Streak</div>
            <div className="v">{stats?.currentStreak || 0}🔥</div>
          </div>
          <div className="chip">
            <div className="k">XP</div>
            <div className="v">{stats?.xp || 0}</div>
          </div>
          <div className="chip">
            <div className="k">Level</div>
            <div className="v">{stats?.level || 1}</div>
          </div>
        </div>
      </div>

      <div className="focusCard">
        <div className="controlsRow">
          <label className="field">
            <div className="label">Minutes</div>
            <select
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              disabled={running || busy}
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={75}>75</option>
            </select>
          </label>

          <label className="field">
            <div className="label">Subject</div>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={running || busy}
              placeholder="e.g., Physics"
            />
          </label>
        </div>

        <label className="field" style={{ marginTop: 10 }}>
          <div className="label">Goal</div>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            disabled={running || busy}
            placeholder="e.g., Finish 20 MCQs"
          />
        </label>

        <div className="timerBox">
          <div className="ring" style={{ ["--p"]: `${percent}%` }}>
            <div className="time">{fmt(secondsLeft)}</div>
            <div className="sub">
              {mode === "running" ? "Deep work..." : mode === "done" ? "Completed ✅" : "Ready"}
            </div>
          </div>
        </div>

        <div className="btnRow">
          {!running && mode !== "done" ? (
            <button className="btnPrimary" type="button" onClick={start} disabled={busy}>
              Start
            </button>
          ) : null}

          {running ? (
            <button className="btnSecondary" type="button" onClick={pause} disabled={busy}>
              Pause
            </button>
          ) : null}

          <button className="btnSecondary" type="button" onClick={reset} disabled={busy}>
            Reset
          </button>

          {mode === "done" ? (
            <button className="btnPrimary" type="button" onClick={completeSession} disabled={busy}>
              {busy ? "Saving..." : "Save Session (+XP)"}
            </button>
          ) : null}
        </div>

        <div className="hintLine">
          Tip: Daily 1 session = streak alive. Miss a day → streak resets.
        </div>
      </div>
    </div>
  );
}