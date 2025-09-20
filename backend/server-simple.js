const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Basic middleware
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000', 'file://'],
    credentials: true
}));
app.use(express.json());

// Simple file-based storage
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

const ordersFile = path.join(dataDir, 'orders.json');
const productsFile = path.join(dataDir, 'products.json');

// Initialize data files if they don't exist
if (!fs.existsSync(ordersFile)) {
    fs.writeFileSync(ordersFile, JSON.stringify([]));
}

if (!fs.existsSync(productsFile)) {
    const products = [
        { id: 1, name: 'Fresh Apples', image: 'https://images.unsplash.com/photo-1579613832125-5d34a13ffe2a?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400', category: 'Fruits', variants: [{unit: '500 g', price: 75}, {unit: '1 kg', price: 150}] },
        { id: 2, name: 'Ripe Bananas', image: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400', category: 'Fruits', variants: [{unit: '6 pcs', price: 30}, {unit: '1 dozen', price: 50}] },
        { id: 3, name: 'Tomatoes', image: 'https://cdn.zeptonow.com/production/tr:w-1280,ar-3000-3000,pr-true,f-auto,q-80/cms/product_variant/05e8f43f-90fa-4636-8c03-fafc8f9e7b21.jpeg', category: 'Vegetables', variants: [{unit: '250 g', price: 40}, {unit: '500 g', price: 80}] },
        { id: 4, name: 'Organic Milk', image: 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400', category: 'Dairy', variants: [{unit: '500 ml', price: 25}, {unit: '1 litre', price: 48}] }
    ];
    fs.writeFileSync(productsFile, JSON.stringify(products));
}

// Helper functions
const readJSON = (filePath) => {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        return [];
    }
};

const writeJSON = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Routes
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

app.get('/api/products', (req, res) => {
    try {
        const products = readJSON(productsFile);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

app.post('/api/orders', (req, res) => {
    try {
        const { userId, items, total, paymentMethod } = req.body;
        
        const newOrder = {
            id: Date.now().toString(),
            userId: userId || 'guest-user',
            items,
            total,
            paymentMethod,
            status: 'confirmed',
            orderDate: new Date().toISOString(),
            deliveryTime: '12 minutes'
        };

        const orders = readJSON(ordersFile);
        orders.push(newOrder);
        writeJSON(ordersFile, orders);

        res.status(201).json({
            success: true,
            order: newOrder,
            message: 'Order placed successfully'
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create order' });
    }
});

app.get('/api/orders/user/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const orders = readJSON(ordersFile);
        const userOrders = orders.filter(order => order.userId === userId);
        res.json(userOrders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

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
        res.status(500).json({ error: 'Payment verification failed' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log('🚀 Simple Server running on http://localhost:' + PORT);
    console.log('🩺 Health: http://localhost:' + PORT + '/api/health');
    console.log('📡 API Base: http://localhost:' + PORT + '/api');
    console.log('💾 Using file-based storage');
});
