#!/bin/bash

echo "🧪 Testing build process for Render deployment..."

# Test backend build
echo "📦 Testing backend build..."
cd backend
npm install
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Backend build successful"
else
    echo "❌ Backend build failed"
    exit 1
fi
cd ..

# Test frontend build
echo "📦 Testing frontend build..."
cd frontend
npm install
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi
cd ..

echo "🎉 All builds successful! Ready for Render deployment." 