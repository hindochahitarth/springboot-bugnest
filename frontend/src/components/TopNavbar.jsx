import React, { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import '../Dashboard.css';
import { useNavigate } from 'react-router-dom';

const TopNavbar = ({ title }) => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const displayName = user?.sub || user?.email || "User";
    const displayRole = user?.role || "Member";

    return (
        <header className="top-navbar">
            <div className="navbar-left">
                <h1 className="navbar-title">{title}</h1>
            </div>

            <div className="navbar-center">
                <div className="search-bar">
                    <span className="search-icon">🔍</span>
                    <input type="text" placeholder="Search bugs, projects..." />
                </div>
            </div>

            <div className="navbar-right">
                <button className="btn-primary-sm">+ New Bug</button>
                <button className="icon-btn">🔔</button>
                <div
                    className="profile-menu"
                    onClick={() => navigate('/settings')}
                    style={{ cursor: 'pointer' }}
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
