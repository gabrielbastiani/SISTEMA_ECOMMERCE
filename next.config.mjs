const nextConfig = {
  experimental: {
    turbo: false,
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