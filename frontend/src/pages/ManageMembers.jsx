import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import '../Dashboard.css';

const ManageMembers = () => {
    const { projectId } = useParams();
    const { token } = useContext(AuthContext);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteData, setInviteData] = useState({ email: '', role: 'DEVELOPER', message: '' });
    const [inviteError, setInviteError] = useState("");
    const [inviteLoading, setInviteLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('accepted');

    useEffect(() => {
        fetchMembers();
    }, [projectId]);

    const fetchMembers = async () => {
        try {
            const res = await axios.get(`http://localhost:8080/api/projects/${projectId}/members`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMembers(res.data);
        } catch (err) {
            console.error("Failed to fetch members", err);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        setInviteLoading(true);
        setInviteError("");
        try {
            await axios.post(`http://localhost:8080/api/projects/${projectId}/invite`, {
                userEmail: inviteData.email,
                role: inviteData.role,
                message: inviteData.message
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowInviteModal(false);
            setInviteData({ email: '', role: 'DEVELOPER', message: '' });
            fetchMembers();
        } catch (err) {
            setInviteError(err.response?.data?.error || "Failed to send invitation");
        } finally {
            setInviteLoading(false);
        }
    };

    const handleRemove = async (memberId) => {
        if (!window.confirm("Are you sure you want to remove this member?")) return;
        try {
            await axios.delete(`http://localhost:8080/api/projects/${projectId}/members/${memberId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchMembers();
        } catch (err) {
            alert("Failed to remove member: " + (err.response?.data?.error || "Error"));
        }
    };

    const acceptedMembers = members.filter(m => m.status === 'ACCEPTED');
    const pendingInvites = members.filter(m => m.status === 'PENDING' || m.status === 'REJECTED');

    if (loading) return <div className="loading-state">Loading members...</div>;

    // Security: Is current user the owner?
    const currentUserMembership = members.find(m => m.userEmail === user?.email);
    const isOwner = user?.role === 'ADMIN' || (currentUserMembership && currentUserMembership.isProjectOwner);

    return (
        <div className="manage-members-page">
            <div className="page-header">
                <div>
                    <h2>Project Team</h2>
                    <p>Manage who has access to this project and their roles.</p>
                </div>
                <button className="btn-primary" onClick={() => setShowInviteModal(true)}>
                    + Invite Member
                </button>
            </div>

            <div className="tabs-container">
                <button
                    className={`tab-item ${activeTab === 'accepted' ? 'active' : ''}`}
                    onClick={() => setActiveTab('accepted')}
                >
                    Members ({acceptedMembers.length})
                </button>
                <button
                    className={`tab-item ${activeTab === 'pending' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pending')}
                >
                    Invitations ({pendingInvites.length})
                </button>
            </div>

            <div className="members-list-card card">
                <table>
                    <thead>
                        <tr>
                            <th>User / Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            {activeTab === 'accepted' ? <th>Joined At</th> : <th>Last Activity</th>}
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(activeTab === 'accepted' ? acceptedMembers : pendingInvites).map(member => (
                            <tr key={member.id}>
                                <td>
                                    <div className="user-info-cell">
                                        <div className="avatar-sm">
                                            {(member.userName || member.userEmail || "?").charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="user-name-bold">{member.userName || "Not yet registered"}</div>
                                            <div className="user-email-sub">{member.userEmail}</div>
                                        </div>
                                    </div>
                                </td>
                                <td><span className="role-badge">{member.role}</span></td>
                                <td>
                                    <span className={`status-pill ${member.status.toLowerCase()}`}>
                                        {member.status}
                                    </span>
                                </td>
                                <td>{member.joinedAt || "N/A"}</td>
                                <td>
                                    <button className="btn-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="16" height="16">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {(activeTab === 'accepted' ? acceptedMembers : pendingInvites).length === 0 && (
                            <tr>
                                <td colSpan="5" className="empty-table">No {activeTab} members found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showInviteModal && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h3>Invite Team Member</h3>
                        <p>Send an invitation to join this project workflow.</p>

                        <form onSubmit={handleInvite}>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    value={inviteData.email}
                                    onChange={e => setInviteData({ ...inviteData, email: e.target.value })}
                                    placeholder="colleague@company.com"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Project Role</label>
                                <select
                                    value={inviteData.role}
                                    onChange={e => setInviteData({ ...inviteData, role: e.target.value })}
                                >
                                    <option value="DEVELOPER">Developer</option>
                                    <option value="TESTER">Tester</option>
                                    {user?.role === 'ADMIN' && <option value="PROJECT_MANAGER">Project Manager</option>}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Personal Message (Optional)</label>
                                <textarea
                                    value={inviteData.message}
                                    onChange={e => setInviteData({ ...inviteData, message: e.target.value })}
                                    rows="3"
                                />
                            </div>

                            {inviteError && <div className="error-text">{inviteError}</div>}

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowInviteModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={inviteLoading}>
                                    {inviteLoading ? "Sending..." : "Send Invitation"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageMembers;
