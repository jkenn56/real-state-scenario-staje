import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

function ListingForm({ isEdit }) {
    const { id } = useParams();
    const [formData, setFormData] = useState({ price: '', location: '', description: '' });
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (isEdit && id) fetchListing();
    }, [isEdit, id]);

    const fetchListing = async () => {
        try {
            const response = await axios.get('/api/listings');
            const listing = response.data.find(l => l.id === parseInt(id));
            if (listing) {
                setFormData({ price: listing.price, location: listing.location, description: listing.description });
                if (listing.image_url) setImagePreview(`http://localhost:5000${listing.image_url}`);
            }
        } catch (error) {
            console.error('Failed to fetch listing');
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formDataToSend = new FormData();
        formDataToSend.append('price', formData.price);
        formDataToSend.append('location', formData.location);
        formDataToSend.append('description', formData.description);
        if (image) formDataToSend.append('image', image);
        
        try {
            if (isEdit && id) {
                await axios.put(`/api/listings/${id}`, formDataToSend, { headers: { 'Content-Type': 'multipart/form-data' } });
                setMessage('Property updated successfully!');
            } else {
                await axios.post('/api/listings', formDataToSend, { headers: { 'Content-Type': 'multipart/form-data' } });
                setMessage('Property listed for sale successfully!');
            }
            setTimeout(() => navigate('/dashboard'), 2000);
        } catch (error) {
            setMessage('Failed to save property');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <h2>{isEdit ? 'Edit Property' : 'List Property for Sale'}</h2>
            {message && <div className={message.includes('successfully') ? 'success' : 'error'}>{message}</div>}
            <form onSubmit={handleSubmit}>
                <input type="number" placeholder="Price (RWF)" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} required />
                <input type="text" placeholder="Location" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} required />
                <textarea placeholder="Property Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows="4" required />
                <label className="file-input-label">{imagePreview ? 'Change Image' : 'Upload Property Image'}<input type="file" accept="image/*" onChange={handleImageChange} /></label>
                {imagePreview && <div className="image-preview"><img src={imagePreview} alt="Preview" /></div>}
                <button type="submit" disabled={loading}>{loading ? 'Saving...' : (isEdit ? 'Update Property' : 'List Property')}</button>
            </form>
        </div>
    );
}

export default ListingForm;