import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import '../Dashboard.css';
import { useNavigate } from 'react-router-dom';

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

const BellIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
);

const TopNavbar = ({ title }) => {
    const { user, token } = useContext(AuthContext);
    const navigate = useNavigate();
    const [invites, setInvites] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    const displayName = user?.sub || user?.email || "User";
    const displayRole = user?.role || "Member";

    useEffect(() => {
        if (token) {
            fetchInvites();
        }
    }, [token]);

    const fetchInvites = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/projects/invites', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInvites(response.data);
        } catch (error) {
            console.error("Error fetching invites:", error);
        }
    };

    const handleInviteResponse = async (inviteId, status) => {
        try {
            await axios.post(`http://localhost:8080/api/projects/invites/${inviteId}/respond?status=${status}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchInvites();
            // Optional: refresh projects list if on Projects page
        } catch (error) {
            console.error("Error responding to invite:", error);
        }
    };

    return (
        <header className="top-navbar">
            <div className="navbar-left">
                <h1 className="navbar-title">{title}</h1>
            </div>

            <div className="navbar-center">
                <div className="search-bar">
                    <span className="search-icon"><SearchIcon /></span>
                    <input type="text" placeholder="Search bugs, projects..." />
                </div>
            </div>

            <div className="navbar-right">
                <button className="btn-primary-sm" onClick={() => navigate('/bugs')}>+ New Bug</button>
                <div className="notifications-container" style={{ position: 'relative' }}>
                    <button
                        className={`icon-btn ${invites.length > 0 ? 'has-notifications' : ''}`}
                        title="Notifications"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <BellIcon />
                        {invites.length > 0 && <span className="notification-badge">{invites.length}</span>}
                    </button>

                    {showNotifications && (
                        <div className="notifications-dropdown" style={{
                            position: 'absolute', top: '100%', right: 0,
                            width: '320px', background: 'white',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            borderRadius: '0.75rem', border: '1px solid #e2e8f0',
                            zIndex: 1000, marginTop: '0.5rem', padding: '1rem'
                        }}>
                            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#475569' }}>PRODUCT UPDATES & INVITES</h4>
                            {invites.length === 0 ? (
                                <p style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', margin: '2rem 0' }}>No new notifications</p>
                            ) : (
                                <div className="invites-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {invites.map(invite => (
                                        <div key={invite.id} style={{ fontSize: '0.85rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                                            <p style={{ margin: '0 0 0.5rem 0' }}>
                                                You've been invited to join as <strong>{invite.role}</strong>
                                            </p>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    className="page-btn active"
                                                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                                                    onClick={() => handleInviteResponse(invite.id, 'ACCEPTED')}
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    className="page-btn"
                                                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                                                    onClick={() => handleInviteResponse(invite.id, 'REJECTED')}
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div
                    className="profile-menu"
                    onClick={() => navigate('/settings')}
                    title="Go to Settings"
                >
                    <div className="user-text">
                        <span className="user-name-top">{displayName}</span>
                        <span className="user-role-top">{displayRole}</span>
                    </div>
                    <div className="avatar-sm">
                        {displayName.charAt(0).toUpperCase()}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default TopNavbar;
