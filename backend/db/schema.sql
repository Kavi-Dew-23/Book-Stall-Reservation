-- Schema for Book Stall Reservation
-- Run this SQL to create required tables in MySQL
-- Create and select database (safe to run multiple times)
CREATE DATABASE IF NOT EXISTS bookfair;
USE bookfair;

-- Users table to store registered publishers/vendors
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255), -- store hash if implementing auth
  business_name VARCHAR(255),
  contact_number VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stalls (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  size ENUM('small','medium','large') NOT NULL DEFAULT 'small',
  map_position VARCHAR(255),
  is_reserved TINYINT(1) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS reservations (
  id VARCHAR(36) PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  user_id INT NULL,
  business_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50),
  address VARCHAR(255),
  status ENUM('active','cancelled') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS reservation_stalls (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reservation_id VARCHAR(36) NOT NULL,
  stall_id INT NOT NULL,
  -- Use TEXT to safely store long signed URLs from Firebase Storage
  qr_url TEXT,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
  FOREIGN KEY (stall_id) REFERENCES stalls(id) ON DELETE CASCADE
);

-- Ensure a stall can only belong to one active reservation at a time
CREATE UNIQUE INDEX IF NOT EXISTS uq_reservation_stalls_stall_id ON reservation_stalls (stall_id);

