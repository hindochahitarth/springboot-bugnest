import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import './Projects.css';

const Projects = () => {
    const { token, user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);

    useEffect(() => {
        fetchProjects();
    }, [token]);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:8080/api/projects', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProjects(response.data);
        } catch (error) {
            console.error("Error fetching projects:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.projectKey.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const canCreate = user?.role === 'ADMIN' || user?.role === 'MANAGER';

    return (
        <div className="page-container">
            <header className="page-header">
                <h1 className="page-title">Projects</h1>
                <div className="header-actions">
                    <div className="search-bar">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {canCreate && (
                        <button className="btn-primary-sm" onClick={() => setShowCreateModal(true)}>
                            + New Project
                        </button>
                    )}
                </div>
            </header>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Project Name</th>
                            <th>Key</th>
                            <th>Owner</th>
                            <th>Members</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading projects...</td></tr>
                        ) : filteredProjects.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No projects found.</td></tr>
                        ) : (
                            filteredProjects.map(project => (
                                <tr key={project.id}>
                                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{project.name}</td>
                                    <td><code style={{ background: '#f1f5f9', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>{project.projectKey}</code></td>
                                    <td>
                                        <div className="owner-cell">
                                            <div className="avatar-xs">{project.creatorName.charAt(0)}</div>
                                            <span>{project.creatorName} {project.creatorName === user?.name ? '(You)' : ''}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="members-count">
                                            {project.memberCount} Members
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-pill ${project.status?.toLowerCase() || 'active'}`}>
                                            {project.status || 'ACTIVE'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="project-actions">
                                            <button className="icon-btn" title="View Board" onClick={() => navigate(`/projects/${project.id}/kanban`)}>
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />
                                                </svg>
                                            </button>
                                            <button className="icon-btn" title="View Bugs" onClick={() => navigate(`/projects/${project.id}/bugs`)}>
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                                </svg>
                                            </button>
                                            {(user?.role === 'ADMIN' || project.creatorName === user?.name) && (
                                                <button className="icon-btn primary" title="Manage Team" onClick={() => navigate(`/projects/${project.id}/members`)}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a5.971 5.971 0 00-.942 3.197M12 10.5a3.375 3.375 0 100-6.75 3.375 3.375 0 000 6.75zM9 18.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12 18.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM15 18.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
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

            {showCreateModal && (
                <CreateProjectModal
                    token={token}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => { setShowCreateModal(false); fetchProjects(); }}
                />
            )}

            {showMemberModal && (
                <ManageMembersModal
                    token={token}
                    project={selectedProject}
                    onClose={() => setShowMemberModal(false)}
                />
            )}
        </div>
    );
};

const CreateProjectModal = ({ token, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({ name: '', description: '', projectKey: '', status: 'ACTIVE' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('http://localhost:8080/api/projects', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onSuccess();
        } catch (error) {
            alert(error.response?.data?.error || "Failed to create project");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div className="modal-content" style={{ background: 'white', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '480px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Create New Project</h3>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Project Name</label>
                        <input required type="text" className="form-input" style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Project Key (Short Name)</label>
                        <input required type="text" maxLength="5" placeholder="e.g. BNF" style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} value={formData.projectKey} onChange={e => setFormData({ ...formData, projectKey: e.target.value.toUpperCase() })} />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Description</label>
                        <textarea className="form-input" style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', minHeight: '100px' }} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', background: 'white' }}>Cancel</button>
                        <button type="submit" disabled={loading} className="btn-primary-sm" style={{ flex: 1, padding: '0.75rem' }}>
                            {loading ? 'Creating...' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ManageMembersModal = ({ token, project, onClose }) => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inviteData, setInviteData] = useState({ userEmail: '', role: 'DEVELOPER' });

    useEffect(() => {
        fetchMembers();
    }, [project.id]);

    const fetchMembers = async () => {
        try {
            const response = await axios.get(`http://localhost:8080/api/projects/${project.id}/members`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMembers(response.data);
        } catch (error) {
            console.error("Error fetching members:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`http://localhost:8080/api/projects/${project.id}/invite`, inviteData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInviteData({ userEmail: '', role: 'DEVELOPER' });
            fetchMembers();
            alert("Invitation sent!");
        } catch (error) {
            alert(error.response?.data?.error || "Failed to invite user");
        }
    };

    return (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div className="modal-content" style={{ background: 'white', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '600px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem' }}>Manage Members: {project.name}</h3>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#64748b' }}>×</button>
                </div>

                <div style={{ marginBottom: '2rem', background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem' }}>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#475569' }}>INVITE NEW MEMBER</h4>
                    <form onSubmit={handleInvite} style={{ display: 'flex', gap: '0.75rem' }}>
                        <input required type="email" placeholder="User email" style={{ flex: 1, padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} value={inviteData.userEmail} onChange={e => setInviteData({ ...inviteData, userEmail: e.target.value })} />
                        <select style={{ padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} value={inviteData.role} onChange={e => setInviteData({ ...inviteData, role: e.target.value })}>
                            <option value="DEVELOPER">Developer</option>
                            <option value="TESTER">Tester</option>
                            <option value="MANAGER">Manager</option>
                        </select>
                        <button type="submit" className="btn-primary-sm" style={{ padding: '0.6rem 1rem' }}>Invite</button>
                    </form>
                </div>

                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <table className="data-table" style={{ fontSize: '0.9rem' }}>
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="3" style={{ textAlign: 'center', padding: '1rem' }}>Loading...</td></tr>
                            ) : members.map(member => (
                                <tr key={member.id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{member.userName}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{member.userEmail}</div>
                                    </td>
                                    <td><span className="badge badge-gray">{member.role}</span></td>
                                    <td>
                                        <span className={`badge ${member.status === 'ACCEPTED' ? 'badge-success' :
                                            member.status === 'PENDING' ? 'badge-warning' : 'badge-danger'
                                            }`}>
                                            {member.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
export default Projects;
