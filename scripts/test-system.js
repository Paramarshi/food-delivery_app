#!/usr/bin/env node

// Complete Product Tracking System Test
// Tests all components: Product codes, QR codes, and integration

const { generateProductId, createProductMetadata, isValidProductId } = require('../utils/product-code-generator');
const { generateProductQRCode, generatePrintableLabel } = require('../utils/qr-code-generator');

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║   Product Tracking System - Complete Test             ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

async function runTests() {
    let passed = 0;
    let failed = 0;

    // Test 1: Product ID Generation
    try {
        console.log('📋 Test 1: Product ID Generation');
        const productId = generateProductId('Organic Apples');
        console.log('   Generated ID:', productId);
        
        if (isValidProductId(productId)) {
            console.log('   ✅ Valid product ID format\n');
            passed++;
        } else {
            console.log('   ❌ Invalid product ID format\n');
            failed++;
        }
    } catch (error) {
        console.log('   ❌ Error:', error.message, '\n');
        failed++;
    }

    // Test 2: Product ID Validation
    try {
        console.log('📋 Test 2: Product ID Validation');
        const validIds = [
            'APPLE_MHNPR1Y5_A7B9C2',
            'MILK_L5K2J_B8C0D3',
            'RICE_M6L3K_C9D1E4'
        ];
        
        const invalidIds = [
            'APPLE',
            'APPLE_123',
            'invalid_format_here'
        ];
        
        let allValid = validIds.every(id => isValidProductId(id));
        let allInvalid = invalidIds.every(id => !isValidProductId(id));
        
        if (allValid && allInvalid) {
            console.log('   ✅ Validation working correctly\n');
            passed++;
        } else {
            console.log('   ❌ Validation not working correctly\n');
            failed++;
        }
    } catch (error) {
        console.log('   ❌ Error:', error.message, '\n');
        failed++;
    }

    // Test 3: Metadata Creation
    try {
        console.log('📋 Test 3: Metadata Creation');
        const productId = generateProductId('Test Product');
        const metadata = createProductMetadata({
            productId: productId,
            name: 'Test Product',
            category: 'Test',
            origin: 'Test Farm',
            farmer: 'Test Farmer',
            weight: 5,
            unit: 'kg'
        });
        
        if (metadata.productId && metadata.name && metadata.trackingUrl && metadata.verificationHash) {
            console.log('   ✅ Metadata created with all fields\n');
            passed++;
        } else {
            console.log('   ❌ Metadata missing required fields\n');
            failed++;
        }
    } catch (error) {
        console.log('   ❌ Error:', error.message, '\n');
        failed++;
    }

    // Test 4: QR Code Generation
    try {
        console.log('📋 Test 4: QR Code Generation');
        const testId = 'TEST_MHNPR1Y5_A7B9C2';
        const qrDataUrl = await generateProductQRCode(testId);
        
        if (qrDataUrl && qrDataUrl.startsWith('data:image/png;base64,')) {
            console.log('   ✅ QR code generated successfully\n');
            passed++;
        } else {
            console.log('   ❌ Invalid QR code format\n');
            failed++;
        }
    } catch (error) {
        console.log('   ❌ Error:', error.message, '\n');
        failed++;
    }

    // Test 5: Printable Label Generation
    try {
        console.log('📋 Test 5: Printable Label Generation');
        const labelHtml = await generatePrintableLabel({
            productId: 'TEST_MHNPR1Y5_A7B9C2',
            name: 'Test Product',
            origin: 'Test Farm',
            category: 'Test',
            weight: 5,
            unit: 'kg'
        });
        
        if (labelHtml && labelHtml.includes('<!DOCTYPE html>') && labelHtml.includes('QR')) {
            console.log('   ✅ Label HTML generated successfully\n');
            passed++;
        } else {
            console.log('   ❌ Invalid label HTML\n');
            failed++;
        }
    } catch (error) {
        console.log('   ❌ Error:', error.message, '\n');
        failed++;
    }

    // Test 6: Unique ID Generation
    try {
        console.log('📋 Test 6: Unique ID Generation (No Collisions)');
        const ids = new Set();
        let hasCollision = false;
        
        for (let i = 0; i < 100; i++) {
            const id = generateProductId('Apple');
            if (ids.has(id)) {
                hasCollision = true;
                break;
            }
            ids.add(id);
        }
        
        if (!hasCollision && ids.size === 100) {
            console.log('   ✅ Generated 100 unique IDs without collision\n');
            passed++;
        } else {
            console.log('   ❌ ID collision detected\n');
            failed++;
        }
    } catch (error) {
        console.log('   ❌ Error:', error.message, '\n');
        failed++;
    }

    // Test 7: Error Handling
    try {
        console.log('📋 Test 7: Error Handling');
        let errorsCaught = 0;
        
        // Test empty product type
        try {
            generateProductId('');
        } catch (e) {
            errorsCaught++;
        }
        
        // Test null product type
        try {
            generateProductId(null);
        } catch (e) {
            errorsCaught++;
        }
        
        // Test invalid type
        try {
            generateProductId(123);
        } catch (e) {
            errorsCaught++;
        }
        
        if (errorsCaught === 3) {
            console.log('   ✅ All errors handled correctly\n');
            passed++;
        } else {
            console.log('   ❌ Some errors not handled correctly\n');
            failed++;
        }
    } catch (error) {
        console.log('   ❌ Unexpected error:', error.message, '\n');
        failed++;
    }

    // Summary
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║   Test Summary                                         ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    console.log(`   Total Tests: ${passed + failed}`);
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log();

    if (failed === 0) {
        console.log('🎉 All tests passed! System is working correctly.\n');
        console.log('Next steps:');
        console.log('  1. Run: node scripts/register-product.js');
        console.log('  2. Generate your first product and QR code');
        console.log('  3. Test scanning at: http://localhost:3000/public/profile.html\n');
        process.exit(0);
    } else {
        console.log('⚠️  Some tests failed. Please check the errors above.\n');
        process.exit(1);
    }
}

// Run tests
runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
