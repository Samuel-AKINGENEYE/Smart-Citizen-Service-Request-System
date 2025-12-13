const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const requestRoutes = require('./routes/requests');
const db = require('./db'); // triggers DB connection

const app = express();

app.use(cors());
app.use(bodyParser.json());

console.log('server.js loaded'); // debug log

app.use('/requests', requestRoutes);

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
