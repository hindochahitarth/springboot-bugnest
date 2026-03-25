import React, { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import AuthContext from "../context/AuthContext";

const apiBase = "http://localhost:8080";

const StatusPill = ({ status }) => {
  const s = (status || "ACTIVE").toUpperCase();
  const styles = useMemo(() => {
    if (s === "ACTIVE") return { background: "#dcfce7", color: "#166534" };
    if (s === "INACTIVE") return { background: "#fee2e2", color: "#991b1b" };
    if (s === "DELETED") return { background: "#e5e7eb", color: "#374151" };
    return { background: "#e0f2fe", color: "#075985" };
  }, [s]);

  return (
    <span style={{ ...styles, padding: "0.18rem 0.55rem", borderRadius: 999, fontWeight: 800, fontSize: "0.75rem" }}>
      {s}
    </span>
  );
};

const AdminProjects = () => {
  const { token } = useContext(AuthContext);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", projectKey: "", status: "ACTIVE" });

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${apiBase}/api/admin/projects`, {
        params: { status: statusFilter },
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to load projects");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, statusFilter]);

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p?.name || "",
      description: p?.description || "",
      projectKey: p?.projectKey || "",
      status: (p?.status || "ACTIVE").toUpperCase()
    });
  };

  const closeEdit = () => {
    setEditing(null);
  };

  const saveEdit = async () => {
    if (!editing?.id) return;
    try {
      await axios.patch(`${apiBase}/api/admin/projects/${editing.id}`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      closeEdit();
      fetchProjects();
    } catch (e) {
      alert(e?.response?.data?.error || "Failed to update project");
    }
  };

  const toggleActive = async (p) => {
    const current = (p?.status || "ACTIVE").toUpperCase();
    const next = current === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await axios.patch(`${apiBase}/api/admin/projects/${p.id}`, { status: next }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProjects();
    } catch (e) {
      alert(e?.response?.data?.error || "Failed to update project status");
    }
  };

  const deleteProject = async (p) => {
    const ok = window.confirm(`Delete project "${p?.name}"?\n\nThis is a soft-delete (status=DELETED).`);
    if (!ok) return;
    try {
      await axios.delete(`${apiBase}/api/admin/projects/${p.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProjects();
    } catch (e) {
      alert(e?.response?.data?.error || "Failed to delete project");
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0 }}>Project Management</h2>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-secondary)" }}>Admin-level edit, deactivate, or delete projects.</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <label style={{ fontWeight: 800, color: "var(--text-secondary)" }}>Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: "0.45rem 0.6rem", borderRadius: 8 }}>
            <option value="ALL">All</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="DELETED">Deleted</option>
          </select>
        </div>
      </div>

      {loading && <p style={{ marginTop: "1rem" }}>Loading projects...</p>}
      {error && <p style={{ marginTop: "1rem", color: "#ef4444", fontWeight: 800 }}>{error}</p>}

      {!loading && !error && (
        <div style={{ marginTop: "1rem", background: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "140px 1.4fr 0.9fr 120px 260px", gap: "0.75rem", padding: "0.75rem 1rem", borderBottom: "1px solid var(--border-color)", fontWeight: 900, color: "var(--text-secondary)" }}>
            <div>Key</div>
            <div>Name</div>
            <div>Status</div>
            <div>Members</div>
            <div>Actions</div>
          </div>

          {projects.length === 0 && (
            <div style={{ padding: "1rem" }}>No projects found.</div>
          )}

          {projects.map((p) => (
            <div key={p.id} style={{ display: "grid", gridTemplateColumns: "140px 1.4fr 0.9fr 120px 260px", gap: "0.75rem", padding: "0.85rem 1rem", borderBottom: "1px solid var(--border-color)", alignItems: "center" }}>
              <div style={{ fontWeight: 900 }}>{p.projectKey}</div>
              <div>
                <div style={{ fontWeight: 900 }}>{p.name}</div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{p.description || "—"}</div>
              </div>
              <div><StatusPill status={p.status} /></div>
              <div style={{ fontWeight: 900 }}>{p.memberCount ?? 0}</div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button className="btn-secondary" onClick={() => openEdit(p)}>Edit</button>
                <button className="btn-secondary" onClick={() => toggleActive(p)}>
                  {String(p.status || "ACTIVE").toUpperCase() === "ACTIVE" ? "Deactivate" : "Activate"}
                </button>
                <button className="btn-reject" onClick={() => deleteProject(p)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 50
        }}>
          <div style={{ width: "min(720px, 100%)", background: "var(--card-bg)", borderRadius: 14, border: "1px solid var(--border-color)", padding: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
              <h3 style={{ margin: 0 }}>Edit Project</h3>
              <button className="btn-secondary" onClick={closeEdit}>Close</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.75rem" }}>
              <div>
                <div style={{ fontWeight: 900, marginBottom: 6 }}>Name</div>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={{ width: "100%", padding: "0.55rem 0.6rem", borderRadius: 10 }} />
              </div>
              <div>
                <div style={{ fontWeight: 900, marginBottom: 6 }}>Project Key</div>
                <input value={form.projectKey} onChange={(e) => setForm((f) => ({ ...f, projectKey: e.target.value }))} style={{ width: "100%", padding: "0.55rem 0.6rem", borderRadius: 10 }} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{ fontWeight: 900, marginBottom: 6 }}>Description</div>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={4} style={{ width: "100%", padding: "0.55rem 0.6rem", borderRadius: 10 }} />
              </div>
              <div>
                <div style={{ fontWeight: 900, marginBottom: 6 }}>Status</div>
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} style={{ width: "100%", padding: "0.55rem 0.6rem", borderRadius: 10 }}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="DELETED">DELETED</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.9rem" }}>
              <button className="btn-secondary" onClick={closeEdit}>Cancel</button>
              <button className="btn-primary-sm" style={{ padding: "0.65rem 1rem" }} onClick={saveEdit}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProjects;
