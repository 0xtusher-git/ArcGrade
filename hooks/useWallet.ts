'use client';
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { switchToArcTestnet } from '@/lib/contract';

interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | null;
  isCorrectNetwork: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
}

const TARGET_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID ?? '5042002', 10);

export function useWallet(): WalletState {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConnected = !!address;
  const isCorrectNetwork = chainId === TARGET_CHAIN_ID;

  // Restore session on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    window.ethereum.request({ method: 'eth_accounts' }).then((accounts) => {
      const list = accounts as string[];
      if (list.length > 0) setAddress(list[0]);
    });
    window.ethereum.request({ method: 'eth_chainId' }).then((id) => {
      setChainId(parseInt(id as string, 16));
    });
  }, []);

  // Listen to MetaMask events
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    const onAccountsChanged = (accounts: string[]) => {
      setAddress(accounts[0] ?? null);
    };
    const onChainChanged = (id: string) => {
      setChainId(parseInt(id, 16));
    };
    window.ethereum.on('accountsChanged', onAccountsChanged);
    window.ethereum.on('chainChanged', onChainChanged);
    return () => {
      window.ethereum.removeListener('accountsChanged', onAccountsChanged);
      window.ethereum.removeListener('chainChanged', onChainChanged);
    };
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError('MetaMask not found. Please install it from metamask.io');
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      setAddress(accounts[0]);
      const network = await provider.getNetwork();
      setChainId(Number(network.chainId));
    } catch (err: unknown) {
      setError((err as Error)?.message ?? 'Failed to connect');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
  }, []);

  const switchNetwork = useCallback(async () => {
    const ok = await switchToArcTestnet();
    if (!ok) setError('Failed to switch network. Please switch manually in MetaMask.');
  }, []);

  return { address, isConnected, isConnecting, chainId, isCorrectNetwork, error, connect, disconnect, switchNetwork };
}
