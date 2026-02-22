import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import PublicProfile from "./pages/PublicProfile";
import Home from "./pages/Home";
import Study from "./pages/Study";
import Targets from "./pages/Targets";
import Saathi from "./pages/Saathi";
import Profile from "./pages/Profile";
import Uploads from "./pages/Uploads";
import Connect from "./pages/Connect";
import Recap from "./pages/Recap";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import RecapDrive from "./pages/RecapDrive";
import Focus from "./pages/Focus";
import EditProfile from "./pages/EditProfile";

export default function App() {
  return (
    <Routes>
      {/* App pages with Layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/study" element={<Study />} />
        <Route path="/targets" element={<Targets />} />
        <Route path="/saathi" element={<Saathi />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/uploads" element={<Uploads />} />
        <Route path="/connect" element={<Connect />} />
        <Route path="/recap" element={<Recap />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/u/:handle" element={<PublicProfile />} />
        <Route path="/recap-drive" element={<RecapDrive />} />
        <Route path="/focus" element={<Focus />} />
        <Route path="/edit-profile" element={<EditProfile />} />
      </Route>

      {/* Auth pages (without Layout) */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}