-- Create Database
CREATE DATABASE real_estate;
USE real_estate;

-- Users Table
CREATE TABLE Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('agent', 'visitor') NOT NULL
);

-- Listings Table
CREATE TABLE Listings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    location VARCHAR(150) NOT NULL,
    description TEXT,
    agent_id INT,
    FOREIGN KEY (agent_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Inquiries Table
CREATE TABLE Inquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message TEXT NOT NULL,
    listing_id INT,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES Listings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);