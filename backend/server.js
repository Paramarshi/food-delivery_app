const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/food_delivery', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.log('❌ MongoDB Error:', err));

// Simple Order Schema
const Order = mongoose.model('Order', {
    userId: String,
    items: Array,
    totalAmount: Number,
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running!' });
});

// Create order
app.post('/api/orders', async (req, res) => {
    try {
        console.log('📦 New order:', req.body);
        const order = new Order(req.body);
        const saved = await order.save();
        console.log('✅ Order saved:', saved._id);
        res.json(saved);
    } catch (error) {
        console.log('❌ Error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Get all orders
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user orders
app.get('/api/orders/user/:userId', async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(5000, () => {
    console.log('🚀 Server running on http://localhost:5000');
    console.log('🩺 Health: http://localhost:5000/api/health');
});