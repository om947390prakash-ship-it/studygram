import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import "./Navbar.css";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const nav = useNavigate();

  return (
    <>
      <header className="navBar">
        <div className="navLeft" role="button" tabIndex={0} onClick={() => nav("/")}>
          <img className="navLogo" src="/logo.png.png" alt="StudyGram logo" />
          <div className="navText">
            <div className="navTitle">StudyGram</div>
            
          </div>
        </div>

        <button className="navMenu" onClick={() => setOpen(true)} aria-label="Open menu">
          ☰
        </button>
      </header>

      <Sidebar isOpen={open} toggle={() => setOpen(false)} />
    </>
  );
}
