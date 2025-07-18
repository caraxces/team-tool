# Hướng dẫn Deploy Team Tool lên Vercel

## Chuẩn bị

### 1. Chuẩn bị Database MySQL
Trước khi deploy, bạn cần một MySQL database cloud. Một số lựa chọn:
- **PlanetScale** (khuyến nghị - có plan free)
- **Railway**
- **Supabase** (PostgreSQL)
- **AWS RDS**

### 2. Tạo Database Schema
Chạy script `backend/database.sql` trên database của bạn để tạo tables và dữ liệu mẫu.

## Deploy lên Vercel

### Bước 1: Push code lên GitHub
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### Bước 2: Kết nối với Vercel
1. Truy cập [vercel.com](https://vercel.com)
2. Đăng nhập bằng GitHub
3. Click "New Project"
4. Import repository `team-tool`

### Bước 3: Cấu hình biến môi trường
Trong Vercel dashboard, thêm các biến môi trường sau:

**Database Configuration:**
- `DB_HOST`: MySQL host URL
- `DB_USER`: MySQL username
- `DB_PASSWORD`: MySQL password
- `DB_NAME`: Database name
- `DB_PORT`: 3306

**JWT & Security:**
- `JWT_SECRET`: Một chuỗi bí mật dài (ví dụ: generate bằng `openssl rand -base64 32`)

**Frontend API URL:**
- `NEXT_PUBLIC_API_URL`: https://your-app-name.vercel.app/api

**Email (tùy chọn):**
- `EMAIL_HOST`: smtp.gmail.com
- `EMAIL_PORT`: 587
- `EMAIL_USER`: your-email@gmail.com
- `EMAIL_PASSWORD`: your-app-password

### Bước 4: Deploy
1. Click "Deploy"
2. Vercel sẽ tự động build và deploy ứng dụng

## Cấu hình Domain (tùy chọn)
1. Trong Vercel dashboard, vào tab "Domains"
2. Thêm custom domain của bạn
3. Cập nhật DNS records theo hướng dẫn

## Kiểm tra sau Deploy

### Test API:
- Truy cập: `https://your-app.vercel.app/api/health`
- Kết quả mong đợi: `{"status":"OK","timestamp":"..."}`

### Test Frontend:
- Truy cập: `https://your-app.vercel.app`
- Kiểm tra trang login/register

## Troubleshooting

### Database Connection Issues:
- Kiểm tra biến môi trường DB_*
- Đảm bảo database schema đã được tạo
- Kiểm tra network access (whitelist 0.0.0.0/0 cho Vercel)

### Build Errors:
- Kiểm tra logs trong Vercel dashboard
- Đảm bảo TypeScript types đúng
- Kiểm tra dependencies trong package.json

### API Routing Issues:
- Đảm bảo NEXT_PUBLIC_API_URL đúng format
- Kiểm tra CORS configuration

## Cập nhật Code
Sau khi deploy lần đầu, mọi git push lên main branch sẽ trigger auto-deploy trên Vercel.

## Monitoring
- Vercel cung cấp analytics và monitoring built-in
- Kiểm tra function logs trong dashboard
- Set up alerts cho errors

## Security Notes
- Luôn sử dụng HTTPS
- Keep JWT_SECRET bí mật
- Regularly update dependencies
- Monitor database connections 