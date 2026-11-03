// Uniswap v4 config for Arc Testnet - ONLY for /swap route
import { ethers } from 'ethers';

export const ARC_TESTNET_CHAIN_ID = 5042002;
export const ARC_TESTNET_RPC_URL = process.env.NEXT_PUBLIC_TESTNET_RPC_URL || 'https://rpc.testnet.arc.network';
export const ARC_TESTNET_EXPLORER_URL = process.env.NEXT_PUBLIC_TESTNET_EXPLORER_URL || 'https://testnet.arcscan.app';

// Uniswap v4 contract addresses from env vars
export const UNIVERSAL_ROUTER_TESTNET = process.env.NEXT_PUBLIC_UNIV4_UNIVERSAL_ROUTER || '';
export const V4_QUOTER_TESTNET = process.env.NEXT_PUBLIC_UNIV4_QUOTER || '';
export const PERMIT2_TESTNET =
  process.env.NEXT_PUBLIC_UNIV4_PERMIT2 ||
  process.env.NEXT_PUBLIC_PERMIT2 ||
  '0x000000000022D473030F116dDEE9F6B43aC78BA3';
export const POOL_MANAGER_TESTNET = process.env.NEXT_PUBLIC_UNIV4_POOL_MANAGER || '';
export const POSITION_MANAGER_TESTNET = process.env.NEXT_PUBLIC_UNIV4_POSITION_MANAGER || '';

export const CONTRACTS_READY = Boolean(
  UNIVERSAL_ROUTER_TESTNET &&
  V4_QUOTER_TESTNET &&
  POOL_MANAGER_TESTNET &&
  POSITION_MANAGER_TESTNET
);

export const ARC_CHAIN_ID = ARC_TESTNET_CHAIN_ID;
export const ARC_RPC_URL = ARC_TESTNET_RPC_URL;
export const ARC_EXPLORER_URL = ARC_TESTNET_EXPLORER_URL;

export const UNIVERSAL_ROUTER = UNIVERSAL_ROUTER_TESTNET;
export const V4_QUOTER = V4_QUOTER_TESTNET;
export const PERMIT2 = PERMIT2_TESTNET;

// Reuse token structure
export type DexToken = {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  isGasToken?: boolean;
  chainId?: number;
  chainName?: string;
  /** Fallback letter used when the official logo is missing or fails to load. */
  icon?: string;
  /** Public path to the official, locally hosted token logo. */
  logo?: string;
  /** Issuer-published token, safe to show a verified check. */
  verified?: boolean;
};

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/** True when the token has a real, non-zero contract address configured. */
export function isTokenDeployed(token: DexToken): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(token.address) && token.address !== ZERO_ADDRESS;
}

/**
 * Use an env override when it is a valid non-zero address, otherwise fall back
 * to the official Arc Testnet address. Returning the fallback (instead of an
 * empty string) keeps the token row visible even when an override is malformed.
 */
function resolveConfiguredAddress(envValue: string | undefined, fallback: string): string {
  const trimmed = (envValue ?? '').trim();
  if (/^0x[0-9a-fA-F]{40}$/.test(trimmed) && trimmed.toLowerCase() !== ZERO_ADDRESS) {
    return trimmed;
  }
  return fallback;
}

/**
 * Official Arc Testnet addresses from
 * https://docs.arc.io/arc/references/contract-addresses (retrieved 2026-11-01).
 * `NEXT_PUBLIC_TOKEN_CIRBTC` and `NEXT_PUBLIC_TOKEN_WETH` can override them for
 * local deployments; decimals are read from the contracts at runtime.
 */
export const CIRBTC_ADDRESS = resolveConfiguredAddress(
  process.env.NEXT_PUBLIC_TOKEN_CIRBTC,
  '0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF'
);

export const WETH_ADDRESS = resolveConfiguredAddress(
  process.env.NEXT_PUBLIC_TOKEN_WETH,
  '0x2c4047028a72803939b6fb674D01bC059B5C4961'
);

// Only issuer-published tokens that Arc Testnet actually supports.
export const USDC: DexToken = {
  symbol: 'USDC',
  name: 'USD Coin',
  address: '0x3600000000000000000000000000000000000000',
  decimals: 6,
  isGasToken: true,
  chainId: ARC_TESTNET_CHAIN_ID,
  chainName: 'Arc Testnet',
  icon: 'U',
  logo: '/tokens/usdc.png',
  verified: true,
};

export const EURC: DexToken = {
  symbol: 'EURC',
  name: 'Euro Coin',
  address: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a',
  decimals: 6,
  chainId: ARC_TESTNET_CHAIN_ID,
  chainName: 'Arc Testnet',
  icon: 'E',
  logo: '/tokens/eurc.png',
  verified: true,
};

/**
 * Exactly four swap/liquidity tokens. cirBTC and WETH use the official Arc
 * Testnet contracts above; their decimals are read on-chain by `useDexTokens`
 * and the documented values below are only the initial display fallback.
 */
export const CIRBTC: DexToken = {
  symbol: 'cirBTC',
  name: 'Circle Wrapped Bitcoin',
  address: CIRBTC_ADDRESS,
  decimals: 8,
  chainId: ARC_TESTNET_CHAIN_ID,
  chainName: 'Arc Testnet',
  icon: 'C',
  logo: '/tokens/cirbtc.svg',
  verified: true,
};

export const WETH: DexToken = {
  symbol: 'WETH',
  name: 'Wrapped Ether',
  address: WETH_ADDRESS,
  decimals: 18,
  chainId: ARC_TESTNET_CHAIN_ID,
  chainName: 'Arc Testnet',
  icon: 'W',
  logo: '/tokens/weth.png',
  verified: false,
};

export const DEX_TOKENS: DexToken[] = [USDC, EURC, CIRBTC, WETH];

/** Replace a token's fallback decimals with the value read from the contract. */
export function withTokenDecimals(token: DexToken, decimals: number): DexToken {
  return { ...token, decimals };
}

export type PoolConfig = {
  fee: number;
  tickSpacing: number;
  hooks: string;
};

export type OrderedPoolKey = {
  currency0: string;
  currency1: string;
  fee: number;
  tickSpacing: number;
  hooks: string;
};

const POOLS: Record<string, PoolConfig> = {};

export const SLIPPAGE_OPTIONS_BPS = [10, 50, 100] as const;

function pairKey(a: string, b: string): string {
  return [a.toLowerCase(), b.toLowerCase()].sort().join(':');
}

export function getToken(symbol: string): DexToken | undefined {
  return DEX_TOKENS.find((t) => t.symbol === symbol);
}

export function getPool(tokenA: DexToken, tokenB: DexToken): PoolConfig | undefined {
  if (!CONTRACTS_READY) return undefined;
  return POOLS[pairKey(tokenA.address, tokenB.address)];
}

export function orderPoolKey(pool: PoolConfig, tokenA: string, tokenB: string): OrderedPoolKey {
  const firstIsA = tokenA.toLowerCase() < tokenB.toLowerCase();
  return {
    currency0: firstIsA ? tokenA : tokenB,
    currency1: firstIsA ? tokenB : tokenA,
    fee: pool.fee,
    tickSpacing: pool.tickSpacing,
    hooks: pool.hooks,
  };
}

const abi = ethers.AbiCoder.defaultAbiCoder();

let provider: ethers.JsonRpcProvider | null = null;

export function getReadProvider(): ethers.JsonRpcProvider {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(ARC_TESTNET_RPC_URL, ARC_TESTNET_CHAIN_ID, { staticNetwork: true });
  }
  return provider;
}

export async function quoteExactInput(
  tokenIn: DexToken,
  tokenOut: DexToken,
  amountIn: bigint
): Promise<bigint> {
  if (!CONTRACTS_READY) throw new Error('CONTRACTS_NOT_READY');
  if (amountIn <= 0n) return 0n;
  const pool = getPool(tokenIn, tokenOut);
  if (!pool) throw new Error('NO_ROUTE');

  const key = orderPoolKey(pool, tokenIn.address, tokenOut.address);
  const zeroForOne = key.currency0.toLowerCase() === tokenIn.address.toLowerCase();

  const QUOTE_SELECTOR = '0xaa9d21cb';
  const data =
    QUOTE_SELECTOR +
    abi
      .encode(
        ['tuple(tuple(address,address,uint24,int24,address),bool,uint128,bytes)'],
        [[[key.currency0, key.currency1, key.fee, key.tickSpacing, key.hooks], zeroForOne, amountIn.toString(), '0x']]
      )
      .slice(2);

  const result = await getReadProvider().call({ to: V4_QUOTER, data });
  const [amountOut] = abi.decode(['uint256', 'uint256'], result);
  return BigInt(amountOut.toString());
}

const ROUTER_AS_RECIPIENT = '0x0000000000000000000000000000000000000002';

export function buildSwapCall(params: {
  tokenIn: DexToken;
  tokenOut: DexToken;
  pool: PoolConfig;
  amountIn: bigint;
  amountOut: bigint;
  slippageBps: number;
  recipient: string;
  deadline: number;
}): { to: string; data: string; value: bigint } {
  if (!CONTRACTS_READY) throw new Error('CONTRACTS_NOT_READY');
  const { tokenIn, tokenOut, pool, amountIn, amountOut, slippageBps, recipient, deadline } = params;
  const amountOutMin = (amountOut * BigInt(10_000 - slippageBps)) / 10_000n;
  const key = orderPoolKey(pool, tokenIn.address, tokenOut.address);
  const zeroForOne = key.currency0.toLowerCase() === tokenIn.address.toLowerCase();

  const swapParams = abi.encode(
    ['tuple(tuple(address,address,uint24,int24,address),bool,uint128,uint128,uint256,bytes)'],
    [
      [
        [key.currency0, key.currency1, key.fee, key.tickSpacing, key.hooks],
        zeroForOne,
        amountIn.toString(),
        amountOutMin.toString(),
        '0',
        '0x',
      ],
    ]
  );
  const settleParams = abi.encode(['address', 'uint256', 'bool'], [tokenIn.address, amountIn.toString(), false]);
  const takeParams = abi.encode(['address', 'address', 'uint256'], [tokenOut.address, ROUTER_AS_RECIPIENT, '0']);

  const v4Input = abi.encode(['bytes', 'bytes[]'], ['0x060b0e', [swapParams, settleParams, takeParams]]);
  const sweepInput = abi.encode(
    ['address', 'address', 'uint256'],
    [tokenOut.address, recipient, amountOutMin.toString()]
  );

  const inputs: string[] = [];
  let commands = '0x';
  if (!tokenIn.isGasToken) {
    commands += '02';
    inputs.push(abi.encode(['address', 'address', 'uint160'], [tokenIn.address, ROUTER_AS_RECIPIENT, amountIn.toString()]));
  }
  commands += '10';
  inputs.push(v4Input);
  commands += '04';
  inputs.push(sweepInput);

  const iface = new ethers.Interface(['function execute(bytes commands, bytes[] inputs, uint256 deadline)']);
  const data = iface.encodeFunctionData('execute', [commands, inputs, deadline]);
  const value = tokenIn.isGasToken ? amountIn * 10n ** BigInt(18 - tokenIn.decimals) : 0n;

  return { to: UNIVERSAL_ROUTER, data, value };
}

export const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

export const PERMIT2_ABI = [
  'function allowance(address owner, address token, address spender) view returns (uint160 amount, uint48 expiration, uint48 nonce)',
  'function approve(address token, address spender, uint160 amount, uint48 expiration)',
];

export function parseAmount(value: string, decimals: number): bigint | null {
  const trimmed = value.trim();
  if (!trimmed || !/^\d*\.?\d*$/.test(trimmed) || trimmed === '.') return null;
  try {
    const parsed = ethers.parseUnits(trimmed, decimals);
    return parsed > 0n ? parsed : null;
  } catch {
    return null;
  }
}

export function formatAmount(value: bigint, decimals: number, maxFractionDigits = 6): string {
  const raw = ethers.formatUnits(value, decimals);
  const [whole, fraction] = raw.split('.');
  if (!fraction) return whole;
  const trimmed = fraction.slice(0, maxFractionDigits).replace(/0+$/, '');
  return trimmed ? `${whole}.${trimmed}` : whole;
}

export function friendlySwapError(error: unknown): string {
  const err = error as any;
  if (err?.code === 'ACTION_REJECTED' || err?.code === 4001) return 'Transaction rejected in your wallet.';
  const message = err?.info?.error?.message ?? err?.shortMessage ?? err?.message ?? '';
  if (message.includes('CONTRACTS_NOT_READY')) return 'Uniswap v4 contracts are not configured for Arc Testnet yet';
  if (message.includes('NO_ROUTE')) return 'No liquidity for this pair yet';
  if (message.includes('INSUFFICIENT_FUNDS')) return 'Not enough funds to pay for gas.';
  if (/user rejected|denied transaction/i.test(message)) return 'Transaction rejected in your wallet.';
  return message || 'Swap failed. Please try again.';
}
