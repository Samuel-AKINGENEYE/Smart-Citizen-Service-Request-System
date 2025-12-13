console.log('server.js execution started');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const requestRoutes = require('./routes/requests');
const db = require('./db');

const app = express();

app.use(cors());
app.use(bodyParser.json());

console.log('server.js loaded');

app.use('/requests', requestRoutes);

app.get('/', (req, res) => res.send('Backend is running!'));

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
