/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',              // ✅ Génère un site statique dans /out
  images: { unoptimized: true }, // ✅ Désactive l'optimisation d'images (requis pour static)
  trailingSlash: true,           // ✅ Ajoute un slash final aux URLs (compatible Cloudflare)
  
  // ✅ Désactive ESLint et TypeScript checks pendant le build production
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}
module.exports = nextConfig