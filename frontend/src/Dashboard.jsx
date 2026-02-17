import React, { useContext } from "react";
import AuthContext from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import TopNavbar from "./components/TopNavbar";
import "./Dashboard.css";

// SVG Icons for Cards
const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
);

const RocketIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.63 8.41m5.96 5.96a14.962 14.962 0 01-10.46 3.51m10.46-3.51a14.963 14.963 0 00-3.51-10.46M9.63 8.41a14.963 14.963 0 003.51 10.46M9.63 8.41a14.962 14.962 0 01-3.51-10.46m3.51 10.46L6.21 21M3 21l3.21-3.21m0 0a1.5 1.5 0 112.122-2.122 1.5 1.5 0 01-2.122 2.122z" />
    </svg>
);

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const HeartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
);

const PinIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const DocumentIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

const ChartBarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
);

const UserGroupIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
);

export const DashboardLayout = ({ title, children }) => {
    return (
        <div className="app-container">
            <Sidebar />
            <div className="main-layout">
                <TopNavbar title={title} />
                <main className="main-content">
                    <div className="content-wrapper">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

const SummaryCard = ({ title, value, icon, colorClass = "" }) => (
    <div className={`summary-card ${colorClass}`}>
        <div className="card-header">
            <h3 className="card-title">{title}</h3>
        </div>
        <div className="card-body">
            <p className="card-value">{value}</p>
            <span className="card-icon">{icon}</span>
        </div>
    </div>
);

export const AdminDashboard = () => (
    <DashboardLayout title="Admin Dashboard">
        <div className="dashboard-grid">
            <SummaryCard title="Total Users" value="24" icon={<UsersIcon />} />
            <SummaryCard title="Active Projects" value="8" icon={<RocketIcon />} />
            <SummaryCard title="Pending Requests" value="3" icon={<ClockIcon />} />
            <SummaryCard title="System Health" value="98%" icon={<HeartIcon />} colorClass="card-health" />
        </div>

        <div className="recent-activities-card">
            <h3 className="section-title">Recent Activities</h3>
            <div className="empty-state">
                <p>No recent system activities found.</p>
                <button className="btn-secondary">View All Logs</button>
            </div>
        </div>
    </DashboardLayout>
);

// --- Manager Dashboard Components ---

const ActionCard = ({ title, desc, icon }) => (
    <div className="action-card">
        <div className="action-icon">{icon}</div>
        <div className="action-details">
            <h3 className="action-title">{title}</h3>
            <p className="action-desc">{desc}</p>
        </div>
    </div>
);

const ProjectRow = ({ name, members, progress }) => (
    <div className="project-row">
        <div className="project-info">
            <h4 className="project-name">{name}</h4>
            <span className="project-members">{members} members</span>
        </div>
        <div className="project-progress">
            <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="progress-text">{progress}%</span>
        </div>
    </div>
);

const TeamMemberRow = ({ name, role, bugs }) => (
    <div className="team-row">
        <div className="member-info">
            <div className="member-avatar">{name.charAt(0)}</div>
            <div>
                <h4 className="member-name">{name}</h4>
                <div className="member-role">{role}</div>
            </div>
        </div>
        <div className="member-stats">
            <span className="bug-count">{bugs} bugs</span>
        </div>
    </div>
);

export const ManagerDashboard = () => (
    <DashboardLayout title="Manager Dashboard">
        <div className="dashboard-grid">
            <SummaryCard title="Active Projects" value="8" icon={<RocketIcon />} />
            <SummaryCard title="Pending Bugs" value="14" icon={<ClockIcon />} />
            <SummaryCard title="Bugs Resolved" value="32" icon={<CheckIcon />} />
        </div>

        <div className="recent-activities-card">
            <h3 className="section-title">Recent Activities</h3>
            <div className="empty-state">
                <p>No recent project activities found.</p>
                <button className="btn-secondary">View All Logs</button>
            </div>
        </div>
    </DashboardLayout>
);

export const DeveloperDashboard = () => (
    <DashboardLayout title="Developer Dashboard">
        <div className="dashboard-grid">
            <SummaryCard title="Assigned Bugs" value="5" icon={<PinIcon />} />
            <SummaryCard title="Resolved Today" value="2" icon={<CheckIcon />} />
            <SummaryCard title="Pending Review" value="1" icon={<DocumentIcon />} />
        </div>
    </DashboardLayout>
);

export const TesterDashboard = () => (
    <DashboardLayout title="Tester Dashboard">
        <div className="dashboard-grid">
            <SummaryCard title="Bugs Reported" value="12" icon={<ChartBarIcon />} />
            <SummaryCard title="Verified Fixes" value="8" icon={<CheckIcon />} />
            <SummaryCard title="Open for Retest" value="4" icon={<ClockIcon />} />
        </div>
    </DashboardLayout>
);

// KanbanIcon for reuse in Quick Actions
const KanbanIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0018 4.5h-2.25m-6.75 0H6.75A2.25 2.25 0 004.5 6.75v12a2.25 2.25 0 002.25 2.25h2.25m10.5-15v15m-10.5-15v15" />
    </svg>
);
