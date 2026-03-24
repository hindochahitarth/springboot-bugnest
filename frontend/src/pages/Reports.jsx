import React, { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import "./Bugs.css";

const Reports = () => {
  const { token } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [statsRes, bugsRes] = await Promise.all([
          axios.get("http://localhost:8080/api/stats/dashboard", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:8080/api/bugs", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setStats(statsRes.data);
        setBugs(bugsRes.data);
      } catch (err) {
        console.error("Error loading reports:", err);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchAll();
  }, [token]);

  const byStatus = useMemo(() => {
    const counts = { OPEN: 0, IN_PROGRESS: 0, REVIEW: 0, TESTING: 0, CLOSED: 0 };
    for (const b of bugs) {
      if (counts[b.status] !== undefined) counts[b.status] += 1;
    }
    return counts;
  }, [bugs]);

  const rows = useMemo(() => {
    return Object.entries(byStatus).map(([status, count]) => ({ status, count }));
  }, [byStatus]);

  const maxCount = useMemo(() => {
    return Math.max(1, ...rows.map((r) => r.count));
  }, [rows]);

  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">Reports & Analytics</h1>
      </header>

      {loading ? (
        <div style={{ padding: "2rem", color: "var(--text-secondary)" }}>Loading reports...</div>
      ) : (
        <>
          <div className="dashboard-grid">
            <div className="summary-card">
              <div className="card-title">Projects</div>
              <div className="card-value">{stats?.totalProjects ?? 0}</div>
            </div>
            <div className="summary-card">
              <div className="card-title">Open Bugs</div>
              <div className="card-value">{stats?.openBugs ?? 0}</div>
            </div>
            <div className="summary-card">
              <div className="card-title">Assigned Bugs</div>
              <div className="card-value">{stats?.assignedBugs ?? 0}</div>
            </div>
            <div className="summary-card">
              <div className="card-title">Resolved</div>
              <div className="card-value">{stats?.resolvedBugs ?? 0}</div>
            </div>
          </div>

          <div className="table-container" style={{ marginTop: "1.5rem" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Count</th>
                  <th>Trend</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.status}>
                    <td>
                      <span className={`status-badge status-${r.status.toLowerCase()}`}>
                        {r.status.replace("_", " ")}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{r.count}</td>
                    <td>
                      <div
                        style={{
                          height: 10,
                          width: "100%",
                          background: "var(--border-color)",
                          borderRadius: 999,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${Math.round((r.count / maxCount) * 100)}%`,
                            background:
                              r.status === "CLOSED"
                                ? "#22c55e"
                                : r.status === "OPEN"
                                  ? "#3b82f6"
                                  : r.status === "IN_PROGRESS"
                                    ? "#f97316"
                                    : r.status === "REVIEW"
                                      ? "#a855f7"
                                      : "#0ea5e9",
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
