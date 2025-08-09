import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

(async () => {
  try {
    console.log('🚀 Starting Cold Start Database Latency Test...');
    console.log('📊 Testing with local SQLite database for baseline measurement');
    
    // Create a new client instance to simulate cold start
    const prismaLocal = new PrismaClient({
      datasources: {
        db: {
          url: 'file:./prisma/dev.db'
        }
      }
    });
    
    console.log('\n🔌 Testing cold start database connection (first query)...');
    const coldStartTime = Date.now();
    const result1 = await prismaLocal.$queryRaw`SELECT 1 as test_value, datetime('now') as timestamp`;
    const coldStartLatency = Date.now() - coldStartTime;
    console.log(`❄️  Cold start query completed in ${coldStartLatency}ms`);
    console.log('📋 Query result:', result1);
    
    console.log('\n🏃‍♀️ Testing warm query (second query)...');
    const warmStartTime = Date.now();
    const result2 = await prismaLocal.$queryRaw`SELECT 2 as test_value, datetime('now') as timestamp`;
    const warmLatency = Date.now() - warmStartTime;
    console.log(`🔥 Warm query completed in ${warmLatency}ms`);
    console.log('📋 Query result:', result2);
    
    console.log('\n🏃‍♀️ Testing typical application queries...');
    
    // Test user lookup (common query)
    const userLookupStart = Date.now();
    const users = await prismaLocal.user.findMany({ take: 1 });
    const userLookupLatency = Date.now() - userLookupStart;
    console.log(`👤 User lookup completed in ${userLookupLatency}ms`);
    
    // Test shift lookup (common query)
    const shiftLookupStart = Date.now();
    const shifts = await prismaLocal.shift.findMany({ take: 1, orderBy: { createdAt: 'desc' } });
    const shiftLookupLatency = Date.now() - shiftLookupStart;
    console.log(`⏰ Shift lookup completed in ${shiftLookupLatency}ms`);
    
    // Test complex query with relations
    const complexQueryStart = Date.now();
    const userWithShifts = await prismaLocal.user.findFirst({
      include: {
        shifts: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            perimeter: true
          }
        }
      }
    });
    const complexQueryLatency = Date.now() - complexQueryStart;
    console.log(`🔄 Complex query with relations completed in ${complexQueryLatency}ms`);
    
    console.log('\n📊 Performance Analysis (Local SQLite Baseline):');
    console.log('━'.repeat(50));
    console.log(`Cold Start Latency:    ${coldStartLatency}ms`);
    console.log(`Warm Query Latency:    ${warmLatency}ms`);
    console.log(`User Lookup Latency:   ${userLookupLatency}ms`);
    console.log(`Shift Lookup Latency:  ${shiftLookupLatency}ms`);
    console.log(`Complex Query Latency: ${complexQueryLatency}ms`);
    
    const improvement = coldStartLatency - warmLatency;
    console.log(`\n🎯 Performance improvement from cold to warm: ${improvement}ms`);
    
    console.log('\n📈 Expected improvements with Prisma Accelerate:');
    console.log('━'.repeat(50));
    console.log(`• Cold start reduction: ~50-90ms (current: ${coldStartLatency}ms → expected: ${Math.max(coldStartLatency - 70, 10)}ms)`);
    console.log(`• Cache hits should reduce to: ~5-15ms`);
    console.log(`• Connection pooling should improve: ~${Math.max(warmLatency - 5, 2)}ms faster`);
    
    // Simulate multiple rapid queries to test connection efficiency
    console.log('\n🔄 Testing connection pooling efficiency (10 rapid queries)...');
    const rapidQueries = [];
    const rapidQueriesStart = Date.now();
    
    for (let i = 0; i < 10; i++) {
      rapidQueries.push(
        prismaLocal.$queryRaw`SELECT ${i} as query_num, datetime('now') as timestamp`
      );
    }
    
    await Promise.all(rapidQueries);
    const rapidQueriesLatency = Date.now() - rapidQueriesStart;
    const avgRapidQuery = rapidQueriesLatency / 10;
    console.log(`⚡ 10 rapid queries completed in ${rapidQueriesLatency}ms (avg: ${avgRapidQuery.toFixed(1)}ms per query)`);
    
    console.log('\n✨ Local Database Latency Test completed!');
    console.log('\n💡 To test against Accelerate:');
    console.log('1. Set up Prisma Accelerate connection in DATABASE_URL');
    console.log('2. Run: npm run test-accelerate');
    console.log('3. Compare latencies to see the ~50-90ms improvement');
    
    await prismaLocal.$disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Database latency test failed:');
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
    
    console.log('\n🔍 Troubleshooting:');
    console.log('1. Check if prisma/dev.db exists');
    console.log('2. Run: npx prisma generate');
    console.log('3. Run: npx prisma db push');
    
    process.exit(1);
  }
})();
