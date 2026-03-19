import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import './Bugs.css';

const Bugs = () => {
    const { projectId: urlProjectId } = useParams();
    const navigate = useNavigate();
    const { token, user } = useContext(AuthContext);

    const [bugs, setBugs] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedBug, setSelectedBug] = useState(null);

    const activeProjectId = urlProjectId || selectedProjectId;

    useEffect(() => {
        if (!activeProjectId) {
            fetchProjectsAndBugs();
        } else {
            fetchBugs(activeProjectId);
        }
    }, [activeProjectId, token]);

    const fetchProjectsAndBugs = async () => {
        setLoading(true);
        try {
            // Fetch all projects and all bugs to show counts
            const [projRes, bugRes] = await Promise.all([
                axios.get('http://localhost:8080/api/projects', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:8080/api/bugs', { headers: { Authorization: `Bearer ${token}` } })
            ]);

            setProjects(projRes.data);
            setBugs(bugRes.data);
        } catch (error) {
            console.error("Error fetching projects/bugs:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBugs = async (pId) => {
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:8080/api/projects/${pId}/bugs`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBugs(response.data);
        } catch (error) {
            console.error("Error fetching bugs:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (urlProjectId) {
            navigate('/projects');
        } else {
            setSelectedProjectId(null);
        }
    };

    const filteredBugs = bugs.filter(b =>
        b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.bugId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getProjectBugCount = (pId) => bugs.filter(b => b.projectId === pId).length;

    if (loading && !bugs.length && !projects.length) {
        return <div className="page-container"><p>Loading...</p></div>;
    }

    return (
        <div className="page-container">
            <header className="page-header">
                <div>
                    {activeProjectId && (
                        <button className="back-btn" onClick={handleBack}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" width="16" height="16">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                            </svg>
                            Back to {urlProjectId ? 'Projects' : 'Project Selection'}
                        </button>
                    )}
                    <h1 className="page-title">
                        {activeProjectId
                            ? `Bugs: ${projects.find(p => p.id === Number(activeProjectId))?.name || 'Project'}`
                            : 'Global Bugs Control Center'}
                    </h1>
                </div>

                <div className="header-actions">
                    <div className="search-bar">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                        <input
                            type="text"
                            placeholder={activeProjectId ? "Search project bugs..." : "Search projects..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn-primary-sm" onClick={() => setShowCreateModal(true)}>+ Report Bug</button>
                </div>
            </header>

            {!activeProjectId ? (
                <div className="projects-grid">
                    {projects.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.projectKey.toLowerCase().includes(searchTerm.toLowerCase())).map(project => (
                        <div key={project.id} className="project-card" onClick={() => setSelectedProjectId(project.id)}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <h3>{project.name}</h3>
                                <div className="project-key">{project.projectKey}</div>
                            </div>
                            <div className="bug-count">
                                <span className="bug-count-pill">{getProjectBugCount(project.id)}</span>
                                Bugs Found
                            </div>
                            <div style={{ marginTop: 'auto', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                Click to view and manage bugs
                            </div>
                        </div>
                    ))}
                    {projects.length === 0 && <p className="empty-state">No projects found. Join a project to see bugs.</p>}
                </div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Title</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Assignee</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBugs.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No bugs found in this project.</td></tr>
                            ) : (
                                filteredBugs.map(bug => (
                                    <tr key={bug.id}>
                                        <td style={{ fontWeight: '700', color: 'var(--text-secondary)' }}>{bug.bugId}</td>
                                        <td style={{ fontWeight: '600' }}>{bug.title}</td>
                                        <td>
                                            <span className={`priority-${bug.priority.toLowerCase()}`} style={{ fontWeight: '700', fontSize: '0.75rem' }}>
                                                {bug.priority}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge status-${bug.status.toLowerCase()}`}>
                                                {bug.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td>{bug.assigneeName}</td>
                                        <td>
                                            <div className="action-btns">
                                                <button className="icon-btn" title="View Details" onClick={() => { setSelectedBug(bug); setShowDetailModal(true); }}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                </button>
                                                {(user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER') && (
                                                    <button className="icon-btn" title="Edit Bug" onClick={() => { setSelectedBug(bug); setShowEditModal(true); }}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                        </svg>
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
            )}

            {showCreateModal && (
                <CreateBugModal
                    token={token}
                    projectId={activeProjectId}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        if (activeProjectId) fetchBugs(activeProjectId);
                        else fetchProjectsAndBugs();
                    }}
                />
            )}

            {showDetailModal && selectedBug && (
                <BugDetailModal
                    bug={selectedBug}
                    onClose={() => setShowDetailModal(false)}
                />
            )}

            {showEditModal && selectedBug && (
                <EditBugModal
                    token={token}
                    bug={selectedBug}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={() => {
                        setShowEditModal(false);
                        fetchBugs(activeProjectId || selectedBug.projectId);
                    }}
                />
            )}
        </div>
    );
};

const BugDetailModal = ({ bug, onClose }) => {
    return (
        <div className="ui-modal-overlay" role="dialog" aria-modal="true">
            <div className="ui-modal" style={{ maxWidth: 900 }}>
                <div className="ui-modal-header">
                    <div>
                        <h3 className="ui-modal-title">{bug.title}</h3>
                        <p className="ui-modal-subtitle">{bug.bugId}</p>
                    </div>
                    <button className="ui-modal-close" onClick={onClose} aria-label="Close">×</button>
                </div>

                <div className="bug-detail-grid">
                    <div className="detail-section">
                        <h4>Description</h4>
                        <div className="detail-description">
                            {bug.description || "No description provided."}
                        </div>
                    </div>

                    <div className="detail-sidebar">
                        <div className="meta-item">
                            <span className="meta-label">STATUS</span>
                            <span className={`status-badge status-${bug.status.toLowerCase()}`}>{bug.status.replace('_', ' ')}</span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">PRIORITY</span>
                            <span className={`priority-${bug.priority.toLowerCase()}`} style={{ fontWeight: 700 }}>{bug.priority}</span>
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
                    </div>
                </div>
            </div>
        </div>
    );
};

const EditBugModal = ({ token, bug, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        title: bug.title,
        description: bug.description,
        priority: bug.priority,
        assigneeId: bug.assigneeId || '',
        status: bug.status
    });
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchMembers();
    }, [bug.projectId]);

    const fetchMembers = async () => {
        try {
            const response = await axios.get(`http://localhost:8080/api/projects/${bug.projectId}/members`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMembers(response.data.filter(m => m.status === 'ACCEPTED'));
        } catch (error) {
            console.error("Error fetching members:", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const payload = {
            ...formData,
            assigneeId: formData.assigneeId === "" ? null : Number(formData.assigneeId)
        };

        try {
            // Parallel updates if status changed
            const updates = [
                axios.put(`http://localhost:8080/api/bugs/${bug.id}`, payload, { headers: { Authorization: `Bearer ${token}` } })
            ];

            if (formData.status !== bug.status) {
                updates.push(axios.put(`http://localhost:8080/api/bugs/${bug.id}/status?status=${formData.status}`, {}, { headers: { Authorization: `Bearer ${token}` } }));
            }

            await Promise.all(updates);
            onSuccess();
        } catch (error) {
            alert(error.response?.data?.error || "Failed to update bug");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ui-modal-overlay" role="dialog" aria-modal="true">
            <div className="ui-modal" style={{ maxWidth: 640 }}>
                <div className="ui-modal-header">
                    <div>
                        <h3 className="ui-modal-title">Edit bug</h3>
                        <p className="ui-modal-subtitle">{bug.bugId}</p>
                    </div>
                    <button className="ui-modal-close" onClick={onClose} aria-label="Close">×</button>
                </div>

                <div className="ui-modal-body">
                    <form onSubmit={handleSubmit} className="ui-form">
                        <div className="ui-field">
                            <label>Title</label>
                            <input required type="text" className="ui-input" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                        </div>

                        <div className="ui-form-row">
                            <div className="ui-field">
                                <label>Priority</label>
                                <select className="ui-input" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                    <option value="HIGHEST">Highest</option>
                                </select>
                            </div>
                            <div className="ui-field">
                                <label>Status</label>
                                <select className="ui-input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                    <option value="OPEN">Open</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="REVIEW">Review</option>
                                    <option value="TESTING">Testing</option>
                                    <option value="CLOSED">Closed</option>
                                </select>
                            </div>
                        </div>

                        <div className="ui-field">
                            <label>Assign to</label>
                            <select className="ui-input" value={formData.assigneeId} onChange={e => setFormData({ ...formData, assigneeId: e.target.value })}>
                                <option value="">Unassigned</option>
                                {members.map(m => (
                                    <option key={m.userId} value={m.userId}>{m.userName} ({m.role})</option>
                                ))}
                            </select>
                        </div>

                        <div className="ui-field">
                            <label>Description</label>
                            <textarea className="ui-textarea" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                        </div>

                        <div className="ui-modal-footer">
                            <button type="button" onClick={onClose} className="ui-btn ui-btn-ghost" style={{ flex: 1 }}>Cancel</button>
                            <button type="submit" disabled={loading} className="ui-btn ui-btn-primary" style={{ flex: 1 }}>
                                {loading ? 'Updating…' : 'Save changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const CreateBugModal = ({ token, projectId, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({ title: '', description: '', priority: 'MEDIUM', projectId: projectId || '', assigneeId: '' });
    const [projects, setProjects] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!projectId) {
            fetchProjects();
        } else {
            fetchMembers(projectId);
        }
    }, [projectId]);

    const fetchProjects = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/projects', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProjects(response.data);
        } catch (error) {
            console.error("Error fetching projects:", error);
        }
    };

    const fetchMembers = async (pId) => {
        if (!pId) {
            setMembers([]);
            return;
        }
        try {
            const response = await axios.get(`http://localhost:8080/api/projects/${pId}/members`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMembers(response.data.filter(m => m.status === 'ACCEPTED'));
        } catch (error) {
            console.error("Error fetching members:", error);
            setMembers([]);
        }
    };

    const handleProjectChange = (e) => {
        const pId = e.target.value;
        setFormData({ ...formData, projectId: pId, assigneeId: '' });
        fetchMembers(pId);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const payload = {
            ...formData,
            assigneeId: formData.assigneeId === "" ? null : Number(formData.assigneeId),
            projectId: Number(formData.projectId)
        };

        try {
            await axios.post('http://localhost:8080/api/bugs', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onSuccess();
        } catch (error) {
            alert(error.response?.data?.error || "Failed to report bug");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ui-modal-overlay" role="dialog" aria-modal="true">
            <div className="ui-modal" style={{ maxWidth: 640 }}>
                <div className="ui-modal-header">
                    <div>
                        <h3 className="ui-modal-title">Report bug</h3>
                        <p className="ui-modal-subtitle">Provide title, priority, and details.</p>
                    </div>
                    <button className="ui-modal-close" onClick={onClose} aria-label="Close">×</button>
                </div>

                <div className="ui-modal-body">
                    <form onSubmit={handleSubmit} className="ui-form">
                        {!projectId && (
                            <div className="ui-field">
                                <label>Project</label>
                                <select required className="ui-input" value={formData.projectId} onChange={handleProjectChange}>
                                    <option value="">Select project</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.projectKey})</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="ui-field">
                            <label>Title</label>
                            <input required type="text" className="ui-input" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                        </div>

                        <div className="ui-form-row">
                            <div className="ui-field">
                                <label>Priority</label>
                                <select className="ui-input" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                    <option value="HIGHEST">Highest</option>
                                </select>
                            </div>
                            <div className="ui-field">
                                <label>Assignee</label>
                                <select className="ui-input" value={formData.assigneeId} onChange={e => setFormData({ ...formData, assigneeId: e.target.value })}>
                                    <option value="">Unassigned</option>
                                    {members.map(m => (
                                        <option key={m.userId} value={m.userId}>{m.userName} ({m.role})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="ui-field">
                            <label>Description</label>
                            <textarea className="ui-textarea" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                        </div>

                        <div className="ui-modal-footer">
                            <button type="button" onClick={onClose} className="ui-btn ui-btn-ghost" style={{ flex: 1 }}>Cancel</button>
                            <button type="submit" disabled={loading} className="ui-btn ui-btn-primary" style={{ flex: 1 }}>
                                {loading ? 'Submitting…' : 'Report bug'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Bugs;
