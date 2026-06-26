/** @type {import('next').NextConfig} */
const apiGateway = process.env.API_GATEWAY_URL || "http://127.0.0.1:4000";

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiGateway}/api/:path*`
      },
      {
        source: "/uploads/:path*",
        destination: `${apiGateway}/uploads/:path*`
      }
    ];
  }
};

export default nextConfig;
