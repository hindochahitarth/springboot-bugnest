import React, { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import AuthContext from "../context/AuthContext";

const apiBase = "http://localhost:8080";

const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

const AdminSystemReports = () => {
  const { token } = useContext(AuthContext);
  const [tab, setTab] = useState("projects"); // projects | users
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${apiBase}/api/admin/reports/${tab}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to load report");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, tab]);

  const exportCsv = async () => {
    try {
      const res = await axios.get(`${apiBase}/api/admin/reports/${tab}/export`, {
        responseType: "blob",
        headers: { Authorization: `Bearer ${token}` }
      });
      const filename = tab === "projects" ? "project-report.csv" : "user-report.csv";
      downloadBlob(res.data, filename);
    } catch (e) {
      alert(e?.response?.data?.error || "Failed to export CSV");
    }
  };

  const columns = useMemo(() => {
    if (tab === "projects") {
      return [
        { key: "projectKey", label: "Key" },
        { key: "projectName", label: "Project" },
        { key: "status", label: "Status" },
        { key: "memberCount", label: "Members" },
        { key: "totalBugs", label: "Total" },
        { key: "openBugs", label: "Open" },
        { key: "closedBugs", label: "Closed" },
        { key: "overdueOpenBugs", label: "Overdue" },
        { key: "criticalOpenBugs", label: "Critical" }
      ];
    }
    return [
      { key: "name", label: "User" },
      { key: "email", label: "Email" },
      { key: "role", label: "Role" },
      { key: "createdBugs", label: "Created" },
      { key: "assignedOpenBugs", label: "Assigned Open" },
      { key: "assignedClosedBugs", label: "Assigned Closed" },
      { key: "assignedOverdueOpenBugs", label: "Assigned Overdue" }
    ];
  }, [tab]);

  return (
    <div style={{ padding: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0 }}>System Reports</h2>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-secondary)" }}>Per-project and per-user metrics with CSV export.</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button className={tab === "projects" ? "btn-primary-sm" : "btn-secondary"} style={tab === "projects" ? { padding: "0.65rem 1rem" } : {}} onClick={() => setTab("projects")}>Per Project</button>
          <button className={tab === "users" ? "btn-primary-sm" : "btn-secondary"} style={tab === "users" ? { padding: "0.65rem 1rem" } : {}} onClick={() => setTab("users")}>Per User</button>
          <button className="btn-secondary" onClick={exportCsv}>Export CSV</button>
        </div>
      </div>

      {loading && <p style={{ marginTop: "1rem" }}>Loading report...</p>}
      {error && <p style={{ marginTop: "1rem", color: "#ef4444", fontWeight: 800 }}>{error}</p>}

      {!loading && !error && (
        <div style={{ marginTop: "1rem", background: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns.length}, minmax(120px, 1fr))`, gap: "0.75rem", padding: "0.75rem 1rem", borderBottom: "1px solid var(--border-color)", fontWeight: 900, color: "var(--text-secondary)" }}>
            {columns.map((c) => <div key={c.key}>{c.label}</div>)}
          </div>

          {rows.length === 0 && <div style={{ padding: "1rem" }}>No data.</div>}

          {rows.map((r, idx) => (
            <div key={r.projectId || r.userId || idx} style={{ display: "grid", gridTemplateColumns: `repeat(${columns.length}, minmax(120px, 1fr))`, gap: "0.75rem", padding: "0.85rem 1rem", borderBottom: "1px solid var(--border-color)" }}>
              {columns.map((c) => (
                <div key={c.key} style={{ fontWeight: c.key.endsWith("Bugs") ? 900 : 700 }}>
                  {r?.[c.key] ?? "—"}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSystemReports;
