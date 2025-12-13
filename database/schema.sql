CREATE DATABASE smart_citizen;
USE smart_citizen;

CREATE TABLE service_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    citizen_name VARCHAR(100) NOT NULL,
    category ENUM(
        'Broken Road',
        'Street Light',
        'Water Issue',
        'Garbage',
        'Noise',
        'Lost & Found'
    ) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255),
    status ENUM('Pending', 'In Progress', 'Resolved') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

