const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'scrs_secret_key_2026';

// Middleware
app.use(cors());
app.use(express.json());

console.log('🚀 SCRS Backend Starting...');

// Database connection (optional - works without it)
let db = null;
try {
    db = mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'samuel',
        password: process.env.DB_PASSWORD || 'Samuel@2025!',
        database: process.env.DB_NAME || 'smart_city'
    });
    db.connect((err) => {
        if (err) console.log('⚠️ Database not connected - using mock data');
        else console.log('✅ Database connected');
    });
} catch(err) {
    console.log('⚠️ No database - using mock data');
}

// Helper query function
const query = (sql, params) => {
    return new Promise((resolve, reject) => {
        if (!db) {
            resolve([]);
            return;
        }
        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

// ============ ROOT & HEALTH ============
app.get('/', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Smart Citizen Request System API is running!',
        endpoints: ['/health', '/api/categories', '/api/auth/login', '/api/auth/register']
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK', uptime: process.uptime(), timestamp: new Date() });
});

// ============ CATEGORIES ============
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await query('SELECT * FROM categories WHERE is_active = 1');
        if (categories && categories.length > 0) {
            res.json({ success: true, categories });
        } else {
            res.json({ 
                success: true, 
                categories: [
                    { id: 1, name: 'Roads - Pothole', sla_hours: 72 },
                    { id: 2, name: 'Roads - Street Damage', sla_hours: 96 },
                    { id: 3, name: 'Water - Leakage', sla_hours: 48 },
                    { id: 4, name: 'Water - Supply Issue', sla_hours: 24 },
                    { id: 5, name: 'Electricity - Outage', sla_hours: 24 },
                    { id: 6, name: 'Electricity - Streetlight', sla_hours: 72 },
                    { id: 7, name: 'Sanitation - Garbage', sla_hours: 48 },
                    { id: 8, name: 'Sanitation - Drainage', sla_hours: 48 },
                    { id: 9, name: 'Public Safety - Lighting', sla_hours: 72 },
                    { id: 10, name: 'Public Safety - Other', sla_hours: 72 }
                ]
            });
        }
    } catch (error) {
        res.json({ 
            success: true, 
            categories: [
                { id: 1, name: 'Roads - Pothole' },
                { id: 2, name: 'Water - Leakage' },
                { id: 3, name: 'Electricity - Outage' }
            ]
        });
    }
});

// ============ REGISTER ============
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, phone, password, full_name, national_id } = req.body;
        
        if (!email || !phone || !password || !full_name) {
            return res.status(400).json({ success: false, message: 'All fields required' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        if (db) {
            const existing = await query('SELECT id FROM users WHERE email = ? OR phone = ?', [email, phone]);
            if (existing.length > 0) {
                return res.status(400).json({ success: false, message: 'User already exists' });
            }
            const result = await query(
                'INSERT INTO users (email, phone, password_hash, full_name, national_id, otp_code, otp_expires_at) VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))',
                [email, phone, hashedPassword, full_name, national_id, otp]
            );
            res.status(201).json({ success: true, message: 'Registration successful', userId: result.insertId, otp });
        } else {
            res.status(201).json({ success: true, message: 'Registration successful', userId: 1, otp });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============ VERIFY OTP ============
app.post('/api/auth/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (db) {
            const users = await query('SELECT id FROM users WHERE email = ? AND otp_code = ? AND otp_expires_at > NOW()', [email, otp]);
            if (users.length === 0) {
                return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
            }
            await query('UPDATE users SET is_verified = 1, otp_code = NULL, otp_expires_at = NULL WHERE id = ?', [users[0].id]);
        }
        res.json({ success: true, message: 'Account verified' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============ LOGIN ============
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Mock users for testing
        const mockUsers = [
            { id: 1, email: 'citizen@test.com', password_hash: await bcrypt.hash('Citizen@123', 10), full_name: 'Test Citizen', role: 'citizen' },
            { id: 2, email: 'admin@scrs.gov', password_hash: await bcrypt.hash('Admin@123', 10), full_name: 'System Admin', role: 'super_admin' }
        ];
        
        let user = mockUsers.find(u => u.email === email);
        
        if (db) {
            const users = await query('SELECT id, email, password_hash, full_name, role FROM users WHERE email = ?', [email]);
            if (users.length > 0) user = users[0];
        }
        
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            token,
            user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============ AUTH MIDDLEWARE ============
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Token required' });
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ success: false, message: 'Invalid token' });
        req.user = user;
        next();
    });
};

// ============ SUBMIT REQUEST ============
app.post('/api/requests', authenticateToken, async (req, res) => {
    try {
        const { category_id, title, description, location_address, priority } = req.body;
        const refNum = 'SCR' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000);
        res.status(201).json({ success: true, message: 'Request submitted', reference_number: refNum });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============ MY REQUESTS ============
app.get('/api/requests/my-requests', authenticateToken, async (req, res) => {
    res.json({ success: true, requests: [] });
});

// ============ ADMIN ROUTES ============
app.get('/api/admin/requests', authenticateToken, async (req, res) => {
    if (req.user.role !== 'super_admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    res.json({ success: true, requests: [] });
});

app.get('/api/admin/stats', authenticateToken, async (req, res) => {
    if (req.user.role !== 'super_admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    res.json({ success: true, stats: { total: 0, open: 0, inProgress: 0, resolved: 0 } });
});

app.put('/api/admin/requests/:id/status', authenticateToken, async (req, res) => {
    if (req.user.role !== 'super_admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    res.json({ success: true, message: 'Status updated' });
});

// ============ START SERVER ============
app.listen(PORT, () => {
    console.log(`\n🚀 SCRS Backend running on port ${PORT}`);
    console.log(`📍 Health: https://scrs-backend.onrender.com/health`);
    console.log(`📍 Categories: https://scrs-backend.onrender.com/api/categories\n`);
});

module.exports = app;
