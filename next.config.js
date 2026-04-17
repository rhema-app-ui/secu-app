/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/secu-app',
  assetPrefix: '/secu-app/',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

module.exports = nextConfig;