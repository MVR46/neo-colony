/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Add support for Phaser in webpack
    config.module.rules.push({
      test: /\.js$/,
      include: /node_modules\/phaser/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['next/babel'],
        },
      },
    });

    return config;
  },
  // Ensure serverless functions have enough time for AI operations
  serverRuntimeConfig: {
    maxDuration: 60,
  }
};

module.exports = nextConfig; 