import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import './Kanban.css';

const Kanban = () => {
    const { projectId } = useParams();
    const { token } = useContext(AuthContext);
    const [bugs, setBugs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (projectId) {
            fetchBugs();
        }
    }, [projectId, token]);

    const fetchBugs = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:8080/api/projects/${projectId}/bugs`, {
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
        { id: 'OPEN', title: 'Open', color: '#ef4444' },
        { id: 'IN_PROGRESS', title: 'In Progress', color: '#3b82f6' },
        { id: 'REVIEW', title: 'Review', color: '#f59e0b' },
        { id: 'TESTING', title: 'Testing', color: '#10b981' },
        { id: 'CLOSED', title: 'Closed', color: '#64748b' },
    ];

    const getBugsByStatus = (status) => bugs.filter(bug => bug.status === status);

    return (
        <div className="page-container">
            <header className="page-header">
                <h1 className="page-title">Project Board</h1>
            </header>

            <div className="kanban-board">
                {loading ? (
                    <div style={{ textAlign: 'center', width: '100%', padding: '3rem', color: '#64748b' }}>Loading board...</div>
                ) : columns.map(column => (
                    <div key={column.id} className="kanban-column">
                        <div className="kanban-column-header">
                            <h3 className="column-title">
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: column.color }}></span>
                                {column.title}
                            </h3>
                            <span className="column-count">{getBugsByStatus(column.id).length}</span>
                        </div>
                        <div className="kanban-cards">
                            {getBugsByStatus(column.id).map(bug => (
                                <div key={bug.id} className="bug-card">
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
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{bug.assigneeName}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Kanban;
