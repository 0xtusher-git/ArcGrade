/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
    NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
    NEXT_PUBLIC_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
    NEXT_PUBLIC_EXPLORER_URL: process.env.NEXT_PUBLIC_EXPLORER_URL,
  },
  async redirects() {
    return [
      { source: '/app', destination: '/swap', permanent: true },
      { source: '/app/:path*', destination: '/swap', permanent: true },
    ];
  },
  webpack: (config) => {
    // The /swap wallet stack (RainbowKit -> wagmi -> @wagmi/connectors) pulls in
    // the Coinbase Base Account connector, which depends on @coinbase/cdp-sdk.
    // That SDK lists the x402 payment packages as *optional* peer dependencies.
    // Nothing in this app uses x402, and @x402/svm conflicts with the installed
    // @solana/kit version, so replace them with empty modules at build time.
    config.resolve.alias = {
      ...config.resolve.alias,
      '@x402/core': false,
      '@x402/evm': false,
      '@x402/svm': false,
      '@x402/extensions': false,
    };
    return config;
  },
};

export default nextConfig;
