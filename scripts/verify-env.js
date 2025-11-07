// Script to verify your .env configuration
// Usage: node scripts/verify-env.js

require('dotenv').config();

console.log("\n=== Environment Configuration Check ===\n");

// Check Private Key
const privateKey = process.env.PRIVATE_KEY;
if (!privateKey || privateKey === 'your_private_key_here') {
  console.log("❌ PRIVATE_KEY: Not configured");
  console.log("   → Export from MetaMask and add to .env");
} else if (privateKey.length !== 64) {
  console.log("❌ PRIVATE_KEY: Invalid length (should be 64 characters)");
  console.log("   → Current length:", privateKey.length);
  console.log("   → Remove '0x' prefix if present");
} else {
  console.log("✅ PRIVATE_KEY: Configured (64 characters)");
  console.log("   → Address preview:", privateKey.substring(0, 6) + "..." + privateKey.substring(58));
}

// Check RPC URLs
console.log("\n--- RPC URLs ---");
const amoyRpc = process.env.AMOY_RPC_URL;
console.log(amoyRpc ? "✅ AMOY_RPC_URL: " + amoyRpc : "⚠️  AMOY_RPC_URL: Using default");

const polygonRpc = process.env.POLYGON_RPC_URL;
console.log(polygonRpc ? "✅ POLYGON_RPC_URL: " + polygonRpc : "⚠️  POLYGON_RPC_URL: Using default");

// Check API Keys
console.log("\n--- Block Explorer API Keys ---");
const polygonScanKey = process.env.POLYGONSCAN_API_KEY;
console.log(polygonScanKey ? "✅ POLYGONSCAN_API_KEY: Configured" : "❌ POLYGONSCAN_API_KEY: Missing");

const etherscanKey = process.env.ETHERSCAN_API_KEY;
console.log(etherscanKey ? "✅ ETHERSCAN_API_KEY: Configured" : "❌ ETHERSCAN_API_KEY: Missing");

// Check Contract Address
console.log("\n--- Contract Address ---");
const contractAddress = process.env.SUPPLY_CHAIN_CONTRACT;
if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
  console.log("⏳ SUPPLY_CHAIN_CONTRACT: Not deployed yet");
  console.log("   → Will be filled after deployment");
} else {
  console.log("✅ SUPPLY_CHAIN_CONTRACT:", contractAddress);
}

// Summary
console.log("\n--- Summary ---");
let readyToDeploy = true;

if (!privateKey || privateKey === 'your_private_key_here' || privateKey.length !== 64) {
  console.log("❌ Cannot deploy: Private key not configured properly");
  readyToDeploy = false;
}

if (!polygonScanKey || !etherscanKey) {
  console.log("⚠️  Warning: Block explorer API keys missing (contract verification will fail)");
}

if (readyToDeploy) {
  console.log("\n✅ Ready to deploy to testnet!");
  console.log("\nNext steps:");
  console.log("1. Get test MATIC: https://faucet.polygon.technology/");
  console.log("2. Check balance: npx hardhat run scripts/check-balance.js --network amoy");
  console.log("3. Deploy contract: npx hardhat run blockchain/deploy.js --network amoy");
} else {
  console.log("\n❌ Not ready to deploy. Please configure missing items above.");
  console.log("\nSee CRYPTO_API_SETUP.md for detailed instructions.");
}

console.log("\n======================================\n");
