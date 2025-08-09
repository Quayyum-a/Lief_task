import 'dotenv/config';
import { prisma } from './lib/prisma';

(async () => {
  try {
    console.log('🚀 Starting database connectivity smoke test...');
    console.log('📊 Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 
        process.env.DATABASE_URL.replace(/apikey=.*?($|&)/, 'apikey=[REDACTED]$1') : 
        'NOT_SET',
      LOG_LEVEL: process.env.LOG_LEVEL
    });
    
    console.log('\n🔌 Testing basic database connection...');
    const result = await prisma.$queryRaw`SELECT 1 as test_value`;
    console.log('✅ Database connection successful!');
    console.log('📋 Query result:', result);
    
    console.log('\n🏃‍♀️ Testing a second query to check Accelerate caching...');
    const start = Date.now();
    const cachedResult = await prisma.$queryRaw`SELECT 1 as test_value, NOW() as timestamp`;
    const duration = Date.now() - start;
    console.log('⚡ Second query completed in', duration, 'ms');
    console.log('📋 Cached query result:', cachedResult);
    
    console.log('\n🎯 Testing with caching hint...');
    const cachedStart = Date.now();
    const accelerateResult = await prisma.$queryRaw`SELECT 1 as test_value, 'accelerate-test' as source`;
    const accelerateDuration = Date.now() - cachedStart;
    console.log('⚡ Accelerate query completed in', accelerateDuration, 'ms');
    console.log('📋 Accelerate result:', accelerateResult);
    
    console.log('\n✨ All database connectivity tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:');
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
    console.log('\n🔍 Debugging information:');
    console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);
    if (process.env.DATABASE_URL) {
      const isAccelerateUrl = process.env.DATABASE_URL.startsWith('prisma://');
      console.log('Using Prisma Accelerate:', isAccelerateUrl);
      if (!isAccelerateUrl) {
        console.log('⚠️  Note: DATABASE_URL should start with "prisma://" for Accelerate');
      }
    }
    
    process.exit(1);
  }
})();
