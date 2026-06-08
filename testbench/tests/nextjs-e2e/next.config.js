/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/cfg-old', destination: '/cfg-new', permanent: true },
      { source: '/cfg-302', destination: '/cfg-new', permanent: false },
    ];
  },
  async rewrites() {
    return [
      { source: '/cfg-rewrite', destination: '/posts/missing' },
    ];
  },
  async headers() {
    return [
      {
        source: '/cfg-headers',
        headers: [
          { key: 'X-Lly-Test', value: 'from-config' },
          { key: 'Cache-Control', value: 'public, max-age=60' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
