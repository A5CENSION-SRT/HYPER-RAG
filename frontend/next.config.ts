import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://127.0.0.1:8000/api/v1/:path*', // Proxy to FastAPI backend
      },
    ];
  },
  // Disable response buffering and compression for SSE streams
  async headers() {
    return [
      {
        source: '/api/v1/knowledge/upload/stream',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'X-Accel-Buffering',
            value: 'no',
          },
          {
            key: 'Content-Encoding',
            value: 'identity',
          },
        ],
      },
    ];
  },
  // Disable compression for SSE endpoints
  compress: false,
};

export default nextConfig;
