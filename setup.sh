#!/bin/bash
# Setup script for HealthShift application

echo "🏥 Setting up HealthShift application..."

# Set environment variables and initialize database
# export DATABASE_URL="file:./dev.db" # Legacy SQLite connection - commented for Accelerate
export NEXTAUTH_URL="http://localhost:3000"
export NEXTAUTH_SECRET="your-nextauth-secret-key-for-development"
export NODE_ENV="development"

# Generate Prisma client for Accelerate
echo "📦 Generating Prisma client for Accelerate..."
npx prisma generate --accelerate

# Push database schema
echo "🗄️ Setting up database..."
npx prisma db push

echo "✅ Setup complete! You can now run: npm run dev"
