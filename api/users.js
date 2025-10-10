const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Fallback in-memory storage for when database is not available
let mockUsers = {};

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            await handleGetUser(req, res);
        } else if (req.method === 'POST') {
            await handleCreateOrUpdateUser(req, res);
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Error handling users:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const handleGetUser = async (req, res) => {
    const { userId } = req.query;
    
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }
    
    try {
        // Try database first
        const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [userId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Database error, using fallback storage:', error.message);
        
        // Fallback to in-memory storage
        const user = mockUsers[userId];
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.status(200).json(user);
    }
};

const handleCreateOrUpdateUser = async (req, res) => {
    const { userId, name, email, address } = req.body;
    
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }
    
    try {
        // Try database first
        const result = await pool.query(
            `INSERT INTO users (user_id, name, email, address) 
             VALUES ($1, $2, $3, $4) 
             ON CONFLICT (user_id) 
             DO UPDATE SET name = $2, email = $3, address = $4 
             RETURNING *`,
            [userId, name, email, address]
        );
        
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Database error, using fallback storage:', error.message);
        
        // Fallback to in-memory storage
        const user = {
            id: Date.now(),
            user_id: userId,
            name,
            email,
            address,
            created_at: new Date().toISOString()
        };
        
        mockUsers[userId] = user;
        res.status(200).json(user);
    }
};