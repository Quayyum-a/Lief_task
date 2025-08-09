# Database Connectivity Smoke Test

This directory contains smoke test scripts to verify Prisma Accelerate connectivity and cache performance.

## Files Added

1. **`test-db-connection.ts`** - Basic connectivity test with enhanced logging
2. **`test-db-accelerate.ts`** - Comprehensive Accelerate test with setup guidance
3. **Updated `package.json`** - Added test scripts and required dependencies

## Usage

### Quick Test
```bash
npm run test-db
```

### Comprehensive Accelerate Test
```bash
LOG_LEVEL=debug npm run test-accelerate
```

## Setup Requirements

### For Local Development
If using local development (SQLite), you'll need to:
1. Modify the Prisma schema to use SQLite instead of PostgreSQL
2. Regenerate the Prisma client
3. Use the `.env.local` configuration

### For Prisma Accelerate Testing
To test actual Accelerate connectivity and cache hits:

1. **Set up Prisma Accelerate:**
   - Visit https://console.prisma.io/
   - Create or select your project
   - Enable Accelerate for your database

2. **Update `.env` with real credentials:**
   ```env
   DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=YOUR_ACTUAL_API_KEY"
   ```

3. **Run the test:**
   ```bash
   LOG_LEVEL=debug npm run test-accelerate
   ```

## Expected Output

### With Placeholder Values (Current State)
The test will detect placeholder values and provide setup instructions.

### With Real Accelerate Credentials
```
🚀 Starting Prisma Accelerate connectivity smoke test...
📊 Environment Configuration: { ... }

🔌 Testing basic database connection...
✅ Database connection successful!
📋 Query result: [ { test_value: 1 } ]

🏃‍♀️ Testing query caching behavior...
Test 1: First query execution...
⚡ Query completed in 23ms (likely cache miss)
Test 2: Immediate re-execution...
⚡ Query completed in 4ms (cache hit! 🎯)
Test 3: Different query...
⚡ Query completed in 18ms (new query, likely cache miss)

📊 Caching Analysis:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Query 1: 23ms
Query 2: 4ms (✅ Faster - likely cached!)
Query 3: 18ms

🎉 Accelerate caching appears to be working!
   Cached queries are executing faster than initial queries.

✨ Database connectivity and Accelerate smoke test completed!
```

## What the Test Validates

1. **Connection Handshake** - Verifies connection to Prisma Accelerate
2. **Cache Performance** - Measures query execution times to detect caching
3. **Error Handling** - Provides detailed debugging information
4. **Environment Setup** - Validates configuration and provides guidance

## Debug Logging

Run with `LOG_LEVEL=debug` to see additional connection details and Prisma internal logs.

## Next Steps

Once real Accelerate credentials are configured:
1. The test will demonstrate actual cache hits
2. Connection handshake details will be visible in debug logs
3. Performance improvements from caching will be measurable
4. The setup can be deployed to staging for production testing
