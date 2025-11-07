// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SupplyChain
 * @dev Smart contract for managing food supply chain with full traceability
 */
contract SupplyChain {
    
    // Product stages in the supply chain
    enum Stage {
        Harvest,
        QualityCheck,
        Processing,
        Packaging,
        Storage,
        Transport,
        Warehouse,
        Delivery,
        Delivered
    }
    
    // Roles in the supply chain
    enum Role {
        Admin,
        Farmer,
        QualityInspector,
        Processor,
        Packager,
        Transporter,
        WarehouseManager,
        Retailer,
        DeliveryPartner
    }
    
    // Product structure
    struct Product {
        uint256 productId;
        string productName;
        string productType;
        uint256 harvestDate;
        string origin;
        address farmer;
        Stage currentStage;
        bool isOrganic;
        bool isCertified;
        uint256 qualityScore;
        uint256 temperature;
        bool exists;
    }
    
    // Journey checkpoint structure
    struct Checkpoint {
        Stage stage;
        string location;
        uint256 timestamp;
        address verifiedBy;
        string verifierName;
        Role verifierRole;
        uint256 temperature;
        string notes;
        string ipfsHash; // For storing images/documents
    }
    
    // Certification structure
    struct Certification {
        string certName;
        string certAuthority;
        uint256 certDate;
        uint256 expiryDate;
        string certHash;
        bool isValid;
    }
    
    // User/Participant structure
    struct Participant {
        address participantAddress;
        string name;
        string contactInfo;
        Role role;
        bool isActive;
        uint256 registrationDate;
    }
    
    // State variables
    address public owner;
    uint256 public productCounter;
    
    // Mappings
    mapping(uint256 => Product) public products;
    mapping(uint256 => Checkpoint[]) public productJourney;
    mapping(uint256 => Certification[]) public productCertifications;
    mapping(address => Participant) public participants;
    mapping(uint256 => mapping(address => bool)) public productAccessControl;
    
    // Events
    event ProductRegistered(uint256 indexed productId, string productName, address farmer);
    event CheckpointAdded(uint256 indexed productId, Stage stage, address verifiedBy);
    event CertificationAdded(uint256 indexed productId, string certName);
    event ParticipantRegistered(address indexed participantAddress, string name, Role role);
    event StageUpdated(uint256 indexed productId, Stage newStage);
    event TemperatureRecorded(uint256 indexed productId, uint256 temperature, uint256 timestamp);
    event ProductDelivered(uint256 indexed productId, address deliveredTo);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    
    modifier onlyActiveParticipant() {
        require(participants[msg.sender].isActive, "Not an active participant");
        _;
    }
    
    modifier productExists(uint256 _productId) {
        require(products[_productId].exists, "Product does not exist");
        _;
    }
    
    modifier hasRole(Role _role) {
        require(participants[msg.sender].role == _role, "Unauthorized role");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        productCounter = 0;
        
        // Register owner as admin
        participants[msg.sender] = Participant({
            participantAddress: msg.sender,
            name: "System Admin",
            contactInfo: "admin@foodchain.com",
            role: Role.Admin,
            isActive: true,
            registrationDate: block.timestamp
        });
    }
    
    /**
     * @dev Register a new participant in the supply chain
     */
    function registerParticipant(
        address _address,
        string memory _name,
        string memory _contactInfo,
        Role _role
    ) public onlyOwner {
        require(!participants[_address].isActive, "Participant already registered");
        
        participants[_address] = Participant({
            participantAddress: _address,
            name: _name,
            contactInfo: _contactInfo,
            role: _role,
            isActive: true,
            registrationDate: block.timestamp
        });
        
        emit ParticipantRegistered(_address, _name, _role);
    }
    
    /**
     * @dev Register a new product (by farmer)
     */
    function registerProduct(
        string memory _productName,
        string memory _productType,
        string memory _origin,
        bool _isOrganic
    ) public onlyActiveParticipant hasRole(Role.Farmer) returns (uint256) {
        productCounter++;
        
        products[productCounter] = Product({
            productId: productCounter,
            productName: _productName,
            productType: _productType,
            harvestDate: block.timestamp,
            origin: _origin,
            farmer: msg.sender,
            currentStage: Stage.Harvest,
            isOrganic: _isOrganic,
            isCertified: false,
            qualityScore: 0,
            temperature: 0,
            exists: true
        });
        
        // Add initial checkpoint
        productJourney[productCounter].push(Checkpoint({
            stage: Stage.Harvest,
            location: _origin,
            timestamp: block.timestamp,
            verifiedBy: msg.sender,
            verifierName: participants[msg.sender].name,
            verifierRole: Role.Farmer,
            temperature: 0,
            notes: "Product harvested",
            ipfsHash: ""
        }));
        
        // Grant access to farmer
        productAccessControl[productCounter][msg.sender] = true;
        
        emit ProductRegistered(productCounter, _productName, msg.sender);
        emit CheckpointAdded(productCounter, Stage.Harvest, msg.sender);
        
        return productCounter;
    }
    
    /**
     * @dev Add a checkpoint to product journey
     */
    function addCheckpoint(
        uint256 _productId,
        Stage _stage,
        string memory _location,
        uint256 _temperature,
        string memory _notes,
        string memory _ipfsHash
    ) public onlyActiveParticipant productExists(_productId) {
        require(
            uint8(_stage) > uint8(products[_productId].currentStage),
            "Invalid stage progression"
        );
        
        productJourney[_productId].push(Checkpoint({
            stage: _stage,
            location: _location,
            timestamp: block.timestamp,
            verifiedBy: msg.sender,
            verifierName: participants[msg.sender].name,
            verifierRole: participants[msg.sender].role,
            temperature: _temperature,
            notes: _notes,
            ipfsHash: _ipfsHash
        }));
        
        // Update product stage and temperature
        products[_productId].currentStage = _stage;
        products[_productId].temperature = _temperature;
        
        emit CheckpointAdded(_productId, _stage, msg.sender);
        emit StageUpdated(_productId, _stage);
        emit TemperatureRecorded(_productId, _temperature, block.timestamp);
    }
    
    /**
     * @dev Add certification to product
     */
    function addCertification(
        uint256 _productId,
        string memory _certName,
        string memory _certAuthority,
        uint256 _expiryDate,
        string memory _certHash
    ) public onlyActiveParticipant productExists(_productId) {
        productCertifications[_productId].push(Certification({
            certName: _certName,
            certAuthority: _certAuthority,
            certDate: block.timestamp,
            expiryDate: _expiryDate,
            certHash: _certHash,
            isValid: true
        }));
        
        products[_productId].isCertified = true;
        
        emit CertificationAdded(_productId, _certName);
    }
    
    /**
     * @dev Update quality score (by quality inspector)
     */
    function updateQualityScore(
        uint256 _productId,
        uint256 _score
    ) public onlyActiveParticipant hasRole(Role.QualityInspector) productExists(_productId) {
        require(_score <= 100, "Score must be between 0 and 100");
        products[_productId].qualityScore = _score;
    }
    
    /**
     * @dev Mark product as delivered
     */
    function markDelivered(
        uint256 _productId,
        address _customer
    ) public onlyActiveParticipant productExists(_productId) {
        require(
            participants[msg.sender].role == Role.DeliveryPartner,
            "Only delivery partner can mark as delivered"
        );
        
        products[_productId].currentStage = Stage.Delivered;
        
        productJourney[_productId].push(Checkpoint({
            stage: Stage.Delivered,
            location: "Customer Location",
            timestamp: block.timestamp,
            verifiedBy: msg.sender,
            verifierName: participants[msg.sender].name,
            verifierRole: Role.DeliveryPartner,
            temperature: products[_productId].temperature,
            notes: "Product delivered to customer",
            ipfsHash: ""
        }));
        
        emit ProductDelivered(_productId, _customer);
    }
    
    /**
     * @dev Get product details
     */
    function getProduct(uint256 _productId) public view productExists(_productId) returns (
        string memory productName,
        string memory productType,
        string memory origin,
        address farmer,
        Stage currentStage,
        bool isOrganic,
        uint256 qualityScore,
        uint256 harvestDate
    ) {
        Product memory p = products[_productId];
        return (
            p.productName,
            p.productType,
            p.origin,
            p.farmer,
            p.currentStage,
            p.isOrganic,
            p.qualityScore,
            p.harvestDate
        );
    }
    
    /**
     * @dev Get product journey (all checkpoints)
     */
    function getProductJourney(uint256 _productId) public view productExists(_productId) returns (Checkpoint[] memory) {
        return productJourney[_productId];
    }
    
    /**
     * @dev Get product certifications
     */
    function getProductCertifications(uint256 _productId) public view productExists(_productId) returns (Certification[] memory) {
        return productCertifications[_productId];
    }
    
    /**
     * @dev Get checkpoint count for a product
     */
    function getCheckpointCount(uint256 _productId) public view productExists(_productId) returns (uint256) {
        return productJourney[_productId].length;
    }
    
    /**
     * @dev Get specific checkpoint
     */
    function getCheckpoint(uint256 _productId, uint256 _index) public view productExists(_productId) returns (
        Stage stage,
        string memory location,
        uint256 timestamp,
        address verifiedBy,
        string memory verifierName,
        uint256 temperature,
        string memory notes
    ) {
        require(_index < productJourney[_productId].length, "Invalid checkpoint index");
        Checkpoint memory cp = productJourney[_productId][_index];
        return (
            cp.stage,
            cp.location,
            cp.timestamp,
            cp.verifiedBy,
            cp.verifierName,
            cp.temperature,
            cp.notes
        );
    }
    
    /**
     * @dev Verify product authenticity
     */
    function verifyProduct(uint256 _productId) public view productExists(_productId) returns (bool) {
        return products[_productId].exists && productJourney[_productId].length > 0;
    }
    
    /**
     * @dev Get participant details
     */
    function getParticipant(address _address) public view returns (
        string memory name,
        Role role,
        bool isActive,
        uint256 registrationDate
    ) {
        Participant memory p = participants[_address];
        return (p.name, p.role, p.isActive, p.registrationDate);
    }
    
    /**
     * @dev Deactivate participant
     */
    function deactivateParticipant(address _address) public onlyOwner {
        participants[_address].isActive = false;
    }
    
    /**
     * @dev Get total products registered
     */
    function getTotalProducts() public view returns (uint256) {
        return productCounter;
    }
}
