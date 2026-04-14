const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const db = require('./database/db');
require('dotenv').config();

const app = express();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

const fs = require('fs');
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

app.use('/uploads', express.static('uploads'));
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'mysecretkey123',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ error: 'Please login first' });
    }
};

const isAgent = (req, res, next) => {
    if (req.session.user && req.session.user.is_agent) {
        next();
    } else {
        res.status(403).json({ error: 'Agent access required' });
    }
};

app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password, is_agent } = req.body;
        
        const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const [result] = await db.execute(
            'INSERT INTO users (name, email, password, is_agent) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, is_agent ? 1 : 0]
        );
        
        res.json({ success: true, message: 'Registration successful' });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            is_agent: user.is_agent === 1
        };
        
        res.json({ success: true, user: req.session.user });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/session', (req, res) => {
    if (req.session.user) {
        res.json({ user: req.session.user });
    } else {
        res.json({ user: null });
    }
});

app.get('/api/listings', async (req, res) => {
    try {
        const [listings] = await db.execute(`
            SELECT l.*, u.name as agent_name 
            FROM listings l 
            LEFT JOIN users u ON l.agent_id = u.id 
            WHERE l.status = 'available'
            ORDER BY l.created_at DESC
        `);
        res.json(listings);
    } catch (error) {
        res.json([]);
    }
});

app.post('/api/listings', isAuthenticated, isAgent, upload.single('image'), async (req, res) => {
    try {
        const { price, location, description } = req.body;
        const image_url = req.file ? `/uploads/${req.file.filename}` : null;
        
        const [result] = await db.execute(
            'INSERT INTO listings (price, location, description, agent_id, image_url) VALUES (?, ?, ?, ?, ?)',
            [price, location, description, req.session.user.id, image_url]
        );
        
        res.json({ success: true, message: 'Property listed for sale successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create listing' });
    }
});

app.put('/api/listings/:id', isAuthenticated, isAgent, upload.single('image'), async (req, res) => {
    try {
        const listingId = req.params.id;
        const { price, location, description, status } = req.body;
        
        const [listings] = await db.execute('SELECT agent_id FROM listings WHERE id = ?', [listingId]);
        
        if (listings.length === 0 || listings[0].agent_id !== req.session.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        let query = 'UPDATE listings SET price = ?, location = ?, description = ?';
        let params = [price, location, description];
        
        if (status) {
            query += ', status = ?';
            params.push(status);
        }
        
        if (req.file) {
            query += ', image_url = ?';
            params.push(`/uploads/${req.file.filename}`);
        }
        
        query += ' WHERE id = ?';
        params.push(listingId);
        
        await db.execute(query, params);
        res.json({ success: true, message: 'Property updated successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update listing' });
    }
});

app.delete('/api/listings/:id', isAuthenticated, isAgent, async (req, res) => {
    try {
        const listingId = req.params.id;
        
        const [listings] = await db.execute('SELECT agent_id FROM listings WHERE id = ?', [listingId]);
        
        if (listings.length === 0 || listings[0].agent_id !== req.session.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        await db.execute('DELETE FROM listings WHERE id = ?', [listingId]);
        res.json({ success: true, message: 'Property deleted successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete listing' });
    }
});

app.post('/api/listings/:id/view', async (req, res) => {
    try {
        await db.execute('UPDATE listings SET view_count = view_count + 1 WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update views' });
    }
});

app.get('/api/agent/stats', isAuthenticated, isAgent, async (req, res) => {
    try {
        const userId = req.session.user.id;
        
        const [properties] = await db.execute('SELECT COUNT(*) as count FROM listings WHERE agent_id = ?', [userId]);
        const [inquiries] = await db.execute(`
            SELECT COUNT(*) as count FROM inquiries i
            JOIN listings l ON i.listing_id = l.id
            WHERE l.agent_id = ?
        `, [userId]);
        const [unread] = await db.execute(`
            SELECT COUNT(*) as count FROM inquiries i
            JOIN listings l ON i.listing_id = l.id
            WHERE l.agent_id = ? AND i.reply_status = 'pending'
        `, [userId]);
        const [views] = await db.execute('SELECT SUM(view_count) as total FROM listings WHERE agent_id = ?', [userId]);
        
        res.json({
            totalProperties: properties[0].count,
            totalInquiries: inquiries[0].count,
            unreadInquiries: unread[0].count,
            totalViews: views[0].total || 0
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

app.get('/api/agent/properties', isAuthenticated, isAgent, async (req, res) => {
    try {
        const [properties] = await db.execute(`
            SELECT l.*, 
                   (SELECT COUNT(*) FROM inquiries WHERE listing_id = l.id) as inquiry_count
            FROM listings l
            WHERE l.agent_id = ?
            ORDER BY l.created_at DESC
        `, [req.session.user.id]);
        res.json(properties);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch properties' });
    }
});

app.get('/api/agent/inquiries', isAuthenticated, isAgent, async (req, res) => {
    try {
        const [inquiries] = await db.execute(`
            SELECT i.*, l.location, l.price, u.name as user_name, u.email
            FROM inquiries i
            JOIN listings l ON i.listing_id = l.id
            JOIN users u ON i.user_id = u.id
            WHERE l.agent_id = ?
            ORDER BY i.created_at DESC
        `, [req.session.user.id]);
        res.json(inquiries);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch inquiries' });
    }
});

app.post('/api/inquiries/:id/reply', isAuthenticated, isAgent, async (req, res) => {
    try {
        const inquiryId = req.params.id;
        const { reply_message } = req.body;
        
        await db.execute(
            'UPDATE inquiries SET reply_message = ?, reply_status = "replied" WHERE id = ?',
            [reply_message, inquiryId]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send reply' });
    }
});

app.post('/api/inquiries', isAuthenticated, async (req, res) => {
    try {
        const { listing_id, message } = req.body;
        await db.execute(
            'INSERT INTO inquiries (listing_id, user_id, message) VALUES (?, ?, ?)',
            [listing_id, req.session.user.id, message]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send inquiry' });
    }
});

app.get('/api/user/inquiries', isAuthenticated, async (req, res) => {
    try {
        const [inquiries] = await db.execute(`
            SELECT i.*, l.location, l.price, u.name as agent_name
            FROM inquiries i
            JOIN listings l ON i.listing_id = l.id
            JOIN users u ON l.agent_id = u.id
            WHERE i.user_id = ?
            ORDER BY i.created_at DESC
        `, [req.session.user.id]);
        res.json(inquiries);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch inquiries' });
    }
});

app.post('/api/favorites', isAuthenticated, async (req, res) => {
    try {
        const { listing_id } = req.body;
        await db.execute(
            'INSERT INTO favorites (user_id, listing_id) VALUES (?, ?)',
            [req.session.user.id, listing_id]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add favorite' });
    }
});

app.delete('/api/favorites/:listing_id', isAuthenticated, async (req, res) => {
    try {
        await db.execute(
            'DELETE FROM favorites WHERE user_id = ? AND listing_id = ?',
            [req.session.user.id, req.params.listing_id]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove favorite' });
    }
});

app.get('/api/favorites', isAuthenticated, async (req, res) => {
    try {
        const [favorites] = await db.execute(`
            SELECT l.*, u.name as agent_name
            FROM favorites f
            JOIN listings l ON f.listing_id = l.id
            JOIN users u ON l.agent_id = u.id
            WHERE f.user_id = ?
        `, [req.session.user.id]);
        res.json(favorites);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch favorites' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
