import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from './context/AuthContext';
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
        <div className="page-container">
            <header className="page-header">
                <div className="role-tabs" style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '0.5rem' }}>
                    {['ADMIN', 'MANAGER', 'DEVELOPER', 'TESTER'].map(role => (
                        <button
                            key={role}
                            className={`page-btn ${activeRole === role ? 'active' : ''}`}
                            onClick={() => setActiveRole(role)}
                            style={{
                                padding: '0.5rem 1rem',
                                border: 'none',
                                boxShadow: activeRole === role ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            {role.charAt(0) + role.slice(1).toLowerCase()}s
                        </button>
                    ))}
                </div>
                <button className="btn-primary-sm" onClick={() => setShowModal(true)}>+ Add User</button>
            </header>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>User Name</th>
                            <th>Email Address</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading users...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>No users found in this category.</td></tr>
                        ) : (
                            users.map(user => (
                                <tr key={user.id}>
                                    <td style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div className="avatar-sm" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span style={{ fontWeight: 600 }}>{user.name}</span>
                                    </td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className="badge badge-gray">{user.role}</span>
                                    </td>
                                    <td>
                                        <span className={`badge ${user.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                                            {user.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="icon-btn" title="Edit">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '480px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Add New User</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="24" height="24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {error && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 500 }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>Full Name</label>
                        <input required type="text" placeholder="e.g. John Doe" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', outline: 'none', transition: 'border-color 0.2s' }} />
                    </div>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>Email Address</label>
                        <input required type="email" placeholder="john@example.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', outline: 'none' }} />
                    </div>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>User Role</label>
                        <input type="text" value={formData.role} disabled style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', background: '#f8fafc', color: '#64748b', fontWeight: 500 }} />
                    </div>

                    <div style={{ marginBottom: '2rem', padding: '1rem', background: '#eff6ff', borderRadius: '0.75rem', border: '1px solid #dbeafe', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#3b82f6" width="24" height="24" style={{ flexShrink: 0 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                        </svg>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#1e40af', fontWeight: 500, lineHeight: '1.5' }}>
                            A temporary password will be auto-generated and sent to the user's email address for their first login.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.75rem', border: '1px solid #e2e8f0', background: 'white', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600, color: '#475569' }}>Cancel</button>
                        <button type="submit" disabled={loading} className="btn-primary-sm" style={{ flex: 1, padding: '0.75rem', fontSize: '0.95rem' }}>
                            {loading ? 'Creating...' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Users;
