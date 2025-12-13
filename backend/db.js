const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'samuel',
    password: 'Samuel@2025!',
    database: 'smart_city'
});

db.connect((err) => {
    if (err) console.error('DB Connection FAILED:', err.message);
    else console.log('Connected to MySQL database.');
});

module.exports = db;
