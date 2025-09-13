import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer, nextRuntime }) => {
    if (!isServer && nextRuntime === 'edge') {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            "async_hooks": false,
        };
    }
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "async_hooks": false,
      };
    }
    config.module.rules.push({
      test: /.*\.node$/,
      loader: 'node-loader',
    });

    return config;
  },
};

export default nextConfig;
