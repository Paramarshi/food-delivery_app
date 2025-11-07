// Product Code Generator for Blockchain Supply Chain
// Generates unique product codes and QR codes for tracking

const crypto = require('crypto');

/**
 * Generate a unique product ID
 * Format: {PREFIX}_{TIMESTAMP}_{RANDOM}
 * Example: APPLE_L5K2J_A7B9C2
 */
function generateProductId(productType) {
    if (!productType || typeof productType !== 'string') {
        throw new Error('Product type is required and must be a string');
    }
    
    const prefix = productType.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10);
    if (prefix.length === 0) {
        throw new Error('Product type must contain at least one alphanumeric character');
    }
    
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    
    return `${prefix}_${timestamp}_${random}`;
}

/**
 * Generate a batch code for multiple products
 * Format: BATCH_{DATE}_{SUPPLIER}_{COUNT}
 * Example: BATCH_20251106_FARM01_100_A7B9
 */
function generateBatchCode(supplierCode, quantity) {
    if (!supplierCode || typeof supplierCode !== 'string') {
        throw new Error('Supplier code is required and must be a string');
    }
    
    if (!quantity || typeof quantity !== 'number' || quantity <= 0) {
        throw new Error('Quantity must be a positive number');
    }
    
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const supplier = supplierCode.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10);
    const random = crypto.randomBytes(2).toString('hex').toUpperCase();
    
    return `BATCH_${date}_${supplier}_${quantity}_${random}`;
}

/**
 * Generate tracking URL for QR code
 */
function generateTrackingUrl(productId, baseUrl = 'http://localhost:3000') {
    return `${baseUrl}/public/profile.html?track=${productId}`;
}

/**
 * Generate verification hash for product authenticity
 */
function generateVerificationHash(productId, productName, origin) {
    const data = `${productId}|${productName}|${origin}|${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Validate product ID format
 */
function isValidProductId(productId) {
    // Format: PREFIX_TIMESTAMP_RANDOM (e.g., APPLE_L5K2J_A7B9C2)
    const pattern = /^[A-Z0-9]{3,10}_[A-Z0-9]{5,10}_[A-F0-9]{6}$/;
    return pattern.test(productId);
}

/**
 * Generate multiple product IDs for bulk registration
 */
function generateBulkProductIds(productType, quantity) {
    const products = [];
    const batchCode = generateBatchCode(productType.substring(0, 6).toUpperCase(), quantity);
    
    for (let i = 0; i < quantity; i++) {
        products.push({
            productId: generateProductId(productType),
            batchCode: batchCode,
            sequenceNumber: i + 1,
            totalInBatch: quantity
        });
    }
    
    return products;
}

/**
 * Generate product metadata for blockchain registration
 */
function createProductMetadata(productInfo) {
    return {
        productId: productInfo.productId || generateProductId(productInfo.name),
        name: productInfo.name,
        category: productInfo.category,
        origin: productInfo.origin,
        farmer: productInfo.farmer,
        harvestDate: productInfo.harvestDate || new Date().toISOString(),
        weight: productInfo.weight,
        unit: productInfo.unit || 'kg',
        certifications: productInfo.certifications || [],
        verificationHash: generateVerificationHash(
            productInfo.productId || 'NEW',
            productInfo.name,
            productInfo.origin
        ),
        timestamp: Date.now(),
        trackingUrl: generateTrackingUrl(productInfo.productId)
    };
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateProductId,
        generateBatchCode,
        generateTrackingUrl,
        generateVerificationHash,
        isValidProductId,
        generateBulkProductIds,
        createProductMetadata
    };
}

// Browser compatibility
if (typeof window !== 'undefined') {
    window.ProductCodeGenerator = {
        generateProductId,
        generateBatchCode,
        generateTrackingUrl,
        isValidProductId,
        createProductMetadata
    };
}

// Test function (for CLI testing)
if (require.main === module) {
    console.log('\n=== Product Code Generator Test ===\n');
    
    try {
        // Test product ID generation
        console.log('1. Testing Product ID Generation:');
        const appleId = generateProductId('Organic Apples');
        console.log('   Apple ID:', appleId);
        console.log('   Valid:', isValidProductId(appleId));
        
        const milkId = generateProductId('Fresh Milk');
        console.log('   Milk ID:', milkId);
        console.log('   Valid:', isValidProductId(milkId));
        
        // Test batch code
        console.log('\n2. Testing Batch Code Generation:');
        const batchCode = generateBatchCode('FARM01', 100);
        console.log('   Batch Code:', batchCode);
        
        // Test tracking URL
        console.log('\n3. Testing Tracking URL:');
        const trackingUrl = generateTrackingUrl(appleId);
        console.log('   URL:', trackingUrl);
        
        // Test verification hash
        console.log('\n4. Testing Verification Hash:');
        const hash = generateVerificationHash(appleId, 'Organic Apples', 'Washington Farm');
        console.log('   Hash:', hash.substring(0, 16) + '...');
        
        // Test metadata creation
        console.log('\n5. Testing Metadata Creation:');
        const metadata = createProductMetadata({
            productId: appleId,
            name: 'Organic Apples',
            category: 'Fruits',
            origin: 'Washington Farm',
            farmer: 'John Smith',
            weight: 10,
            unit: 'kg'
        });
        console.log('   Metadata:', JSON.stringify(metadata, null, 2));
        
        // Test bulk generation
        console.log('\n6. Testing Bulk Product IDs:');
        const bulkProducts = generateBulkProductIds('Tomatoes', 5);
        console.log('   Generated', bulkProducts.length, 'product IDs:');
        bulkProducts.forEach((p, i) => {
            console.log(`   ${i + 1}. ${p.productId} (Batch: ${p.batchCode})`);
        });
        
        console.log('\n✅ All tests passed!\n');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}
