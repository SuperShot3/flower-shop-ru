/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['next-mdx-remote', 'heic2any'],
  async headers() {
    const cspReportOnly = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "img-src 'self' https: data: blob:",
      "font-src 'self' https: data:",
      "style-src 'self' 'unsafe-inline' https:",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
      "connect-src 'self' https: wss:",
      "frame-src 'self' https://mc.yandex.ru",
      "worker-src 'self' blob:",
      "form-action 'self' https:",
      'upgrade-insecure-requests',
    ].join('; ');

    const common = [
      { key: 'X-DNS-Prefetch-Control', value: 'off' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Permissions-Policy',
        value:
          'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
      },
      { key: 'Content-Security-Policy-Report-Only', value: cspReportOnly },
    ];

    const hsts =
      process.env.NODE_ENV === 'production'
        ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }]
        : [];

    return [
      {
        source: '/(.*)',
        headers: [...common, ...hsts],
      },
    ];
  },
  async redirects() {
    return [
      { source: '/', destination: '/ru', permanent: false },
      { source: '/th', destination: '/ru', permanent: true },
      { source: '/th/:path*', destination: '/ru/:path*', permanent: true },
      { source: '/zh-sg', destination: '/ru', permanent: true },
      { source: '/zh-sg/:path*', destination: '/ru/:path*', permanent: true },
      { source: '/zh-hk', destination: '/ru', permanent: true },
      { source: '/zh-hk/:path*', destination: '/ru/:path*', permanent: true },
      { source: '/:lang(en|ru)/guides', destination: '/:lang/info', permanent: true },
      {
        source: '/:lang(en|ru)/guides/birthday-flower-gift',
        destination: '/:lang/info/birthday-flower-gift',
        permanent: true,
      },
      {
        source: '/:lang(en|ru)/guides/flowers-chiang-mai',
        destination: '/:lang/info/flowers-chiang-mai',
        permanent: true,
      },
      {
        source: '/:lang(en|ru)/guides/rose-bouquets-chiang-mai',
        destination: '/:lang/info/rose-bouquets-chiang-mai',
        permanent: true,
      },
      {
        source: '/:lang(en|ru)/guides/same-day-flower-delivery-chiang-mai',
        destination: '/:lang/info/same-day-flower-delivery-chiang-mai',
        permanent: true,
      },
      {
        source: '/:lang(en|ru)/guides/flower-delivery-to-hospitals-chiang-mai',
        destination: '/:lang/info/flower-delivery-to-hospitals-chiang-mai',
        permanent: true,
      },
      {
        source: '/:lang(en|ru)/guides/perfect-bouquet-someone-special',
        destination: '/:lang/info/perfect-bouquet-someone-special',
        permanent: true,
      },
      {
        source: '/:lang(en|ru)/info/delivery-policy-chiang-mai',
        destination: '/:lang/info/delivery-policy',
        permanent: true,
      },
      {
        source: '/collections/white-roses-chiang-mai',
        destination: '/ru/collections/roses-chiang-mai?color=white',
        permanent: true,
      },
      {
        source: '/collections/pink-roses-chiang-mai',
        destination: '/ru/collections/roses-chiang-mai?color=pink',
        permanent: true,
      },
      {
        source: '/collections/red-roses-chiang-mai',
        destination: '/ru/collections/roses-chiang-mai?color=red',
        permanent: true,
      },
      {
        source: '/:lang(en|ru)/collections/white-roses-chiang-mai',
        destination: '/:lang/collections/roses-chiang-mai?color=white',
        permanent: true,
      },
      {
        source: '/:lang(en|ru)/collections/pink-roses-chiang-mai',
        destination: '/:lang/collections/roses-chiang-mai?color=pink',
        permanent: true,
      },
      {
        source: '/:lang(en|ru)/collections/red-roses-chiang-mai',
        destination: '/:lang/collections/roses-chiang-mai?color=red',
        permanent: true,
      },
      {
        source: '/:lang(en|ru)/partner',
        destination: '/:lang',
        permanent: false,
      },
      {
        source: '/:lang(en|ru)/partner/login',
        destination: '/:lang/partner/apply',
        permanent: false,
      },
      {
        source: '/:lang(en|ru)/partner/login/:path*',
        destination: '/:lang/partner/apply',
        permanent: false,
      },
      {
        source: '/:lang(en|ru)/partner/register',
        destination: '/:lang/partner/apply',
        permanent: false,
      },
      {
        source: '/:lang(en|ru)/partner/register/:path*',
        destination: '/:lang/partner/apply',
        permanent: false,
      },
      {
        source: '/:lang(en|ru)/partner/dashboard/:path*',
        destination: '/:lang',
        permanent: false,
      },
      {
        source: '/:lang(en|ru)/partner/products/:path*',
        destination: '/:lang',
        permanent: false,
      },
      {
        source: '/:lang(en|ru)/partner/shop/:path*',
        destination: '/:lang',
        permanent: false,
      },
      {
        source: '/:lang(en|ru)/partner/how-it-works',
        destination: '/:lang/partner/apply',
        permanent: false,
      },
      { source: '/studio', destination: '/admin', permanent: false },
      { source: '/studio/:path*', destination: '/admin', permanent: false },
    ];
  },
  async rewrites() {
    return [
      { source: '/feeds/google.txt', destination: '/feeds/google-merchant-feed' },
      { source: '/feeds/google-merchant-feed.tsv', destination: '/feeds/google-merchant-feed' },
    ];
  },
  experimental: {
    serverComponentsExternalPackages: ['pg'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      ...(function cdnRemotePatterns() {
        const raw = process.env.CATALOG_CDN_URL?.trim() || '';
        try {
          const host = new URL(raw).hostname;
          if (!host) return [];
          return [{ protocol: 'https', hostname: host, pathname: '/**' }];
        } catch {
          return [];
        }
      })(),
      {
        protocol: 'https',
        hostname: 'storage.yandexcloud.net',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
