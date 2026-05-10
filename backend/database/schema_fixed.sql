USE smart_city;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    national_id VARCHAR(50),
    profile_photo VARCHAR(500),
    role ENUM('citizen', 'department_admin', 'field_officer', 'super_admin') DEFAULT 'citizen',
    department_id INT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    otp_code VARCHAR(6),
    otp_expires_at TIMESTAMP NULL,
    reset_token VARCHAR(255),
    reset_expires_at TIMESTAMP NULL,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_phone (phone)
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    head_officer_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    sla_hours INT NOT NULL DEFAULT 72,
    department_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Requests table
CREATE TABLE IF NOT EXISTS requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reference_number VARCHAR(20) UNIQUE,
    citizen_id INT,
    category_id INT,
    title VARCHAR(255),
    description TEXT NOT NULL,
    location_address TEXT,
    location_latitude DECIMAL(10, 8),
    location_longitude DECIMAL(11, 8),
    status ENUM('open', 'in_progress', 'resolved', 'rejected') DEFAULT 'open',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    is_anonymous BOOLEAN DEFAULT FALSE,
    assigned_to INT,
    assigned_department_id INT,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_reference (reference_number)
);

-- Insert default data
INSERT IGNORE INTO departments (id, name, description) VALUES
(1, 'Public Works', 'Handles roads, infrastructure, and public facilities'),
(2, 'Water Department', 'Manages water supply and drainage systems'),
(3, 'Electricity Board', 'Handles power supply and streetlights'),
(4, 'Sanitation Department', 'Manages waste collection and disposal'),
(5, 'Public Safety', 'Coordinates security and emergency services');

INSERT IGNORE INTO categories (id, name, description, sla_hours, department_id) VALUES
(1, 'Roads - Pothole', 'Report potholes on public roads', 72, 1),
(2, 'Roads - Street Damage', 'Damaged roads or sidewalks', 96, 1),
(3, 'Water - Leakage', 'Water pipe leakage or wastage', 48, 2),
(4, 'Water - Supply Issue', 'No water supply or low pressure', 24, 2),
(5, 'Electricity - Outage', 'Power cut or fluctuation', 24, 3),
(6, 'Electricity - Streetlight', 'Broken or malfunctioning streetlight', 72, 3),
(7, 'Sanitation - Garbage', 'Uncollected garbage or waste', 48, 4),
(8, 'Sanitation - Drainage', 'Blocked drains or sewage', 48, 4),
(9, 'Public Safety - Lighting', 'Dark spots or safety concerns', 72, 5),
(10, 'Public Safety - Other', 'General safety concerns', 72, 5);
