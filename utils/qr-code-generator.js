// QR Code Generator for Blockchain Supply Chain Products
// Generates QR codes that consumers can scan to track products

const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

/**
 * Generate QR code for a product
 * @param {string} productId - Unique product identifier
 * @param {object} options - QR code options
 * @returns {Promise<string>} - Base64 encoded QR code image
 */
async function generateProductQRCode(productId, options = {}) {
    const defaultOptions = {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.95,
        margin: 2,
        color: {
            dark: '#000000',
            light: '#FFFFFF'
        },
        width: 300
    };

    const qrOptions = { ...defaultOptions, ...options };
    
    // Generate tracking URL
    const trackingUrl = options.baseUrl 
        ? `${options.baseUrl}/public/profile.html?track=${productId}`
        : `http://localhost:3000/public/profile.html?track=${productId}`;

    try {
        // Generate QR code as data URL
        const qrCodeDataUrl = await QRCode.toDataURL(trackingUrl, qrOptions);
        return qrCodeDataUrl;
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw error;
    }
}

/**
 * Generate QR code and save to file
 * @param {string} productId - Unique product identifier
 * @param {string} outputPath - File path to save QR code
 * @param {object} options - QR code options
 */
async function generateAndSaveQRCode(productId, outputPath, options = {}) {
    const defaultOptions = {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 400,
        color: {
            dark: '#000000',
            light: '#FFFFFF'
        }
    };

    const qrOptions = { ...defaultOptions, ...options };
    
    const trackingUrl = options.baseUrl 
        ? `${options.baseUrl}/public/profile.html?track=${productId}`
        : `http://localhost:3000/public/profile.html?track=${productId}`;

    try {
        // Ensure directory exists
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Generate and save QR code
        await QRCode.toFile(outputPath, trackingUrl, qrOptions);
        console.log(`QR code saved to: ${outputPath}`);
        return outputPath;
    } catch (error) {
        console.error('Error saving QR code:', error);
        throw error;
    }
}

/**
 * Generate QR codes for multiple products in batch
 * @param {Array} products - Array of product objects with productId
 * @param {string} outputDir - Directory to save QR codes
 * @param {object} options - QR code options
 */
async function generateBatchQRCodes(products, outputDir, options = {}) {
    const results = [];
    
    for (const product of products) {
        const filename = `${product.productId}.png`;
        const outputPath = path.join(outputDir, filename);
        
        try {
            await generateAndSaveQRCode(product.productId, outputPath, options);
            results.push({
                productId: product.productId,
                success: true,
                path: outputPath
            });
        } catch (error) {
            results.push({
                productId: product.productId,
                success: false,
                error: error.message
            });
        }
    }
    
    return results;
}

/**
 * Generate QR code with product information embedded
 * @param {object} productData - Complete product information
 * @param {object} options - QR code options
 */
async function generateProductQRCodeWithData(productData, options = {}) {
    const qrData = {
        productId: productData.productId,
        name: productData.name,
        origin: productData.origin,
        trackingUrl: `http://localhost:3000/public/profile.html?track=${productData.productId}`,
        timestamp: Date.now()
    };

    const dataString = JSON.stringify(qrData);
    
    const defaultOptions = {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 400
    };

    const qrOptions = { ...defaultOptions, ...options };

    try {
        const qrCodeDataUrl = await QRCode.toDataURL(dataString, qrOptions);
        return qrCodeDataUrl;
    } catch (error) {
        console.error('Error generating QR code with data:', error);
        throw error;
    }
}

/**
 * Generate printable label with QR code and product info
 * @param {object} productData - Product information
 * @returns {string} - HTML string for printable label
 */
async function generatePrintableLabel(productData) {
    const qrCode = await generateProductQRCode(productData.productId, { width: 250 });
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Product Label - ${productData.productId}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .label {
            border: 2px solid #000;
            padding: 20px;
            width: 400px;
            text-align: center;
            background: white;
        }
        .label h2 {
            margin: 0 0 10px 0;
            font-size: 24px;
        }
        .label .product-id {
            font-family: 'Courier New', monospace;
            font-size: 18px;
            font-weight: bold;
            margin: 10px 0;
            padding: 5px;
            background: #f0f0f0;
        }
        .label img {
            margin: 15px 0;
        }
        .label .info {
            text-align: left;
            margin-top: 15px;
            font-size: 14px;
        }
        .label .info p {
            margin: 5px 0;
        }
        .scan-text {
            margin-top: 15px;
            font-size: 12px;
            color: #666;
        }
        @media print {
            body {
                margin: 0;
                padding: 0;
            }
            .label {
                border: 2px solid #000;
                page-break-after: always;
            }
        }
    </style>
</head>
<body>
    <div class="label">
        <h2>${productData.name}</h2>
        <div class="product-id">${productData.productId}</div>
        <img src="${qrCode}" alt="QR Code" />
        <div class="info">
            <p><strong>Origin:</strong> ${productData.origin}</p>
            <p><strong>Category:</strong> ${productData.category || 'N/A'}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            ${productData.weight ? `<p><strong>Weight:</strong> ${productData.weight} ${productData.unit || 'kg'}</p>` : ''}
        </div>
        <div class="scan-text">
            📱 Scan QR code to track product journey on blockchain
        </div>
    </div>
</body>
</html>
    `;
    
    return html;
}

module.exports = {
    generateProductQRCode,
    generateAndSaveQRCode,
    generateBatchQRCodes,
    generateProductQRCodeWithData,
    generatePrintableLabel
};

// Test function (for CLI testing)
if (require.main === module) {
    console.log('\n=== QR Code Generator Test ===\n');
    
    const testProductId = 'APPLE_MHNPR1Y5_A7B9C2';
    
    (async () => {
        try {
            console.log('1. Testing QR Code Generation:');
            const qrDataUrl = await generateProductQRCode(testProductId);
            console.log('   ✅ QR Code generated successfully');
            console.log('   Data URL length:', qrDataUrl.length, 'characters');
            console.log('   Format:', qrDataUrl.substring(0, 30) + '...');
            
            console.log('\n2. Testing Printable Label:');
            const label = await generatePrintableLabel({
                productId: testProductId,
                name: 'Organic Apples',
                origin: 'Washington Farm',
                category: 'Fruits',
                weight: 10,
                unit: 'kg'
            });
            console.log('   ✅ Label HTML generated');
            console.log('   HTML length:', label.length, 'characters');
            
            console.log('\n3. Testing File Save:');
            const outputPath = path.join(__dirname, '../qr-codes', `${testProductId}.png`);
            await generateAndSaveQRCode(testProductId, outputPath);
            console.log('   ✅ QR code saved to file');
            
            console.log('\n✅ All QR code tests passed!\n');
            
        } catch (error) {
            console.error('\n❌ Test failed:', error.message);
            process.exit(1);
        }
    })();
}
