import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Register({ setUser }) {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', is_agent: false });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (formData.password !== formData.confirmPassword) return setError("Passwords don't match");
        if (formData.password.length < 4) return setError('Password must be at least 4 characters');
        setLoading(true);
        try {
            await axios.post('/api/register', { name: formData.name, email: formData.email, password: formData.password, is_agent: formData.is_agent });
            const loginResponse = await axios.post('/api/login', { email: formData.email, password: formData.password });
            setUser(loginResponse.data.user);
            navigate('/');
        } catch (error) {
            setError(error.response?.data?.error || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h2>Create Account</h2>
            {error && <div className="error">{error}</div>}
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Full name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                <input type="password" placeholder="Password (min 4 characters)" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                <input type="password" placeholder="Confirm password" value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} required />
                <label className="checkbox-label"><input type="checkbox" checked={formData.is_agent} onChange={(e) => setFormData({...formData, is_agent: e.target.checked})} /> I am a real estate agent</label>
                <button type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Sign Up'}</button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '1rem' }}>Already have an account? <Link to="/login">Sign In</Link></p>
        </div>
    );
}

export default Register;