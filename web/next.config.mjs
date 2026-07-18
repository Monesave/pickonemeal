/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/app/home',
        destination: '/home',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;


