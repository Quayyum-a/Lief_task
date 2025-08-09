import 'dotenv/config';
import { prisma } from './lib/prisma';

(async () => {
  try {
    console.log('🚀 Starting Prisma Accelerate connectivity smoke test...');
    
    // Check environment setup
    const databaseUrl = process.env.DATABASE_URL;
    const isPlaceholder = databaseUrl?.includes('<accelerate-host>') || databaseUrl?.includes('<YOUR_API_KEY>');
    
    console.log('📊 Environment Configuration:', {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: databaseUrl ? 
        databaseUrl.replace(/apikey=.*?($|&)/, 'apikey=[REDACTED]$1') : 
        'NOT_SET',
      LOG_LEVEL: process.env.LOG_LEVEL,
      isAccelerateSetup: databaseUrl?.startsWith('prisma://') || false,
      hasPlaceholders: isPlaceholder || false
    });
    
    if (isPlaceholder) {
      console.log('\n⚠️  SETUP REQUIRED: Prisma Accelerate Configuration');
      console.log('━'.repeat(60));
      console.log('The DATABASE_URL contains placeholder values.');
      console.log('To test Prisma Accelerate connectivity and cache hits:\n');
      
      console.log('1. Set up Prisma Accelerate:');
      console.log('   • Visit: https://console.prisma.io/');
      console.log('   • Create or select your project');
      console.log('   • Enable Accelerate for your database\n');
      
      console.log('2. Update your .env file with the real Accelerate URL:');
      console.log('   DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=YOUR_ACTUAL_API_KEY"\n');
      
      console.log('3. Re-run this test to see:');
      console.log('   ✅ Connection handshake with Accelerate');
      console.log('   ⚡ Cache hit/miss metrics');
      console.log('   🔄 Query performance improvements\n');
      
      console.log('📋 Expected output with real Accelerate setup:');
      console.log('━'.repeat(60));
      console.log('🔌 Testing basic database connection...');
      console.log('✅ Database connection successful!');
      console.log('📋 Query result: [ { test_value: 1 } ]');
      console.log('🏃‍♀️ Testing a second query to check Accelerate caching...');
      console.log('⚡ Second query completed in 15 ms (cache miss)');
      console.log('🏃‍♀️ Testing third query (should be cached)...');
      console.log('⚡ Third query completed in 3 ms (cache hit!)');
      console.log('✨ Accelerate cache working correctly!\n');
      
      process.exit(1);
    }
    
    // If we reach here, we have a real Accelerate URL
    console.log('\n🔌 Testing basic database connection...');
    const result = await prisma.$queryRaw`SELECT 1 as test_value`;
    console.log('✅ Database connection successful!');
    console.log('📋 Query result:', result);
    
    console.log('\n🏃‍♀️ Testing query caching behavior...');
    
    // Test 1: First execution (likely cache miss)
    console.log('Test 1: First query execution...');
    const start1 = Date.now();
    const result1 = await prisma.$queryRaw`SELECT 1 as test_value, NOW() as timestamp`;
    const duration1 = Date.now() - start1;
    console.log(`⚡ Query completed in ${duration1}ms (likely cache miss)`);
    
    // Test 2: Immediate re-execution (should be cached)
    console.log('Test 2: Immediate re-execution...');
    const start2 = Date.now();
    const result2 = await prisma.$queryRaw`SELECT 1 as test_value, NOW() as timestamp`;
    const duration2 = Date.now() - start2;
    console.log(`⚡ Query completed in ${duration2}ms ${duration2 < duration1 ? '(cache hit! 🎯)' : '(cache miss)'}`);
    
    // Test 3: Different query
    console.log('Test 3: Different query...');
    const start3 = Date.now();
    const result3 = await prisma.$queryRaw`SELECT 2 as test_value, 'accelerate-test' as source`;
    const duration3 = Date.now() - start3;
    console.log(`⚡ Query completed in ${duration3}ms (new query, likely cache miss)`);
    
    console.log('\n📊 Caching Analysis:');
    console.log('━'.repeat(40));
    console.log(`Query 1: ${duration1}ms`);
    console.log(`Query 2: ${duration2}ms ${duration2 < duration1 ? '(✅ Faster - likely cached!)' : '(❓ Not cached)'}`);
    console.log(`Query 3: ${duration3}ms`);
    
    if (duration2 < duration1) {
      console.log('\n🎉 Accelerate caching appears to be working!');
      console.log('   Cached queries are executing faster than initial queries.');
    } else {
      console.log('\n❓ Cache behavior unclear - queries may be too simple to show significant difference.');
      console.log('   Try with more complex queries in production.');
    }
    
    console.log('\n✨ Database connectivity and Accelerate smoke test completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Database connection failed:');
    console.error('━'.repeat(60));
    
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      if ('code' in error) {
        console.error('Error code:', error.code);
      }
    } else {
      console.error('Unknown error:', error);
    }
    
    // Provide helpful debugging information
    console.log('\n🔍 Debugging Information:');
    console.log('━'.repeat(40));
    console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);
    
    if (process.env.DATABASE_URL) {
      const isAccelerateUrl = process.env.DATABASE_URL.startsWith('prisma://');
      console.log('Using Prisma Accelerate format:', isAccelerateUrl);
      
      const hasPlaceholders = process.env.DATABASE_URL.includes('<') || 
                               process.env.DATABASE_URL.includes('YOUR_API_KEY');
      
      if (hasPlaceholders) {
        console.log('❌ URL contains placeholder values - update .env with real credentials');
      }
      
      if (!isAccelerateUrl) {
        console.log('⚠️  Note: DATABASE_URL should start with "prisma://" for Accelerate');
      }
    }
    
    console.log('\n💡 Next Steps:');
    console.log('1. Verify Prisma Accelerate setup in Prisma Console');
    console.log('2. Update DATABASE_URL with your actual API key');
    console.log('3. Ensure your database is accessible from Accelerate');
    
    process.exit(1);
  }
})();
