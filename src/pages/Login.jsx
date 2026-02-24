import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { ensureUserDoc } from "../services/userService";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!email.trim() || !pass) {
      setErr("Email and password required");
      return;
    }

    try {
      setLoading(true);

      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);

      // Create user doc if missing (safe)
      const cleanHandle = (cred.user.email || "user")
        .split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "");

      await ensureUserDoc(cred.user.uid, {
        name: cred.user.displayName || "User",
        handle: `@${cleanHandle || "user"}`,
      });

      // go to your app page
      nav("/saathi");
    } catch (e2) {
      setErr(e2?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="authWrap">
      <form className="authCard" onSubmit={onSubmit}>
        <h1>Login</h1>
        <p className="muted">Login to access your Saathi</p>

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
        />
        <input
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          placeholder="Password"
          type="password"
          autoComplete="current-password"
        />

        {err ? <div className="authErr">{err}</div> : null}

        <button className="btnPrimary" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <button
          className="btnGhost"
          type="button"
          onClick={() => nav("/signup")}
          disabled={loading}
        >
          Create new account
        </button>
      </form>
    </div>
  );
}