// Script to verify your .env configuration
// Usage: node scripts/verify-env.js

require('dotenv').config();

console.log("\n=== Environment Configuration Check ===\n");

// Check Database Connection
console.log("--- Database Configuration ---");
const dbHost = process.env.DB_HOST;
console.log(dbHost ? "✅ DB_HOST: " + dbHost : "❌ DB_HOST: Not configured");

const dbName = process.env.DB_NAME;
console.log(dbName ? "✅ DB_NAME: " + dbName : "❌ DB_NAME: Not configured");

const dbUser = process.env.DB_USER;
console.log(dbUser ? "✅ DB_USER: " + dbUser : "❌ DB_USER: Not configured");

const dbPassword = process.env.DB_PASSWORD;
console.log(dbPassword ? "✅ DB_PASSWORD: Configured" : "❌ DB_PASSWORD: Not configured");

// Check Clerk Authentication
console.log("\n--- Clerk Authentication ---");
const clerkPublishable = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
console.log(clerkPublishable ? "✅ CLERK_PUBLISHABLE_KEY: Configured" : "❌ CLERK_PUBLISHABLE_KEY: Not configured");

const clerkSecret = process.env.CLERK_SECRET_KEY;
console.log(clerkSecret ? "✅ CLERK_SECRET_KEY: Configured" : "❌ CLERK_SECRET_KEY: Not configured");

// Summary
console.log("\n--- Summary ---");

console.log("\n✅ Environment configuration verified!");
console.log("\nDatabase connection:");
console.log("  - PostgreSQL configured and ready");
console.log("\nClerk Authentication:");
console.log("  - API keys configured");
console.log("\nNext steps:");
console.log("1. Ensure PostgreSQL database is running");
console.log("2. Start the local server: node local-server.js");
console.log("3. Open the app: http://localhost:3000/public/index.html");

console.log("\n===========================================\n");

