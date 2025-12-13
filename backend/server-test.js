const express = require('express');
const app = express();

console.log('Server.js loaded');

app.get('/', (req, res) => res.send('Backend is running!'));

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
