'use client';

import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  bitgetWallet,
  coinbaseWallet,
  injectedWallet,
  metaMaskWallet,
  okxWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';
import { arcTestnet } from './appChain';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

export const hasWalletConnect = Boolean(projectId);

// WalletConnect requires a real project ID, so that connector is only added
// when the env var is present. Everything else keeps working without it.
const wallets = [
  injectedWallet,
  metaMaskWallet,
  coinbaseWallet,
  bitgetWallet,
  okxWallet,
  ...(hasWalletConnect ? [walletConnectWallet] : []),
];

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets,
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
