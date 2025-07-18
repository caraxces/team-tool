#!/bin/bash

echo "🏗️ Building Team Tool for Render..."

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm install
npm run build

echo "✅ Build completed successfully!"
echo "📁 Frontend build is ready in frontend/.next/" 