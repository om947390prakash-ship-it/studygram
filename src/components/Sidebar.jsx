import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function Sidebar({ isOpen, toggle }) {
  const { pathname } = useLocation();
  const { user } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
    toggle();
  };

  return (
    <div className={`sbOverlay ${isOpen ? "open" : ""}`} onClick={toggle}>
      <aside className={`sb ${isOpen ? "open" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="sbTop">
          <div className="sbTitle">Menu</div>
          <button className="sbClose" onClick={toggle} aria-label="Close">✕</button>
        </div>

        {/* User Card */}
        <div className="sbUser">
          <div className="sbAvatar">
            {(user?.displayName || "OP").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="sbName">{user?.displayName || "Guest"}</div>
            <div className="sbHandle">{user ? user.email : "Please login"}</div>
          </div>
        </div>

        <nav className="sbLinks">
          <Link className={`sbItem ${pathname === "/" ? "active" : ""}`} to="/" onClick={toggle}>
            <span className="icon">🏠</span><span>Home</span>
          </Link>

          <Link className={`sbItem ${pathname === "/profile" ? "active" : ""}`} to="/profile" onClick={toggle}>
            <span className="icon">👤</span><span>Profile</span>
          </Link>

          {/* ✅ Logged out -> Login दिखाओ */}
          {!user && (
            <Link className={`sbItem ${pathname === "/login" ? "active" : ""}`} to="/login" onClick={toggle}>
              <span className="icon">🔐</span><span>Login</span>
            </Link>
          )}

          {/* ✅ Logged in -> Logout दिखाओ */}
          {user && (
            <button className="sbItem sbBtn" onClick={handleLogout} type="button">
              <span className="icon">🚪</span><span>Logout</span>
            </button>
          )}

          <Link className={`sbItem ${pathname === "/contact" ? "active" : ""}`} to="/contact" onClick={toggle}>
            <span className="icon">☎️</span><span>Contact Us</span>
          </Link>
        </nav>

        <div className="sbHint">
          Tip: Daily Targets complete karo — streak & badges unlock honge.
        </div>
      </aside>
    </div>
  );
}