import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyProfile, upsertMyProfile, uploadProfilePhoto } from "../services/userService";
import "./EditProfile.css";

export default function EditProfile() {
  const { user, loading } = useAuth() || {};
  const uid = user?.uid;
  const nav = useNavigate();
  const fileRef = useRef(null);

  const [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    handle: "",
    bio: "",
    photoURL: "",
  });

  useEffect(() => {
    if (loading) return;
    if (!uid) return;

    (async () => {
      const p = await getMyProfile(uid);
      if (p) {
        setProfile({
          name: p.name || "",
          handle: p.handle || (user?.email ? user.email.split("@")[0] : "you"),
          bio: p.bio || "",
          photoURL: p.photoURL || "",
        });
      } else {
        setProfile((x) => ({
          ...x,
          handle: user?.email ? user.email.split("@")[0] : "you",
        }));
      }
    })();
  }, [uid, loading, user?.email]);

  async function onPickPhoto(e) {
    const f = e.target.files?.[0];
    if (!f || !uid) return;

    if (!f.type.startsWith("image/")) return alert("Please select an image");

    setBusy(true);
    try {
      const url = await uploadProfilePhoto(uid, f);
      setProfile((p) => ({ ...p, photoURL: url }));
    } catch (err) {
      console.error(err);
      alert("Photo upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!uid) return;
    const name = profile.name.trim();
    const handle = profile.handle.trim().replace("@", "");
    const bio = profile.bio.trim();

    if (!name) return alert("Name required");
    if (!handle) return alert("Handle required");

    setBusy(true);
    try {
      await upsertMyProfile(uid, {
        name,
        handle,
        bio,
        photoURL: profile.photoURL || "",
      });
      alert("Profile updated ✅");
      nav("/profile");
    } catch (e) {
      console.error(e);
      alert(e?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="pageWrap">Loading...</div>;
  if (!uid) return <div className="pageWrap">Login required.</div>;

  return (
    <div className="editWrap">
      <div className="editCard">
        <div className="editHead">
          <h2>Edit Profile</h2>
          <button className="btnGhost" onClick={() => nav("/profile")} type="button" disabled={busy}>
            Cancel
          </button>
        </div>

        <div className="avatarRow">
          <div className="avatarBig">
            {profile.photoURL ? (
              <img src={profile.photoURL} alt="profile" />
            ) : (
              <span>{(profile.name || "Y").slice(0, 1).toUpperCase()}</span>
            )}
          </div>

          <div className="avatarActions">
            <button
              className="btnPrimary"
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
            >
              Change Photo
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={onPickPhoto}
            />
            <div className="hintText">jpg/png/webp • square looks best</div>
          </div>
        </div>

        <div className="formGrid">
          <label className="field">
            <div className="lab">Name</div>
            <input
              className="inp"
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              placeholder="Your name"
            />
          </label>

          <label className="field">
            <div className="lab">Handle</div>
            <input
              className="inp"
              value={profile.handle}
              onChange={(e) => setProfile((p) => ({ ...p, handle: e.target.value }))}
              placeholder="yourhandle"
            />
          </label>

          <label className="field full">
            <div className="lab">Bio</div>
            <textarea
              className="inp ta"
              rows={4}
              value={profile.bio}
              onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
              placeholder="Tell something about your study goal..."
            />
          </label>
        </div>

        <button className="btnPrimary fullBtn" type="button" onClick={save} disabled={busy}>
          {busy ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
