// Script to check wallet balance
// Usage: npx hardhat run scripts/check-balance.js --network amoy

const hre = require("hardhat");

async function main() {
  console.log("\n=== Checking Wallet Balance ===\n");

  try {
    // Get the deployer account
    const [deployer] = await hre.ethers.getSigners();
    const address = await deployer.getAddress();
    
    console.log("Wallet Address:", address);
    
    // Get balance
    const balance = await hre.ethers.provider.getBalance(address);
    const balanceInMatic = hre.ethers.formatEther(balance);
    
    console.log("Balance:", balanceInMatic, "MATIC");
    
    // Get network info
    const network = await hre.ethers.provider.getNetwork();
    console.log("Network:", network.name);
    console.log("Chain ID:", network.chainId.toString());
    
    // Check if sufficient balance
    const minRequired = 0.1; // Minimum MATIC needed for deployment
    if (parseFloat(balanceInMatic) < minRequired) {
      console.log("\n⚠️  WARNING: Balance is low!");
      console.log(`You need at least ${minRequired} MATIC for deployment.`);
      console.log("\nGet test MATIC from:");
      console.log("- https://faucet.polygon.technology/");
      console.log("- https://www.alchemy.com/faucets/polygon-amoy");
    } else {
      console.log("\n✅ Balance is sufficient for deployment!");
    }
    
  } catch (error) {
    console.error("\n❌ Error checking balance:");
    if (error.message.includes("invalid private key")) {
      console.error("Invalid private key in .env file");
      console.error("Make sure PRIVATE_KEY is 64 characters (without 0x prefix)");
    } else {
      console.error(error.message);
    }
  }
  
  console.log("\n================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
