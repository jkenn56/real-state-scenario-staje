import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function AgentDashboard() {
    const [stats, setStats] = useState({ totalProperties: 0, totalInquiries: 0, unreadInquiries: 0, totalViews: 0 });
    const [properties, setProperties] = useState([]);
    const [inquiries, setInquiries] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedInquiry, setSelectedInquiry] = useState(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchDashboardData(); }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, propertiesRes, inquiriesRes] = await Promise.all([
                axios.get('/api/agent/stats'),
                axios.get('/api/agent/properties'),
                axios.get('/api/agent/inquiries')
            ]);
            setStats(statsRes.data);
            setProperties(propertiesRes.data);
            setInquiries(inquiriesRes.data);
        } catch (error) {
            console.error('Failed to fetch dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleReply = async (inquiryId) => {
        try {
            await axios.post(`/api/inquiries/${inquiryId}/reply`, { reply_message: replyMessage });
            setSelectedInquiry(null);
            setReplyMessage('');
            fetchDashboardData();
        } catch (error) {
            alert('Failed to send reply');
        }
    };

    const updatePropertyStatus = async (propertyId, status) => {
        try {
            const property = properties.find(p => p.id === propertyId);
            await axios.put(`/api/listings/${propertyId}`, { 
                price: property.price, 
                location: property.location, 
                description: property.description, 
                status 
            });
            fetchDashboardData();
        } catch (error) {
            alert('Failed to update status');
        }
    };

    if (loading) return <div className="loading">Loading dashboard...</div>;

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Agent Dashboard</h1>
                <Link to="/add-listing" className="add-property-btn">+ List New Property</Link>
            </div>
            
            <div className="dashboard-tabs">
                <button className={activeTab === 'overview' ? 'tab-active' : 'tab'} onClick={() => setActiveTab('overview')}>
                    Overview
                </button>
                <button className={activeTab === 'properties' ? 'tab-active' : 'tab'} onClick={() => setActiveTab('properties')}>
                    My Properties ({properties.length})
                </button>
                <button className={activeTab === 'inquiries' ? 'tab-active' : 'tab'} onClick={() => setActiveTab('inquiries')}>
                    Inquiries ({stats.unreadInquiries} new)
                </button>
            </div>

            {activeTab === 'overview' && (
                <div>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-info">
                                <h3>{stats.totalProperties}</h3>
                                <p>Properties Listed</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-info">
                                <h3>{stats.totalInquiries}</h3>
                                <p>Total Inquiries</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-info">
                                <h3>{stats.unreadInquiries}</h3>
                                <p>Unread Messages</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-info">
                                <h3>{stats.totalViews}</h3>
                                <p>Total Views</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="recent-section">
                        <h2>Recent Properties</h2>
                        <div className="properties-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Property</th>
                                        <th>Price</th>
                                        <th>Inquiries</th>
                                        <th>Views</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {properties.slice(0, 5).map(prop => (
                                        <tr key={prop.id}>
                                            <td>{prop.location}</td>
                                            <td>{parseInt(prop.price).toLocaleString()} RWF</td>
                                            <td>{prop.inquiry_count || 0}</td>
                                            <td>{prop.view_count || 0}</td>
                                            <td>
                                                <span className={`status-badge status-${prop.status || 'available'}`}>
                                                    {prop.status === 'available' ? 'For Sale' : prop.status || 'For Sale'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'properties' && (
                <div className="properties-section">
                    <div className="properties-grid">
                        {properties.map(prop => (
                            <div key={prop.id} className="property-card-dashboard">
                                {prop.image_url && (
                                    <img src={`http://localhost:5000${prop.image_url}`} alt={prop.location} />
                                )}
                                <div className="property-info">
                                    <h3>{prop.location}</h3>
                                    <p className="price">{parseInt(prop.price).toLocaleString()} RWF</p>
                                    <div className="property-stats">
                                        <span>{prop.view_count || 0} views</span>
                                        <span>{prop.inquiry_count || 0} inquiries</span>
                                    </div>
                                    <select 
                                        value={prop.status || 'available'} 
                                        onChange={(e) => updatePropertyStatus(prop.id, e.target.value)} 
                                        className="status-select"
                                    >
                                        <option value="available">For Sale</option>
                                        <option value="sold">Sold</option>
                                        <option value="draft">Draft</option>
                                    </select>
                                    <div className="property-actions">
                                        <Link to={`/edit-property/${prop.id}`} className="edit-link">Edit</Link>
                                        <button 
                                            className="delete-link" 
                                            onClick={() => { 
                                                if (window.confirm('Delete this property?')) { 
                                                    axios.delete(`/api/listings/${prop.id}`).then(() => fetchDashboardData()); 
                                                } 
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'inquiries' && (
                <div className="inquiries-section">
                    {inquiries.map(inquiry => (
                        <div key={inquiry.id} className={`inquiry-card ${inquiry.reply_status === 'pending' ? 'unread' : ''}`}>
                            <div className="inquiry-header">
                                <div>
                                    <strong>{inquiry.user_name}</strong> interested in <strong>{inquiry.location}</strong>
                                    <span className="inquiry-date">{new Date(inquiry.created_at).toLocaleDateString()}</span>
                                </div>
                                <span className={`status-badge status-${inquiry.reply_status}`}>
                                    {inquiry.reply_status === 'pending' ? 'Pending Reply' : 'Replied'}
                                </span>
                            </div>
                            <div className="inquiry-message">
                                <p><strong>Message:</strong> {inquiry.message}</p>
                                {inquiry.reply_message && (
                                    <p className="reply-message"><strong>Your Reply:</strong> {inquiry.reply_message}</p>
                                )}
                            </div>
                            {inquiry.reply_status === 'pending' && (
                                <div className="inquiry-reply">
                                    <textarea 
                                        placeholder="Type your reply here..."
                                        value={selectedInquiry === inquiry.id ? replyMessage : ''} 
                                        onChange={(e) => { 
                                            setSelectedInquiry(inquiry.id); 
                                            setReplyMessage(e.target.value); 
                                        }} 
                                    />
                                    {selectedInquiry === inquiry.id && (
                                        <button onClick={() => handleReply(inquiry.id)}>Send Reply</button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AgentDashboard;