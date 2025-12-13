const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const requestRoutes = require('./routes/requests'); // route file
const db = require('./db'); // triggers DB connection

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Debug log to confirm server.js is running
console.log('server.js loaded');

// Routes
app.use('/requests', requestRoutes);

// Test route
app.get('/', (req, res) => res.send('Backend is running!'));

// Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
