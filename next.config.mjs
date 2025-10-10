/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pdf-parse', 'mammoth'],
  allowedDevOrigins: ['192.168.56.1'],
};

export default nextConfig;
