#!/bin/bash

echo "🏗️ Building Team Tool for Render..."

# Build frontend
echo "📦 Building frontend..."
cd frontend

# Use npm ci for faster, reliable installs
if [ -f "package-lock.json" ]; then
    echo "📦 Using npm ci for fast install..."
    npm ci --only=production
else
    echo "📦 Using npm install..."
    npm install --only=production
fi

echo "🔨 Building Next.js app..."
npm run build

echo "✅ Build completed successfully!"
echo "📁 Frontend build is ready in frontend/.next/" 