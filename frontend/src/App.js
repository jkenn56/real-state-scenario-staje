import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import Register from './components/Register';
import ListingList from './components/ListingList';
import ListingForm from './components/ListingForm';
import Inquire from './components/Inquire';
import AgentDashboard from './components/AgentDashboard';
import UserDashboard from './components/UserDashboard';
import LandingPage from './components/LandingPage';
import './styles/App.css';
import './styles/Dashboard.css';
import './styles/LandingPage.css';

axios.defaults.baseURL = 'http://localhost:5000';
axios.defaults.withCredentials = true;

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkSession();
    }, []);

    const checkSession = async () => {
        try {
            const response = await axios.get('/api/session');
            setUser(response.data.user);
        } catch (error) {
            console.error('Session check failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await axios.post('/api/logout');
            setUser(null);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <Router>
            <div className="app">
                <nav className="navbar">
                    <div className="nav-brand">
                        <Link to="/" className="brand-link">
                            <span className="logo-icon">🏠</span>
                            <span>Integrity<span>Homes</span></span>
                        </Link>
                    </div>
                    <div className="nav-links">
                        <Link to="/">Home</Link>
                        <Link to="/properties">Properties</Link>
                        {user && <Link to="/dashboard">Dashboard</Link>}
                        {user && user.is_agent && <Link to="/add-listing">List Property</Link>}
                        {user ? (
                            <>
                                <span className="user-name">👋 {user.name}</span>
                                <button onClick={logout} className="logout-btn">Logout</button>
                            </>
                        ) : (
                            <>
                                <Link to="/login">Login</Link>
                                <Link to="/register">Register</Link>
                            </>
                        )}
                    </div>
                </nav>

                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<LandingPage user={user} />} />
                        <Route path="/properties" element={<ListingList user={user} />} />
                        <Route path="/login" element={user ? <Navigate to="/" /> : <Login setUser={setUser} />} />
                        <Route path="/register" element={user ? <Navigate to="/" /> : <Register setUser={setUser} />} />
                        <Route path="/dashboard" element={user ? (user.is_agent ? <AgentDashboard /> : <UserDashboard />) : <Navigate to="/login" />} />
                        <Route path="/add-listing" element={user && user.is_agent ? <ListingForm /> : <Navigate to="/" />} />
                        <Route path="/edit-property/:id" element={user && user.is_agent ? <ListingForm isEdit={true} /> : <Navigate to="/" />} />
                        <Route path="/inquire/:id" element={user ? <Inquire /> : <Navigate to="/login" />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </main>

                <footer className="footer">
                    <div className="footer-content">
                        <div className="footer-section">
                            <h4>HomeFinder</h4>
                            <p>Find your dream property in Rwanda</p>
                            <div className="social-links">
                                <a href="#">Facebook</a>
                                <a href="#">Twitter</a>
                                <a href="#">Instagram</a>
                                <a href="#">LinkedIn</a>
                            </div>
                        </div>
                        <div className="footer-section">
                            <h4>Quick Links</h4>
                            <Link to="/">Home</Link>
                            <Link to="/properties">Properties</Link>
                            {!user && <Link to="/login">Login</Link>}
                            {!user && <Link to="/register">Register</Link>}
                            {user && <Link to="/dashboard">Dashboard</Link>}
                        </div>
                        <div className="footer-section">
                            <h4>Contact Us</h4>
                            <p>Email: info@homefinder.rw</p>
                            <p>Phone: +250 788 123 456</p>
                            <p>Kigali, Rwanda</p>
                        </div>
                        <div className="footer-section">
                            <h4>Legal</h4>
                            <Link to="/terms">Terms of Service</Link>
                            <Link to="/privacy">Privacy Policy</Link>
                            <Link to="/faq">FAQ</Link>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>&copy; 2024 HomeFinder. All rights reserved.</p>
                    </div>
                </footer>
            </div>
        </Router>
    );
}

function NotFound() {
    return (
        <div className="not-found">
            <h1>404</h1>
            <h2>Page Not Found</h2>
            <p>The page you are looking for does not exist.</p>
            <Link to="/" className="home-link">Go Back Home</Link>
        </div>
    );
}

export default App;