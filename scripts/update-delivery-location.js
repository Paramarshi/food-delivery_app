/**
 * Update Delivery Location Script
 * This script allows updating the delivery location/checkpoint for products
 * Usage: node scripts/update-delivery-location.js
 */

const { ethers } = require('hardhat');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Predefined locations for common delivery points
const DELIVERY_LOCATIONS = {
    '1': { name: 'Central Warehouse', coords: '28.6139° N, 77.2090° E', city: 'New Delhi', address: 'Connaught Place, New Delhi' },
    '2': { name: 'Distribution Hub - North', coords: '28.7041° N, 77.1025° E', city: 'Delhi', address: 'Rohini, Delhi' },
    '3': { name: 'Distribution Hub - South', coords: '28.5355° N, 77.3910° E', city: 'Noida', address: 'Sector 62, Noida' },
    '4': { name: 'Local Store - Downtown', coords: '28.6328° N, 77.2197° E', city: 'New Delhi', address: 'Janpath, New Delhi' },
    '5': { name: 'Local Store - Suburb', coords: '28.4595° N, 77.0266° E', city: 'Gurugram', address: 'Cyber City, Gurugram' },
    '6': { name: 'Customer Delivery - Residential', coords: '28.5494° N, 77.2501° E', city: 'New Delhi', address: 'Lajpat Nagar, New Delhi' },
    '7': { name: 'Customer Delivery - Office', coords: '28.6139° N, 77.2315° E', city: 'New Delhi', address: 'Barakhamba Road, New Delhi' },
    '8': { name: 'Express Delivery Center', coords: '28.6692° N, 77.4538° E', city: 'Ghaziabad', address: 'Indirapuram, Ghaziabad' }
};

const STAGES = {
    0: 'Farm',
    1: 'Processing',
    2: 'Quality Check',
    3: 'Packaging',
    4: 'Warehouse',
    5: 'Distribution',
    6: 'Retail',
    7: 'Delivery',
    8: 'Delivered'
};

async function updateDeliveryLocation() {
    console.log('\n🚚 ===== DELIVERY LOCATION UPDATE SYSTEM =====\n');

    try {
        // Get contract
        const SupplyChain = await ethers.getContractFactory('SupplyChain');
        const contract = await SupplyChain.attach(process.env.SUPPLY_CHAIN_CONTRACT || '0x5FbDB2315678afecb367f032d93F642f64180aa3');

        // Get signers
        const [deployer, farmer, inspector, transporter] = await ethers.getSigners();

        console.log('📋 Connected to contract:', contract.target || contract.address);
        console.log('👤 Your address:', deployer.address);

        // Get total products
        const totalProducts = await contract.getTotalProducts();
        console.log(`\n📦 Total products in system: ${totalProducts}\n`);

        if (totalProducts.toString() === '0') {
            console.log('❌ No products found. Please register products first.');
            rl.close();
            return;
        }

        // Get product ID
        const productId = await question('Enter Product ID to update delivery location: ');

        if (!productId || isNaN(productId)) {
            console.log('❌ Invalid Product ID');
            rl.close();
            return;
        }

        // Get product details
        const product = await contract.getProduct(productId);
        console.log(`\n✅ Product found: ${product[0]}`);
        console.log(`   Type: ${product[1]}`);
        console.log(`   Origin: ${product[2]}`);
        console.log(`   Current Stage: ${STAGES[Number(product[4])]}\n`);

        // Select delivery stage
        console.log('📍 SELECT DELIVERY STAGE:');
        console.log('4. Warehouse');
        console.log('5. Distribution');
        console.log('6. Retail');
        console.log('7. Delivery (In Transit)');
        console.log('8. Delivered (Final)\n');

        const stage = await question('Enter stage number (4-8): ');

        if (!stage || isNaN(stage) || stage < 4 || stage > 8) {
            console.log('❌ Invalid stage. Must be 4-8 for delivery tracking.');
            rl.close();
            return;
        }

        // Show available locations
        console.log('\n📍 AVAILABLE DELIVERY LOCATIONS:\n');
        Object.entries(DELIVERY_LOCATIONS).forEach(([key, loc]) => {
            console.log(`${key}. ${loc.name}`);
            console.log(`   📍 ${loc.address}, ${loc.city}`);
            console.log(`   🌍 Coordinates: ${loc.coords}\n`);
        });
        console.log('9. Enter custom location\n');

        const locationChoice = await question('Select location (1-9): ');

        let location, temperature, notes;

        if (locationChoice === '9') {
            // Custom location
            const customCity = await question('Enter city: ');
            const customAddress = await question('Enter address: ');
            const customCoords = await question('Enter GPS coordinates (optional, press Enter to skip): ');
            
            location = customCoords 
                ? `${customAddress}, ${customCity} (${customCoords})`
                : `${customAddress}, ${customCity}`;
        } else if (DELIVERY_LOCATIONS[locationChoice]) {
            const loc = DELIVERY_LOCATIONS[locationChoice];
            location = `${loc.name} - ${loc.address}, ${loc.city} (${loc.coords})`;
        } else {
            console.log('❌ Invalid location choice');
            rl.close();
            return;
        }

        // Get temperature (if applicable)
        const needTemp = await question('Track temperature? (y/n): ');
        if (needTemp.toLowerCase() === 'y') {
            temperature = await question('Enter temperature in °C: ');
        }

        // Get delivery notes
        notes = await question('Enter delivery notes (optional): ');

        console.log('\n📝 CHECKPOINT SUMMARY:');
        console.log(`Product ID: ${productId}`);
        console.log(`Stage: ${STAGES[stage]}`);
        console.log(`Location: ${location}`);
        if (temperature) console.log(`Temperature: ${temperature}°C`);
        if (notes) console.log(`Notes: ${notes}`);

        const confirm = await question('\nConfirm and submit to blockchain? (y/n): ');

        if (confirm.toLowerCase() !== 'y') {
            console.log('❌ Cancelled');
            rl.close();
            return;
        }

        // Submit to blockchain
        console.log('\n⛓️  Submitting to blockchain...');

        const tx = await contract.addCheckpoint(
            productId,
            stage,
            location,
            temperature || 0,
            notes || '',
            '' // IPFS hash (optional)
        );

        console.log('📤 Transaction sent:', tx.hash);
        console.log('⏳ Waiting for confirmation...');

        const receipt = await tx.wait();
        
        console.log('\n✅ DELIVERY LOCATION UPDATED SUCCESSFULLY!');
        console.log(`📋 Block number: ${receipt.blockNumber}`);
        console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
        
        // Get updated journey
        const journey = await contract.getProductJourney(productId);
        console.log(`\n📊 Total checkpoints: ${journey.length}`);
        console.log('\n📍 COMPLETE DELIVERY JOURNEY:');
        journey.forEach((checkpoint, index) => {
            const date = new Date(Number(checkpoint.timestamp) * 1000);
            console.log(`\n${index + 1}. ${STAGES[Number(checkpoint.stage)]}`);
            console.log(`   📍 ${checkpoint.location}`);
            console.log(`   🕐 ${date.toLocaleString()}`);
            if (checkpoint.temperature > 0) {
                console.log(`   🌡️  ${checkpoint.temperature}°C`);
            }
            if (checkpoint.notes) {
                console.log(`   📝 ${checkpoint.notes}`);
            }
            console.log(`   ✅ Verified by: ${checkpoint.verifierName || 'System'}`);
        });

        console.log('\n✨ Delivery location tracking updated successfully!');
        console.log('🌐 View on tracker: http://localhost:3000/supply-chain-tracker.html');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    }

    rl.close();
}

// Run the script
updateDeliveryLocation().catch((error) => {
    console.error(error);
    process.exit(1);
});
