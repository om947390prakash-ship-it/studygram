import { NavLink, useNavigate } from "react-router-dom";
import "./Footer.css";

<NavLink to="/uploads" className="fabBtn">
  ⬆️
</NavLink>

function Tab({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `footerTab ${isActive ? "footerActive" : ""}`
      }
    >
      <div className="footerIcon">{icon}</div>
      <span className="footerLabel">{label}</span>
    </NavLink>
  );
}

export default function Footer() {
  const nav = useNavigate();

  return (
    <footer className="footerWrap">
      <div className="footerGlass" />

      <div className="footerRow">
        <Tab to="/study" icon={<IconStudy />} label="Study" />
        <Tab to="/saathi" icon={<IconUsers />} label="Saathi" />

        {/* 🔥 Premium Center Button */}
        <button
          className="footerFab"
          onClick={() => nav("/uploads")}
          aria-label="Uploads"
        >
          <IconUploads />
        </button>

        <Tab to="/Connect" icon={<IconCheck />} label="Connect" />
        <Tab to="/recap" icon={<IconRecap />} label="Recap" />
      </div>
    </footer>
  );
}

/* ================= ICONS ================= */

function IconStudy() {
  return (
    <svg viewBox="0 0 24 24" className="ico">
      <path d="M4 6l8-3 8 3v10l-8 3-8-3z" />
      <path d="M12 3v13" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" className="ico">
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3 3-5 6-5s6 2 6 5" />
      <path d="M17 11a2.5 2.5 0 1 0 0-5" />
    </svg>
  );
}

function IconUploads() {
  return (
    <svg viewBox="0 0 24 24" className="ico big">
      <path d="M12 3v12" />
      <path d="M7 8l5-5 5 5" />
      <path d="M4 18v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" className="ico">
      <path d="M20 6L9 17l-5-5" />
      <rect x="3" y="3" width="18" height="18" rx="4" />
    </svg>
  );
}

function IconRecap() {
  return (
    <svg viewBox="0 0 24 24" className="ico">
      <path d="M4 4v6h6" />
      <path d="M20 20v-6h-6" />
      <path d="M5 15a7 7 0 0 0 12 2" />
      <path d="M19 9a7 7 0 0 0-12-2" />
    </svg>
  );
}
