#!/usr/bin/env node

// CLI Tool for Product Registration with QR Code Generation
// Usage: node scripts/register-product.js

const { generateProductId, createProductMetadata } = require('../utils/product-code-generator');
const { generateAndSaveQRCode, generatePrintableLabel } = require('../utils/qr-code-generator');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            resolve(answer);
        });
    });
}

async function main() {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║       Product Registration & QR Generator             ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    try {
        // Get product information
        const name = await question('Product Name (e.g., Organic Apples): ');
        const category = await question('Category (e.g., Fruits, Vegetables, Dairy): ');
        const origin = await question('Origin/Farm Location (e.g., Washington Farm): ');
        const farmer = await question('Farmer/Producer Name: ');
        const weight = await question('Weight/Quantity (e.g., 10): ');
        const unit = await question('Unit (e.g., kg, lbs, units): ');
        
        // Generate product ID
        const productId = generateProductId(name);
        console.log('\n✅ Generated Product ID:', productId);

        // Create metadata
        const metadata = createProductMetadata({
            productId,
            name,
            category,
            origin,
            farmer,
            weight: parseFloat(weight) || 0,
            unit
        });

        console.log('\n📋 Product Metadata:');
        console.log(JSON.stringify(metadata, null, 2));

        // Generate QR Code
        console.log('\n🔄 Generating QR Code...');
        
        const qrDir = path.join(__dirname, '../qr-codes');
        const qrPath = path.join(qrDir, `${productId}.png`);
        
        await generateAndSaveQRCode(productId, qrPath, {
            baseUrl: 'http://localhost:3000'
        });

        console.log('✅ QR Code saved to:', qrPath);

        // Generate printable label
        const label = await generatePrintableLabel(metadata);
        const labelPath = path.join(qrDir, `${productId}_label.html`);
        fs.writeFileSync(labelPath, label);
        console.log('✅ Printable label saved to:', labelPath);

        // Save metadata to JSON
        const metadataPath = path.join(qrDir, `${productId}_metadata.json`);
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
        console.log('✅ Metadata saved to:', metadataPath);

        console.log('\n╔════════════════════════════════════════════════════════╗');
        console.log('║   Registration Complete                               ║');
        console.log('╚════════════════════════════════════════════════════════╝\n');
        
        console.log('✅ Product successfully registered!\n');
        console.log('📦 Files generated:');
        console.log('   - QR Code image');
        console.log('   - Printable label (HTML)');
        console.log('   - Product metadata (JSON)\n');
        
        console.log('3. Use these details to register the product:');
        console.log(`   Product ID: ${productId}`);
        console.log(`   Name: ${name}`);
        console.log(`   Origin: ${origin}\n`);
        
        console.log('4. Print the label and attach QR code to product packaging\n');
        console.log('5. Consumers can scan the QR code to track the product journey!\n');

        console.log('📱 Tracking URL:');
        console.log(`   ${metadata.trackingUrl}\n`);

        console.log('🎉 Product registration files created successfully!\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        rl.close();
    }
}

// Run the script
main();
