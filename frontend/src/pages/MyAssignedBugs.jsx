import React, { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import "./Bugs.css";

const MyAssignedBugs = () => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchBugs = async () => {
      setLoading(true);
      try {
        const res = await axios.get("http://localhost:8080/api/bugs/assigned-to-me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBugs(res.data);
      } catch (err) {
        console.error("Error fetching assigned bugs:", err);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchBugs();
  }, [token]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return bugs;
    return bugs.filter(
      (b) =>
        b.title?.toLowerCase().includes(q) ||
        b.bugId?.toLowerCase().includes(q) ||
        b.projectName?.toLowerCase().includes(q)
    );
  }, [bugs, searchTerm]);

  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">My Assigned Bugs</h1>
        <div className="header-actions">
          <div className="search-bar">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              width="20"
              height="20"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search bugs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Project</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                  Loading bugs...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                  No assigned bugs found.
                </td>
              </tr>
            ) : (
              filtered.map((bug) => (
                <tr key={bug.id}>
                  <td style={{ fontWeight: 700, color: "var(--text-secondary)" }}>{bug.bugId}</td>
                  <td style={{ fontWeight: 600 }}>{bug.title}</td>
                  <td>{bug.projectName}</td>
                  <td>
                    <span className={`status-badge status-${bug.status.toLowerCase()}`}>
                      {bug.status.replace("_", " ")}
                    </span>
                  </td>
                  <td>
                    <span className={`priority-${bug.priority.toLowerCase()}`} style={{ fontWeight: 700, fontSize: "0.75rem" }}>
                      {bug.priority}
                    </span>
                  </td>
                  <td>
                    <button className="page-btn active" onClick={() => navigate(`/bugs/${bug.id}`)}>
                      Open
                    </button>
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

export default MyAssignedBugs;
