const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const requestRoutes = require('./routes/requests');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use('/requests', requestRoutes);

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
