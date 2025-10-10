const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Debug: Check if environment variables are loaded
console.log('🔍 Environment check:');
console.log('- DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('- POSTGRES_URL exists:', !!process.env.POSTGRES_URL);

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Test database connection on startup
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
    } else {
        console.log('✅ Database connected successfully');
        release();
    }
});

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Simple mock API endpoints
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Food Delivery API is running (Development Mode)',
    timestamp: new Date().toISOString(),
    environment: 'Development'
  });
});

// Config endpoint for client-side environment variables
app.get('/api/config', (req, res) => {
  res.json({
    CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
    CLERK_FRONTEND_API: process.env.NEXT_PUBLIC_CLERK_FRONTEND_API || ''
  });
});

app.get('/api/products', (req, res) => {
  // Sample products data
  const products = [
    { id: 1, name: 'Fresh Apples', image: 'https://images.unsplash.com/photo-1579613832125-5d34a13ffe2a?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400', category: 'Fruits', variants: [{unit: '500 g', price: 75}, {unit: '1 kg', price: 150}] },
    { id: 2, name: 'Ripe Bananas', image: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400', category: 'Fruits', variants: [{unit: '6 pcs', price: 30}, {unit: '1 dozen', price: 50}] },
    { id: 3, name: 'Tomatoes', image: 'https://cdn.zeptonow.com/production/tr:w-403,ar-1024-1024,pr-true,f-auto,q-80/cms/product_variant/04a3037a-04a3-47f3-9db4-23ae268177aa.jpeg', category: 'Vegetables', variants: [{unit: '250 g', price: 24}, {unit: '500 g', price: 42}] },
    { id: 4, name: 'Organic Milk', image: 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400', category: 'Dairy', variants: [{unit: '500 ml', price: 25}, {unit: '1 litre', price: 48}] },
    { id: 5, name: 'Whole Wheat Bread', image: 'https://cdn.zeptonow.com/production/tr:w-1280,ar-1200-1200,pr-true,f-auto,q-80/cms/product_variant/68de0f15-ba46-4a79-95ec-0e2a33ce9dcc.jpeg', category: 'Bakery', variants: [{unit: '1 loaf', price: 45}] },
    { id: 6, name: 'Eggs', image: 'https://cdn.zeptonow.com/production/tr:w-1280,ar-1200-1200,pr-true,f-auto,q-80/cms/product_variant/35241f67-e64e-4f15-8c9e-175186993049.jpeg', category: 'Dairy', variants: [{unit: '6 pack', price: 40}, {unit: '12 pack', price: 70}] }
  ];
  res.json(products);
});

// Mock orders storage
let mockOrders = [];
let orderIdCounter = 1;

// Route to get orders for specific user (must be before general /api/orders route)
app.get('/api/orders/user/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    const orders = result.rows;
    
    const formattedOrders = orders.map(order => ({
      id: order.id,
      _id: order.id,
      userId: order.user_id,
      items: order.items,
      total: order.total_amount,
      totalAmount: order.total_amount,
      status: order.status,
      paymentMethod: order.payment_method,
      orderDate: order.created_at,
      createdAt: order.created_at,
      deliveryAddress: order.delivery_address
    }));
    
    res.status(200).json(formattedOrders);
  } catch (error) {
    console.error('Database error:', error.message);
    res.status(500).json({ error: 'Failed to fetch orders', details: error.message });
  }
});

app.get('/api/orders', async (req, res) => {
  const { userId } = req.query;
  
  try {
    let query, params;
    if (userId) {
      query = 'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC';
      params = [userId];
    } else {
      query = 'SELECT * FROM orders ORDER BY created_at DESC';
      params = [];
    }
    
    const result = await pool.query(query, params);
    const orders = result.rows;
    
    const formattedOrders = orders.map(order => ({
      id: order.id,
      _id: order.id,
      userId: order.user_id,
      items: order.items,
      total: order.total_amount,
      totalAmount: order.total_amount,
      status: order.status,
      paymentMethod: order.payment_method,
      orderDate: order.created_at,
      createdAt: order.created_at,
      deliveryAddress: order.delivery_address
    }));
    
    res.status(200).json(formattedOrders);
  } catch (error) {
    console.error('Database error, using fallback storage:', error.message);
    
    // Fallback to in-memory storage
    if (userId) {
      const userOrders = mockOrders.filter(order => order.user_id === userId);
      res.json(userOrders.map(order => ({
        id: order.id,
        userId: order.user_id,
        items: order.items,
        total: order.total_amount,
        status: order.status,
        paymentMethod: order.payment_method,
        orderDate: order.created_at
      })));
    } else {
      res.json(mockOrders);
    }
  }
});

app.post('/api/orders', async (req, res) => {
  const { userId, items, total, totalAmount, paymentMethod = 'COD', paymentId, deliveryAddress } = req.body;
  
  const orderTotal = total || totalAmount;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items are required and must be a non-empty array' });
  }
  
  if (!orderTotal || isNaN(orderTotal) || orderTotal <= 0) {
    return res.status(400).json({ error: 'Valid total amount is required' });
  }
  
  try {
    // Save to Neon database
    const result = await pool.query(
      `INSERT INTO orders (user_id, items, total_amount, payment_method, payment_id, delivery_address) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId || 'guest-user', JSON.stringify(items), parseFloat(orderTotal), paymentMethod, paymentId, JSON.stringify(deliveryAddress)]
    );
    
    const newOrder = result.rows[0];
    
    res.status(201).json({
      success: true,
      _id: newOrder.id,
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
      message: 'Order placed successfully and saved to database'
    });
  } catch (error) {
    console.error('Database error:', error.message);
    
    // Fallback to in-memory storage
    const newOrder = {
      id: orderIdCounter++,
      user_id: userId || 'guest-user',
      items: items,
      total_amount: parseFloat(orderTotal),
      status: 'pending',
      payment_method: paymentMethod,
      payment_id: paymentId,
      created_at: new Date().toISOString()
    };
    
    mockOrders.push(newOrder);
    
    res.status(201).json({
      success: true,
      _id: newOrder.id,
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
      message: 'Order placed successfully (fallback storage)'
    });
  }
});

app.post('/api/payment-verify', (req, res) => {
  res.json({
    success: true,
    message: 'Payment verified successfully (Development Mode)',
    paymentId: req.body.razorpay_payment_id
  });
});

// Mock users storage
let mockUsers = {};

app.get('/api/users', (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  
  const user = mockUsers[userId];
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json(user);
});

app.post('/api/users', (req, res) => {
  const { userId, name, email, address } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  
  const user = {
    id: Date.now(),
    user_id: userId,
    name,
    email,
    address,
    created_at: new Date().toISOString()
  };
  
  mockUsers[userId] = user;
  res.json(user);
});

// Serve the main HTML file for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Development Server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api/`);
  console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📱 Frontend available at http://localhost:${PORT}`);
});

module.exports = app;