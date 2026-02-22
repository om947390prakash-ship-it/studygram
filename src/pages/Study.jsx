import { useNavigate } from "react-router-dom";
import "./Study.css";

export default function Study() {
  const nav = useNavigate();

  return (
    <div className="studyWrap">
      <div className="studyHeader">
        <div>
          <h2>Study Mode</h2>
          <p>Deep focus + daily plan. One tap to start targets.</p>
        </div>

        <div className="studyPills">
          <span className="pill">Focus</span>
          <span className="pill">Routine</span>
          <span className="pill">Compete</span>
        </div>
      </div>

      <div className="studyCards">

        {/* Daily Targets */}
        <div className="card">
          <h3>Daily Targets</h3>
          <p>Subject-wise tasks + progress + congrats 🎉</p>
          <button className="btnPrimary" onClick={() => nav("/targets")}>
            Open Targets
          </button>
        </div>

        {/* ✅ NEW: Recap Drive */}
        <div className="card">
          <h3>Recap Drive</h3>
          <p>Saved recaps, PDFs, notes — all in one place 📁</p>
          <button className="btnPrimary" onClick={() => nav("/recap-drive")}>
            Open Drive
          </button>
        </div>

      </div>
    </div>
  );
}
<div className="card">
  <h3>Focus Mode</h3>
  <p>Pomodoro + streak + XP. Deep work starts here ⏱️</p>
  <button className="btnPrimary" onClick={() => nav("/focus")}>
    Start Focus
  </button>
</div>