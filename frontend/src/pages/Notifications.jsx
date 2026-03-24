import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import "./Bugs.css";

const Notifications = () => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:8080/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(res.data);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchNotifications();
  }, [token]);

  const markRead = async (id) => {
    try {
      await axios.put(`http://localhost:8080/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (err) {
      alert(err.response?.data?.error || "Failed to mark as read");
    }
  };

  const openNotification = async (n) => {
    if (!n.read) await markRead(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">Notifications</h1>
        <div className="header-actions">
          <button className="page-btn" onClick={fetchNotifications}>
            Refresh
          </button>
          <button className="page-btn" onClick={() => navigate("/invites")}>
            Invitations
          </button>
        </div>
      </header>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Type</th>
              <th>Message</th>
              <th>Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                  Loading notifications...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                  No notifications yet.
                </td>
              </tr>
            ) : (
              items.map((n) => (
                <tr key={n.id} style={{ opacity: n.read ? 0.7 : 1 }}>
                  <td>
                    <span className={`status-badge status-${n.read ? "closed" : "open"}`}>
                      {n.read ? "Read" : "New"}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700 }}>{n.type}</td>
                  <td>{n.message}</td>
                  <td style={{ color: "var(--text-secondary)" }}>
                    {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                  </td>
                  <td>
                    <div className="action-btns">
                      {n.link && (
                        <button className="page-btn active" onClick={() => openNotification(n)}>
                          Open
                        </button>
                      )}
                      {!n.read && (
                        <button className="page-btn" onClick={() => markRead(n.id)}>
                          Mark read
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Notifications;

