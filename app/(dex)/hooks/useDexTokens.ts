'use client';

import { useEffect, useMemo, useState } from 'react';
import { parseAbi, type PublicClient } from 'viem';
import {
  CIRBTC,
  DEX_TOKENS,
  WETH,
  isTokenDeployed,
  withTokenDecimals,
  type DexToken,
} from '@/lib/dexConfig.testnet';

const DECIMALS_ABI = parseAbi(['function decimals() view returns (uint8)']);

/**
 * The fixed four-token Arc Testnet list. cirBTC and WETH always keep their rows,
 * and their decimals are read from the contracts; the config values are only a
 * fallback until the read completes (or if the RPC is unavailable).
 */
export function useDexTokens(publicClient?: PublicClient): DexToken[] {
  const [decimals, setDecimals] = useState<Record<string, number>>({});

  useEffect(() => {
    const readable = [CIRBTC, WETH].filter(isTokenDeployed);
    if (!publicClient || readable.length === 0) {
      setDecimals({});
      return;
    }

    let cancelled = false;
    void (async () => {
      const entries = await Promise.all(
        readable.map(async (token) => {
          try {
            const value = await publicClient.readContract({
              address: token.address as `0x${string}`,
              abi: DECIMALS_ABI,
              functionName: 'decimals',
            });
            const parsed = Number(value);
            if (!Number.isInteger(parsed) || parsed < 0 || parsed > 36) return null;
            return [token.symbol, parsed] as const;
          } catch {
            return null;
          }
        })
      );
      if (cancelled) return;
      setDecimals(
        Object.fromEntries(
          entries.filter((entry): entry is readonly [string, number] => entry !== null)
        )
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [publicClient]);

  return useMemo(
    () =>
      DEX_TOKENS.map((token) =>
        decimals[token.symbol] === undefined
          ? token
          : withTokenDecimals(token, decimals[token.symbol])
      ),
    [decimals]
  );
}
