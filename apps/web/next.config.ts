import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Emit standalone output for Docker / Azure Container Apps
  output: 'standalone',

  // Allow images from Supabase Storage and Unsplash (used for sample product photos)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  // Statically typed links — catches broken routes at build time
  typedRoutes: true,
}

export default nextConfig
