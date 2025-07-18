import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  },
  // Cấu hình cho Render.com
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL.replace('/api', '')}/api/:path*` : 'http://localhost:3001/api/:path*',
      },
    ];
  },
  // Tối ưu cho production
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
};

export default nextConfig;
