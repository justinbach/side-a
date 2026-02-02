import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'coverartarchive.org',
      },
      {
        protocol: 'http',
        hostname: 'coverartarchive.org',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '54321',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
}

export default nextConfig
