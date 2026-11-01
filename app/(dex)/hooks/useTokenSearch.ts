'use client';

import { useEffect, useMemo, useState } from 'react';
import { hexToString, isAddress, parseAbi, type PublicClient } from 'viem';
import type { DexToken } from '@/lib/dexConfig.testnet';

export type ImportCandidate = {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
};

export type TokenSearchState = {
  loading: boolean;
  results: DexToken[];
  candidate: ImportCandidate | null;
  explorer: { href: string; label: string } | null;
  hasQuery: boolean;
};

const METADATA_ABI = parseAbi([
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function decimals() view returns (uint8)',
]);

const SYMBOL_BYTES32_ABI = parseAbi(['function symbol() view returns (bytes32)']);

const EMPTY: TokenSearchState = {
  loading: false,
  results: [],
  candidate: null,
  explorer: null,
  hasQuery: false,
};

/**
 * Filters the configured token list and, for a pasted 0x address, either reads
 * ERC-20 metadata on chain (import candidate) or falls back to an explorer link
 * for wallet addresses / transaction hashes.
 */
export function useTokenSearch({
  query,
  tokens,
  publicClient,
  explorerUrl,
  enabled,
}: {
  query: string;
  tokens: DexToken[];
  publicClient?: PublicClient;
  explorerUrl: string;
  enabled: boolean;
}): TokenSearchState {
  const q = query.trim();

  const localResults = useMemo(() => {
    if (!q) return tokens;
    const needle = q.toLowerCase();
    return tokens.filter(
      (token) =>
        token.symbol.toLowerCase().includes(needle) ||
        token.name.toLowerCase().includes(needle) ||
        token.address.toLowerCase().includes(needle)
    );
  }, [q, tokens]);

  const [state, setState] = useState<TokenSearchState>(EMPTY);

  useEffect(() => {
    if (!q) {
      setState({ ...EMPTY, results: localResults });
      return;
    }
    if (!enabled) {
      setState({ ...EMPTY, results: localResults, hasQuery: true });
      return;
    }
    if (/^0x[0-9a-fA-F]{64}$/.test(q)) {
      setState({
        ...EMPTY,
        explorer: { href: `${explorerUrl}/tx/${q}`, label: 'View on Arc Testnet explorer' },
        hasQuery: true,
      });
      return;
    }
    if (!/^0x[0-9a-fA-F]{40}$/.test(q) || !isAddress(q)) {
      setState({ ...EMPTY, results: localResults, hasQuery: true });
      return;
    }

    const known = tokens.find((token) => token.address.toLowerCase() === q.toLowerCase());
    if (known) {
      setState({ ...EMPTY, results: [known], hasQuery: true });
      return;
    }
    if (!publicClient) {
      setState({ ...EMPTY, hasQuery: true });
      return;
    }

    let cancelled = false;
    setState({ ...EMPTY, loading: true, hasQuery: true });
    const address = q as `0x${string}`;

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const [symbol, decimals] = await Promise.all([
            publicClient
              .readContract({ address, abi: METADATA_ABI, functionName: 'symbol' })
              .catch(async () => {
                const raw = await publicClient.readContract({
                  address,
                  abi: SYMBOL_BYTES32_ABI,
                  functionName: 'symbol',
                });
                return hexToString(raw).replace(/\u0000/g, '').trim();
              }),
            publicClient.readContract({ address, abi: METADATA_ABI, functionName: 'decimals' }),
          ]);

          if (!symbol || !Number.isFinite(Number(decimals))) throw new Error('NOT_ERC20');

          let name = '';
          try {
            name = await publicClient.readContract({ address, abi: METADATA_ABI, functionName: 'name' });
          } catch {
            name = '';
          }

          if (cancelled) return;
          setState({
            ...EMPTY,
            candidate: {
              address,
              symbol: String(symbol),
              name: name || String(symbol),
              decimals: Number(decimals),
            },
            hasQuery: true,
          });
        } catch {
          if (cancelled) return;
          setState({
            ...EMPTY,
            explorer: { href: `${explorerUrl}/address/${address}`, label: 'View on Arc Testnet explorer' },
            hasQuery: true,
          });
        }
      })();
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [q, localResults, tokens, publicClient, enabled, explorerUrl]);

  return state;
}
