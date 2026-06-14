
USE master;
GO

IF EXISTS (SELECT * FROM sys.databases WHERE name = 'InvestConnect')
BEGIN
    ALTER DATABASE InvestConnect SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE InvestConnect;
END
GO

CREATE DATABASE InvestConnect;
GO
USE InvestConnect;
GO


-- Table 1: Users (Handles Investors, Owners, and Admins) 
CREATE TABLE Users (
    user_id INT PRIMARY KEY,        
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) NOT NULL, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP 
);

-- Table 2: Categories (The 8 specific industries)
CREATE TABLE Categories (
    category_id INT PRIMARY KEY,    
    category_name VARCHAR(50) UNIQUE NOT NULL
);

-- Table 3: Business_Profiles 
CREATE TABLE Business_Profiles (
    business_id INT PRIMARY KEY,    
    owner_id INT NOT NULL,
    category_id INT NOT NULL,
    business_name VARCHAR(150) NOT NULL,
    description TEXT,
    min_investment DECIMAL(15, 2) NOT NULL,
    annual_profit DECIMAL(15, 2),
    pitch_deck_url VARCHAR(255),
    is_approved BIT DEFAULT 0,      -- 0 = Pending, 1 = Approved 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY (owner_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE CASCADE
);

-- Table 4: Investor_Preferences (Financial ranges) 
CREATE TABLE Investor_Preferences (
    preference_id INT PRIMARY KEY,  
    investor_id INT UNIQUE NOT NULL,
    min_budget DECIMAL(15, 2) DEFAULT 0.00,
    max_budget DECIMAL(15, 2) NOT NULL,
    FOREIGN KEY (investor_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- Table 5: Investor_Interests (Checklist of industries) 
CREATE TABLE Investor_Interests (
    investor_id INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (investor_id, category_id), -- Composite Key
    FOREIGN KEY (investor_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE NO ACTION
);

-- Table 6: Watchlist (Saved businesses) 
CREATE TABLE Watchlist (
    watchlist_id INT PRIMARY KEY,   
    investor_id INT NOT NULL,
    business_id INT NOT NULL,
    saved_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY (investor_id) REFERENCES Users(user_id) ON DELETE NO ACTION,
    FOREIGN KEY (business_id) REFERENCES Business_Profiles(business_id) ON DELETE CASCADE
);

-- Table 7: Comments (For Investor/Owner Communication)
CREATE TABLE Comments (
    comment_id INT IDENTITY(1,1) PRIMARY KEY, -- Auto-increments safely
    business_id INT NOT NULL,
    investor_id INT NOT NULL,
    comment_text NVARCHAR(MAX) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES Business_Profiles(business_id) ON DELETE CASCADE,
    FOREIGN KEY (investor_id) REFERENCES Users(user_id) ON DELETE NO ACTION
);

-- Table 8: Business_Likes (For Investor/Owner Communication)
CREATE TABLE Business_Likes (
    like_id INT IDENTITY(1,1) PRIMARY KEY,
    business_id INT NOT NULL,
    investor_id INT NOT NULL,
    liked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- Ensure an investor can only like a specific business once
    CONSTRAINT UQ_Investor_Business_Like UNIQUE (investor_id, business_id),
    FOREIGN KEY (business_id) REFERENCES Business_Profiles(business_id) ON DELETE CASCADE,
    FOREIGN KEY (investor_id) REFERENCES Users(user_id) ON DELETE NO ACTION
);
GO

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = N'node_user')
BEGIN
    CREATE USER node_user FOR LOGIN node_user;
END
ALTER ROLE db_owner ADD MEMBER node_user;
GO


INSERT INTO Users (user_id, full_name, email, password_hash, user_role) VALUES 
(1, 'Zainab Bilal', 'owner@test.com', 'pass123', 'Business Owner'),
(2, 'Amna Shahzad', 'admin@test.com', 'pass123', 'Admin'),
(3, 'Saba Siddiq', 'investor@test.com', 'pass123', 'Investor');

INSERT INTO Categories (category_id, category_name) VALUES 
(1, 'Technology'), (2, 'Medicine'), (3, 'Hospitality');

INSERT INTO Business_Profiles (business_id, owner_id, category_id, business_name, description, min_investment, is_approved) VALUES 
(101, 1, 1, 'Tech Innovators', 'An AI startup.', 50000.00, 1),
(102, 1, 2, 'MediCare Plus', 'A telemedicine platform.', 25000.00, 1),
(103, 1, 3, 'Cozy Stays', 'A boutique hotel.', 100000.00, 0);


INSERT INTO Comments (business_id, investor_id, comment_text) VALUES 
(101, 3, 'This looks like a great opportunity! Do you have financial projections?');

INSERT INTO Business_Likes (business_id, investor_id) VALUES 
(101, 3);
GO