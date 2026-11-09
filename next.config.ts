import type { NextConfig } from 'next';
import { ADMIN_HOST, BASE_PATH } from './lib/base-path';

const onAdminHost = [{ type: 'host' as const, value: ADMIN_HOST }];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Served at drmarcosrassi.com.br/pgdtrauma through a proxy on the WordPress host.
  basePath: BASE_PATH,
  experimental: {
    serverActions: {
      // The admin is reached through the main domain's proxy; allow its Origin for Server Actions.
      allowedOrigins: ['pgdtraumatologia.com', 'www.pgdtraumatologia.com', 'drmarcosrassi.com.br', 'www.drmarcosrassi.com.br', ADMIN_HOST],
      bodySizeLimit: '3mb',
    },
  },
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Images uploaded through /admin live in Vercel Blob.
    remotePatterns: [{ protocol: 'https', hostname: '*.public.blob.vercel-storage.com' }],
    qualities: [75, 85],
    deviceSizes: [360, 480, 640, 768, 960, 1200, 1536, 1920],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async redirects() {
    // The bare root has nothing on the landing-page hosts: send it to the page.
    // (On admin.pgdtraumatologia.com the root is the panel: see vercel.json.)
    return [{ source: '/', destination: BASE_PATH, basePath: false, permanent: false, missing: onAdminHost }];
  },
  async headers() {
    return [
      {
        source: '/media/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default nextConfig;
