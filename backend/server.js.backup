const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Simple test endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Smart Citizen Request System API is running!',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
