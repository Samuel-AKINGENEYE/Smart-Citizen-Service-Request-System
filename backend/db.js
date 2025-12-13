const mysql = require('mysql2');

// Create connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'samuel',           // your MySQL username
    password: 'Samuel@2025!', // your MySQL password
    database: 'smart_city'
});

// Attempt to connect and print result
db.connect((err) => {
    if (err) {
        console.error('DB Connection FAILED:');
        console.error(err.message);
    } else {
        console.log('Connected to MySQL database.');
    }
});

module.exports = db;
