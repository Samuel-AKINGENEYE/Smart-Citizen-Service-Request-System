const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'samuel',           // your MySQL username
    password: 'Samuel@2025!', // your MySQL password
    database: 'smart_city'
});

// Log both success and failure
db.connect((err) => {
    if (err) {
        console.error('Database connection FAILED:', err);
        process.exit(1); // stop server if DB fails
    } else {
        console.log('Connected to MySQL database.');
    }
});

module.exports = db;
