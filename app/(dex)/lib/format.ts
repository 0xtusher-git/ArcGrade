import { formatAmount, type DexToken } from '@/lib/dexConfig.testnet';

/** Shorten a hex address to 0xabc…1234. */
export function shortAddress(address: string): string {
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/**
 * Only USDC has a price we actually know (1 USDC = $1). Every other token
 * returns a muted dash instead of inventing a price.
 */
export function fiatValue(token: DexToken | null, amount: bigint | null): string {
  if (!token || token.symbol !== 'USDC') return '-';
  const numeric = amount ? Number(formatAmount(amount, token.decimals, 2)) : 0;
  return `$${numeric.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
