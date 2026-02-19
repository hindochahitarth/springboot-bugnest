import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './Register.css';

const Register = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: searchParams.get('email') || '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        setError("");

        try {
            await axios.post("http://localhost:8080/api/auth/register", {
                name: formData.name,
                email: formData.email,
                password: formData.password
            });
            navigate('/login?registered=true');
        } catch (err) {
            setError(err.response?.data?.error || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-wrapper">
            <div className="register-card">
                <div className="register-brand">
                    <div className="brand-logo">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                            <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.327.196 2.23 1.356 2.23 2.69v5.113c0 3.472-1.657 6.68-4.396 8.759L14.505 21.5a3 3 0 01-3.01 0l-2.481-1.847a11.013 11.013 0 01-4.396-8.759V5.46c0-1.333.903-2.494 2.23-2.69zM13.5 10.5h-3V15h3v-4.5z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h1>Join BugNest</h1>
                    <p>Create your account to start tracking bugs</p>
                </div>

                <form onSubmit={handleSubmit} className="register-form">
                    <div className="form-group">
                        <label>Full Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            placeholder="John Doe"
                        />
                    </div>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            placeholder="name@company.com"
                            disabled={!!searchParams.get('email')}
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="form-group">
                        <label>Confirm Password</label>
                        <input
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    <button type="submit" className="register-btn" disabled={loading}>
                        {loading ? "Creating Account..." : "Register"}
                    </button>

                    {error && <div className="error-alert">{error}</div>}
                </form>

                <div className="register-footer">
                    Already have an account? <span onClick={() => navigate('/login')}>Login</span>
                </div>
            </div>
        </div>
    );
};

export default Register;
