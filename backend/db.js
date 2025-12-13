const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'samuel',           // MySQL username
    password: 'Samuel@2025!', // MySQL password
    database: 'smart_city'
});

// Connect and print any error, or success message
db.connect((err) => {
    if (err) {
        console.error('DB Connection FAILED:', err.message);
    } else {
        console.log('Connected to MySQL database.');
    }
});

module.exports = db;
