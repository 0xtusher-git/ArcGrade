// ethers.js v6 contract helpers for ArcTrust smart contract

import { ethers } from 'ethers';

// ABI: only the functions we need to call from the frontend
export const ARCTRUST_ABI = [
  // Read score for any wallet
  'function getScore(address wallet) view returns (uint256 score, uint256 lastUpdated)',
  // Write score (only authorized updater can call)
  'function updateScore(address wallet, uint256 score) external',
  // Get contract owner
  'function owner() view returns (address)',
  // Event emitted on score update
  'event ScoreUpdated(address indexed wallet, uint256 score, uint256 timestamp)',
];

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? '';
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? 'https://rpc.testnet.arc.network';
const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID ?? '5042002', 10);

// Read-only provider (no wallet needed)
function getReadProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(RPC_URL, {
    chainId: CHAIN_ID,
    name: 'arc-testnet',
  });
}

// Get read-only contract instance
function getReadContract(): ethers.Contract | null {
  if (!CONTRACT_ADDRESS) return null;
  const provider = getReadProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, ARCTRUST_ABI, provider);
}

// Get score from on-chain (returns null if contract not deployed yet)
export async function getOnChainScore(
  walletAddress: string
): Promise<{ score: number; lastUpdated: number } | null> {
  try {
    const contract = getReadContract();
    if (!contract) return null;
    const [score, lastUpdated] = await contract.getScore(walletAddress);
    return {
      score: Number(score),
      lastUpdated: Number(lastUpdated),
    };
  } catch {
    return null;
  }
}

// Write score using connected signer (MetaMask wallet must be the authorized updater)
export async function writeScoreOnChain(
  walletAddress: string,
  score: number,
  signer: ethers.Signer
): Promise<string | null> {
  try {
    if (!CONTRACT_ADDRESS) return null;
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ARCTRUST_ABI, signer);
    const tx = await contract.updateScore(walletAddress, score);
    await tx.wait();
    return tx.hash;
  } catch (err) {
    console.error('writeScoreOnChain error:', err);
    return null;
  }
}

// Arc Testnet network config for MetaMask
export const ARC_TESTNET_CONFIG = {
  chainId: `0x${CHAIN_ID.toString(16)}`,
  chainName: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
  rpcUrls: [RPC_URL],
  blockExplorerUrls: ['https://testnet.arcscan.app'],
};

// Ask MetaMask to switch to / add Arc Testnet
export async function switchToArcTestnet(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ethereum) return false;
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ARC_TESTNET_CONFIG.chainId }],
    });
    return true;
  } catch (switchError: unknown) {
    // Chain not added yet — add it
    if ((switchError as { code?: number })?.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [ARC_TESTNET_CONFIG],
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}
