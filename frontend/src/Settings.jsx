import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import AuthContext from './context/AuthContext';
import Sidebar from './components/Sidebar';
import TopNavbar from './components/TopNavbar';
import './Dashboard.css'; // Reusing dashboard styles for consistency

const Settings = () => {
    const { user, token } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('profile');

    return (
        <div className="app-container">
            <Sidebar />
            <div className="main-layout">
                <TopNavbar title="Settings" />
                <main className="main-content">
                    <div className="content-wrapper">
                        <div className="settings-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
                            {/* Tabs */}
                            <div className="settings-tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0' }}>
                                <button
                                    className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('profile')}
                                    style={{
                                        padding: '1rem',
                                        background: 'none',
                                        border: 'none',
                                        borderBottom: activeTab === 'profile' ? '2px solid #2563eb' : '2px solid transparent',
                                        color: activeTab === 'profile' ? '#2563eb' : '#64748b',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Profile Settings
                                </button>
                                <button
                                    className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('security')}
                                    style={{
                                        padding: '1rem',
                                        background: 'none',
                                        border: 'none',
                                        borderBottom: activeTab === 'security' ? '2px solid #2563eb' : '2px solid transparent',
                                        color: activeTab === 'security' ? '#2563eb' : '#64748b',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Security Settings
                                </button>
                            </div>

                            {/* Content */}
                            {activeTab === 'profile' ? <ProfileSettings token={token} user={user} /> : <SecuritySettings token={token} />}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

const ProfileSettings = ({ token, user }) => {
    const [fullName, setFullName] = useState(user?.sub || user?.fullName || '');
    const [email] = useState(user?.email || ''); // Usually read-only
    const [role] = useState(user?.role || ''); // Read-only
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSave = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            await axios.put('http://localhost:8080/api/users/profile',
                { fullName },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage('Profile updated successfully!');
            // Ideally update context user state here
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update profile');
        }
    };

    return (
        <div className="settings-card" style={{ background: 'white', padding: '2rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>Personal Information</h3>
            <form onSubmit={handleSave}>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>Full Name</label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
                    />
                </div>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>Email Address</label>
                    <input
                        type="email"
                        value={email}
                        disabled
                        style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', background: '#f8fafc', color: '#94a3b8' }}
                    />
                </div>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>Role</label>
                    <input
                        type="text"
                        value={role}
                        disabled
                        style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', background: '#f8fafc', color: '#94a3b8' }}
                    />
                </div>

                {message && <div style={{ padding: '0.75rem', background: '#ecfdf5', color: '#047857', borderRadius: '0.375rem', marginBottom: '1rem' }}>{message}</div>}
                {error && <div style={{ padding: '0.75rem', background: '#fef2f2', color: '#b91c1c', borderRadius: '0.375rem', marginBottom: '1rem' }}>{error}</div>}

                <button type="submit" className="btn-primary-sm" style={{ padding: '0.75rem 1.5rem' }}>Save Changes</button>
            </form>
        </div>
    );
};

const SecuritySettings = ({ token }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match");
            return;
        }

        try {
            await axios.put('http://localhost:8080/api/users/change-password',
                { currentPassword, newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage('Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to change password');
        }
    };

    return (
        <div className="settings-card" style={{ background: 'white', padding: '2rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>Change Password</h3>
            <form onSubmit={handleChangePassword}>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>Current Password</label>
                    <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
                        required
                    />
                </div>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>New Password</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
                        required
                    />
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>Minimum 6 characters</p>
                </div>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>Confirm New Password</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
                        required
                    />
                </div>

                {message && <div style={{ padding: '0.75rem', background: '#ecfdf5', color: '#047857', borderRadius: '0.375rem', marginBottom: '1rem' }}>{message}</div>}
                {error && <div style={{ padding: '0.75rem', background: '#fef2f2', color: '#b91c1c', borderRadius: '0.375rem', marginBottom: '1rem' }}>{error}</div>}

                <button type="submit" className="btn-primary-sm" style={{ padding: '0.75rem 1.5rem' }}>Update Password</button>
            </form>
        </div>
    );
};

export default Settings;
