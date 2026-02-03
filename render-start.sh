#!/bin/bash
# Render start script - ensures we're in the backend directory
set -e

echo "=========================================="
echo "Render Start Script"
echo "=========================================="
echo "Current directory: $(pwd)"
echo "Changing to backend directory..."
cd backend || exit 1

echo "Current directory after cd: $(pwd)"
echo "Verifying dist/index.js exists..."
if [ ! -f "dist/index.js" ]; then
    echo "❌ ERROR: dist/index.js not found! Build may have failed."
    exit 1
fi

echo "✅ dist/index.js found"
echo "Starting application..."
npm start
