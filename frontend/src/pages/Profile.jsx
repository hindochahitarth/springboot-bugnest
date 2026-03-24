import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import "./Bugs.css";

const Profile = () => {
  const { token } = useContext(AuthContext);
  const [me, setMe] = useState(null);
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get("http://localhost:8080/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMe(res.data);
        setFullName(res.data?.name || "");
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    };
    if (token) load();
  }, [token]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(
        "http://localhost:8080/api/users/profile",
        { fullName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMe((prev) => (prev ? { ...prev, name: fullName } : prev));
      alert("Profile updated");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">Profile</h1>
      </header>

      <div className="ui-modal" style={{ maxWidth: 720 }}>
        <div className="ui-modal-body">
          <form onSubmit={save} className="ui-form">
            <div className="ui-field">
              <label>Full name</label>
              <input className="ui-input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>

            <div className="ui-form-row">
              <div className="ui-field">
                <label>Email</label>
                <input className="ui-input" value={me?.email || ""} readOnly />
              </div>
              <div className="ui-field">
                <label>Role</label>
                <input className="ui-input" value={me?.role || ""} readOnly />
              </div>
            </div>

            <div className="ui-modal-footer">
              <button type="submit" disabled={saving} className="ui-btn ui-btn-primary" style={{ flex: 1 }}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;

