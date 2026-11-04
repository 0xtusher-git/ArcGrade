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
import { defineChain } from 'viem';
import { ARC_CHAIN_ID, ARC_EXPLORER_URL, ARC_RPC_URL } from './dexConfig';
import { ARC_MAINNET_CONFIG } from './contract';

/**
 * ArcGrade's own wagmi config. It is intentionally separate from the swap
 * app's config in `lib/appWagmi.ts`: ArcGrade only talks to Arc mainnet, while
 * the swap app only talks to Arc Testnet. Never share one config between them.
 *
 * Every chain value is taken from the existing mainnet config:
 * - `lib/dexConfig.ts`   -> chain ID, RPC URL, explorer URL
 * - `lib/contract.ts`    -> display name and native currency (ARC_MAINNET_CONFIG)
 */
export const arcMainnet = defineChain({
  id: ARC_CHAIN_ID,
  name: ARC_MAINNET_CONFIG.chainName,
  nativeCurrency: ARC_MAINNET_CONFIG.nativeCurrency,
  rpcUrls: {
    default: {
      http: [ARC_RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: 'Arc Explorer',
      url: ARC_EXPLORER_URL,
    },
  },
});

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

/** WalletConnect is only offered when a real project ID is configured. */
export const hasArcGradeWalletConnect = Boolean(projectId);

// Same wallet set as the swap app, but wired to the Arc mainnet config above.
const wallets = [
  injectedWallet,
  metaMaskWallet,
  coinbaseWallet,
  bitgetWallet,
  okxWallet,
  ...(hasArcGradeWalletConnect ? [walletConnectWallet] : []),
];

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets,
    },
  ],
  {
    appName: 'ArcGrade',
    projectId: projectId || 'arcgrade-app',
  }
);

export const arcGradeConfig = createConfig({
  connectors,
  chains: [arcMainnet],
  transports: {
    [arcMainnet.id]: http(arcMainnet.rpcUrls.default.http[0]),
  },
  ssr: true,
});
