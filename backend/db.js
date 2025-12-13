const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',       // replace with your MySQL username
    password: '',       // replace with your MySQL password
    database: 'smart_city'
});

db.connect((err) => {
    if(err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL database.');
});

module.exports = db;
