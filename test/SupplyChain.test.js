const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SupplyChain Smart Contract", function () {
    let supplyChain;
    let owner, farmer, inspector, transporter, customer;

    beforeEach(async function () {
        // Get signers
        [owner, farmer, inspector, transporter, customer] = await ethers.getSigners();

        // Deploy contract (Ethers v6 syntax)
        const SupplyChain = await ethers.getContractFactory("SupplyChain");
        supplyChain = await SupplyChain.deploy();
        await supplyChain.waitForDeployment(); // v6 syntax

        // Register participants
        await supplyChain.registerParticipant(
            farmer.address,
            "Green Valley Farm",
            "farmer@greenvalley.com",
            1 // Farmer role
        );

        await supplyChain.registerParticipant(
            inspector.address,
            "Quality Inspector",
            "inspector@fssai.gov",
            2 // QualityInspector role
        );

        await supplyChain.registerParticipant(
            transporter.address,
            "Cold Chain Logistics",
            "logistics@coldchain.com",
            6 // Transporter role
        );
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await supplyChain.owner()).to.equal(owner.address);
        });

        it("Should register owner as admin", async function () {
            const participant = await supplyChain.getParticipant(owner.address);
            expect(participant.name).to.equal("System Admin");
            expect(participant.role).to.equal(0); // Admin role
            expect(participant.isActive).to.be.true;
        });
    });

    describe("Participant Registration", function () {
        it("Should register a farmer", async function () {
            const participant = await supplyChain.getParticipant(farmer.address);
            expect(participant.name).to.equal("Green Valley Farm");
            expect(participant.role).to.equal(1);
            expect(participant.isActive).to.be.true;
        });

        it("Should fail if non-owner tries to register", async function () {
            await expect(
                supplyChain.connect(farmer).registerParticipant(
                    customer.address,
                    "Customer",
                    "customer@email.com",
                    0
                )
            ).to.be.revertedWith("Only owner can perform this action");
        });

        it("Should emit ParticipantRegistered event", async function () {
            await expect(
                supplyChain.registerParticipant(
                    customer.address,
                    "Customer",
                    "customer@email.com",
                    0
                )
            ).to.emit(supplyChain, "ParticipantRegistered")
             .withArgs(customer.address, "Customer", 0);
        });
    });

    describe("Product Registration", function () {
        it("Should register a product by farmer", async function () {
            const tx = await supplyChain.connect(farmer).registerProduct(
                "Organic Apples",
                "Fruit",
                "Shimla, HP",
                true
            );

            await expect(tx)
                .to.emit(supplyChain, "ProductRegistered")
                .withArgs(1, "Organic Apples", farmer.address);

            const product = await supplyChain.getProduct(1);
            expect(product.productName).to.equal("Organic Apples");
            expect(product.isOrganic).to.be.true;
            expect(product.currentStage).to.equal(0); // Harvest stage
        });

        it("Should fail if non-farmer tries to register", async function () {
            await expect(
                supplyChain.connect(inspector).registerProduct(
                    "Product",
                    "Type",
                    "Origin",
                    true
                )
            ).to.be.revertedWith("Unauthorized role");
        });

        it("Should increment product counter", async function () {
            await supplyChain.connect(farmer).registerProduct(
                "Apples",
                "Fruit",
                "Shimla",
                true
            );

            await supplyChain.connect(farmer).registerProduct(
                "Milk",
                "Dairy",
                "Gujarat",
                false
            );

            expect(await supplyChain.getTotalProducts()).to.equal(2);
        });

        it("Should create initial checkpoint", async function () {
            await supplyChain.connect(farmer).registerProduct(
                "Apples",
                "Fruit",
                "Shimla",
                true
            );

            const checkpointCount = await supplyChain.getCheckpointCount(1);
            expect(checkpointCount).to.equal(1);

            const checkpoint = await supplyChain.getCheckpoint(1, 0);
            expect(checkpoint.stage).to.equal(0); // Harvest
            expect(checkpoint.location).to.equal("Shimla");
            expect(checkpoint.verifiedBy).to.equal(farmer.address);
        });
    });

    describe("Checkpoint Management", function () {
        beforeEach(async function () {
            // Register a product first
            await supplyChain.connect(farmer).registerProduct(
                "Organic Apples",
                "Fruit",
                "Shimla, HP",
                true
            );
        });

        it("Should add quality check checkpoint", async function () {
            await expect(
                supplyChain.connect(inspector).addCheckpoint(
                    1,
                    1, // Quality Check stage
                    "Processing Unit",
                    15, // temperature
                    "Passed certification",
                    ""
                )
            ).to.emit(supplyChain, "CheckpointAdded")
             .withArgs(1, 1, inspector.address);

            const product = await supplyChain.getProduct(1);
            expect(product.currentStage).to.equal(1);
            expect(product.qualityScore).to.equal(0); // Not set yet
        });

        it("Should record temperature", async function () {
            await supplyChain.connect(transporter).addCheckpoint(
                1,
                5, // Transport stage
                "On Route",
                4, // 4°C
                "Cold chain maintained",
                ""
            );

            const checkpoint = await supplyChain.getCheckpoint(1, 1);
            expect(checkpoint.temperature).to.equal(4);
        });

        it("Should fail if stage progression is invalid", async function () {
            // Current stage is 0 (Harvest)
            // Trying to go backwards or stay same should fail
            await expect(
                supplyChain.connect(farmer).addCheckpoint(
                    1,
                    0, // Same stage (Harvest)
                    "Location",
                    20,
                    "Notes",
                    ""
                )
            ).to.be.revertedWith("Invalid stage progression");
        });

        it("Should track multiple checkpoints", async function () {
            // Quality Check
            await supplyChain.connect(inspector).addCheckpoint(
                1, 1, "QC Unit", 15, "Passed", ""
            );

            // Processing
            await supplyChain.connect(inspector).addCheckpoint(
                1, 2, "Processing", 12, "Processed", ""
            );

            // Packaging
            await supplyChain.connect(inspector).addCheckpoint(
                1, 3, "Packaging", 10, "Packed", ""
            );

            const count = await supplyChain.getCheckpointCount(1);
            expect(count).to.equal(4); // Including initial harvest
        });
    });

    describe("Certification Management", function () {
        beforeEach(async function () {
            await supplyChain.connect(farmer).registerProduct(
                "Organic Apples",
                "Fruit",
                "Shimla, HP",
                true
            );
        });

        it("Should add certification", async function () {
            const expiryDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 year

            await expect(
                supplyChain.connect(inspector).addCertification(
                    1,
                    "USDA Organic",
                    "USDA",
                    expiryDate,
                    "cert_hash_123"
                )
            ).to.emit(supplyChain, "CertificationAdded")
             .withArgs(1, "USDA Organic");

            const certs = await supplyChain.getProductCertifications(1);
            expect(certs.length).to.equal(1);
            expect(certs[0].certName).to.equal("USDA Organic");
            expect(certs[0].isValid).to.be.true;
        });

        it("Should mark product as certified", async function () {
            const expiryDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

            await supplyChain.connect(inspector).addCertification(
                1, "USDA Organic", "USDA", expiryDate, "hash"
            );

            const certs = await supplyChain.getProductCertifications(1);
            expect(certs.length).to.be.greaterThan(0);
            expect(certs[0].certName).to.equal("USDA Organic");
        });
    });

    describe("Quality Score", function () {
        beforeEach(async function () {
            await supplyChain.connect(farmer).registerProduct(
                "Organic Apples",
                "Fruit",
                "Shimla, HP",
                true
            );
        });

        it("Should allow inspector to set quality score", async function () {
            await supplyChain.connect(inspector).updateQualityScore(1, 98);

            const product = await supplyChain.getProduct(1);
            expect(product.qualityScore).to.equal(98);
        });

        it("Should fail if score is over 100", async function () {
            await expect(
                supplyChain.connect(inspector).updateQualityScore(1, 101)
            ).to.be.revertedWith("Score must be between 0 and 100");
        });

        it("Should fail if non-inspector tries to set score", async function () {
            await expect(
                supplyChain.connect(farmer).updateQualityScore(1, 95)
            ).to.be.revertedWith("Unauthorized role");
        });
    });

    describe("Product Verification", function () {
        it("Should verify existing product", async function () {
            await supplyChain.connect(farmer).registerProduct(
                "Apples",
                "Fruit",
                "Shimla",
                true
            );

            const isValid = await supplyChain.verifyProduct(1);
            expect(isValid).to.be.true;
        });

        it("Should return false for non-existent product", async function () {
            await expect(
                supplyChain.verifyProduct(999)
            ).to.be.revertedWith("Product does not exist");
        });
    });

    describe("Product Journey", function () {
        it("Should return complete journey", async function () {
            // Register product
            await supplyChain.connect(farmer).registerProduct(
                "Organic Apples",
                "Fruit",
                "Shimla, HP",
                true
            );

            // Add multiple checkpoints
            await supplyChain.connect(inspector).addCheckpoint(
                1, 1, "QC Unit", 15, "Quality checked", ""
            );

            await supplyChain.connect(transporter).addCheckpoint(
                1, 5, "In Transit", 4, "Transporting", ""
            );

            const journey = await supplyChain.getProductJourney(1);
            expect(journey.length).to.equal(3);
            
            // Check first checkpoint (Harvest)
            expect(journey[0].stage).to.equal(0);
            expect(journey[0].verifiedBy).to.equal(farmer.address);
            
            // Check last checkpoint (Transport)
            expect(journey[2].stage).to.equal(5);
            expect(journey[2].temperature).to.equal(4);
        });
    });

    describe("Access Control", function () {
        it("Should deactivate participant", async function () {
            await supplyChain.deactivateParticipant(farmer.address);

            const participant = await supplyChain.getParticipant(farmer.address);
            expect(participant.isActive).to.be.false;
        });

        it("Should fail when inactive participant tries to act", async function () {
            await supplyChain.deactivateParticipant(farmer.address);

            await expect(
                supplyChain.connect(farmer).registerProduct(
                    "Product",
                    "Type",
                    "Origin",
                    true
                )
            ).to.be.revertedWith("Not an active participant");
        });
    });

    describe("Edge Cases", function () {
        it("Should handle product with no certifications", async function () {
            await supplyChain.connect(farmer).registerProduct(
                "Apples",
                "Fruit",
                "Shimla",
                false
            );

            const certs = await supplyChain.getProductCertifications(1);
            expect(certs.length).to.equal(0);
        });

        it("Should handle checkpoint with empty IPFS hash", async function () {
            await supplyChain.connect(farmer).registerProduct(
                "Apples",
                "Fruit",
                "Shimla",
                true
            );

            await supplyChain.connect(inspector).addCheckpoint(
                1, 1, "QC", 15, "Checked", ""
            );

            const checkpoint = await supplyChain.getCheckpoint(1, 1);
            expect(checkpoint.notes).to.equal("Checked");
        });
    });
});
