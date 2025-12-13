const db = require('../db');

// Get all requests
exports.getAllRequests = (req, res) => {
    const query = 'SELECT * FROM requests';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

// Create new request
exports.createRequest = (req, res) => {
    const { name, contact, issue_type, location, description } = req.body;
    const query = 'INSERT INTO requests (name, contact, issue_type, location, description) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [name, contact, issue_type, location, description], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Request submitted', id: result.insertId });
    });
};
