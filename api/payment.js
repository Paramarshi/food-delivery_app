/**
 * Payment Processing API
 * Handles payment verification and processing
 */

// Simulated payment gateway integration
// In production, integrate with real payment gateways like:
// - Razorpay
// - Stripe
// - PayU
// - Paytm

const payments = new Map(); // In-memory storage (use database in production)

module.exports = async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Process Payment
    if (req.method === 'POST') {
        try {
            const {
                orderId,
                amount,
                paymentMethod,
                cardDetails,
                upiId,
                walletType,
                bankCode,
                customerEmail,
                customerPhone
            } = req.body;

            // Validate required fields
            if (!orderId || !amount || !paymentMethod) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields'
                });
            }

            // Validate amount
            if (amount <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid amount'
                });
            }

            // Process based on payment method
            let paymentResult;
            switch (paymentMethod) {
                case 'card':
                    paymentResult = await processCardPayment(cardDetails, amount);
                    break;
                case 'upi':
                    paymentResult = await processUPIPayment(upiId, amount);
                    break;
                case 'wallet':
                    paymentResult = await processWalletPayment(walletType, amount);
                    break;
                case 'netbanking':
                    paymentResult = await processNetBankingPayment(bankCode, amount);
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid payment method'
                    });
            }

            // Generate transaction details
            const transactionId = generateTransactionId();
            const timestamp = new Date().toISOString();

            // Store payment record
            const paymentRecord = {
                transactionId,
                orderId,
                amount,
                paymentMethod,
                status: paymentResult.success ? 'success' : 'failed',
                timestamp,
                customerEmail,
                customerPhone,
                gatewayResponse: paymentResult
            };

            payments.set(transactionId, paymentRecord);

            // Return response
            if (paymentResult.success) {
                return res.status(200).json({
                    success: true,
                    transactionId,
                    orderId,
                    amount,
                    paymentMethod,
                    timestamp,
                    message: 'Payment processed successfully'
                });
            } else {
                return res.status(400).json({
                    success: false,
                    error: paymentResult.error || 'Payment failed',
                    orderId
                });
            }

        } catch (error) {
            console.error('Payment processing error:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    // Get Payment Status
    if (req.method === 'GET') {
        const { transactionId } = req.query;

        if (!transactionId) {
            return res.status(400).json({
                success: false,
                error: 'Transaction ID required'
            });
        }

        const payment = payments.get(transactionId);

        if (!payment) {
            return res.status(404).json({
                success: false,
                error: 'Transaction not found'
            });
        }

        return res.status(200).json({
            success: true,
            payment
        });
    }

    return res.status(405).json({
        success: false,
        error: 'Method not allowed'
    });
};

// Payment Processing Functions

async function processCardPayment(cardDetails, amount) {
    // Simulate card payment processing
    // In production, integrate with payment gateway API
    
    // Validate card details
    if (!cardDetails || !cardDetails.number || !cardDetails.cvv) {
        return { success: false, error: 'Invalid card details' };
    }

    // Simulate processing delay
    await sleep(1500);

    // Simulate success (90% success rate)
    const success = Math.random() > 0.1;

    if (success) {
        return {
            success: true,
            gatewayTransactionId: 'GTW-' + Date.now(),
            cardLast4: cardDetails.number.slice(-4),
            cardType: detectCardType(cardDetails.number)
        };
    } else {
        return {
            success: false,
            error: 'Card declined - Insufficient funds or invalid card'
        };
    }
}

async function processUPIPayment(upiId, amount) {
    // Simulate UPI payment processing
    
    if (!upiId || !upiId.includes('@')) {
        return { success: false, error: 'Invalid UPI ID' };
    }

    await sleep(2000);

    const success = Math.random() > 0.05;

    if (success) {
        return {
            success: true,
            gatewayTransactionId: 'UPI-' + Date.now(),
            upiId: maskUPIId(upiId)
        };
    } else {
        return {
            success: false,
            error: 'UPI transaction failed - Please try again'
        };
    }
}

async function processWalletPayment(walletType, amount) {
    // Simulate wallet payment processing
    
    if (!walletType) {
        return { success: false, error: 'Wallet type required' };
    }

    await sleep(1000);

    const success = Math.random() > 0.05;

    if (success) {
        return {
            success: true,
            gatewayTransactionId: 'WLT-' + Date.now(),
            walletType,
            walletBalance: 'Deducted ₹' + amount
        };
    } else {
        return {
            success: false,
            error: 'Insufficient wallet balance'
        };
    }
}

async function processNetBankingPayment(bankCode, amount) {
    // Simulate net banking payment processing
    
    if (!bankCode) {
        return { success: false, error: 'Bank selection required' };
    }

    await sleep(2500);

    const success = Math.random() > 0.08;

    if (success) {
        return {
            success: true,
            gatewayTransactionId: 'NB-' + Date.now(),
            bankCode,
            bankName: getBankName(bankCode)
        };
    } else {
        return {
            success: false,
            error: 'Net banking transaction failed - Please check with your bank'
        };
    }
}

// Helper Functions

function generateTransactionId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return 'TXN' + timestamp + random;
}

function detectCardType(cardNumber) {
    const number = cardNumber.replace(/\s/g, '');
    
    if (number.startsWith('4')) return 'Visa';
    if (number.startsWith('5')) return 'Mastercard';
    if (number.startsWith('3')) return 'American Express';
    if (number.startsWith('6')) return 'Discover';
    
    return 'Unknown';
}

function maskUPIId(upiId) {
    const [name, provider] = upiId.split('@');
    const maskedName = name.substring(0, 2) + '***' + name.substring(name.length - 2);
    return maskedName + '@' + provider;
}

function getBankName(bankCode) {
    const banks = {
        'sbi': 'State Bank of India',
        'hdfc': 'HDFC Bank',
        'icici': 'ICICI Bank',
        'axis': 'Axis Bank',
        'kotak': 'Kotak Mahindra Bank',
        'pnb': 'Punjab National Bank',
        'bob': 'Bank of Baroda'
    };
    return banks[bankCode] || 'Unknown Bank';
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Export functions for testing
module.exports.processCardPayment = processCardPayment;
module.exports.processUPIPayment = processUPIPayment;
module.exports.processWalletPayment = processWalletPayment;
module.exports.processNetBankingPayment = processNetBankingPayment;
module.exports.generateTransactionId = generateTransactionId;
