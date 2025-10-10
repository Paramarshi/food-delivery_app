export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
        
        // For demo purposes, always return success
        // In production, you would verify the signature with Razorpay
        res.status(200).json({
            success: true,
            message: 'Payment verified successfully',
            paymentId: razorpay_payment_id
        });
    } catch (error) {
        console.error('Payment verification failed:', error.message);
        res.status(500).json({ error: 'Payment verification failed' });
    }
}