/**
 * Deployment script for SupplyChain smart contract
 * Deploy to Polygon Mumbai Testnet or Ethereum Sepolia
 */

const hre = require("hardhat");

async function main() {
    console.log("🚀 Starting SupplyChain contract deployment...");
    
    // Get the contract factory
    const SupplyChain = await hre.ethers.getContractFactory("SupplyChain");
    
    console.log("📝 Deploying contract...");
    
    // Deploy the contract (Ethers v6 syntax)
    const supplyChain = await SupplyChain.deploy();
    
    await supplyChain.waitForDeployment();
    
    const contractAddress = await supplyChain.getAddress();
    console.log("✅ SupplyChain contract deployed to:", contractAddress);
    
    const deployTx = supplyChain.deploymentTransaction();
    if (deployTx) {
        console.log("📋 Transaction hash:", deployTx.hash);
        
        // Wait for confirmations (skip on local network)
        const network = await hre.ethers.provider.getNetwork();
        if (network.chainId !== 1337n && network.chainId !== 31337n) {
            console.log("⏳ Waiting for block confirmations...");
            await deployTx.wait(5);
            console.log("✅ Contract confirmed on blockchain!");
        } else {
            console.log("✅ Contract deployed on local network (instant confirmation)");
        }
    }
    
    // Register some initial participants for testing
    console.log("\n🔧 Setting up initial participants...");
    
    const [deployer, farmer1, inspector1, transporter1] = await hre.ethers.getSigners();
    
    // Register farmer
    const tx1 = await supplyChain.registerParticipant(
        farmer1.address,
        "Green Valley Farm",
        "farmer@greenvalley.com",
        1 // Role.Farmer
    );
    await tx1.wait();
    console.log("✅ Farmer registered:", farmer1.address);
    
    // Register quality inspector
    const tx2 = await supplyChain.registerParticipant(
        inspector1.address,
        "Quality Inspector - FSSAI",
        "inspector@fssai.gov.in",
        2 // Role.QualityInspector
    );
    await tx2.wait();
    console.log("✅ Quality Inspector registered:", inspector1.address);
    
    // Register transporter
    const tx3 = await supplyChain.registerParticipant(
        transporter1.address,
        "Cold Chain Logistics",
        "logistics@coldchain.com",
        6 // Role.Transporter
    );
    await tx3.wait();
    console.log("✅ Transporter registered:", transporter1.address);
    
    console.log("\n" + "=".repeat(60));
    console.log("📊 DEPLOYMENT SUMMARY");
    console.log("=".repeat(60));
    console.log("Contract Address:", contractAddress);
    console.log("Network:", hre.network.name);
    console.log("Deployer:", deployer.address);
    console.log("Block Number:", await hre.ethers.provider.getBlockNumber());
    console.log("=".repeat(60));
    
    // Save deployment info
    const fs = require("fs");
    const deploymentInfo = {
        network: hre.network.name,
        contractAddress: contractAddress,
        deployer: deployer.address,
        deploymentTime: new Date().toISOString(),
        transactionHash: deployTx ? deployTx.hash : 'N/A',
        participants: {
            farmer: farmer1.address,
            inspector: inspector1.address,
            transporter: transporter1.address
        }
    };
    
    fs.writeFileSync(
        "deployment-info.json",
        JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("\n✅ Deployment info saved to deployment-info.json");
    console.log("\n🎉 Deployment completed successfully!");
}

// Execute deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
