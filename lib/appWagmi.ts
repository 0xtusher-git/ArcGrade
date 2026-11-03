'use client';

import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  bitgetWallet,
  injectedWallet,
  metaMaskWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';
import { arcTestnet } from './appChain';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

export const hasWalletConnect = Boolean(projectId);

// WalletConnect requires a real project ID, so that connector is only added
// when the env var is present. Everything else keeps working without it.
//
// Installed browser wallets (OKX, Phantom, ...) are discovered by RainbowKit
// via EIP-6963 and shown under its own "Installed" group, so they are not
// listed here. Coinbase and Rainbow are intentionally left out.
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Browser Wallets',
      wallets: [injectedWallet, metaMaskWallet],
    },
    {
      groupName: 'Other',
      wallets: [
        ...(hasWalletConnect ? [walletConnectWallet] : []),
        bitgetWallet,
      ],
    },
  ],
  {
    appName: 'RepDex',
    projectId: projectId || 'repdex-app',
  }
);

export const appConfig = createConfig({
  connectors,
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: http(arcTestnet.rpcUrls.default.http[0]),
  },
  ssr: true,
});
