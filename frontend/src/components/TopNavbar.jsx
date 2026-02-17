import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import ThemeContext from '../context/ThemeContext';
import '../Dashboard.css';
import { useNavigate } from 'react-router-dom';

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="22" height="22">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M3 12h2.25m.386-6.364l1.591 1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12a6.75 6.75 0 1113.5 0 6.75 6.75 0 01-13.5 0z" />
    </svg>
);

const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="22" height="22">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
);

const BellIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
);

const TopNavbar = ({ title }) => {
    const { user, token } = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);
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
            </div>

            <div className="navbar-right">

                <button
                    className="icon-btn theme-toggle"
                    onClick={toggleTheme}
                    title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                    {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                </button>

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
                            width: '320px', background: 'var(--card-bg)',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            borderRadius: '0.75rem', border: '1px solid var(--border-color)',
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
