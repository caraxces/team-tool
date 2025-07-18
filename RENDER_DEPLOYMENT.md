# Hướng dẫn Deploy Team Tool lên Render.com

## Chuẩn bị

### 1. Chuẩn bị Database MySQL
- **Railway**: Tạo MySQL database (có free tier)
- **PlanetScale**: MySQL serverless platform
- **AWS RDS**: Cho production
- **Hoặc sử dụng PostgreSQL trên Render**

### 2. Tạo Database Schema
Chạy script `backend/database.sql` trên database của bạn.

## Deploy Backend trên Render

### Bước 1: Tạo Web Service cho Backend
1. Truy cập [render.com](https://render.com)
2. Kết nối GitHub repository
3. Tạo "New Web Service"
4. Chọn repository `team-tool`

### Bước 2: Cấu hình Backend Service
**Build & Deploy:**
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

**Environment Variables:**
```
NODE_ENV=production
PORT=10000
DB_HOST=your-mysql-host
DB_USER=your-mysql-user
DB_PASSWORD=your-mysql-password
DB_NAME=your-database-name
DB_PORT=3306
JWT_SECRET=your-jwt-secret-here
```

### Bước 3: Deploy Backend
- Click "Create Web Service"
- Đợi build và deploy hoàn thành
- Lưu lại URL backend (ví dụ: `https://team-tool-backend.onrender.com`)

## Deploy Frontend trên Render

### Bước 1: Tạo Static Site cho Frontend
1. Trong Render dashboard, click "New Static Site"
2. Chọn cùng repository `team-tool`

### Bước 2: Cấu hình Frontend Service
**Build & Deploy:**
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `.next`

**Environment Variables:**
```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com/api
BACKEND_URL=https://your-backend-url.onrender.com
```

### Bước 3: Deploy Frontend
- Click "Create Static Site"
- Đợi build và deploy hoàn thành

## Deploy Full Stack cùng một Service (Khuyến nghị)

### Cách 1: Monorepo Deployment
**Build & Deploy Settings:**
- **Root Directory**: `/` (root)
- **Build Command**: `cd frontend && npm ci --only=production && npm run build`
- **Start Command**: `cd frontend && npm start`

### Cách 2: Sử dụng render.yaml (Khuyến nghị nhất)
1. Commit file `render.yaml` trong root directory
2. Render sẽ tự động detect và sử dụng cấu hình này

**Environment Variables:**
```
NODE_ENV=production
PORT=10000
DB_HOST=your-mysql-host
DB_USER=your-mysql-user
DB_PASSWORD=your-mysql-password
DB_NAME=your-database-name
DB_PORT=3306
JWT_SECRET=your-jwt-secret-key
NEXT_PUBLIC_API_URL=https://your-app.onrender.com/api
```

## Troubleshooting

### Lỗi "No open ports detected"
**Giải pháp:**
1. Đảm bảo backend listen trên `0.0.0.0:PORT`
2. Kiểm tra PORT environment variable
3. Sử dụng PORT từ `process.env.PORT`

### Lỗi "Could not find production build"
**Giải pháp:**
1. Build command phải chạy `npm run build` trước
2. Kiểm tra build command: `cd frontend && npm ci --only=production && npm run build`
3. Start command: `cd frontend && npm start`

### Lỗi "Ran out of memory" hoặc "Infinite loop"
**Giải pháp:**
1. **KHÔNG sử dụng** `postinstall` script trong root package.json
2. Sử dụng `npm ci --only=production` thay vì `npm install`
3. Build command đúng: `cd frontend && npm ci --only=production && npm run build`
4. Đảm bảo không có circular dependencies trong build process

### Database Connection Issues
**Giải pháp:**
1. Kiểm tra database URL và credentials
2. Whitelist Render IP ranges: `0.0.0.0/0`
3. Test connection strings

### API Routing Issues
**Giải pháp:**
1. Đảm bảo NEXT_PUBLIC_API_URL đúng
2. Kiểm tra CORS configuration
3. Test API endpoints: `/api/health`

## Script Commands

### Build Commands
```bash
# Cho frontend only
cd frontend && npm install && npm run build

# Cho full stack
npm run render-build
```

### Start Commands
```bash
# Cho frontend only
cd frontend && npm start

# Cho full stack
npm run render-start
```

## Monitor & Logs
- Render cung cấp real-time logs
- Set up alerts cho service downtime
- Monitor database connections

## Performance Tips
1. **Enable caching** cho static assets
2. **Optimize build size** bằng tree shaking
3. **Database connection pooling**
4. **CDN** cho images và static files

## Security
- Luôn sử dụng HTTPS
- Keep secrets trong environment variables
- Regular dependency updates
- Monitor security alerts 