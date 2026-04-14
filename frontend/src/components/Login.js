import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Login({ setUser }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await axios.post('/api/login', { email, password });
            setUser(response.data.user);
            navigate('/');
        } catch (error) {
            setError(error.response?.data?.error || 'Wrong email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h2>Welcome Back</h2>
            {error && <div className="error">{error}</div>}
            <form onSubmit={handleSubmit}>
                <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit" disabled={loading}>{loading ? 'Please wait...' : 'Sign In'}</button>
            </form>
            <p className="demo-note">Demo accounts:<br />Agent: agent@test.com / agent123<br />User: user@test.com / user123</p>
            <p style={{ textAlign: 'center', marginTop: '1rem' }}>New here? <Link to="/register">Create Account</Link></p>
        </div>
    );
}

export default Login;