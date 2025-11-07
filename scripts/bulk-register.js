#!/usr/bin/env node

// Bulk Product Registration Tool
// Usage: node scripts/bulk-register.js products.csv

const { generateBulkProductIds, createProductMetadata } = require('../utils/product-code-generator');
const { generateBatchQRCodes, generatePrintableLabel } = require('../utils/qr-code-generator');
const fs = require('fs');
const path = require('path');

/**
 * Generate multiple products from a template
 */
async function bulkRegister(productInfo, quantity) {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║   Bulk Product Registration                            ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    console.log(`📦 Creating ${quantity} products of type: ${productInfo.name}\n`);

    // Generate product IDs
    const products = generateBulkProductIds(productInfo.name, quantity);
    
    console.log(`✅ Generated ${products.length} unique product IDs`);
    console.log(`📦 Batch Code: ${products[0].batchCode}\n`);

    // Create output directory
    const outputDir = path.join(__dirname, '../qr-codes/batch', products[0].batchCode);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate metadata for each product
    const allProducts = [];
    for (const product of products) {
        const metadata = createProductMetadata({
            ...productInfo,
            productId: product.productId,
            batchCode: product.batchCode,
            sequenceNumber: product.sequenceNumber
        });
        allProducts.push(metadata);
    }

    // Generate QR codes
    console.log('🔄 Generating QR codes...');
    const qrResults = await generateBatchQRCodes(allProducts, outputDir, {
        baseUrl: 'http://localhost:3000'
    });

    const successCount = qrResults.filter(r => r.success).length;
    console.log(`✅ Generated ${successCount}/${qrResults.length} QR codes\n`);

    // Generate printable labels
    console.log('🔄 Generating printable labels...');
    for (const product of allProducts) {
        const label = await generatePrintableLabel(product);
        const labelPath = path.join(outputDir, `${product.productId}_label.html`);
        fs.writeFileSync(labelPath, label);
    }
    console.log(`✅ Generated ${allProducts.length} printable labels\n`);

    // Save batch metadata
    const batchMetadata = {
        batchCode: products[0].batchCode,
        productType: productInfo.name,
        quantity: quantity,
        products: allProducts,
        generatedAt: new Date().toISOString()
    };

    const batchPath = path.join(outputDir, 'batch_metadata.json');
    fs.writeFileSync(batchPath, JSON.stringify(batchMetadata, null, 2));
    console.log('✅ Batch metadata saved\n');

    // Generate CSV for bulk blockchain registration
    const csvPath = path.join(outputDir, 'blockchain_registration.csv');
    const csvHeaders = 'Product ID,Name,Origin,Category,Weight,Unit,Tracking URL\n';
    const csvRows = allProducts.map(p => 
        `${p.productId},${p.name},${p.origin},${p.category},${p.weight},${p.unit},${p.trackingUrl}`
    ).join('\n');
    fs.writeFileSync(csvPath, csvHeaders + csvRows);
    console.log('✅ CSV file created for blockchain registration\n');

    // Summary
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║   Summary                                              ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    console.log(`📦 Batch Code: ${products[0].batchCode}`);
    console.log(`📊 Total Products: ${quantity}`);
    console.log(`📁 Output Directory: ${outputDir}`);
    console.log(`\n📋 Files Generated:`);
    console.log(`   - ${quantity} QR code images (.png)`);
    console.log(`   - ${quantity} Printable labels (.html)`);
    console.log(`   - 1 Batch metadata file (JSON)`);
    console.log(`   - 1 Blockchain registration file (CSV)`);

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║   Next Steps                                           ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    console.log('1. Review batch metadata in:', batchPath);
    console.log('2. Print labels from the _label.html files');
    console.log('3. Register products on blockchain using the CSV file');
    console.log('4. Attach QR codes to product packaging\n');

    console.log('🎉 Bulk registration completed successfully!\n');

    return {
        batchCode: products[0].batchCode,
        outputDir,
        products: allProducts
    };
}

// Example usage
async function example() {
    const productInfo = {
        name: 'Organic Apples',
        category: 'Fruits',
        origin: 'Washington Farm',
        farmer: 'John Smith',
        weight: 1,
        unit: 'kg'
    };

    const quantity = 10;

    await bulkRegister(productInfo, quantity);
}

// Command line usage
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('\nUsage: node scripts/bulk-register.js\n');
        console.log('This will generate 10 sample products.\n');
        console.log('Modify the script to customize product details.\n');
        example();
    } else {
        console.log('\nFor custom bulk registration, modify the example() function in the script.\n');
    }
}

module.exports = { bulkRegister };
