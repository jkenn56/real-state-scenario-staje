import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function ListingList({ user }) {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingListing, setEditingListing] = useState(null);
    const [editForm, setEditForm] = useState({ price: '', location: '', description: '' });
    const [editImage, setEditImage] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [savedProperties, setSavedProperties] = useState([]);
    const [saveMessage, setSaveMessage] = useState({});

    useEffect(() => {
        fetchListings();
        if (user && !user.is_agent) {
            fetchSavedProperties();
        }
    }, [user]);

    const fetchListings = async () => {
        try {
            const response = await axios.get('/api/listings');
            setListings(response.data);
        } catch (error) {
            console.error('Failed to fetch listings');
        } finally {
            setLoading(false);
        }
    };

    const fetchSavedProperties = async () => {
        try {
            const response = await axios.get('/api/favorites');
            setSavedProperties(response.data.map(fav => fav.id));
        } catch (error) {
            console.error('Failed to fetch saved properties');
        }
    };

    const handleSaveProperty = async (listingId) => {
        try {
            await axios.post('/api/favorites', { listing_id: listingId });
            setSavedProperties([...savedProperties, listingId]);
            setSaveMessage({ [listingId]: 'Property saved' });
            setTimeout(() => {
                setSaveMessage({});
            }, 2000);
        } catch (error) {
            setSaveMessage({ [listingId]: 'Already saved or error' });
            setTimeout(() => {
                setSaveMessage({});
            }, 2000);
        }
    };

    const handleUnsaveProperty = async (listingId) => {
        try {
            await axios.delete(`/api/favorites/${listingId}`);
            setSavedProperties(savedProperties.filter(id => id !== listingId));
            setSaveMessage({ [listingId]: 'Removed from saved' });
            setTimeout(() => {
                setSaveMessage({});
            }, 2000);
        } catch (error) {
            console.error('Failed to unsave property');
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`/api/listings/${id}`);
            fetchListings();
            setShowDeleteConfirm(null);
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to delete');
        }
    };

    const handleEdit = (listing) => {
        setEditingListing(listing);
        setEditForm({ price: listing.price, location: listing.location, description: listing.description });
        setEditImage(null);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('price', editForm.price);
        formData.append('location', editForm.location);
        formData.append('description', editForm.description);
        if (editImage) formData.append('image', editImage);
        
        try {
            await axios.put(`/api/listings/${editingListing.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            fetchListings();
            setEditingListing(null);
        } catch (error) {
            alert('Failed to update');
        }
    };

    if (loading) return <div className="loading">Loading properties...</div>;

    if (listings.length === 0) {
        return (
            <div>
                <h1>Properties for Sale</h1>
                <div className="no-listings">
                    <p>No properties listed yet.</p>
                    {user && user.is_agent && (
                        <p style={{ marginTop: '1rem' }}>
                            <Link to="/add-listing" style={{ color: '#0066cc', fontWeight: 'bold' }}>List your first property</Link>
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div>
            <h1>Properties for Sale</h1>
            <div className="listings-grid">
                {listings.map(listing => (
                    <div key={listing.id} className="listing-card">
                        {listing.image_url && (
                            <img 
                                src={`http://localhost:5000${listing.image_url}`} 
                                alt={listing.location} 
                                className="listing-image" 
                            />
                        )}
                        <div className="listing-content">
                            <h3>{listing.location}</h3>
                            <div className="price">{parseInt(listing.price).toLocaleString()} RWF</div>
                            <div className="description">{listing.description}</div>
                            <div className="agent">Listed by {listing.agent_name}</div>
                            
                            <div className="listing-buttons">
                                {user && !user.is_agent && (
                                    savedProperties.includes(listing.id) ? (
                                        <button 
                                            onClick={() => handleUnsaveProperty(listing.id)} 
                                            className="saved-btn"
                                        >
                                            Saved
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => handleSaveProperty(listing.id)} 
                                            className="save-btn"
                                        >
                                            Save Property
                                        </button>
                                    )
                                )}
                                
                                {user && user.is_agent && user.id === listing.agent_id && (
                                    <div className="card-actions">
                                        <button onClick={() => handleEdit(listing)} className="edit-btn">Edit</button>
                                        <button onClick={() => setShowDeleteConfirm(listing.id)} className="delete-btn">Delete</button>
                                    </div>
                                )}
                                
                                {!user && (
                                    <Link to="/login" className="inquire-btn">Sign in to inquire</Link>
                                )}
                                
                                {user && !user.is_agent && (
                                    <Link to={`/inquire/${listing.id}`} className="inquire-btn">Contact Agent</Link>
                                )}
                            </div>
                            
                            {saveMessage[listing.id] && (
                                <div className="save-message">{saveMessage[listing.id]}</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {editingListing && (
                <div className="modal-overlay" onClick={() => setEditingListing(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Edit Property</h3>
                        <form onSubmit={handleUpdate}>
                            <input 
                                type="number" 
                                placeholder="Price (RWF)" 
                                value={editForm.price} 
                                onChange={(e) => setEditForm({...editForm, price: e.target.value})} 
                                required 
                            />
                            <input 
                                type="text" 
                                placeholder="Location" 
                                value={editForm.location} 
                                onChange={(e) => setEditForm({...editForm, location: e.target.value})} 
                                required 
                            />
                            <textarea 
                                placeholder="Description" 
                                value={editForm.description} 
                                onChange={(e) => setEditForm({...editForm, description: e.target.value})} 
                                rows="4" 
                                required 
                            />
                            <label className="file-input-label">
                                Change Image
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={(e) => setEditImage(e.target.files[0])} 
                                />
                            </label>
                            <div className="modal-buttons">
                                <button type="button" onClick={() => setEditingListing(null)}>Cancel</button>
                                <button type="submit">Update</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDeleteConfirm && (
                <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
                    <div className="modal-content">
                        <h3>Confirm Delete</h3>
                        <p>Are you sure you want to delete this property?</p>
                        <div className="modal-buttons">
                            <button onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
                            <button onClick={() => handleDelete(showDeleteConfirm)} className="delete-btn">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ListingList;