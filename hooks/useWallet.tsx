'use client';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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

const WalletContext = createContext<WalletState | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConnected = !!address;
  const isCorrectNetwork = chainId === TARGET_CHAIN_ID;

  // Restore session on mount (ONLY ONCE)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    const eth = window.ethereum;

    // Use a non-interactive check
    eth.request({ method: 'eth_accounts' }).then((accounts) => {
      const list = accounts as string[];
      if (list.length > 0) setAddress(list[0]);
    });

    eth.request({ method: 'eth_chainId' }).then((id) => {
      setChainId(parseInt(id as string, 16));
    });

    const onAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      setAddress(accounts[0] ?? null);
    };
    const onChainChanged = (...args: unknown[]) => {
      const id = args[0] as string;
      setChainId(parseInt(id, 16));
    };

    eth.on('accountsChanged', onAccountsChanged as any);
    eth.on('chainChanged', onChainChanged as any);

    return () => {
      eth.removeListener('accountsChanged', onAccountsChanged as any);
      eth.removeListener('chainChanged', onChainChanged as any);
    };
  }, []);

  const connect = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
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

  return (
    <WalletContext.Provider value={{ 
      address, isConnected, isConnecting, chainId, isCorrectNetwork, error, 
      connect, disconnect, switchNetwork 
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
