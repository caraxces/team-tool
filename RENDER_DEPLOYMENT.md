# Hướng dẫn Deploy Team Tool lên Render

## Cấu hình hiện tại

Dự án này được cấu hình để deploy lên Render với 3 services:

1. **Backend Service** (`team-tool-backend`)
2. **Frontend Service** (`team-tool-frontend`) 
3. **Database** (`team-tool-db`)

## Các bước deploy

### 1. Chuẩn bị

- Đảm bảo code đã được push lên GitHub
- Có tài khoản Render.com

### 2. Deploy lên Render

1. Đăng nhập vào [Render.com](https://render.com)
2. Click "New" → "Blueprint"
3. Connect với GitHub repository
4. Render sẽ tự động detect file `render.yaml` và tạo 3 services

### 3. Cấu hình Services

#### Backend Service
- **Name**: team-tool-backend
- **Runtime**: Node.js
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Health Check**: `/api/health`

#### Frontend Service  
- **Name**: team-tool-frontend
- **Runtime**: Node.js
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Health Check**: `/`

#### Database
- **Name**: team-tool-db
- **Type**: MySQL
- **Plan**: Free

### 4. Environment Variables

Backend sẽ tự động nhận các biến môi trường từ database:
- `DB_HOST`
- `DB_USER` 
- `DB_PASSWORD`
- `DB_NAME`
- `DB_PORT`

Frontend sẽ có:
- `NEXT_PUBLIC_API_URL`: URL của backend service

### 5. URLs

Sau khi deploy thành công:
- **Frontend**: https://team-tool-frontend.onrender.com
- **Backend**: https://team-tool-backend.onrender.com
- **API**: https://team-tool-backend.onrender.com/api

## Troubleshooting

### Lỗi thường gặp

1. **Build failed**: Kiểm tra logs để xem lỗi cụ thể
2. **Database connection failed**: Đảm bảo database đã được tạo và environment variables đúng
3. **Health check failed**: Kiểm tra endpoint `/api/health` có hoạt động không

### Kiểm tra logs

- Vào dashboard của từng service trên Render
- Click vào "Logs" để xem chi tiết lỗi

## Cập nhật

Để cập nhật ứng dụng:
1. Push code mới lên GitHub
2. Render sẽ tự động trigger rebuild
3. Hoặc manual trigger từ dashboard

## Lưu ý

- Free plan có giới hạn về resources
- Database sẽ sleep sau 90 phút không sử dụng
- Services sẽ sleep sau 15 phút không có traffic 