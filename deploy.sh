#!/bin/bash

echo "🚀 Chuẩn bị deploy Team Tool lên Vercel..."

# Kiểm tra git status
echo "📋 Kiểm tra git status..."
git status

# Add tất cả thay đổi
echo "📦 Adding changes to git..."
git add .

# Commit với message
read -p "💬 Nhập commit message (hoặc enter để dùng mặc định): " commit_msg
if [ -z "$commit_msg" ]; then
    commit_msg="Deploy to Vercel - $(date '+%Y-%m-%d %H:%M:%S')"
fi

git commit -m "$commit_msg"

# Push lên GitHub
echo "🚚 Pushing to GitHub..."
git push origin main

echo "✅ Code đã được push lên GitHub!"
echo "🌐 Bây giờ bạn có thể:"
echo "   1. Truy cập https://vercel.com"
echo "   2. Import project này từ GitHub"
echo "   3. Cấu hình biến môi trường theo hướng dẫn trong DEPLOYMENT.md"
echo "   4. Deploy!"

echo ""
echo "📖 Xem file DEPLOYMENT.md để biết chi tiết hướng dẫn." 