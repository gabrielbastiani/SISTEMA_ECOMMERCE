// @ts-check

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  experimental: {
    // @ts-ignore
    turbo: false
  },
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      }
    ]
  }
}

export default nextConfig;