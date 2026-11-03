import {
  arbitrumSepolia,
  avalancheFuji,
  baseSepolia,
  codexTestnet,
  hyperliquidEvmTestnet,
  inkSepolia,
  lineaSepolia,
  optimismSepolia,
  plumeSepolia,
  polygonAmoy,
  seiTestnet,
  sepolia,
  sonicTestnet,
  unichainSepolia,
  worldchainSepolia,
  xdcTestnet,
} from 'viem/chains';
import { arcTestnet } from '@/lib/appChain';
import { USDC, isTokenDeployed, type DexToken } from '@/lib/dexConfig.testnet';

/**
 * Single source of truth for the chains the Bridge tab can pick from.
 *
 * Testnets only. Every chain ID below comes from viem's built-in chain
 * definitions (or the existing Arc definition). Circle's CCTP/Bridge Kit
 * supported-blockchains table lists every corresponding network; Solana Devnet
 * (non-EVM) and BNB Smart Chain Testnet (USYC only) are intentionally excluded.
 *
 * A few display names intentionally match the bridge UI rather than viem:
 * - HyperEVM Testnet -> viem hyperliquidEvmTestnet
 * - Ink Testnet -> viem inkSepolia
 * - Plume Testnet -> viem plumeSepolia
 * - XDC Apothem -> viem xdcTestnet
 */
export type BridgeChain = {
  id: number;
  name: string;
  /** Public path to the locally hosted parent-network logo. */
  logo: string;
  /** Fallback letter when the logo fails to load. */
  glyph: string;
};

export const ARC_BRIDGE_CHAIN: BridgeChain = {
  id: arcTestnet.id,
  name: 'Arc Testnet',
  logo: '/chains/arc.png',
  glyph: 'A',
};

export const DEFAULT_NON_ARC_CHAIN_ID = sepolia.id;

export const BRIDGE_CHAINS: BridgeChain[] = [
  ARC_BRIDGE_CHAIN,
  { id: arbitrumSepolia.id, name: 'Arbitrum Sepolia', logo: '/chains/arbitrum.png', glyph: 'A' },
  { id: avalancheFuji.id, name: 'Avalanche Fuji', logo: '/chains/avalanche.png', glyph: 'A' },
  { id: baseSepolia.id, name: 'Base Sepolia', logo: '/chains/base.png', glyph: 'B' },
  { id: codexTestnet.id, name: 'Codex Testnet', logo: '/chains/codex.png', glyph: 'C' },
  { id: sepolia.id, name: 'Ethereum Sepolia', logo: '/chains/ethereum.png', glyph: 'E' },
  {
    id: hyperliquidEvmTestnet.id,
    name: 'HyperEVM Testnet',
    logo: '/chains/hyperevm.png',
    glyph: 'H',
  },
  { id: inkSepolia.id, name: 'Ink Testnet', logo: '/chains/ink.svg', glyph: 'I' },
  { id: lineaSepolia.id, name: 'Linea Sepolia', logo: '/chains/linea.png', glyph: 'L' },
  { id: optimismSepolia.id, name: 'OP Sepolia', logo: '/chains/optimism.png', glyph: 'O' },
  { id: plumeSepolia.id, name: 'Plume Testnet', logo: '/chains/plume.png', glyph: 'P' },
  { id: polygonAmoy.id, name: 'Polygon PoS Amoy', logo: '/chains/polygon.png', glyph: 'P' },
  { id: seiTestnet.id, name: 'Sei Testnet', logo: '/chains/sei.png', glyph: 'S' },
  { id: sonicTestnet.id, name: 'Sonic Testnet', logo: '/chains/sonic.png', glyph: 'S' },
  { id: unichainSepolia.id, name: 'Unichain Sepolia', logo: '/chains/unichain.png', glyph: 'U' },
  {
    id: worldchainSepolia.id,
    name: 'World Chain Sepolia',
    logo: '/chains/worldchain.png',
    glyph: 'W',
  },
  { id: xdcTestnet.id, name: 'XDC Apothem', logo: '/chains/xdc.png', glyph: 'X' },
];

export function getBridgeChain(id: number | undefined): BridgeChain {
  return BRIDGE_CHAINS.find((chain) => chain.id === id) ?? ARC_BRIDGE_CHAIN;
}

/**
 * USDC is the only bridgeable asset for now. We reuse the existing Arc USDC
 * address when it is configured and leave the address empty on every other
 * chain instead of inventing one.
 */
export function bridgeUsdc(chain: BridgeChain): DexToken {
  const address =
    chain.id === arcTestnet.id && isTokenDeployed(USDC) ? USDC.address : '';

  return {
    symbol: 'USDC',
    name: 'USD Coin',
    address,
    decimals: 6,
    chainId: chain.id,
    chainName: chain.name,
    icon: 'U',
    logo: USDC.logo,
    verified: USDC.verified,
  };
}

/**
 * Keep Arc Testnet on exactly one side. Picking the chain that already sits on
 * the opposite side swaps the two sides instead of producing From = To.
 */
export function nextBridgePair(
  side: 'from' | 'to',
  chainId: number,
  fromChainId: number,
  toChainId: number
): [number, number] {
  if (chainId === (side === 'from' ? fromChainId : toChainId)) {
    return [fromChainId, toChainId];
  }

  if (side === 'from') {
    if (chainId === toChainId) return [toChainId, fromChainId];
    const nextTo =
      chainId === arcTestnet.id
        ? fromChainId !== arcTestnet.id
          ? fromChainId
          : DEFAULT_NON_ARC_CHAIN_ID
        : arcTestnet.id;
    return [chainId, nextTo];
  }

  if (chainId === fromChainId) return [toChainId, fromChainId];
  const nextFrom =
    chainId === arcTestnet.id
      ? toChainId !== arcTestnet.id
        ? toChainId
        : DEFAULT_NON_ARC_CHAIN_ID
      : arcTestnet.id;
  return [nextFrom, chainId];
}
