#!/bin/bash

echo "🏗️ Building Team Tool for Render..."

# Navigate to frontend
cd frontend

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Build the application
echo "🔨 Building Next.js application..."
npm run build

# Check if build was successful
if [ -d ".next" ]; then
    echo "✅ Build successful! .next directory found."
    ls -la .next/
else
    echo "❌ Build failed! .next directory not found."
    exit 1
fi

echo "🎉 Build completed successfully!" 