CREATE DATABASE IF NOT EXISTS smart_city;

USE smart_city;

CREATE TABLE IF NOT EXISTS requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    citizen_name VARCHAR(100) NOT NULL,
    contact_info VARCHAR(100) NOT NULL,
    issue_type ENUM('Broken Road','Street Light','Water Issue','Garbage','Noise','Lost/Found') NOT NULL,
    description TEXT,
    location VARCHAR(255) NOT NULL,
    status ENUM('Pending','In Progress','Resolved') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
