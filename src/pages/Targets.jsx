import { useEffect, useMemo, useState } from "react";
import "./Targets.css";

function makeId() {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

/* ---------- AI Templates (no API) ---------- */
function buildSuggestions({ subject, topic, count, difficulty }) {
  const t = (topic || "").trim();
  const diff = (difficulty || "Medium").toLowerCase();

  const base = {
    Physics: [
      "Revise formulas + units",
      "Solve PYQs (timed)",
      "Do 20 MCQs + review mistakes",
      "Make 1-page notes",
      "Practice numericals set",
      "Concept revise + examples",
      "Error log update",
    ],
    Chemistry: [
      "Revise reactions / mechanisms",
      "NCERT line-by-line (important)",
      "Solve PYQs (timed)",
      "Do 30 MCQs + review mistakes",
      "Make short notes (name reactions)",
      "Practice numericals / stoichiometry",
      "Error log update",
    ],
    Maths: [
      "Revise formulas + key tricks",
      "Solve PYQs (timed)",
      "Do 25 questions mixed set",
      "Make 1-page formula sheet",
      "Practice 10 tough questions",
      "Revise mistakes (error log)",
      "Speed practice set",
    ],
  };

  const generic = [
    "Revise key concepts",
    "Solve PYQs (timed)",
    "Do MCQ practice + review",
    "Make short notes",
    "Update error log",
  ];

  let pool = base[subject] ? [...base[subject]] : [...generic];

  if (t) {
    pool = pool.map((x) => `${x} — ${t}`);
    pool.unshift(`Quick concept revise — ${t}`);
    pool.unshift(`PYQ mix test — ${t} (timed)`);
  }

  if (diff === "easy") {
    pool.unshift("Basics + examples (foundation)");
    pool.unshift("NCERT/Notes quick read");
  } else if (diff === "hard") {
    pool.unshift("Tough problems set (advanced)");
    pool.unshift("Mixed test (high difficulty) + analysis");
    pool.push("Deep error analysis + redo wrong ones");
  } else {
    pool.unshift("Mixed practice set (medium) + review");
  }

  const out = [];
  for (let i = 0; i < (count || 6); i++) out.push(pool[i % pool.length]);
  return out;
}

/* ---------- AI Suggest Modal ---------- */
function AISuggestModal({ open, subject, onClose, onApply }) {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(6);
  const [difficulty, setDifficulty] = useState("Medium");
  const [preview, setPreview] = useState([]);

  useEffect(() => {
    if (!open) return;
    setTopic("");
    setCount(6);
    setDifficulty("Medium");
    setPreview([]);
  }, [open, subject]);

  if (!open) return null;

  function generate() {
    const suggestions = buildSuggestions({ subject, topic, count, difficulty });
    setPreview(suggestions);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.40)",
        display: "grid",
        placeItems: "center",
        zIndex: 9999,
        padding: 14,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(720px, 94vw)",
          borderRadius: 18,
          background: "#ffffff",
          border: "1px solid rgba(15,23,42,0.12)",
          boxShadow: "0 22px 70px rgba(15,23,42,0.18)",
          padding: 14,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 950, fontSize: 18 }}>✨ AI Suggest Targets</div>
            <div style={{ opacity: 0.65, marginTop: 2 }}>
              Subject: <b>{subject}</b>
            </div>
          </div>
          <button className="miniBtn danger" type="button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 0.8fr 0.8fr", gap: 10, marginTop: 12 }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Topic (optional)</div>
            <input
              className="input"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Kinematics / Thermodynamics / Organic"
              style={{ height: 44 }}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Count</div>
            <select className="input" value={count} onChange={(e) => setCount(Number(e.target.value))} style={{ height: 44 }}>
              <option value={4}>4</option>
              <option value={6}>6</option>
              <option value={8}>8</option>
              <option value={10}>10</option>
            </select>
          </div>

          <div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Difficulty</div>
            <select className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={{ height: 44 }}>
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 12 }}>
          <button className="btnGhost" type="button" onClick={generate}>
            Preview
          </button>
          <button
            className="btnPrimary"
            type="button"
            onClick={() => {
              const suggestions = preview.length ? preview : buildSuggestions({ subject, topic, count, difficulty });
              onApply(suggestions);
              onClose();
            }}
          >
            Apply to {subject}
          </button>
        </div>

        {preview.length ? (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Preview</div>
            <div style={{ display: "grid", gap: 8 }}>
              {preview.map((x, i) => (
                <div
                  key={i}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 14,
                    border: "1px solid rgba(15,23,42,0.10)",
                    background: "rgba(124,58,237,0.06)",
                    fontWeight: 800,
                    color: "#0f172a",
                  }}
                >
                  {x}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function Targets() {
  // -------- Timer --------
  const [running, setRunning] = useState(false);
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  const timeStr = useMemo(() => {
    const h = String(Math.floor(secs / 3600)).padStart(2, "0");
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }, [secs]);

  // -------- Subjects + Targets --------
  const [subjects, setSubjects] = useState(["Physics", "Chemistry", "Maths"]);
  const [active, setActive] = useState("Physics"); // still useful for pills highlight

  const [newSubject, setNewSubject] = useState("");
  const [targetsBySub, setTargetsBySub] = useState({
    Physics: [],
    Chemistry: [],
    Maths: [],
  });

  // per-subject add input values
  const [draftBySub, setDraftBySub] = useState({
    Physics: "",
    Chemistry: "",
    Maths: "",
  });

  // -------- Edit Target (global editor) --------
  const [editing, setEditing] = useState({ sub: null, id: null });
  const [editText, setEditText] = useState("");

  // -------- AI modal --------
  const [aiOpen, setAiOpen] = useState(false);
  const [aiSub, setAiSub] = useState("Physics");

  // Ensure active subject exists
  useEffect(() => {
    if (!subjects.includes(active) && subjects.length) setActive(subjects[0]);
  }, [subjects, active]);

  // Add subject
  const addSubject = () => {
    const name = newSubject.trim();
    if (!name) return;

    const exists = subjects.some((s) => s.toLowerCase() === name.toLowerCase());
    if (exists) {
      setNewSubject("");
      return;
    }

    setSubjects((p) => [...p, name]);
    setTargetsBySub((p) => ({ ...p, [name]: [] }));
    setDraftBySub((p) => ({ ...p, [name]: "" }));
    setActive(name);
    setNewSubject("");
  };

  // Remove subject
  const removeSubject = (name) => {
    const nextSubjects = subjects.filter((s) => s !== name);
    setSubjects(nextSubjects);

    setTargetsBySub((p) => {
      const copy = { ...p };
      delete copy[name];
      return copy;
    });

    setDraftBySub((p) => {
      const copy = { ...p };
      delete copy[name];
      return copy;
    });

    if (active === name) setActive(nextSubjects[0] || "");

    if (editing.sub === name) {
      setEditing({ sub: null, id: null });
      setEditText("");
    }
  };

  // Add target to a specific subject
  const addTargetFor = (sub) => {
    const t = (draftBySub[sub] || "").trim();
    if (!t) return;

    setTargetsBySub((p) => ({
      ...p,
      [sub]: [...(p[sub] || []), { id: makeId(), text: t, done: false }],
    }));

    setDraftBySub((p) => ({ ...p, [sub]: "" }));
  };

  // Toggle done
  const toggleDone = (sub, id) => {
    setTargetsBySub((p) => ({
      ...p,
      [sub]: (p[sub] || []).map((x) => (x.id === id ? { ...x, done: !x.done } : x)),
    }));
  };

  // Move target up/down
  function moveTarget(sub, id, dir) {
    setTargetsBySub((prev) => {
      const list = [...(prev[sub] || [])];
      const i = list.findIndex((x) => x.id === id);
      if (i === -1) return prev;

      const j = dir === "up" ? i - 1 : i + 1;
      if (j < 0 || j >= list.length) return prev;

      [list[i], list[j]] = [list[j], list[i]];
      return { ...prev, [sub]: list };
    });
  }

  // Edit
  function startEdit(sub, t) {
    setEditing({ sub, id: t.id });
    setEditText(t.text);
  }

  function saveEdit() {
    const txt = editText.trim();
    if (!txt) return;
    if (!editing.sub || !editing.id) return;

    const sub = editing.sub;
    const id = editing.id;

    setTargetsBySub((prev) => ({
      ...prev,
      [sub]: (prev[sub] || []).map((x) => (x.id === id ? { ...x, text: txt } : x)),
    }));

    setEditing({ sub: null, id: null });
    setEditText("");
  }

  function cancelEdit() {
    setEditing({ sub: null, id: null });
    setEditText("");
  }

  // Delete target
  function deleteTarget(sub, id) {
    setTargetsBySub((prev) => ({
      ...prev,
      [sub]: (prev[sub] || []).filter((x) => x.id !== id),
    }));

    if (editing.sub === sub && editing.id === id) {
      setEditing({ sub: null, id: null });
      setEditText("");
    }
  }

  // Completion % per subject
  function completionPctFor(sub) {
    const list = targetsBySub[sub] || [];
    const total = list.length || 0;
    const done = list.filter((x) => x.done).length;
    return total === 0 ? 0 : Math.round((done / total) * 100);
  }

  // AI Apply
  function applyAISuggestions(sub, suggestions) {
    const arr = (suggestions || [])
      .map((x) => String(x || "").trim())
      .filter(Boolean)
      .map((text) => ({ id: makeId(), text, done: false }));

    if (!arr.length) return;

    setTargetsBySub((prev) => ({
      ...prev,
      [sub]: [...(prev[sub] || []), ...arr],
    }));
  }

  return (
    <div className="targetsWrap">
      {/* Header */}
      <div className="targetsHead">
        <div>
          <h1>Daily Targets</h1>
          <p>Plan • Focus • Track</p>
        </div>

        <div className="timerCard">
          <div className="timerTime">{timeStr}</div>
          <div className="timerBtns">
            <button className="btnPrimary" onClick={() => setRunning((r) => !r)} type="button">
              {running ? "Pause" : "Start"}
            </button>

            <button
              className="btnGhost"
              type="button"
              onClick={() => {
                setRunning(false);
                setSecs(0);
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Subjects pills */}
      <div className="subRow">
        {subjects.map((s) => (
          <button
            key={s}
            className={`subPill ${active === s ? "active" : ""}`}
            onClick={() => setActive(s)}
            type="button"
            title="Select subject"
          >
            <span>{s}</span>
            <span
              className="subX"
              onClick={(e) => {
                e.stopPropagation();
                removeSubject(s);
              }}
              title="Remove subject"
            >
              ✕
            </span>
          </button>
        ))}
      </div>

      {/* Add Subject */}
      <div className="addSubjectRow">
        <input
          className="input"
          value={newSubject}
          onChange={(e) => setNewSubject(e.target.value)}
          placeholder="Add Subject"
          onKeyDown={(e) => {
            if (e.key === "Enter") addSubject();
          }}
        />
        <button className="btnDark" onClick={addSubject} type="button">
          Add
        </button>
      </div>

      {/* ✅ ALL SUBJECTS TARGETS + Add input inside each */}
      {subjects.map((sub) => {
        const list = targetsBySub[sub] || [];
        const pct = completionPctFor(sub);

        return (
          <div key={sub} className="bigCard">
            <div className="bigTop">
              <h2>{sub}</h2>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  className="miniBtn"
                  type="button"
                  onClick={() => {
                    setAiSub(sub);
                    setAiOpen(true);
                  }}
                  title={`AI suggest targets for ${sub}`}
                >
                  ✨ AI
                </button>

                <div style={{ fontWeight: 900, color: "#334155" }}>{pct}%</div>
              </div>
            </div>

            {/* Add target row INSIDE each subject */}
            <div className="addTargetRow">
              <input
                className="input"
                value={draftBySub[sub] || ""}
                onChange={(e) => setDraftBySub((p) => ({ ...p, [sub]: e.target.value }))}
                placeholder={`Add target for ${sub}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addTargetFor(sub);
                }}
              />
              <button className="btnDark" onClick={() => addTargetFor(sub)} type="button">
                Add
              </button>
            </div>

            <div className="progressRow">
              <div className="progressBar">
                <div className="progressFill" style={{ width: `${pct}%` }} />
              </div>
              <div className="progressText">{pct}% Completed</div>
            </div>

            {list.length === 0 ? (
              <div className="emptyText">No targets for {sub}. Use Add or ✨ AI.</div>
            ) : (
              <div className="targetsList">
                {list.map((t, idx, arr) => (
                  <div key={t.id} className={`tRow ${t.done ? "done" : ""}`}>
                    <label className="tLeft">
                      <input type="checkbox" checked={t.done} onChange={() => toggleDone(sub, t.id)} />

                      {editing.sub === sub && editing.id === t.id ? (
                        <input
                          className="tEditInput"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit();
                            if (e.key === "Escape") cancelEdit();
                          }}
                          autoFocus
                        />
                      ) : (
                        <span className="tText">{t.text}</span>
                      )}
                    </label>

                    <div className="tActions">
                      <button
                        className="miniBtn"
                        onClick={() => moveTarget(sub, t.id, "up")}
                        disabled={idx === 0}
                        title="Move up"
                        type="button"
                      >
                        ↑
                      </button>
                      <button
                        className="miniBtn"
                        onClick={() => moveTarget(sub, t.id, "down")}
                        disabled={idx === arr.length - 1}
                        title="Move down"
                        type="button"
                      >
                        ↓
                      </button>

                      {editing.sub === sub && editing.id === t.id ? (
                        <>
                          <button className="miniBtn primary" onClick={saveEdit} type="button">
                            Save
                          </button>
                          <button className="miniBtn" onClick={cancelEdit} type="button">
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button className="miniBtn" onClick={() => startEdit(sub, t)} type="button">
                          Edit
                        </button>
                      )}

                      <button className="miniBtn danger" onClick={() => deleteTarget(sub, t.id)} title="Remove" type="button">
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* AI Suggest Modal */}
      <AISuggestModal
        open={aiOpen}
        subject={aiSub}
        onClose={() => setAiOpen(false)}
        onApply={(suggestions) => applyAISuggestions(aiSub, suggestions)}
      />
    </div>
  );
}