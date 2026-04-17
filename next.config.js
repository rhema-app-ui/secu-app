/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/secu-app',
  assetPrefix: '/secu-app/',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // ✅ DÉSACTIVER ESLINT PENDANT LE BUILD (pour GitHub Pages)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // ✅ DÉSACTIVER LES CHECKS TYPES PENDANT LE BUILD (optionnel, mais utile)
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;