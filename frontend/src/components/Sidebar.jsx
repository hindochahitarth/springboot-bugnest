import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import '../Dashboard.css'; // Consolidated styles

const Sidebar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    // Role-based menu filtering
    const role = user?.role || "GUEST";

    const allMenuItems = [
        { label: "Dashboard", path: `/${role.toLowerCase()}/dashboard`, icon: "📊", roles: ["ADMIN", "MANAGER", "DEVELOPER", "TESTER"] },
        { label: "Projects", path: "/projects", icon: "📁", roles: ["ADMIN", "MANAGER", "DEVELOPER"] },
        { label: "Bugs", path: "/bugs", icon: "🐛", roles: ["ADMIN", "MANAGER", "DEVELOPER", "TESTER"] },
        { label: "Kanban", path: "/kanban", icon: "📋", roles: ["ADMIN", "MANAGER", "DEVELOPER"] },
        { label: "Reports", path: "/reports", icon: "📈", roles: ["MANAGER"] },
        { label: "Users", path: "/users", icon: "👥", roles: ["ADMIN"] },
        { label: "Settings", path: "/settings", icon: "⚙️", roles: ["ADMIN", "MANAGER"] },
    ];

    const menuItems = allMenuItems.filter(item => item.roles.includes(role));

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo-icon">🐞</div>
                <span className="logo-text">BugNest</span>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section">
                    <span className="nav-label">MAIN MENU</span>
                    {menuItems.map((item) => (
                        <button
                            key={item.label}
                            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                            onClick={() => navigate(item.path)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="nav-section" style={{ marginTop: 'auto' }}>
                    <button className="nav-item logout" onClick={logout}>
                        <span className="nav-icon">🚪</span>
                        Logout
                    </button>
                </div>
            </nav>

            <div className="sidebar-footer">
                <div className="user-profile-mini">
                    <div className="avatar">{user?.sub?.charAt(0).toUpperCase() || 'U'}</div>
                    <div className="user-details">
                        <span className="user-name">{user?.sub || 'User'}</span>
                        <span className="user-role">{user?.role || 'Guest'}</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
