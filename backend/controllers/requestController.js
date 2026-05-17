const db = require('../db');

exports.getAllRequests = (req, res) => {
  const sql = 'SELECT * FROM requests ORDER BY created_at DESC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching requests:', err.message);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.json({ success: true, requests: results });
  });
};

exports.createRequest = (req, res) => {
  const { name, contact, issue_type, location, description } = req.body;
  if (!name || !contact || !issue_type || !description) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const sql = 'INSERT INTO requests (name, contact, issue_type, location, description) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [name.trim(), contact.trim(), issue_type.trim(), location ? location.trim() : null, description.trim()], (err, result) => {
    if (err) {
      console.error('Error creating request:', err.message);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.status(201).json({ success: true, message: 'Request submitted successfully', id: result.insertId });
  });
};
