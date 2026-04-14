import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function Inquire() {
    const { id } = useParams();
    const [message, setMessage] = useState('');
    const [listing, setListing] = useState(null);
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchListing();
    }, [id]);

    const fetchListing = async () => {
        try {
            const response = await axios.get('/api/listings');
            const found = response.data.find(l => l.id === parseInt(id));
            setListing(found);
        } catch (error) {
            console.error('Failed to fetch listing');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('/api/inquiries', { listing_id: id, message });
            setSuccess('Inquiry sent successfully! The agent will contact you soon.');
            setTimeout(() => navigate('/'), 3000);
        } catch (error) {
            alert('Failed to send inquiry');
        } finally {
            setLoading(false);
        }
    };

    if (!listing) return <div className="loading">Loading...</div>;

    return (
        <div className="inquire-container">
            <h2>Inquire About Property</h2>
            <div className="property-details">
                <h3>{listing.location}</h3>
                <p>Price: {parseInt(listing.price).toLocaleString()} RWF</p>
                <p>{listing.description}</p>
                {listing.image_url && <img src={`http://localhost:5000${listing.image_url}`} alt={listing.location} style={{ width: '100%', marginTop: '1rem', borderRadius: '8px' }} />}
            </div>
            {success ? <div className="success">{success}</div> : (
                <form onSubmit={handleSubmit}>
                    <textarea placeholder="Your message to the agent..." value={message} onChange={(e) => setMessage(e.target.value)} rows="5" required />
                    <button type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send Inquiry'}</button>
                </form>
            )}
        </div>
    );
}

export default Inquire;