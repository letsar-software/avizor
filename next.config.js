/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/como-funciona",
        destination: "/metodologia",
        statusCode: 301,
      },
    ];
  },
};

module.exports = nextConfig;
