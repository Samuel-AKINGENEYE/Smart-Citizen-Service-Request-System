console.log('server.js execution started');
<<<<<<< HEAD
=======

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');

const app = express();

app.use(cors());
app.use(bodyParser.json());

const requestRoutes = require('./routes/requests');
app.use('/requests', requestRoutes);

app.get('/', (req, res) => {
    res.send('Backend is running!');
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
>>>>>>> 1a6eb81 (Full working progress: backend + frontend integration, database connected, request submission working)

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');

const app = express();

app.use(cors());
app.use(bodyParser.json());

console.log('server.js loaded');

app.get('/', (req, res) => res.send('Backend is running!'));

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
