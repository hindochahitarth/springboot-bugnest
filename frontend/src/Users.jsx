import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from './context/AuthContext';
import Sidebar from './components/Sidebar';
import TopNavbar from './components/TopNavbar';
import './Dashboard.css';

const Users = () => {
    const { token } = useContext(AuthContext);
    const [activeRole, setActiveRole] = useState('ADMIN');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Fetch users when role changes
    useEffect(() => {
        fetchUsers(activeRole);
    }, [activeRole]);

    const fetchUsers = async (role) => {
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:8080/api/users?role=${role}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-container">
            <Sidebar />
            <div className="main-layout">
                <TopNavbar title="User Management" />
                <main className="main-content">
                    <div className="content-wrapper">

                        {/* Header Actions */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <div className="role-tabs" style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '0.5rem' }}>
                                {['ADMIN', 'MANAGER', 'DEVELOPER', 'TESTER'].map(role => (
                                    <button
                                        key={role}
                                        onClick={() => setActiveRole(role)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            border: 'none',
                                            borderRadius: '0.375rem',
                                            background: activeRole === role ? 'white' : 'transparent',
                                            color: activeRole === role ? '#2563eb' : '#64748b',
                                            fontWeight: activeRole === role ? 600 : 500,
                                            boxShadow: activeRole === role ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {role.charAt(0) + role.slice(1).toLowerCase()}s
                                    </button>
                                ))}
                            </div>
                            <button className="btn-primary-sm" onClick={() => setShowModal(true)}>+ Add User</button>
                        </div>

                        {/* Users Table */}
                        <div className="users-card" style={{ background: 'white', borderRadius: '0.5rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <tr>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Name</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Email</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Role</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                                        <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading users...</td></tr>
                                    ) : users.length === 0 ? (
                                        <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No users found.</td></tr>
                                    ) : (
                                        users.map(user => (
                                            <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{ width: '32px', height: '32px', background: '#eff6ff', color: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.8rem' }}>
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span style={{ fontWeight: 500, color: '#1e293b' }}>{user.name}</span>
                                                </td>
                                                <td style={{ padding: '1rem', color: '#475569', fontSize: '0.9rem' }}>{user.email}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{
                                                        background: '#f1f5f9', color: '#475569', padding: '0.25rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600
                                                    }}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{
                                                        background: user.status === 'ACTIVE' ? '#ecfdf5' : '#fef2f2',
                                                        color: user.status === 'ACTIVE' ? '#059669' : '#dc2626',
                                                        padding: '0.25rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
                                                    }}>
                                                        {user.status === 'ACTIVE' ? '●' : '○'} {user.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                    <button style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 500 }}>Edit</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>

            {/* Add User Modal */}
            {showModal && (
                <AddUserModal
                    token={token}
                    role={activeRole}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => { setShowModal(false); fetchUsers(activeRole); }}
                />
            )}
        </div>
    );
};

const AddUserModal = ({ token, role, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({ name: '', email: '', mobile: '', role: role });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await axios.post('http://localhost:8080/api/users', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.error || "Failed to create user");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div style={{ background: 'white', padding: '2rem', borderRadius: '0.75rem', width: '450px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: '#1e293b' }}>Add New User</h3>

                {error && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>Full Name</label>
                        <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }} />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>Email Address</label>
                        <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }} />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>Role</label>
                        <input type="text" value={formData.role} disabled style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', background: '#f1f5f9', color: '#64748b' }} />
                    </div>

                    <div style={{ marginBottom: '1.5rem', padding: '0.75rem', background: '#eff6ff', borderRadius: '0.5rem', display: 'flex', gap: '0.75rem', alignItems: 'start' }}>
                        <span style={{ fontSize: '1.2rem' }}>ℹ️</span>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#2563eb', lineHeight: '1.4' }}>
                            A temporary password will be auto-generated and sent to the user's email address.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onClose} style={{ padding: '0.75rem 1rem', border: '1px solid #cbd5e1', background: 'white', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: 500, color: '#475569' }}>Cancel</button>
                        <button type="submit" disabled={loading} className="btn-primary-sm" style={{ padding: '0.75rem 1.5rem' }}>{loading ? 'Creating...' : 'Create User'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Users;
