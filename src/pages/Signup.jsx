import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../firebase";
import { ensureUserDoc } from "../services/userService";
import { useNavigate } from "react-router-dom";
import "./Auth.css";
import { doc, setDoc } from "firebase/firestore";

export default function Signup() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("@");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: name || "User" });

      await ensureUserDoc(cred.user.uid, {
        name: name || "User",
        handle: handle.startsWith("@") ? handle : `@${handle}`,
      });

      nav("/saathi");
    } catch (e2) {
      setErr(e2.message);
    }
  }

  return (
    <div className="authWrap">
      <form className="authCard" onSubmit={onSubmit}>
        <h1>Create account</h1>
        <p className="muted">Signup to use Saathi + Leaderboard</p>

        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@handle" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Password" type="password" />

        {err ? <div className="authErr">{err}</div> : null}

        <button className="btnPrimary" type="submit">Sign up</button>
        <button className="btnGhost" type="button" onClick={() => nav("/login")}>Already have account? Login</button>
      </form>
    </div>
  );
}
async function handleSignup() {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  // optional: auth profile name
  await updateProfile(cred.user, { displayName: name });

  // ✅ handle clean
  const cleanHandle = handle.trim().replace("@", "").toLowerCase();

  // ✅ create users/{uid} doc
  await setDoc(doc(db, "users", cred.user.uid), {
    name: name.trim(),
    handle: cleanHandle,
    score: 0,
    focusMinutes: 0,
    completionPct: 0,
    createdAt: Date.now(),
  });

  // redirect
  nav("/");
}