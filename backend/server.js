const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_l9EN6pHGqWYb@ep-green-fire-aderrkjn-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    ssl: {
        rejectUnauthorized: false
    }
});

// Middleware
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:8080', 'file://'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`🔍 ${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
});

console.log('🔍 Checking environment variables...');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Loaded from .env' : 'Using default Neon URL');

// Test database connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ PostgreSQL Connection Error:', err.message);
        console.log('💡 Make sure your Neon database is running');
    } else {
        console.log('✅ Connected to Neon PostgreSQL database');
        console.log('📍 Database: neondb');
        release();
    }
});

// Initialize database tables
const initDatabase = async () => {
    try {
        // Create products table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                image VARCHAR(500),
                category VARCHAR(100),
                variants JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create orders table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(100) NOT NULL,
                items JSONB NOT NULL,
                total_amount DECIMAL(10,2) NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                payment_method VARCHAR(50) DEFAULT 'COD',
                payment_id VARCHAR(100),
                delivery_address JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(100) UNIQUE NOT NULL,
                name VARCHAR(255),
                email VARCHAR(255),
                address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('✅ Database tables initialized');
        
        // Insert initial products if table is empty
        const productCount = await pool.query('SELECT COUNT(*) FROM products');
        if (parseInt(productCount.rows[0].count) === 0) {
            await insertInitialProducts();
        }

    } catch (error) {
        console.error('❌ Error initializing database:', error.message);
    }
};

// Insert initial products
const insertInitialProducts = async () => {
    const initialProducts = [
        // Fruits
        { name: 'Fresh Apples', image: 'https://images.unsplash.com/photo-1579613832125-5d34a13ffe2a?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400', category: 'Fruits', variants: [{unit: '500 g', price: 75}, {unit: '1 kg', price: 150}] },
        { name: 'Ripe Bananas', image: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400', category: 'Fruits', variants: [{unit: '6 pcs', price: 30}, {unit: '1 dozen', price: 50}] },
        { name: 'Mangoes', image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400', category: 'Fruits', variants: [{unit: '500 g', price: 200}, {unit: '1 kg', price: 380}] },
        { name: 'Pineapple', image: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400', category: 'Fruits', variants: [{unit: '1 piece', price: 45}, {unit: '1 kg', price: 35}] },
        { name: 'Papaya', image: 'https://images.unsplash.com/photo-1617112848923-cc2234396a8d?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400', category: 'Fruits', variants: [{unit: '500 g', price: 30}, {unit: '1 kg', price: 55}] },
        
        // Vegetables
        { name: 'Tomatoes', image: 'https://cdn.zeptonow.com/production/tr:w-1280,ar-3000-3000,pr-true,f-auto,q-80/cms/product_variant/05e8f43f-90fa-4636-8c03-fafc8f9e7b21.jpeg', category: 'Vegetables', variants: [{unit: '250 g', price: 40}, {unit: '500 g', price: 80}] },
        { name: 'Carrots', image: 'https://cdn.zeptonow.com/production/tr:w-403,ar-3000-3000,pr-true,f-auto,q-80/cms/product_variant/0ee41064-38af-4d97-ba56-2b26ee7cc9f9.jpeg', category: 'Vegetables', variants: [{unit: '250 g', price: 20}, {unit: '500 g', price: 40}] },
        { name: 'Potatoes (Aloo)', image: 'https://cdn.zeptonow.com/production/tr:w-403,ar-3000-3000,pr-true,f-auto,q-80/cms/product_variant/c8ca7a67-3d41-4fdf-b530-a80d0c8b7c12.jpeg', category: 'Vegetables', variants: [{unit: '500 g', price: 30}, {unit: '1 kg', price: 55}] },
        { name: 'Onion (Pyaz)', image: 'https://cdn.zeptonow.com/production/tr:w-403,ar-3000-3000,pr-true,f-auto,q-80/cms/product_variant/7be6a3dd-b20d-4e7a-9afe-1b30b3e99b12.jpeg', category: 'Vegetables', variants: [{unit: '500 g', price: 35}, {unit: '1 kg', price: 65}] },
        { name: 'Green Chilli (Hari Mirch)', image: 'https://cdn.zeptonow.com/production/tr:w-403,ar-3000-3000,pr-true,f-auto,q-80/cms/product_variant/9a84d2c5-c8b4-45f6-8c7d-5f3e2a1b0c89.jpeg', category: 'Vegetables', variants: [{unit: '100 g', price: 20}, {unit: '250 g', price: 45}] },
        
        // Dairy
        { name: 'Organic Milk', image: 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400', category: 'Dairy', variants: [{unit: '500 ml', price: 25}, {unit: '1 litre', price: 48}] },
        { name: 'Eggs', image: 'https://cdn.zeptonow.com/production/tr:w-1280,ar-1200-1200,pr-true,f-auto,q-80/cms/product_variant/35241f67-e64e-4f15-8c9e-175186993049.jpeg', category: 'Dairy', variants: [{unit: '6 pack', price: 40}, {unit: '12 pack', price: 70}] },
        { name: 'Cheddar Cheese', image: 'https://cdn.zeptonow.com/production/tr:w-1280,ar-1000-1000,pr-true,f-auto,q-80/cms/product_variant/19b40e18-47b0-40bb-806c-f8e9319f6f16.jpeg', category: 'Dairy', variants: [{unit: '100 g', price: 110}, {unit: '200 g', price: 200}] },
        
        // Bakery
        { name: 'Whole Wheat Bread', image: 'https://cdn.zeptonow.com/production/tr:w-1280,ar-1200-1200,pr-true,f-auto,q-80/cms/product_variant/68de0f15-ba46-4a79-95ec-0e2a33ce9dcc.jpeg', category: 'Bakery', variants: [{unit: '1 loaf', price: 45}] }
    ];

    try {
        for (const product of initialProducts) {
            await pool.query(
                'INSERT INTO products (name, image, category, variants) VALUES ($1, $2, $3, $4)',
                [product.name, product.image, product.category, JSON.stringify(product.variants)]
            );
        }
        console.log('✅ Initial products inserted');
    } catch (error) {
        console.error('❌ Error inserting initial products:', error.message);
    }
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Food Delivery API is running with Neon PostgreSQL',
        database: 'Neon PostgreSQL',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY id');
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error fetching products:', error.message);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Create order
app.post('/api/orders', async (req, res) => {
    try {
        console.log('📨 Received order request:', req.body);
        
        const { userId, items, total, totalAmount, paymentMethod = 'COD', paymentId, deliveryAddress } = req.body;
        
        // Handle both 'total' and 'totalAmount' field names for compatibility
        const orderTotal = total || totalAmount;
        
        // Validate required fields
        if (!items || !Array.isArray(items) || items.length === 0) {
            console.log('❌ Validation failed: Items missing or empty');
            return res.status(400).json({ error: 'Items are required and must be a non-empty array' });
        }
        
        if (!orderTotal || isNaN(orderTotal) || orderTotal <= 0) {
            console.log('❌ Validation failed: Invalid total amount:', orderTotal);
            return res.status(400).json({ error: 'Valid total amount is required' });
        }
        
        console.log('📦 Creating order:', { userId, itemsCount: items.length, total: orderTotal, paymentMethod });
        
        const result = await pool.query(
            `INSERT INTO orders (user_id, items, total_amount, payment_method, payment_id, delivery_address) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [userId || 'guest-user', JSON.stringify(items), parseFloat(orderTotal), paymentMethod, paymentId, JSON.stringify(deliveryAddress)]
        );
        
        const newOrder = result.rows[0];
        
        console.log('✅ Order created successfully:', newOrder.id);
        
        res.status(201).json({
            success: true,
            _id: newOrder.id, // For frontend compatibility
            order: {
                id: newOrder.id,
                userId: newOrder.user_id,
                items: newOrder.items,
                total: newOrder.total_amount,
                status: newOrder.status,
                paymentMethod: newOrder.payment_method,
                orderDate: newOrder.created_at,
                deliveryTime: '12 minutes'
            },
            message: 'Order placed successfully'
        });
    } catch (error) {
        console.error('❌ Error creating order:', error.message);
        res.status(500).json({ error: 'Failed to create order', details: error.message });
    }
});

// Get orders by user
app.get('/api/orders/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query(
            'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        
        const orders = result.rows.map(order => ({
            id: order.id,
            userId: order.user_id,
            items: order.items,
            total: order.total_amount,
            status: order.status,
            paymentMethod: order.payment_method,
            orderDate: order.created_at,
            deliveryAddress: order.delivery_address
        }));
        
        res.json(orders);
    } catch (error) {
        console.error('❌ Error fetching orders:', error.message);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Get all orders (admin)
app.get('/api/orders', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error fetching all orders:', error.message);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Update order status
app.put('/api/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const result = await pool.query(
            'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('❌ Error updating order:', error.message);
        res.status(500).json({ error: 'Failed to update order' });
    }
});

// Payment verification endpoint
app.post('/api/payment/verify', (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
        
        // For demo purposes, always return success
        res.json({
            success: true,
            message: 'Payment verified successfully',
            paymentId: razorpay_payment_id
        });
    } catch (error) {
        console.error('❌ Payment verification failed:', error.message);
        res.status(500).json({ error: 'Payment verification failed' });
    }
});

// Create or update user profile
app.post('/api/users', async (req, res) => {
    try {
        const { userId, name, email, address } = req.body;
        
        const result = await pool.query(
            `INSERT INTO users (user_id, name, email, address) 
             VALUES ($1, $2, $3, $4) 
             ON CONFLICT (user_id) 
             DO UPDATE SET name = $2, email = $3, address = $4 
             RETURNING *`,
            [userId, name, email, address]
        );
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('❌ Error saving user:', error.message);
        res.status(500).json({ error: 'Failed to save user' });
    }
});

// Get user profile
app.get('/api/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [userId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('❌ Error fetching user:', error.message);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
initDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`🩺 Health: http://localhost:${PORT}/api/health`);
        console.log(`📡 API Base: http://localhost:${PORT}/api`);
        console.log(`📊 Using Neon PostgreSQL database`);
    });
}).catch(error => {
    console.error('❌ Failed to initialize database:', error.message);
    process.exit(1);
});

module.exports = app;