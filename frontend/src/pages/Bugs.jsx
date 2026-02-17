import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import './Bugs.css';

const Bugs = () => {
    const { projectId } = useParams();
    const { token, user } = useContext(AuthContext);
    const [bugs, setBugs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchBugs();
    }, [projectId, token]);

    const fetchBugs = async () => {
        setLoading(true);
        try {
            // If projectId exists, fetch project bugs, else (optionally) all bugs if Admin
            const url = projectId
                ? `http://localhost:8080/api/projects/${projectId}/bugs`
                : `http://localhost:8080/api/bugs`; // TODO: Implement global bugs if needed

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBugs(response.data);
        } catch (error) {
            console.error("Error fetching bugs:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (bugId, newStatus) => {
        try {
            await axios.put(`http://localhost:8080/api/bugs/${bugId}/status?status=${newStatus}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchBugs();
        } catch (error) {
            alert(error.response?.data?.error || "Failed to update status");
        }
    };

    const filteredBugs = bugs.filter(b =>
        b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.bugId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="page-container">
            <header className="page-header">
                <h1 className="page-title">{projectId ? 'Project Bugs' : 'Global Bugs'}</h1>
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
                    {projectId && (
                        <button className="btn-primary-sm" onClick={() => setShowCreateModal(true)}>+ New Bug</button>
                    )}
                </div>
            </header>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Bug ID</th>
                            <th>Title</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Assignee</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading bugs...</td></tr>
                        ) : filteredBugs.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No bugs found.</td></tr>
                        ) : (
                            filteredBugs.map(bug => (
                                <tr key={bug.id}>
                                    <td style={{ fontWeight: '700', color: '#64748b' }}>{bug.bugId}</td>
                                    <td style={{ fontWeight: '600' }}>{bug.title}</td>
                                    <td>
                                        <span style={{
                                            color: bug.priority === 'HIGHEST' ? '#ef4444' :
                                                bug.priority === 'HIGH' ? '#f97316' :
                                                    bug.priority === 'MEDIUM' ? '#3b82f6' : '#22c55e',
                                            fontWeight: '700',
                                            fontSize: '0.75rem'
                                        }}>
                                            {bug.priority}
                                        </span>
                                    </td>
                                    <td>
                                        <select
                                            value={bug.status}
                                            onChange={(e) => handleStatusChange(bug.id, e.target.value)}
                                            style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}
                                        >
                                            <option value="OPEN">Open</option>
                                            <option value="IN_PROGRESS">In Progress</option>
                                            <option value="REVIEW">Review</option>
                                            <option value="TESTING">Testing</option>
                                            <option value="CLOSED">Closed</option>
                                        </select>
                                    </td>
                                    <td>{bug.assigneeName}</td>
                                    <td>
                                        <button className="icon-btn" title="View Details">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showCreateModal && (
                <CreateBugModal
                    token={token}
                    projectId={projectId}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => { setShowCreateModal(false); fetchBugs(); }}
                />
            )}
        </div>
    );
};

const CreateBugModal = ({ token, projectId, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({ title: '', description: '', priority: 'MEDIUM', projectId, assigneeId: '' });
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchMembers();
    }, [projectId]);

    const fetchMembers = async () => {
        try {
            const response = await axios.get(`http://localhost:8080/api/projects/${projectId}/members`, {
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
        try {
            await axios.post('http://localhost:8080/api/bugs', formData, {
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
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div className="modal-content" style={{ background: 'white', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '480px' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>Report New Bug</h3>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Title</label>
                        <input required type="text" style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Priority</label>
                        <select style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="HIGHEST">Highest</option>
                        </select>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Assign To</label>
                        <select style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} value={formData.assigneeId} onChange={e => setFormData({ ...formData, assigneeId: e.target.value })}>
                            <option value="">Unassigned</option>
                            {members.map(m => (
                                <option key={m.userId} value={m.userId}>{m.userName} ({m.role})</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Description</label>
                        <textarea style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', minHeight: '100px' }} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', background: 'white' }}>Cancel</button>
                        <button type="submit" disabled={loading} className="btn-primary-sm" style={{ flex: 1, padding: '0.75rem' }}>
                            {loading ? 'Submitting...' : 'Report Bug'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Bugs;
