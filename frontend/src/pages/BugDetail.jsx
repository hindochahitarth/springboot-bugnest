import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import "./Bugs.css";

const BugDetail = () => {
  const { bugId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useContext(AuthContext);

  const [bug, setBug] = useState(null);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const [commentMessage, setCommentMessage] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentLoading, setAttachmentLoading] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [bugRes, commentsRes, attachmentsRes] = await Promise.all([
          axios.get(`http://localhost:8080/api/bugs/${bugId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`http://localhost:8080/api/bugs/${bugId}/comments`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`http://localhost:8080/api/bugs/${bugId}/attachments`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setBug(bugRes.data);
        setComments(commentsRes.data);
        setAttachments(attachmentsRes.data);
      } catch (err) {
        console.error("Error loading bug detail:", err);
      } finally {
        setLoading(false);
      }
    };

    if (token && bugId) fetchAll();
  }, [token, bugId]);

  const allowedStatuses = useMemo(() => {
    const role = user?.role;
    if (!role) return [];
    if (role === "ADMIN" || role === "PROJECT_MANAGER") {
      return ["OPEN", "IN_PROGRESS", "REVIEW", "TESTING", "CLOSED"];
    }
    if (role === "DEVELOPER") {
      return ["IN_PROGRESS", "REVIEW"];
    }
    if (role === "TESTER") {
      const base = ["TESTING", "CLOSED"];
      if (bug?.status === "CLOSED") base.unshift("OPEN");
      return base;
    }
    return [];
  }, [user?.role, bug?.status]);

  const [nextStatus, setNextStatus] = useState("");
  useEffect(() => {
    if (allowedStatuses.length > 0) setNextStatus(allowedStatuses[0]);
  }, [allowedStatuses.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshComments = async () => {
    const res = await axios.get(`http://localhost:8080/api/bugs/${bugId}/comments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setComments(res.data);
  };

  const refreshAttachments = async () => {
    const res = await axios.get(`http://localhost:8080/api/bugs/${bugId}/attachments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setAttachments(res.data);
  };

  const handleUpdateStatus = async () => {
    if (!nextStatus) return;
    setStatusUpdating(true);
    try {
      await axios.put(`http://localhost:8080/api/bugs/${bugId}/status?status=${nextStatus}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const bugRes = await axios.get(`http://localhost:8080/api/bugs/${bugId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBug(bugRes.data);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update status");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    const msg = commentMessage.trim();
    if (!msg) return;
    setCommentLoading(true);
    try {
      await axios.post(
        `http://localhost:8080/api/bugs/${bugId}/comments`,
        { message: msg },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCommentMessage("");
      await refreshComments();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add comment");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleAddAttachment = async (e) => {
    e.preventDefault();
    const name = attachmentName.trim();
    const url = attachmentUrl.trim();
    if (!name || !url) return;
    setAttachmentLoading(true);
    try {
      await axios.post(
        `http://localhost:8080/api/bugs/${bugId}/attachments`,
        { name, url },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAttachmentName("");
      setAttachmentUrl("");
      await refreshAttachments();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add attachment");
    } finally {
      setAttachmentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <p style={{ color: "var(--text-secondary)" }}>Loading bug...</p>
      </div>
    );
  }

  if (!bug) {
    return (
      <div className="page-container">
        <p style={{ color: "var(--text-secondary)" }}>Bug not found or you don’t have access.</p>
        <button className="page-btn" onClick={() => navigate("/bugs")}>
          Back to Bugs
        </button>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <button className="back-btn" onClick={() => navigate(-1)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back
          </button>
          <h1 className="page-title">
            {bug.bugId}: {bug.title}
          </h1>
        </div>

        <div className="header-actions">
          <button className="page-btn" onClick={() => navigate(`/projects/${bug.projectId}/bugs`)}>
            Project Bugs
          </button>
          <button className="page-btn" onClick={() => navigate(`/projects/${bug.projectId}/kanban`)}>
            Project Board
          </button>
        </div>
      </header>

      <div className="bug-detail-grid">
        <div className="detail-section">
          <h4>Description</h4>
          <div className="detail-description">{bug.description || "No description provided."}</div>

          <h4 style={{ marginTop: "1.25rem" }}>Comments</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {comments.length === 0 ? (
              <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>No comments yet.</div>
            ) : (
              comments.map((c) => (
                <div key={c.id} style={{ padding: "0.75rem", border: "1px solid var(--border-color)", borderRadius: "0.75rem", background: "var(--card-bg)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "0.35rem" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{c.authorName}</div>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                      {c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
                    </div>
                  </div>
                  <div style={{ whiteSpace: "pre-wrap", fontSize: "0.9rem" }}>{c.message}</div>
                </div>
              ))
            )}

            <form onSubmit={handleAddComment} className="ui-form" style={{ marginTop: "0.5rem" }}>
              <div className="ui-field">
                <label>Add a comment</label>
                <textarea className="ui-textarea" value={commentMessage} onChange={(e) => setCommentMessage(e.target.value)} placeholder="Write a comment..." />
              </div>
              <div className="ui-modal-footer" style={{ justifyContent: "flex-start" }}>
                <button type="submit" disabled={commentLoading} className="ui-btn ui-btn-primary">
                  {commentLoading ? "Posting…" : "Post comment"}
                </button>
              </div>
            </form>
          </div>

          <h4 style={{ marginTop: "1.25rem" }}>Attachments</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {attachments.length === 0 ? (
              <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>No attachments yet.</div>
            ) : (
              attachments.map((a) => (
                <a
                  key={a.id}
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.65rem 0.75rem",
                    border: "1px solid var(--border-color)",
                    borderRadius: "0.75rem",
                    background: "var(--card-bg)",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{a.name}</span>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>Open</span>
                </a>
              ))
            )}

            <form onSubmit={handleAddAttachment} className="ui-form" style={{ marginTop: "0.5rem" }}>
              <div className="ui-form-row">
                <div className="ui-field">
                  <label>Name</label>
                  <input className="ui-input" value={attachmentName} onChange={(e) => setAttachmentName(e.target.value)} placeholder="e.g. Screenshot" />
                </div>
                <div className="ui-field">
                  <label>URL</label>
                  <input className="ui-input" value={attachmentUrl} onChange={(e) => setAttachmentUrl(e.target.value)} placeholder="https://…" />
                </div>
              </div>
              <div className="ui-modal-footer" style={{ justifyContent: "flex-start" }}>
                <button type="submit" disabled={attachmentLoading} className="ui-btn ui-btn-primary">
                  {attachmentLoading ? "Adding…" : "Add attachment"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="detail-sidebar">
          <div className="meta-item">
            <span className="meta-label">STATUS</span>
            <span className={`status-badge status-${bug.status.toLowerCase()}`}>{bug.status.replace("_", " ")}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">PRIORITY</span>
            <span className={`priority-${bug.priority.toLowerCase()}`} style={{ fontWeight: 700 }}>
              {bug.priority}
            </span>
          </div>
          <div className="meta-item">
            <span className="meta-label">ASSIGNEE</span>
            <span className="meta-value">{bug.assigneeName}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">REPORTER</span>
            <span className="meta-value">{bug.creatorName}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">PROJECT</span>
            <span className="meta-value">{bug.projectName}</span>
          </div>

          {allowedStatuses.length > 0 && (
            <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-color)" }}>
              <div className="meta-item" style={{ alignItems: "stretch" }}>
                <span className="meta-label">UPDATE STATUS</span>
                <select className="ui-input" value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
                  {allowedStatuses.map((s) => (
                    <option key={s} value={s}>
                      {s.replace("_", " ")}
                    </option>
                  ))}
                </select>
                <button className="ui-btn ui-btn-primary" disabled={statusUpdating} style={{ marginTop: "0.5rem" }} onClick={handleUpdateStatus}>
                  {statusUpdating ? "Updating…" : "Update"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BugDetail;

