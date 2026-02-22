import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { ensureUserDoc } from "../services/userService";
import { useNavigate } from "react-router-dom";
import "./Auth.css";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);

      // ensure doc exists even if user signed up elsewhere
      await ensureUserDoc(cred.user.uid, {
        name: cred.user.displayName || "User",
        handle: `@user_${cred.user.uid.slice(0, 5)}`,
      });

      nav("/saathi");
    } catch (e2) {
      setErr(e2.message);
    }
  }

  return (
    <div className="authWrap">
      <form className="authCard" onSubmit={onSubmit}>
        <h1>Login</h1>
        <p className="muted">Login to access your Saathi</p>

        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Password" type="password" />

        {err ? <div className="authErr">{err}</div> : null}

        <button className="btnPrimary" type="submit">Login</button>
        <button className="btnGhost" type="button" onClick={() => nav("/signup")}>Create new account</button>
      </form>
    </div>
  );
}
async function handleLogin() {
  const cred = await signInWithEmailAndPassword(auth, email, password);

  const ref = doc(db, "users", cred.user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const cleanHandle =
      (cred.user.email || "user").split("@")[0].toLowerCase();

    await setDoc(ref, {
      name: cred.user.displayName || "User",
      handle: cleanHandle,
      score: 0,
      focusMinutes: 0,
      completionPct: 0,
      createdAt: Date.now(),
    });
  }

  nav("/");
}