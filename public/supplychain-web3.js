/**
 * Web3 Integration Library for Supply Chain
 * Handles blockchain interactions from the frontend
 * Uses Ethers.js v6
 */

// Contract ABI (Application Binary Interface)
const SUPPLY_CHAIN_ABI = [
    "function registerProduct(string memory _productName, string memory _productType, string memory _origin, bool _isOrganic) public returns (uint256)",
    "function addCheckpoint(uint256 _productId, uint8 _stage, string memory _location, uint256 _temperature, string memory _notes, string memory _ipfsHash) public",
    "function addCertification(uint256 _productId, string memory _certName, string memory _certAuthority, uint256 _expiryDate, string memory _certHash) public",
    "function updateQualityScore(uint256 _productId, uint256 _score) public",
    "function markDelivered(uint256 _productId, address _customer) public",
    "function getProduct(uint256 _productId) public view returns (string memory, string memory, string memory, address, uint8, bool, uint256, uint256)",
    "function getProductJourney(uint256 _productId) public view returns (tuple(uint8 stage, string location, uint256 timestamp, address verifiedBy, string verifierName, uint8 verifierRole, uint256 temperature, string notes, string ipfsHash)[])",
    "function getProductCertifications(uint256 _productId) public view returns (tuple(string certName, string certAuthority, uint256 certDate, uint256 expiryDate, string certHash, bool isValid)[])",
    "function verifyProduct(uint256 _productId) public view returns (bool)",
    "function getTotalProducts() public view returns (uint256)",
    "event ProductRegistered(uint256 indexed productId, string productName, address farmer)",
    "event CheckpointAdded(uint256 indexed productId, uint8 stage, address verifiedBy)",
    "event ProductDelivered(uint256 indexed productId, address deliveredTo)"
];

// Contract address (update after deployment)
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// Stage enum mapping
const STAGES = {
    HARVEST: 0,
    QUALITY_CHECK: 1,
    PROCESSING: 2,
    PACKAGING: 3,
    STORAGE: 4,
    TRANSPORT: 5,
    WAREHOUSE: 6,
    DELIVERY: 7,
    DELIVERED: 8
};

const STAGE_NAMES = [
    "Harvest",
    "Quality Check",
    "Processing",
    "Packaging",
    "Storage",
    "Transport",
    "Warehouse",
    "Delivery",
    "Delivered"
];

class SupplyChainWeb3 {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.account = null;
    }

    /**
     * Initialize Web3 connection
     */
    async init() {
        // Check if ethers is available
        if (typeof ethers === 'undefined') {
            throw new Error('Ethers.js library not loaded. Please make sure the Ethers CDN script is included before this script.');
        }

        if (typeof window.ethereum === 'undefined') {
            throw new Error('MetaMask is not installed');
        }

        try {
            console.log('🔍 Checking dependencies...');
            console.log('- Ethers.js:', typeof ethers !== 'undefined' ? '✅' : '❌');
            console.log('- MetaMask:', typeof window.ethereum !== 'undefined' ? '✅' : '❌');
            console.log('- Contract Address:', CONTRACT_ADDRESS);

            // Request account access
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            
            this.account = accounts[0];
            
            // Create provider and signer (Ethers v6 syntax)
            this.provider = new ethers.BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner();
            
            // Initialize contract
            this.contract = new ethers.Contract(
                CONTRACT_ADDRESS,
                SUPPLY_CHAIN_ABI,
                this.signer
            );

            console.log('✅ Web3 initialized successfully');
            console.log('Account:', this.account);
            console.log('Contract:', CONTRACT_ADDRESS);

            // Listen for account changes
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    console.log('Please connect to MetaMask');
                } else if (accounts[0] !== this.account) {
                    this.account = accounts[0];
                    window.location.reload();
                }
            });

            // Listen for chain changes
            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });

            return true;
        } catch (error) {
            console.error('Failed to initialize Web3:', error);
            throw error;
        }
    }

    /**
     * Register a new product on blockchain
     */
    async registerProduct(productName, productType, origin, isOrganic) {
        try {
            console.log('📝 Registering product on blockchain...');
            
            const tx = await this.contract.registerProduct(
                productName,
                productType,
                origin,
                isOrganic
            );

            console.log('Transaction sent:', tx.hash);
            
            const receipt = await tx.wait();
            console.log('✅ Product registered!');

            // Get product ID from event
            const event = receipt.logs.find(log => {
                try {
                    const parsed = this.contract.interface.parseLog(log);
                    return parsed && parsed.name === 'ProductRegistered';
                } catch {
                    return false;
                }
            });
            
            let productId = 0;
            if (event) {
                const parsed = this.contract.interface.parseLog(event);
                productId = Number(parsed.args.productId);
            }

            return {
                success: true,
                productId: productId,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            console.error('Failed to register product:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Add checkpoint to product journey
     */
    async addCheckpoint(productId, stage, location, temperature, notes, ipfsHash = '') {
        try {
            console.log('📍 Adding checkpoint to blockchain...');
            
            const tx = await this.contract.addCheckpoint(
                productId,
                stage,
                location,
                temperature,
                notes,
                ipfsHash
            );

            const receipt = await tx.wait();
            console.log('✅ Checkpoint added!');

            return {
                success: true,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            console.error('Failed to add checkpoint:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Add certification to product
     */
    async addCertification(productId, certName, certAuthority, expiryDate, certHash) {
        try {
            console.log('📜 Adding certification to blockchain...');
            
            const tx = await this.contract.addCertification(
                productId,
                certName,
                certAuthority,
                expiryDate,
                certHash
            );

            const receipt = await tx.wait();
            console.log('✅ Certification added!');

            return {
                success: true,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            console.error('Failed to add certification:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get product details from blockchain
     */
    async getProduct(productId) {
        try {
            const product = await this.contract.getProduct(productId);
            
            return {
                productName: product[0],
                productType: product[1],
                origin: product[2],
                farmer: product[3],
                currentStage: Number(product[4]),
                isOrganic: product[5],
                qualityScore: Number(product[6]),
                harvestDate: new Date(Number(product[7]) * 1000)
            };
        } catch (error) {
            console.error('Failed to get product:', error);
            throw error;
        }
    }

    /**
     * Get complete product journey from blockchain
     */
    async getProductJourney(productId) {
        try {
            const journey = await this.contract.getProductJourney(productId);
            
            return journey.map(checkpoint => ({
                stage: Number(checkpoint.stage),
                stageName: STAGE_NAMES[Number(checkpoint.stage)],
                location: checkpoint.location,
                timestamp: new Date(Number(checkpoint.timestamp) * 1000),
                verifiedBy: checkpoint.verifiedBy,
                verifierName: checkpoint.verifierName,
                temperature: Number(checkpoint.temperature),
                notes: checkpoint.notes,
                ipfsHash: checkpoint.ipfsHash
            }));
        } catch (error) {
            console.error('Failed to get product journey:', error);
            throw error;
        }
    }

    /**
     * Get product certifications from blockchain
     */
    async getProductCertifications(productId) {
        try {
            const certs = await this.contract.getProductCertifications(productId);
            
            return certs.map(cert => ({
                certName: cert.certName,
                certAuthority: cert.certAuthority,
                certDate: new Date(Number(cert.certDate) * 1000),
                expiryDate: new Date(Number(cert.expiryDate) * 1000),
                certHash: cert.certHash,
                isValid: cert.isValid
            }));
        } catch (error) {
            console.error('Failed to get certifications:', error);
            throw error;
        }
    }

    /**
     * Verify product authenticity
     */
    async verifyProduct(productId) {
        try {
            const isValid = await this.contract.verifyProduct(productId);
            return isValid;
        } catch (error) {
            console.error('Failed to verify product:', error);
            return false;
        }
    }

    /**
     * Get total products registered
     */
    async getTotalProducts() {
        try {
            const total = await this.contract.getTotalProducts();
            return Number(total);
        } catch (error) {
            console.error('Failed to get total products:', error);
            return 0;
        }
    }

    /**
     * Mark product as delivered
     */
    async markDelivered(productId, customerAddress) {
        try {
            console.log('✅ Marking product as delivered...');
            
            const tx = await this.contract.markDelivered(productId, customerAddress);
            const receipt = await tx.wait();
            
            console.log('✅ Product marked as delivered!');

            return {
                success: true,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            console.error('Failed to mark as delivered:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Listen to blockchain events
     */
    listenToEvents(callback) {
        if (!this.contract) {
            console.error('Contract not initialized');
            return;
        }

        // Listen for ProductRegistered events
        this.contract.on('ProductRegistered', (productId, productName, farmer) => {
            callback({
                type: 'ProductRegistered',
                productId: Number(productId),
                productName: productName,
                farmer: farmer
            });
        });

        // Listen for CheckpointAdded events
        this.contract.on('CheckpointAdded', (productId, stage, verifiedBy) => {
            callback({
                type: 'CheckpointAdded',
                productId: Number(productId),
                stage: Number(stage),
                stageName: STAGE_NAMES[Number(stage)],
                verifiedBy: verifiedBy
            });
        });

        // Listen for ProductDelivered events
        this.contract.on('ProductDelivered', (productId, deliveredTo) => {
            callback({
                type: 'ProductDelivered',
                productId: Number(productId),
                deliveredTo: deliveredTo
            });
        });
    }

    /**
     * Get current network info
     */
    async getNetworkInfo() {
        if (!this.provider) return null;

        const network = await this.provider.getNetwork();
        return {
            chainId: network.chainId,
            name: network.name
        };
    }

    /**
     * Get account balance
     */
    async getBalance() {
        if (!this.provider || !this.account) return '0';

        const balance = await this.provider.getBalance(this.account);
        return ethers.formatEther(balance);
    }
}

// Export singleton instance
const supplyChainWeb3 = new SupplyChainWeb3();

// For browser usage
if (typeof window !== 'undefined') {
    window.SupplyChainWeb3 = SupplyChainWeb3; // Export the class
    window.supplyChainWeb3 = supplyChainWeb3; // Export the instance
    window.CONTRACT_ADDRESS = CONTRACT_ADDRESS; // Export contract address
    window.STAGES = STAGES;
    window.STAGE_NAMES = STAGE_NAMES;
    
    console.log('🔗 Supply Chain Web3 Library Loaded');
    console.log('📍 Contract Address:', CONTRACT_ADDRESS);
    console.log('✅ SupplyChainWeb3 class available:', typeof SupplyChainWeb3 !== 'undefined');
    
    // Warn if ethers is not loaded
    if (typeof ethers === 'undefined') {
        console.warn('⚠️ WARNING: Ethers.js is not loaded yet. The blockchain functionality will not work until Ethers.js is available.');
        console.warn('Make sure <script src="https://cdn.ethers.io/lib/ethers-6.7.0.umd.min.js"></script> is included BEFORE this script.');
    } else {
        console.log('✅ Ethers.js is available');
    }
}

