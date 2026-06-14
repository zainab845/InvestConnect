const express = require('express');
const sql = require('mssql/msnodesqlv8'); 
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json()); 
app.use(cors());

const multer = require('multer');
const path = require('path');

// Make the 'uploads' folder public so investors can download files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure where to save uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Prevents name clashing
    }
});
const upload = multer({ storage: storage });

// ==========================================
// 1. DATABASE CONNECTION
// ==========================================
const dbConfig = {
    server: 'LAPTOP-M0U8KO6S\\SQLEXPRESS01',
    database: 'InvestConnect',
    driver: 'ODBC Driver 17 for SQL Server', 
    user: 'node_user',               // Added the user we created
    password: 'NodePassword123!',    // Added the password we created
    options: {
        trustServerCertificate: true // Removed trustedConnection
    }
};
const pool = new sql.ConnectionPool(dbConfig);
const poolConnect = pool.connect()
    .then(() => console.log("\n✅ Connected to Microsoft SQL Server "))
    .catch(err => console.error("\n❌ Database connection failed!", err));

// ==========================================
// 2. CRUD OPERATIONS (For Business Profiles)
// ==========================================

// READ: Get all businesses
// READ: Get all businesses (UPGRADED WITH JOIN FOR EMAILS)
app.get('/api/businesses', async (req, res) => {
    try {
        await poolConnect;
        
        // 🚀 NEW: We JOIN the Users table to securely grab the owner's email!
        const result = await pool.request().query(`
            SELECT b.*, u.email AS owner_email
            FROM Business_Profiles b
            JOIN Users u ON b.owner_id = u.user_id
        `);
        
        res.status(200).json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE: Submit a new business pitch (SPRINT 2 - THE CORRECT ROUTE!)
// UPDATED: Create business with PDF upload
app.post('/api/businesses', upload.single('pitch_deck'), async (req, res) => {
    const { owner_id, business_name, description, industry_category, min_investment, annual_turnover } = req.body;
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        await poolConnect;
        await pool.request()
            .input('owner_id', sql.Int, owner_id)
            .input('name', sql.VarChar, business_name)
            .input('desc', sql.VarChar, description)
            .input('ind', sql.VarChar, industry_category)
            .input('min', sql.Decimal, min_investment)
            .input('turn', sql.Decimal, annual_turnover)
            .input('pdf', sql.NVarChar, fileUrl)
            .query(`
                INSERT INTO Business_Profiles 
                (owner_id, business_name, description, industry_category, min_investment, annual_turnover, pitch_deck_url, is_approved)
                VALUES (@owner_id, @name, @desc, @ind, @min, @turn, @pdf, 0)
            `);
        res.status(201).json({ message: "Pitch submitted with PDF! Pending admin approval." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ==========================================
// 3. PROJECT-SPECIFIC QUERIES 
// ==========================================

// Feature 10: Global Business Search
// Feature 10: Global Business Search
app.get('/api/search', async (req, res) => {
    try {
        await poolConnect;
        const searchTerm = `%${req.query.keyword}%`; 
        
        const result = await pool.request()
            .input('keyword', sql.NVarChar, searchTerm)
            .query(`
                SELECT *
                FROM Business_Profiles
                WHERE business_name LIKE @keyword OR description LIKE @keyword
            `);
            
        res.status(200).json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Feature 15: Admin Approval Dashboard
app.get('/api/admin/pending', async (req, res) => {
    try {
        await poolConnect;
        const result = await pool.request().query(`
            SELECT b.business_id, u.email AS Owner_Email, b.business_name, b.created_at
            FROM Business_Profiles b
            JOIN Users u ON b.owner_id = u.user_id
            ORDER BY b.created_at ASC;
        `); 
        
        res.status(200).json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Feature 15: Admin Approve Route (Publish Business)
app.put('/api/admin/approve/:id', async (req, res) => {
    try {
        await poolConnect;
        
        // 🚀 We ONLY update the database. We do not touch the physical file!
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('UPDATE Business_Profiles SET is_approved = 1 WHERE business_id = @id');
            
        res.status(200).json({ message: "Business Approved and Published!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Feature 15: Admin Reject Route (Optional, but good to have!)
app.delete('/api/admin/reject/:id', async (req, res) => {
    try {
        await poolConnect;
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Business_Profiles WHERE business_id = @id');
            
        res.status(200).json({ message: "Business pitch rejected and deleted." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ==========================================
// 4. COMMUNICATION FEATURES (Comments & Likes)
// ==========================================

// Create a Comment
app.post('/api/comments', async (req, res) => {
    try {
        await poolConnect;
        const { business_id, investor_id, comment_text } = req.body;
        
        const request = pool.request();
        request.input('b_id', sql.Int, business_id);
        request.input('i_id', sql.Int, investor_id);
        request.input('text', sql.NVarChar, comment_text);

        await request.query(`
            INSERT INTO Comments (business_id, investor_id, comment_text)
            VALUES (@b_id, @i_id, @text)
        `);
        res.status(201).json({ message: "Comment added successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Comments for a specific Business (UPGRADED TO INCLUDE NAMES)
app.get('/api/businesses/:id/comments', async (req, res) => {
    try {
        await poolConnect;
        const request = pool.request();
        request.input('b_id', sql.Int, req.params.id);
        
        // 🚀 NEW: We are using our JOIN to grab first_name and last_name from the Users table!
        const result = await request.query(`
            SELECT c.comment_text, c.created_at, u.first_name, u.last_name
            FROM Comments c
            JOIN Users u ON c.investor_id = u.user_id
            WHERE c.business_id = @b_id
            ORDER BY c.created_at DESC
        `);
        res.status(200).json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Like a Business
app.post('/api/likes', async (req, res) => {
    try {
        await poolConnect;
        const { business_id, investor_id } = req.body;
        
        const request = pool.request();
        request.input('b_id', sql.Int, business_id);
        request.input('i_id', sql.Int, investor_id);

        await request.query(`
            INSERT INTO Business_Likes (business_id, investor_id)
            VALUES (@b_id, @i_id)
        `);
        res.status(201).json({ message: "Business liked successfully!" });
    } catch (err) {
        if (err.message.includes('UQ_Investor_Business_Like')) {
            return res.status(400).json({ error: "You have already liked this business." });
        }
        res.status(500).json({ error: err.message });
    }
});

// Get Like Count for a specific Business
app.get('/api/businesses/:id/likes', async (req, res) => {
    try {
        await poolConnect;
        const request = pool.request();
        request.input('b_id', sql.Int, req.params.id);
        
        const result = await request.query(`
            SELECT COUNT(*) AS total_likes 
            FROM Business_Likes 
            WHERE business_id = @b_id
        `);
        res.status(200).json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 5. AUTHENTICATION & REGISTRATION
// ==========================================

// POST: Register a new user (Investor or Owner)
app.post('/api/register', async (req, res) => {
    const { email, password, role_type, first_name, last_name, phone_number } = req.body;

    try {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        await poolConnect;
        const request = pool.request();

        request.input('email', sql.VarChar, email);
        request.input('password_hash', sql.VarChar, password_hash);
        request.input('role_type', sql.VarChar, role_type);
        request.input('first_name', sql.VarChar, first_name);
        request.input('last_name', sql.VarChar, last_name);
        request.input('phone_number', sql.VarChar, phone_number);

        const query = `
            BEGIN TRAN;
            BEGIN TRY
                DECLARE @NewUserID INT;
                INSERT INTO Users (email, password_hash, role_type)
                VALUES (@email, @password_hash, @role_type);
                
                SET @NewUserID = SCOPE_IDENTITY();

                IF @role_type = 'Investor'
                BEGIN
                    INSERT INTO Investors (investor_id, first_name, last_name, phone_number)
                    VALUES (@NewUserID, @first_name, @last_name, @phone_number);
                END
                ELSE IF @role_type = 'Owner'
                BEGIN
                    INSERT INTO Business_Owners (owner_id, first_name, last_name, phone_number)
                    VALUES (@NewUserID, @first_name, @last_name, @phone_number);
                END

                COMMIT TRAN;
                SELECT @NewUserID AS new_user_id;
            END TRY
            BEGIN CATCH
                ROLLBACK TRAN;
                THROW;
            END CATCH
        `;

        const result = await request.query(query);
        res.status(201).json({ 
            message: "User registered successfully!", 
            userId: result.recordset[0].new_user_id 
        });

    } catch (err) {
        console.log("❌ REGISTRATION ERROR:", err.message);
        res.status(500).json({ error: "Failed to register user. Email might already exist." });
    }
});

// POST: Login a user
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        await poolConnect;
        const request = pool.request();
        
        request.input('email', sql.VarChar, email);
        const result = await request.query('SELECT * FROM Users WHERE email = @email');
        const user = result.recordset[0];

        if (!user) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        res.status(200).json({ 
            message: "Login successful!", 
            user: {
                user_id: user.user_id,
                email: user.email,
                role_type: user.role_type
            }
        });

    } catch (err) {
        console.log("❌ LOGIN ERROR:", err.message);
        res.status(500).json({ error: "Server error during login." });
    }
});

// ==========================================
// 6. INVESTOR PROFILES & MATCHING
// ==========================================

// Get an Investor's Profile (Name from Users, Preferences from Investors)
app.get('/api/investors/:id', async (req, res) => {
    try {
        await poolConnect;
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT u.first_name, u.last_name, i.min_budget, i.max_budget, i.preferred_industry 
                FROM Users u
                LEFT JOIN Investors i ON u.user_id = i.investor_id
                WHERE u.user_id = @id
            `);
            
        if (result.recordset.length > 0) {
            res.status(200).json(result.recordset[0]);
        } else {
            res.status(404).json({ error: "Profile not found" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Save Investor Matching Preferences
app.put('/api/investors/:id/preferences', async (req, res) => {
    const { min_budget, max_budget, preferred_industry } = req.body;
    try {
        await poolConnect;
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('min', sql.Decimal, min_budget)
            .input('max', sql.Decimal, max_budget)
            .input('ind', sql.NVarChar, preferred_industry)
            .query(`
                UPDATE Investors 
                SET min_budget = @min, max_budget = @max, preferred_industry = @ind 
                WHERE investor_id = @id
            `);
        res.status(200).json({ message: "Matching preferences saved!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 7. PERSONAL WATCHLIST
// ==========================================

// Feature 13a: Toggle Watchlist (Add or Remove)
app.post('/api/watchlist/toggle', async (req, res) => {
    const { investor_id, business_id } = req.body;
    try {
        await poolConnect;
        const request = pool.request()
            .input('i_id', sql.Int, investor_id)
            .input('b_id', sql.Int, business_id);

        // Check if it's already saved
        const check = await request.query('SELECT * FROM Watchlist WHERE investor_id = @i_id AND business_id = @b_id');

        if (check.recordset.length > 0) {
            // It exists, so REMOVE it (Un-save)
            await request.query('DELETE FROM Watchlist WHERE investor_id = @i_id AND business_id = @b_id');
            res.status(200).json({ message: "Removed from Watchlist", isSaved: false });
        } else {
            // It doesn't exist, so ADD it (Save)
            await request.query('INSERT INTO Watchlist (investor_id, business_id) VALUES (@i_id, @b_id)');
            res.status(200).json({ message: "Saved to Watchlist!", isSaved: true });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Feature 13b: Get an Investor's saved business IDs
app.get('/api/investors/:id/watchlist', async (req, res) => {
    try {
        await poolConnect;
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT business_id FROM Watchlist WHERE investor_id = @id');
            
        // We just send back an array of numbers (the IDs) so React knows which buttons to highlight!
        const savedIds = result.recordset.map(row => row.business_id);
        res.status(200).json(savedIds);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start the Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 InvestConnect API is running on http://localhost:${PORT}`);
});