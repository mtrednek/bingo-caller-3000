/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig