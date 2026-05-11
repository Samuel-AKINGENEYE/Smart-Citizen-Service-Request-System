const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// CORS - allow your frontend
const allowedOrigins = [
    'https://your-vercel-url.vercel.app',
    'http://localhost:8000',
    'http://localhost:3000'
];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Categories endpoint
app.get('/api/categories', (req, res) => {
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
            { id: 8, name: 'Public Safety', sla_hours: 72 }
        ]
    });
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    const validUsers = {
        'citizen@test.com': { password: 'Citizen@123', role: 'citizen', name: 'Test Citizen' },
        'admin@scrs.gov': { password: 'Admin@123', role: 'super_admin', name: 'System Admin' }
    };
    
    const user = validUsers[email];
    if (user && user.password === password) {
        const token = Buffer.from(`${email}:${Date.now()}`).toString('base64');
        res.json({
            success: true,
            token: token,
            user: { id: 1, email: email, full_name: user.name, role: user.role }
        });
    } else {
        res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
});

// Register endpoint
app.post('/api/auth/register', (req, res) => {
    const { full_name, email, phone, password } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000);
    
    res.json({
        success: true,
        message: 'Registration successful! Please verify your OTP.',
        userId: Date.now(),
        otp: otp.toString()
    });
});

// Verify OTP
app.post('/api/auth/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    res.json({ success: true, message: 'Account verified successfully!' });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Smart Citizen Request System API is running!',
        env: process.env.NODE_ENV,
        endpoints: ['GET /health', 'GET /api/categories', 'POST /api/auth/login', 'POST /api/auth/register']
    });
});

app.listen(PORT, () => {
    console.log(`✅ SCRS Backend running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📍 Health: /health`);
});
