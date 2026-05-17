-- Smart Citizen Request System Database Schema
USE smart_city;

-- Users table (citizens and admins)
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
    otp_expires_at TIMESTAMP,
    reset_token VARCHAR(255),
    reset_expires_at TIMESTAMP,
    last_login TIMESTAMP,
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

-- Request categories
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    sla_hours INT NOT NULL DEFAULT 72,
    department_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhance existing requests table with new columns
ALTER TABLE requests 
ADD COLUMN IF NOT EXISTS reference_number VARCHAR(20) UNIQUE,
ADD COLUMN IF NOT EXISTS category_id INT,
ADD COLUMN IF NOT EXISTS citizen_id INT,
ADD COLUMN IF NOT EXISTS status ENUM('open', 'in_progress', 'resolved', 'rejected') DEFAULT 'open',
ADD COLUMN IF NOT EXISTS priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS assigned_to INT,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS citizen_confirmed TINYINT(1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS citizen_confirmed_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS review_deadline TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD INDEX idx_status (status),
ADD INDEX idx_reference (reference_number);

-- Request attachments table
CREATE TABLE IF NOT EXISTS request_attachments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    request_id INT NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255),
    file_size INT,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE
);

-- Request timeline for tracking changes
CREATE TABLE IF NOT EXISTS request_timeline (
    id INT PRIMARY KEY AUTO_INCREMENT,
    request_id INT NOT NULL,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    comment TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
    INDEX idx_request (request_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_read (user_id, is_read)
);

-- Insert default departments
INSERT IGNORE INTO departments (name, description) VALUES
('Public Works', 'Handles roads, infrastructure, and public facilities'),
('Water Department', 'Manages water supply and drainage systems'),
('Electricity Board', 'Handles power supply and streetlights'),
('Sanitation Department', 'Manages waste collection and disposal'),
('Public Safety', 'Coordinates security and emergency services');

-- Insert default categories
INSERT IGNORE INTO categories (name, description, sla_hours, department_id) VALUES
('Roads - Pothole', 'Report potholes on public roads', 72, 1),
('Roads - Street Damage', 'Damaged roads or sidewalks', 96, 1),
('Water - Leakage', 'Water pipe leakage or wastage', 48, 2),
('Water - Supply Issue', 'No water supply or low pressure', 24, 2),
('Electricity - Outage', 'Power cut or fluctuation', 24, 3),
('Electricity - Streetlight', 'Broken or malfunctioning streetlight', 72, 3),
('Sanitation - Garbage', 'Uncollected garbage or waste', 48, 4),
('Sanitation - Drainage', 'Blocked drains or sewage', 48, 4),
('Public Safety - Lighting', 'Dark spots or safety concerns', 72, 5),
('Public Safety - Other', 'General safety concerns', 72, 5);

-- Create index for better performance
CREATE INDEX idx_requests_citizen ON requests(citizen_id);
CREATE INDEX idx_requests_status_priority ON requests(status, priority);
