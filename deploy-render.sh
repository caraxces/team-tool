#!/bin/bash

echo "🚀 Chuẩn bị deploy Team Tool lên Render.com..."

# Kiểm tra git status
echo "📋 Kiểm tra git status..."
git status

# Add tất cả thay đổi
echo "📦 Adding changes to git..."
git add .

# Commit với message
read -p "💬 Nhập commit message (hoặc enter để dùng mặc định): " commit_msg
if [ -z "$commit_msg" ]; then
    commit_msg="Fix Render deployment - $(date '+%Y-%m-%d %H:%M:%S')"
fi

git commit -m "$commit_msg"

# Push lên GitHub
echo "🚚 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Code đã được push lên GitHub!"
echo ""
echo "🌐 Bây giờ hãy làm theo các bước sau trên Render.com:"
echo ""
echo "📋 CÁCH 1: Deploy Frontend + Backend riêng biệt"
echo "   1. Tạo Web Service cho Backend:"
echo "      - Root Directory: backend"
echo "      - Build Command: npm install && npm run build"
echo "      - Start Command: npm start"
echo "      - Environment Variables: DB_HOST, DB_USER, DB_PASSWORD, etc."
echo ""
echo "   2. Tạo Static Site cho Frontend:"
echo "      - Root Directory: frontend"
echo "      - Build Command: npm install && npm run build"
echo "      - Publish Directory: .next"
echo "      - Environment Variables: NEXT_PUBLIC_API_URL"
echo ""
echo "📋 CÁCH 2: Deploy Full Stack cùng một service (Khuyến nghị)"
echo "   1. Tạo Web Service:"
echo "      - Root Directory: / (root)"
echo "      - Build Command: cd frontend && npm install && npm run build"
echo "      - Start Command: cd frontend && npm start"
echo "      - Environment Variables: tất cả variables cần thiết"
echo ""
echo "📋 CÁCH 3: Sử dụng render.yaml (Tự động)"
echo "   - File render.yaml đã được tạo trong root"
echo "   - Render sẽ tự động detect và sử dụng cấu hình này"
echo ""
echo "📖 Xem file RENDER_DEPLOYMENT.md để biết chi tiết!"
echo ""
echo "🔧 Lỗi phổ biến đã được fix:"
echo "   ✅ Next.js build trước khi start"
echo "   ✅ Port binding 0.0.0.0:10000"
echo "   ✅ Environment variables configuration"
echo "   ✅ CORS và API routing" 