'use client';

import { useMemo } from 'react';
import type { DexToken } from '@/lib/dexConfig.testnet';

export type TokenSearchState = {
  loading: boolean;
  results: DexToken[];
  /** A pasted address that is not one of the configured Arc Testnet tokens. */
  unsupported: boolean;
  explorer: { href: string; label: string } | null;
  hasQuery: boolean;
};

const EMPTY: TokenSearchState = {
  loading: false,
  results: [],
  unsupported: false,
  explorer: null,
  hasQuery: false,
};

/**
 * Filters the configured token list. A pasted 0x address only matches a token
 * already in that list; unknown addresses are reported as unsupported and are
 * never offered as an import. Transaction hashes still link to the explorer.
 */
export function useTokenSearch({
  query,
  tokens,
  explorerUrl,
  enabled,
}: {
  query: string;
  tokens: DexToken[];
  explorerUrl: string;
  enabled: boolean;
}): TokenSearchState {
  const q = query.trim();

  return useMemo(() => {
    if (!q) {
      return { ...EMPTY, results: tokens };
    }
    if (!enabled) {
      return { ...EMPTY, results: tokens, hasQuery: true };
    }
    if (/^0x[0-9a-fA-F]{64}$/.test(q)) {
      return {
        ...EMPTY,
        explorer: { href: `${explorerUrl}/tx/${q}`, label: 'View on Arc Testnet explorer' },
        hasQuery: true,
      };
    }
    if (/^0x[0-9a-fA-F]{40}$/.test(q)) {
      const known = tokens.find((token) => token.address.toLowerCase() === q.toLowerCase());
      if (known) {
        return { ...EMPTY, results: [known], hasQuery: true };
      }
      return { ...EMPTY, unsupported: true, hasQuery: true };
    }

    const needle = q.toLowerCase();
    return {
      ...EMPTY,
      results: tokens.filter(
        (token) =>
          token.symbol.toLowerCase().includes(needle) ||
          token.name.toLowerCase().includes(needle) ||
          token.address.toLowerCase().includes(needle)
      ),
      hasQuery: true,
    };
  }, [q, tokens, explorerUrl, enabled]);
}
