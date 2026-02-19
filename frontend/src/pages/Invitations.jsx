import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import '../Dashboard.css';

const Invitations = () => {
    const { token } = useContext(AuthContext);
    const [invites, setInvites] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInvites();
    }, []);

    const fetchInvites = async () => {
        try {
            const res = await axios.get("http://localhost:8080/api/projects/invites", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInvites(res.data);
        } catch (err) {
            console.error("Failed to fetch invites", err);
        } finally {
            setLoading(false);
        }
    };

    const handleResponse = async (inviteId, status) => {
        try {
            await axios.post(`http://localhost:8080/api/projects/invites/${inviteId}/respond?status=${status}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchInvites();
        } catch (err) {
            alert("Action failed: " + (err.response?.data?.error || "Error"));
        }
    };

    if (loading) return <div className="loading-state">Loading invitations...</div>;

    return (
        <div className="invitations-page">
            <div className="page-header">
                <h2>Project Invitations</h2>
                <p>Respond to projects you've been invited to join.</p>
            </div>

            <div className="invites-grid">
                {invites.map(invite => (
                    <div key={invite.id} className="invite-card card">
                        <div className="invite-header">
                            <div className="invite-meta">
                                <span className="role-tag">{invite.role}</span>
                                <span className="time-tag">New Invitation</span>
                            </div>
                            <h3>Invitation to Project Board</h3>
                        </div>
                        <div className="invite-body">
                            <p>You have been invited to join a project as a <strong>{invite.role}</strong>.</p>
                            {invite.message && (
                                <div className="invite-message">
                                    " {invite.message} "
                                </div>
                            )}
                        </div>
                        <div className="invite-actions">
                            <button
                                className="btn-reject"
                                onClick={() => handleResponse(invite.id, 'REJECTED')}
                            >
                                Reject
                            </button>
                            <button
                                className="btn-primary"
                                onClick={() => handleResponse(invite.id, 'ACCEPTED')}
                            >
                                Accept & Join
                            </button>
                        </div>
                    </div>
                ))}

                {invites.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon">📂</div>
                        <h3>No pending invitations</h3>
                        <p>When someone invites you to a project, it will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Invitations;
