import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function LandingPage({ user }) {
    const [featuredListings, setFeaturedListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [priceRange, setPriceRange] = useState('');

    useEffect(() => {
        fetchListings();
    }, []);

    const fetchListings = async () => {
        try {
            const response = await axios.get('/api/listings');
            setFeaturedListings(response.data.slice(0, 6));
        } catch (error) {
            console.error('Failed to fetch listings');
        } finally {
            setLoading(false);
        }
    };

    const filteredListings = featuredListings.filter(listing => {
        const matchesSearch = listing.location.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPrice = !priceRange || 
            (priceRange === 'under500' && listing.price < 500000) ||
            (priceRange === '500to1m' && listing.price >= 500000 && listing.price <= 1000000) ||
            (priceRange === 'above1m' && listing.price > 1000000);
        return matchesSearch && matchesPrice;
    });

    return (
        <div className="landing-page">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <h1>Find Your Dream Property in Rwanda</h1>
                    <p>Discover the perfect home or investment property from our curated collection of premium listings</p>
                    
                    <div className="search-bar">
                        <input 
                            type="text" 
                            placeholder="Search by location (Kigali, Rubavu, Musanze...)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)}>
                            <option value="">All Prices</option>
                            <option value="under500">Under 500,000 RWF</option>
                            <option value="500to1m">500,000 - 1,000,000 RWF</option>
                            <option value="above1m">Above 1,000,000 RWF</option>
                        </select>
                        <button className="search-btn">Search</button>
                    </div>
                    
                    {!user && (
                        <div className="hero-cta">
                            <Link to="/register" className="cta-primary">Get Started</Link>
                            <Link to="/login" className="cta-secondary">Sign In</Link>
                        </div>
                    )}
                </div>
                <div className="hero-stats">
                    <div className="stat">
                        <h3>500+</h3>
                        <p>Properties for Sale</p>
                    </div>
                    <div className="stat">
                        <h3>50+</h3>
                        <p>Verified Agents</p>
                    </div>
                    <div className="stat">
                        <h3>1000+</h3>
                        <p>Happy Buyers</p>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <h2>Why Choose Integrity Homes?</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon"></div>
                        <h3>Verified Properties</h3>
                        <p>All properties are verified by our team for authenticity and legal compliance</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon"></div>
                        <h3>Secure Transactions</h3>
                        <p>Safe and secure communication with verified property agents</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon"></div>
                        <h3>Quick Response</h3>
                        <p>Get responses from agents within 24 hours</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon"></div>
                        <h3>Prime Locations</h3>
                        <p>Properties in the best neighborhoods across Rwanda</p>
                    </div>
                </div>
            </section>

            {/* Featured Properties */}
            <section className="featured-section">
                <div className="section-header">
                    <h2>Properties for Sale</h2>
                    <Link to="/properties" className="view-all">View All →</Link>
                </div>
                
                {loading ? (
                    <div className="loading">Loading properties...</div>
                ) : (
                    <div className="featured-grid">
                        {filteredListings.map(listing => (
                            <div key={listing.id} className="featured-card">
                                {listing.image_url && (
                                    <img 
                                        src={`http://localhost:5000${listing.image_url}`} 
                                        alt={listing.location}
                                        className="featured-image"
                                    />
                                )}
                                <div className="featured-info">
                                    <h3>{listing.location}</h3>
                                    <p className="price">{parseInt(listing.price).toLocaleString()} RWF</p>
                                    <p className="description">{listing.description.substring(0, 100)}...</p>
                                    <div className="featured-footer">
                                        <span className="agent">Listed by {listing.agent_name}</span>
                                        {user ? (
                                            <Link to={`/inquire/${listing.id}`} className="details-btn">Inquire</Link>
                                        ) : (
                                            <Link to="/login" className="details-btn">View Details</Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* How It Works */}
            <section className="how-it-works">
                <h2>How It Works</h2>
                <div className="steps">
                    <div className="step">
                        <div className="step-number">1</div>
                        <h3>Create Account</h3>
                        <p>Sign up as a buyer or agent in minutes</p>
                    </div>
                    <div className="step">
                        <div className="step-number">2</div>
                        <h3>Browse Properties</h3>
                        <p>Search through hundreds of verified property listings</p>
                    </div>
                    <div className="step">
                        <div className="step-number">3</div>
                        <h3>Contact Agents</h3>
                        <p>Send inquiries directly to property agents</p>
                    </div>
                    <div className="step">
                        <div className="step-number">4</div>
                        <h3>Schedule Viewing</h3>
                        <p>Arrange property viewings and find your perfect home</p>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="testimonials">
                <h2>What Our Clients Say</h2>
                <div className="testimonials-grid">
                    <div className="testimonial-card">
                        <p>"Found my dream house in Kigali within a week. The platform is very easy to use!"</p>
                        <div className="testimonial-author">
                            <strong>Marie Uwase</strong>
                            <span>Home Buyer</span>
                        </div>
                    </div>
                    <div className="testimonial-card">
                        <p>"As an agent, I've sold 5 properties through HomeFinder. Great experience!"</p>
                        <div className="testimonial-author">
                            <strong>John Mugabo</strong>
                            <span>Real Estate Agent</span>
                        </div>
                    </div>
                    <div className="testimonial-card">
                        <p>"The best property platform in Rwanda. Quick responses and verified listings."</p>
                        <div className="testimonial-author">
                            <strong>David Nkusi</strong>
                            <span>Property Investor</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            {!user && (
                <section className="cta-section">
                    <div className="cta-content">
                        <h2>Ready to Find Your Next Property?</h2>
                        <p>Join thousands of happy home buyers and agents on HomeFinder</p>
                        <Link to="/register" className="cta-button">Get Started Now</Link>
                    </div>
                </section>
            )}

            {/* Newsletter */}
            <section className="newsletter">
                <div className="newsletter-content">
                    <h3>Subscribe to Our Newsletter</h3>
                    <p>Get the latest property listings and deals straight to your inbox</p>
                    <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
                        <input type="email" placeholder="Enter your email" />
                        <button type="submit">Subscribe</button>
                    </form>
                </div>
            </section>
        </div>
    );
}

export default LandingPage;