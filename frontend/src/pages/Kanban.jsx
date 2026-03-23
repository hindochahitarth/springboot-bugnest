import React, { useMemo, useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import './Kanban.css';
import './Bugs.css';

const Kanban = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { token } = useContext(AuthContext);
    const [bugs, setBugs] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!token) return;

        if (projectId) {
            fetchBugs(projectId);
            return;
        }

        fetchProjects();
    }, [projectId, token]);

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

    const columns = [
        { id: 'OPEN', title: 'Open' },
        { id: 'IN_PROGRESS', title: 'In Progress' },
        { id: 'REVIEW', title: 'Review' },
        { id: 'TESTING', title: 'Testing' },
        { id: 'CLOSED', title: 'Closed' },
    ];

    const getBugsByStatus = (status) => bugs.filter(bug => bug.status === status);

    const filteredProjects = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return projects;
        return projects.filter(p =>
            p.name?.toLowerCase().includes(q) ||
            p.projectKey?.toLowerCase().includes(q)
        );
    }, [projects, searchTerm]);

    return (
        <div className="page-container">
            <header className="page-header">
                <div>
                    {projectId && (
                        <button className="back-btn" onClick={() => navigate('/kanban')}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" width="16" height="16">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                            </svg>
                            Back to Project Selection
                        </button>
                    )}
                    <h1 className="page-title">{projectId ? 'Project Board' : 'Project Board (Select a project)'}</h1>
                </div>

                {!projectId && (
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
                    </div>
                )}
            </header>

            {!projectId ? (
                <div className="projects-grid">
                    {loading ? (
                        <div style={{ textAlign: 'center', width: '100%', padding: '3rem', color: 'var(--text-secondary)' }}>Loading projects...</div>
                    ) : (
                        <>
                            {filteredProjects.map(project => (
                                <div key={project.id} className="project-card" onClick={() => navigate(`/projects/${project.id}/kanban`)}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <h3>{project.name}</h3>
                                        <div className="project-key">{project.projectKey}</div>
                                    </div>
                                    <div style={{ marginTop: 'auto', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        Click to open Kanban board
                                    </div>
                                </div>
                            ))}
                            {projects.length === 0 && <p className="empty-state">No projects found. Join a project to view its board.</p>}
                        </>
                    )}
                </div>
            ) : (
                <div className="kanban-board">
                    {loading ? (
                        <div style={{ textAlign: 'center', width: '100%', padding: '3rem', color: 'var(--text-secondary)' }}>Loading board...</div>
                    ) : columns.map(column => (
                        <div key={column.id} className="kanban-column">
                            <div className="kanban-column-header">
                                <h3 className="column-title">
                                    <span className={`kanban-dot kanban-dot-${column.id.toLowerCase()}`} />
                                    {column.title}
                                </h3>
                                <span className="column-count">{getBugsByStatus(column.id).length}</span>
                            </div>
                            <div className="kanban-cards">
                                {getBugsByStatus(column.id).map(bug => (
                                    <div key={bug.id} className="bug-card" role="button" tabIndex={0} onClick={() => navigate(`/bugs/${bug.id}`)}>
                                        <div className="bug-card-header">
                                            <span className="bug-id">{bug.bugId}</span>
                                            <span style={{
                                                fontSize: '0.65rem',
                                                fontWeight: '700',
                                                color: bug.priority === 'HIGHEST' ? '#ef4444' :
                                                    bug.priority === 'HIGH' ? '#f97316' :
                                                        bug.priority === 'MEDIUM' ? '#3b82f6' : '#22c55e'
                                            }}>{bug.priority}</span>
                                        </div>
                                        <h4 className="bug-card-title">{bug.title}</h4>
                                        <div className="bug-card-footer">
                                            <div className="avatar-sm" style={{ width: '24px', height: '24px', fontSize: '0.7rem' }}>
                                                {bug.assigneeName?.charAt(0) || '?'}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{bug.assigneeName}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Kanban;
