import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const BugIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="48" height="48">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
);

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-wrapper">
            <nav className="landing-nav">
                <div className="landing-logo">
                    <div className="logo-box">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                            <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.327.196 2.23 1.356 2.23 2.69v5.113c0 3.472-1.657 6.68-4.396 8.759L14.505 21.5a3 3 0 01-3.01 0l-2.481-1.847a11.013 11.013 0 01-4.396-8.759V5.46c0-1.333.903-2.494 2.23-2.69zM13.5 10.5h-3V15h3v-4.5z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <span>BugNest</span>
                </div>
                <button className="nav-login-btn" onClick={() => navigate('/login')}>Login</button>
            </nav>

            <main className="landing-hero">
                <div className="hero-content">
                    <div className="badge-modern">V2.0 is now live</div>
                    <h1 className="hero-title">
                        Exterminate Bugs with <span className="text-gradient">Precision.</span>
                    </h1>
                    <p className="hero-subtitle">
                        BugNest is the ultimate enterprise-grade bug tracking system designed for rapid teams.
                        Assign tasks, track progress, and ship better software faster.
                    </p>
                    <div className="hero-actions">
                        <button className="btn-primary-lg" onClick={() => navigate('/login')}>Get Started for Free</button>
                        <button className="btn-outline-lg">View Documentation</button>
                    </div>
                </div>

                <div className="hero-visual">
                    <div className="glass-card main-card">
                        <div className="card-header-sim">
                            <div className="dots"><span /><span /><span /></div>
                        </div>
                        <div className="card-mock-content">
                            <div className="mock-row title-row" />
                            <div className="mock-grid">
                                <div className="mock-item" />
                                <div className="mock-item" />
                                <div className="mock-item" />
                            </div>
                            <div className="mock-row" style={{ width: '80%' }} />
                            <div className="mock-row" style={{ width: '60%' }} />
                        </div>
                    </div>
                    <div className="glass-card float-card p1">
                        <div className="float-icon"><BugIcon /></div>
                        <div className="float-text">14 Active Bugs</div>
                    </div>
                    <div className="decorative-glow" />
                </div>
            </main>

            <section className="features-section">
                <div className="feature-card">
                    <h3>Role-based Access</h3>
                    <p>Granular control for Admins, Project Managers, Developers, and Testers.</p>
                </div>
                <div className="feature-card">
                    <h3>Kanban Boards</h3>
                    <p>Visualize your workflow and drag-and-drop bugs through cycles.</p>
                </div>
                <div className="feature-card">
                    <h3>Dark Mode Support</h3>
                    <p>Work comfortably at any hour with our premium dark theme.</p>
                </div>
            </section>

            <footer className="landing-footer">
                <p>&copy; 2026 BugNest. All rights reserved. Built for modern engineering teams.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
