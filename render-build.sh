#!/bin/bash
# Render build script - ensures we're in the backend directory and uses npm
set -e

echo "=========================================="
echo "Render Build Script"
echo "=========================================="
echo "Current directory: $(pwd)"
echo "Changing to backend directory..."
cd backend || exit 1

echo "Current directory after cd: $(pwd)"
echo "Listing files:"
ls -la

echo "=========================================="
echo "Installing dependencies with npm..."
echo "=========================================="
npm install

echo "=========================================="
echo "Building TypeScript code..."
echo "=========================================="
npm run build

echo "=========================================="
echo "Verifying build output..."
echo "=========================================="
if [ -f "dist/index.js" ]; then
    echo "✅ Build successful! dist/index.js exists"
    ls -lh dist/index.js
else
    echo "❌ ERROR: dist/index.js not found!"
    echo "Contents of dist directory:"
    ls -la dist/ 2>/dev/null || echo "dist directory does not exist"
    exit 1
fi

echo "=========================================="
echo "Build completed successfully!"
echo "=========================================="
