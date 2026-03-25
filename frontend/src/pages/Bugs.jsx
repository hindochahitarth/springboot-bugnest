import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import AuthContext from '../context/AuthContext';
import './Bugs.css';

const Bugs = () => {
    const { projectId: urlProjectId } = useParams();
    const navigate = useNavigate();
    const { token, user } = useContext(AuthContext);

    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [tagFilter, setTagFilter] = useState("");
    const [severityFilter, setSeverityFilter] = useState("");
    const [overdueOnly, setOverdueOnly] = useState(false);

    const [pageData, setPageData] = useState({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedBug, setSelectedBug] = useState(null);

    const activeProjectId = urlProjectId || (selectedProjectId ? selectedProjectId : null);

    useEffect(() => {
        if (!token) return;
        fetchProjects();
    }, [token]);

    const fetchProjects = async () => {
        try {
            const response = await api.get('/api/projects');
            setProjects(response.data);
        } catch (error) {
            console.error("Error fetching projects:", error);
        }
    };

    const fetchBugsPaged = async () => {
        setLoading(true);
        try {
            const projectIdParam = urlProjectId ? urlProjectId : (selectedProjectId || undefined);
            const response = await api.get('/api/bugs/paged', {
                params: {
                    projectId: projectIdParam ? Number(projectIdParam) : undefined,
                    tag: tagFilter || undefined,
                    severity: severityFilter || undefined,
                    overdue: overdueOnly ? true : undefined,
                    page,
                    size: pageSize,
                    sort: "updatedAt",
                    dir: "desc"
                },
            });
            setPageData(response.data);
        } catch (error) {
            console.error("Error fetching bugs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token) return;
        fetchBugsPaged();
    }, [token, urlProjectId, selectedProjectId, tagFilter, severityFilter, overdueOnly, page, pageSize]);

    const bugs = pageData.content || [];

    const filteredBugs = bugs.filter(b =>
        (b.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.bugId || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isOverdue = (bug) => {
        if (!bug?.dueDate) return false;
        if (bug?.status === 'CLOSED') return false;
        const today = new Date();
        const due = new Date(bug.dueDate);
        due.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        return due < today;
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <div>
                    {urlProjectId && (
                        <button className="back-btn" onClick={() => navigate('/projects')}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" width="16" height="16">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                            </svg>
                            Back to Projects
                        </button>
                    )}
                    <h1 className="page-title">
                        {activeProjectId
                            ? `Bugs: ${projects.find(p => p.id === Number(activeProjectId))?.name || 'Project'}`
                            : 'Bugs'}
                    </h1>
                </div>

                <div className="header-actions">
                    <div className="search-bar">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search bugs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {!urlProjectId && (
                        <select className="ui-input" value={selectedProjectId} onChange={(e) => { setPage(0); setSelectedProjectId(e.target.value); }} style={{ maxWidth: 220 }}>
                            <option value="">All projects</option>
                            {projects.map(p => (
                                <option key={p.id} value={String(p.id)}>{p.name} ({p.projectKey})</option>
                            ))}
                        </select>
                    )}

                    <input
                        className="ui-input"
                        style={{ maxWidth: 180 }}
                        placeholder="Tag (e.g. ui-bug)"
                        value={tagFilter}
                        onChange={(e) => { setPage(0); setTagFilter(e.target.value); }}
                    />

                    <select className="ui-input" value={severityFilter} onChange={(e) => { setPage(0); setSeverityFilter(e.target.value); }} style={{ maxWidth: 160 }}>
                        <option value="">All severity</option>
                        <option value="MINOR">Minor</option>
                        <option value="MAJOR">Major</option>
                        <option value="BLOCKER">Blocker</option>
                        <option value="CRITICAL">Critical</option>
                    </select>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <input type="checkbox" checked={overdueOnly} onChange={(e) => { setPage(0); setOverdueOnly(e.target.checked); }} />
                        Overdue
                    </label>
                    <button className="btn-primary-sm" onClick={() => setShowCreateModal(true)}>+ Report Bug</button>
                </div>
            </header>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Tags</th>
                            <th>Severity</th>
                            <th>Priority</th>
                            <th>Due</th>
                            <th>Status</th>
                            <th>Assignee</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading bugs...</td></tr>
                        ) : filteredBugs.length === 0 ? (
                            <tr><td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>No bugs found.</td></tr>
                        ) : (
                            filteredBugs.map(bug => (
                                <tr key={bug.id} style={isOverdue(bug) ? { background: 'rgba(239, 68, 68, 0.06)' } : undefined}>
                                    <td style={{ fontWeight: '700', color: 'var(--text-secondary)' }}>{bug.bugId}</td>
                                    <td style={{ fontWeight: '600' }}>{bug.title}</td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{(bug.tags || []).slice(0, 3).join(', ') || '-'}</td>
                                    <td style={{ fontWeight: 700 }}>{bug.severity || 'MINOR'}</td>
                                    <td>
                                        <span className={`priority-${bug.priority.toLowerCase()}`} style={{ fontWeight: '700', fontSize: '0.75rem' }}>
                                            {bug.priority}
                                        </span>
                                    </td>
                                    <td style={{ color: isOverdue(bug) ? '#ef4444' : 'var(--text-secondary)', fontWeight: isOverdue(bug) ? 800 : 500 }}>
                                        {bug.dueDate || '-'}
                                    </td>
                                    <td>
                                        <span className={`status-badge status-${bug.status.toLowerCase()}`}>
                                            {bug.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td>{bug.assigneeName}</td>
                                    <td>
                                        <div className="action-btns">
                                            <button className="icon-btn" title="Open Bug Page" onClick={() => navigate(`/bugs/${bug.id}`)}>
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '0.85rem' }}>
                    Showing {bugs.length} of {pageData.totalElements} bugs
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button className="page-btn" disabled={page <= 0} onClick={() => setPage(p => Math.max(0, p - 1))}>Prev</button>
                    <span style={{ fontSize: '0.85rem' }}>Page {pageData.page + 1} / {Math.max(1, pageData.totalPages || 1)}</span>
                    <button className="page-btn" disabled={pageData.totalPages ? (pageData.page >= pageData.totalPages - 1) : true} onClick={() => setPage(p => p + 1)}>Next</button>
                    <select className="ui-input" value={pageSize} onChange={(e) => { setPage(0); setPageSize(Number(e.target.value)); }} style={{ maxWidth: 110 }}>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            </div>

            {showCreateModal && (
                <CreateBugModal
                    projectId={activeProjectId}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        setPage(0);
                        fetchBugsPaged();
                    }}
                />
            )}

            {showEditModal && selectedBug && (
                <EditBugModal
                    bug={selectedBug}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={() => {
                        setShowEditModal(false);
                        fetchBugsPaged();
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

const EditBugModal = ({ bug, onClose, onSuccess }) => {
    const { user } = useContext(AuthContext);
    const canAssign = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER';
    const [formData, setFormData] = useState({
        title: bug.title,
        description: bug.description,
        priority: bug.priority,
        severity: bug.severity || 'MINOR',
        tagsText: (bug.tags || []).join(', '),
        dueDate: bug.dueDate || '',
        assigneeId: bug.assigneeId || '',
        status: bug.status,
        resolutionNotes: bug.resolutionNotes || ''
    });
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [suggestingPriority, setSuggestingPriority] = useState(false);

    useEffect(() => {
        fetchMembers();
    }, [bug.projectId]);

    const suggestPriorityAi = async () => {
        setSuggestingPriority(true);
        try {
            const { data } = await api.post('/api/ai/bugs/suggest-priority', {
                title: formData.title,
                description: formData.description,
            });
            if (data?.priority) {
                setFormData((prev) => ({ ...prev, priority: data.priority }));
            }
        } catch (e) {
            alert(e.response?.data?.error || 'Could not suggest priority');
        } finally {
            setSuggestingPriority(false);
        }
    };

    const fetchMembers = async () => {
        try {
            const response = await api.get(`/api/projects/${bug.projectId}/members`);
            setMembers(response.data.filter(m => m.status === 'ACCEPTED'));
        } catch (error) {
            console.error("Error fetching members:", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const tags = formData.tagsText
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
        const payload = {
            ...formData,
            assigneeId: formData.assigneeId === "" ? null : Number(formData.assigneeId)
        };
        payload.tags = tags;
        if (!payload.dueDate) payload.dueDate = null;

        try {
            await api.put(`/api/bugs/${bug.id}`, payload);
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
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <select className="ui-input" style={{ flex: 1 }} value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                        <option value="HIGHEST">Highest</option>
                                    </select>
                                    <button type="button" className="btn-primary-sm" disabled={suggestingPriority || !formData.title?.trim()} onClick={suggestPriorityAi} title="Suggest from title & description">
                                        {suggestingPriority ? '…' : 'AI'}
                                    </button>
                                </div>
                            </div>
                            <div className="ui-field">
                                <label>Severity</label>
                                <select className="ui-input" value={formData.severity} onChange={e => setFormData({ ...formData, severity: e.target.value })}>
                                    <option value="MINOR">Minor</option>
                                    <option value="MAJOR">Major</option>
                                    <option value="BLOCKER">Blocker</option>
                                    <option value="CRITICAL">Critical</option>
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

                        {formData.status === 'CLOSED' && (
                            <div className="ui-field">
                                <label>Resolution notes (required to close)</label>
                                <textarea required className="ui-textarea" value={formData.resolutionNotes} onChange={e => setFormData({ ...formData, resolutionNotes: e.target.value })} placeholder="Root cause + fix summary..." />
                            </div>
                        )}

                        <div className="ui-form-row">
                            <div className="ui-field">
                                <label>Due date</label>
                                <input type="date" className="ui-input" value={formData.dueDate || ''} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} />
                            </div>
                            <div className="ui-field">
                                <label>Tags (comma-separated)</label>
                                <input className="ui-input" value={formData.tagsText} onChange={e => setFormData({ ...formData, tagsText: e.target.value })} placeholder="frontend, regression" />
                            </div>
                        </div>

                        <div className="ui-field">
                            <label>Assign to</label>
                            <select
                                className="ui-input"
                                value={formData.assigneeId}
                                disabled={!canAssign}
                                onChange={e => setFormData({ ...formData, assigneeId: e.target.value })}
                            >
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

const CreateBugModal = ({ projectId, onClose, onSuccess }) => {
    const { user } = useContext(AuthContext);
    const canAssign = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER';
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'MEDIUM',
        severity: 'MINOR',
        tagsText: '',
        dueDate: '',
        projectId: projectId || '',
        assigneeId: ''
    });
    const [projects, setProjects] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [suggestingPriority, setSuggestingPriority] = useState(false);

    useEffect(() => {
        if (!projectId) {
            fetchProjects();
        } else {
            fetchMembers(projectId);
        }
    }, [projectId]);

    const suggestPriorityAi = async () => {
        setSuggestingPriority(true);
        try {
            const { data } = await api.post('/api/ai/bugs/suggest-priority', {
                title: formData.title,
                description: formData.description,
            });
            if (data?.priority) {
                setFormData((prev) => ({ ...prev, priority: data.priority }));
            }
        } catch (e) {
            alert(e.response?.data?.error || 'Could not suggest priority');
        } finally {
            setSuggestingPriority(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const response = await api.get('/api/projects');
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
            const response = await api.get(`/api/projects/${pId}/members`);
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
        const tags = formData.tagsText
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
        const payload = {
            ...formData,
            assigneeId: formData.assigneeId === "" ? null : Number(formData.assigneeId),
            projectId: Number(formData.projectId)
        };
        payload.tags = tags;
        if (!payload.dueDate) payload.dueDate = null;

        try {
            await api.post('/api/bugs', payload);
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
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <select className="ui-input" style={{ flex: 1 }} value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                        <option value="HIGHEST">Highest</option>
                                    </select>
                                    <button type="button" className="btn-primary-sm" disabled={suggestingPriority || !formData.title?.trim()} onClick={suggestPriorityAi} title="Suggest from title & description">
                                        {suggestingPriority ? '…' : 'AI'}
                                    </button>
                                </div>
                            </div>
                            <div className="ui-field">
                                <label>Severity</label>
                                <select className="ui-input" value={formData.severity} onChange={e => setFormData({ ...formData, severity: e.target.value })}>
                                    <option value="MINOR">Minor</option>
                                    <option value="MAJOR">Major</option>
                                    <option value="BLOCKER">Blocker</option>
                                    <option value="CRITICAL">Critical</option>
                                </select>
                            </div>
                            <div className="ui-field">
                                <label>Assignee</label>
                                <select
                                    className="ui-input"
                                    value={canAssign ? formData.assigneeId : ''}
                                    disabled={!canAssign}
                                    onChange={e => setFormData({ ...formData, assigneeId: e.target.value })}
                                >
                                    <option value="">Unassigned</option>
                                    {members.map(m => (
                                        <option key={m.userId} value={m.userId}>{m.userName} ({m.role})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="ui-form-row">
                            <div className="ui-field">
                                <label>Due date</label>
                                <input type="date" className="ui-input" value={formData.dueDate || ''} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} />
                            </div>
                            <div className="ui-field">
                                <label>Tags (comma-separated)</label>
                                <input className="ui-input" value={formData.tagsText} onChange={e => setFormData({ ...formData, tagsText: e.target.value })} placeholder="frontend, ui-bug" />
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
