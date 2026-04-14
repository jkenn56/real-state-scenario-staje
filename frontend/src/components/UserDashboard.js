import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function UserDashboard() {
    const [favorites, setFavorites] = useState([]);
    const [inquiries, setInquiries] = useState([]);
    const [activeTab, setActiveTab] = useState('favorites');
    const [loading, setLoading] = useState(true);
    const [removeMessage, setRemoveMessage] = useState({});

    useEffect(() => { 
        fetchUserData(); 
    }, []);

    const fetchUserData = async () => {
        try {
            const [favoritesRes, inquiriesRes] = await Promise.all([
                axios.get('/api/favorites'), 
                axios.get('/api/user/inquiries')
            ]);
            setFavorites(favoritesRes.data);
            setInquiries(inquiriesRes.data);
        } catch (error) {
            console.error('Failed to fetch user data');
        } finally {
            setLoading(false);
        }
    };

    const removeFavorite = async (listingId, propertyName) => {
        if (window.confirm(`Remove "${propertyName}" from your saved properties?`)) {
            try {
                await axios.delete(`/api/favorites/${listingId}`);
                setFavorites(favorites.filter(fav => fav.id !== listingId));
                setRemoveMessage({ [listingId]: 'Removed from saved' });
                setTimeout(() => {
                    setRemoveMessage({});
                }, 2000);
            } catch (error) {
                alert('Failed to remove favorite');
            }
        }
    };

    if (loading) return <div className="loading">Loading dashboard...</div>;

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>My Dashboard</h1>
                <p className="dashboard-subtitle">Manage your saved properties and inquiries</p>
            </div>
            
            <div className="dashboard-tabs">
                <button 
                    className={activeTab === 'favorites' ? 'tab-active' : 'tab'} 
                    onClick={() => setActiveTab('favorites')}
                >
                    Saved Properties ({favorites.length})
                </button>
                <button 
                    className={activeTab === 'inquiries' ? 'tab-active' : 'tab'} 
                    onClick={() => setActiveTab('inquiries')}
                >
                    My Inquiries ({inquiries.length})
                </button>
            </div>

            {activeTab === 'favorites' && (
                <div className="favorites-section">
                    {favorites.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">🏠</div>
                            <h3>No saved properties yet</h3>
                            <p>Save properties you like and they'll appear here</p>
                            <Link to="/properties" className="browse-link">Browse Properties</Link>
                        </div>
                    ) : (
                        <div className="favorites-grid">
                            {favorites.map(property => (
                                <div key={property.id} className="favorite-card">
                                    {property.image_url && (
                                        <img 
                                            src={`http://localhost:5000${property.image_url}`} 
                                            alt={property.location}
                                            className="favorite-image"
                                        />
                                    )}
                                    <div className="favorite-info">
                                        <h3>{property.location}</h3>
                                        <p className="price">{parseInt(property.price).toLocaleString()} RWF</p>
                                        <p className="description">{property.description.substring(0, 100)}...</p>
                                        <p className="agent">Agent: {property.agent_name}</p>
                                        <div className="favorite-actions">
                                            <Link to={`/inquire/${property.id}`} className="inquire-link">
                                                Contact Agent
                                            </Link>
                                            <button 
                                                onClick={() => removeFavorite(property.id, property.location)} 
                                                className="remove-link"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        {removeMessage[property.id] && (
                                            <div className="remove-message">{removeMessage[property.id]}</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'inquiries' && (
                <div className="inquiries-section">
                    {inquiries.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">💬</div>
                            <h3>No inquiries yet</h3>
                            <p>Contact agents about properties you're interested in</p>
                            <Link to="/properties" className="browse-link">Browse Properties</Link>
                        </div>
                    ) : (
                        inquiries.map(inquiry => (
                            <div key={inquiry.id} className={`inquiry-card ${inquiry.reply_status === 'pending' ? 'waiting' : ''}`}>
                                <div className="inquiry-header">
                                    <div>
                                        <strong>{inquiry.location}</strong>
                                        <span className="inquiry-price">{parseInt(inquiry.price).toLocaleString()} RWF</span>
                                        <span className="inquiry-date">{new Date(inquiry.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <span className={`status-badge status-${inquiry.reply_status}`}>
                                        {inquiry.reply_status === 'pending' ? 'Waiting for reply' : 'Replied'}
                                    </span>
                                </div>
                                <div className="inquiry-message">
                                    <p><strong>Your message:</strong> {inquiry.message}</p>
                                    {inquiry.reply_message && (
                                        <p className="reply-message">
                                            <strong>Agent's reply:</strong> {inquiry.reply_message}
                                        </p>
                                    )}
                                </div>
                                <div className="inquiry-footer">
                                    <Link to={`/inquire/${inquiry.listing_id}`} className="follow-up-link">
                                        Send Follow-up
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

export default UserDashboard;