import React, { useContext } from "react";
import AuthContext from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import TopNavbar from "./components/TopNavbar";
import "./Dashboard.css";

const DashboardLayout = ({ title, children }) => {
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

const SummaryCard = ({ title, value, icon, colorClass = "card-blue" }) => (
    <div className={`summary-card ${colorClass}`}>
        <div className="card-header">
            <h3 className="card-title">{title}</h3>
            <span className="card-icon">{icon}</span>
        </div>
        <div className="card-body">
            <p className="card-value">{value}</p>
        </div>
    </div>
);

export const AdminDashboard = () => (
    <DashboardLayout title="Admin Dashboard">
        <div className="dashboard-grid">
            <SummaryCard title="Total Users" value="24" icon="👥" colorClass="card-blue" />
            <SummaryCard title="Active Projects" value="8" icon="🚀" colorClass="card-green" />
            <SummaryCard title="Pending Requests" value="3" icon="⏳" colorClass="card-orange" />
            <SummaryCard title="System Health" value="98%" icon="❤️" colorClass="card-purple" />
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

const ActionCard = ({ title, desc, icon, colorClass }) => (
    <div className={`action-card ${colorClass}`}>
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
        {/* Quick Actions Grid */}
        <div className="dashboard-grid">
            <ActionCard
                title="Project List"
                desc="View and manage all projects"
                icon="📑"
                colorClass="card-blue"
            />
            <ActionCard
                title="Sprint Board"
                desc="Kanban view of current sprint"
                icon="📋"
                colorClass="card-purple"
            />
            <ActionCard
                title="Assign Bugs"
                desc="Assign bugs to team members"
                icon="👤"
                colorClass="card-green"
            />
            <ActionCard
                title="Reports & Analytics"
                desc="Charts and performance metrics"
                icon="📊"
                colorClass="card-orange"
            />
        </div>

        <div className="dashboard-split">
            {/* Active Projects */}
            <div className="content-card">
                <div className="card-header-row">
                    <h3 className="section-title">Active Projects</h3>
                    <a href="#" className="view-all-link">View all ↗</a>
                </div>
                <div className="projects-list">
                    <ProjectRow name="Frontend Redesign" members={4} progress={73} />
                    <ProjectRow name="API Gateway v2" members={3} progress={60} />
                    <ProjectRow name="Mobile App" members={3} progress={36} />
                    <ProjectRow name="Analytics Dashboard" members={2} progress={86} />
                </div>
            </div>

            {/* Team Workload */}
            <div className="content-card">
                <div className="card-header-row">
                    <h3 className="section-title">Team Workload</h3>
                    <a href="#" className="view-all-link">Assign ↗</a>
                </div>
                <div className="team-list">
                    <TeamMemberRow name="Alex Rivera" role="Developer" bugs={3} />
                    <TeamMemberRow name="Marcus Lin" role="Developer" bugs={2} />
                    <TeamMemberRow name="Priya Sharma" role="Tester" bugs={0} />
                    <TeamMemberRow name="Elena Volkov" role="Developer" bugs={2} />
                    <TeamMemberRow name="David Kim" role="Tester" bugs={0} />
                </div>
            </div>
        </div>
    </DashboardLayout>
);

export const DeveloperDashboard = () => (
    <DashboardLayout title="Developer Dashboard">
        <div className="dashboard-grid">
            <SummaryCard title="Assigned Bugs" value="5" icon="📌" colorClass="card-orange" />
            <SummaryCard title="Resolved Today" value="2" icon="✅" colorClass="card-green" />
            <SummaryCard title="Pending Review" value="1" icon="📝" colorClass="card-blue" />
        </div>
    </DashboardLayout>
);

export const TesterDashboard = () => (
    <DashboardLayout title="Tester Dashboard">
        <div className="dashboard-grid">
            <SummaryCard title="Bugs Reported" value="12" icon="🐛" colorClass="card-orange" />
            <SummaryCard title="Verified Fixes" value="8" icon="✅" colorClass="card-green" />
            <SummaryCard title="Open for Retest" value="4" icon="🔄" colorClass="card-blue" />
        </div>
    </DashboardLayout>
);
