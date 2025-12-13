const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db'); // triggers DB connection

const app = express();

app.use(cors());
app.use(bodyParser.json());

console.log('server.js loaded');

app.get('/', (req, res) => res.send('Backend is running!'));

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
