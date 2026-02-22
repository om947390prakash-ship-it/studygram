import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase"; // ⚠️ adjust if needed
import "./Home.css";

export default function Home() {
  const nav = useNavigate();

  // ✅ Firebase test (HOOK INSIDE COMPONENT)
  useEffect(() => {
    async function test() {
      try {
        const snap = await getDocs(collection(db, "users"));
        console.log(
          "USERS:",
          snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        );
      } catch (err) {
        console.error("Firestore error:", err);
      }
    }
    test();
  }, []);

  return (
    <div className="homeWrap">
      <div className="homeHero">
        <h1>Welcome to StudyGram</h1>
        <p>
          Daily Targets + Focus timer + Friends competition. Premium student
          mode.
        </p>

        <div className="homeBtns">
          <button className="btnPrimary" onClick={() => nav("/study")}>
            Go to Study
          </button>
          <button className="btnGhost" onClick={() => nav("/targets")}>
            Daily Targets
          </button>
        </div>
      </div>
    </div>
  );
}