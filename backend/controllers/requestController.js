const db = require('../db');

// Get all requests
exports.getAllRequests = (req, res) => {
    db.query('SELECT * FROM requests ORDER BY created_at DESC', (err, results) => {
        if(err) return res.status(500).json({ error: err });
        res.json(results);
    });
};

// Add new request
exports.createRequest = (req, res) => {
    const { citizen_name, contact_info, issue_type, description, location } = req.body;
    const sql = 'INSERT INTO requests (citizen_name, contact_info, issue_type, description, location) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [citizen_name, contact_info, issue_type, description, location], (err, result) => {
        if(err) return res.status(500).json({ error: err });
        res.json({ message: 'Request submitted', id: result.insertId });
    });
};

// Update request status
exports.updateStatus = (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const sql = 'UPDATE requests SET status = ? WHERE id = ?';
    db.query(sql, [status, id], (err) => {
        if(err) return res.status(500).json({ error: err });
        res.json({ message: 'Status updated' });
    });
};
