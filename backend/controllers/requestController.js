const db = require('../db');

// Get all requests
exports.getAllRequests = (req, res) => {
    const query = 'SELECT * FROM requests';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching requests:', err.message);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
};

// Create new request
exports.createRequest = (req, res) => {
    const { name, contact, issue_type, location, description } = req.body;
    const query = 'INSERT INTO requests (name, contact, issue_type, location, description) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [name, contact, issue_type, location, description], (err, result) => {
        if (err) {
            console.error('Error creating request:', err.message);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Request submitted successfully', id: result.insertId });
    });
};
