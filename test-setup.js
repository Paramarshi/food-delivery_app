// Test script to verify database and authentication setup
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Testing environment setup...\n');

// Test environment variables
console.log('📊 Environment Variables:');
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
console.log('- POSTGRES_URL:', process.env.POSTGRES_URL ? '✅ Set' : '❌ Missing');
console.log('- CLERK_SECRET_KEY:', process.env.CLERK_SECRET_KEY ? '✅ Set' : '❌ Missing');
console.log('- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:', process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing');

// Test database connection
const testDatabase = async () => {
    if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
        console.log('\n❌ No database URL found. Please add your Neon database URL to .env.local');
        return false;
    }

    try {
        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
            ssl: {
                rejectUnauthorized: false
            }
        });

        console.log('\n🔍 Testing database connection...');
        const client = await pool.connect();
        console.log('✅ Database connection successful!');
        
        // Test if tables exist
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('products', 'orders', 'users')
        `);
        
        console.log('📊 Existing tables:', result.rows.map(row => row.table_name));
        
        client.release();
        await pool.end();
        return true;
    } catch (error) {
        console.log('❌ Database connection failed:', error.message);
        return false;
    }
};

// Run tests
const runTests = async () => {
    const dbConnected = await testDatabase();
    
    console.log('\n📋 Next Steps:');
    if (!dbConnected) {
        console.log('1. ✅ Get your Neon database URL from https://neon.tech');
        console.log('2. ✅ Add it to .env.local as DATABASE_URL');
        console.log('3. ✅ Run: node database/init.js');
    } else {
        console.log('1. ✅ Database connection working!');
        console.log('2. 🔄 Run: node database/init.js (to create tables and sample data)');
    }
    
    if (!process.env.CLERK_SECRET_KEY) {
        console.log('3. ✅ Get your Clerk keys from https://clerk.dev');
        console.log('4. ✅ Add them to .env.local');
    } else {
        console.log('3. ✅ Clerk keys configured!');
    }
    
    console.log('5. 🚀 Start the app: node local-server.js');
};

runTests().catch(console.error);