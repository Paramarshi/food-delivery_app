require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Helper function to get accounts array
function getAccounts() {
  const privateKey = process.env.PRIVATE_KEY;
  // Only return accounts if private key is valid (64 characters hex)
  if (privateKey && privateKey.length === 64) {
    return [privateKey];
  }
  return []; // Return empty array if no valid key
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // Local development network
    hardhat: {
      chainId: 1337
    },
    
    // Polygon Amoy Testnet (Replacement for Mumbai)
    amoy: {
      url: process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology",
      accounts: getAccounts(),
      chainId: 80002,
      gasPrice: 20000000000 // 20 Gwei
    },
    
    // Polygon Mumbai Testnet (DEPRECATED - use Amoy instead)
    mumbai: {
      url: process.env.MUMBAI_RPC_URL || "https://rpc.ankr.com/polygon_mumbai",
      accounts: getAccounts(),
      chainId: 80001,
      gasPrice: 20000000000 // 20 Gwei
    },
    
    // Polygon Mainnet
    polygon: {
      url: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
      accounts: getAccounts(),
      chainId: 137,
      gasPrice: 50000000000 // 50 Gwei
    },
    
    // Ethereum Sepolia Testnet
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
      accounts: getAccounts(),
      chainId: 11155111
    },
    
    // Ethereum Mainnet
    mainnet: {
      url: process.env.MAINNET_RPC_URL || "https://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY",
      accounts: getAccounts(),
      chainId: 1
    }
  },
  etherscan: {
    apiKey: {
      polygon: process.env.POLYGONSCAN_API_KEY || "",
      polygonAmoy: process.env.POLYGONSCAN_API_KEY || "",
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || "",
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      mainnet: process.env.ETHERSCAN_API_KEY || ""
    }
  },
  paths: {
    sources: "./blockchain",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
