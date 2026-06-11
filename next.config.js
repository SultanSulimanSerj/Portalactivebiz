/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  serverExternalPackages: ['pdfkit', '@pdf-lib/fontkit'],
}

module.exports = nextConfig
