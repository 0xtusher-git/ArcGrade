// Uniswap v4 swap wiring for Arc mainnet (chain 5042).
// No deployments here: every address below is already live on Arc.
// Quotes use the on-chain V4Quoter; swaps are encoded for the deployed
// Universal Router v2.1.2 (hand-encoded to avoid shipping ethers v5 in the bundle).

import { ethers } from 'ethers';

export const ARC_CHAIN_ID = 5042;
export const ARC_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? 'https://rpc.mainnet.arc.io';
export const ARC_EXPLORER_URL = 'https://explorer.arc.io';

export const UNIVERSAL_ROUTER = '0x8702463e73f74d0b6765aBceb314Ef07aCb92650';
export const V4_QUOTER = '0x8Dc178eFB8111BB0973Dd9d722ebeFF267c98F94';
export const PERMIT2 = '0x000000000022D473030F116dDEE9F6B43aC78BA3';

// Universal Router recipient sentinels
const ROUTER_AS_RECIPIENT = '0x0000000000000000000000000000000000000002';

const QUOTE_SELECTOR = '0xaa9d21cb'; // quoteExactInputSingle(((address,address,uint24,int24,address),bool,uint128,bytes))

export type DexToken = {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  /** Native gas token exposed as an ERC-20 predeploy (USDC on Arc). */
  isGasToken?: boolean;
};

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

// Only tokens with a live Uniswap v4 pool on Arc are listed.
export const DEX_TOKENS: DexToken[] = [
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x3600000000000000000000000000000000000000',
    decimals: 6,
    isGasToken: true,
  },
  {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    address: '0x128cC466B61f542da60c70e3aA11c10e19B84EDB',
    decimals: 18,
  },
  {
    symbol: 'EURC',
    name: 'Euro Coin',
    address: '0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1',
    decimals: 6,
  },
];

export const USDC = DEX_TOKENS[0];
export const WETH = DEX_TOKENS[1];
export const EURC = DEX_TOKENS[2];

const HOOK = '0x1DF2971b2DFb0e80d7061dbe5E73688BA6552800';

// Discovered on-chain pool configs. Keyed by unordered token pair.
const POOLS: Record<string, PoolConfig> = {
  [pairKey(USDC.address, WETH.address)]: { fee: 2900, tickSpacing: 5, hooks: HOOK },
  [pairKey(USDC.address, EURC.address)]: { fee: 500, tickSpacing: 1, hooks: HOOK },
};

export const SLIPPAGE_OPTIONS_BPS = [10, 50, 100] as const;

function pairKey(a: string, b: string): string {
  return [a.toLowerCase(), b.toLowerCase()].sort().join(':');
}

export function getToken(symbol: string): DexToken | undefined {
  return DEX_TOKENS.find((t) => t.symbol === symbol);
}

export function getPool(tokenA: DexToken, tokenB: DexToken): PoolConfig | undefined {
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
    provider = new ethers.JsonRpcProvider(ARC_RPC_URL, ARC_CHAIN_ID, { staticNetwork: true });
  }
  return provider;
}

/** Quote an exact-input single-pool swap through the on-chain V4Quoter. */
export async function quoteExactInput(
  tokenIn: DexToken,
  tokenOut: DexToken,
  amountIn: bigint
): Promise<bigint> {
  if (amountIn <= 0n) return 0n;
  const pool = getPool(tokenIn, tokenOut);
  if (!pool) throw new Error('NO_ROUTE');

  const key = orderPoolKey(pool, tokenIn.address, tokenOut.address);
  const zeroForOne = key.currency0.toLowerCase() === tokenIn.address.toLowerCase();

  // The deployed quoter takes one nested QuoteExactSingleParams struct:
  // ((PoolKey key, bool zeroForOne, uint128 exactAmount, bytes hookData))
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

/**
 * Encode the Universal Router `execute` call for a single-pool v4 exact-input swap.
 * Plan: V4_SWAP [swap, settle, take] + SWEEP to the user.
 * - USDC input is funded with msg.value (its ERC-20 balance mirrors native gas);
 *   no approval or Permit2 needed.
 * - Other ERC-20 inputs are pulled through Permit2 (see `ensureAllowances`).
 */
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
  const { tokenIn, tokenOut, pool, amountIn, amountOut, slippageBps, recipient, deadline } = params;
  const amountOutMin = (amountOut * BigInt(10_000 - slippageBps)) / 10_000n;
  const key = orderPoolKey(pool, tokenIn.address, tokenOut.address);
  const zeroForOne = key.currency0.toLowerCase() === tokenIn.address.toLowerCase();

  // SWAP_EXACT_IN_SINGLE: (PoolKey, bool, uint128, uint128, uint256 minHopPriceX36, bytes hookData)
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
  // SETTLE: (address currency, uint256 amount, bool payerIsUser) - paid from router custody
  const settleParams = abi.encode(['address', 'uint256', 'bool'], [tokenIn.address, amountIn.toString(), false]);
  // TAKE with amount 0 takes the full positive delta (OPEN_DELTA) into the router
  const takeParams = abi.encode(['address', 'address', 'uint256'], [tokenOut.address, ROUTER_AS_RECIPIENT, '0']);

  const v4Input = abi.encode(['bytes', 'bytes[]'], ['0x060b0e', [swapParams, settleParams, takeParams]]);
  const sweepInput = abi.encode(
    ['address', 'address', 'uint256'],
    [tokenOut.address, recipient, amountOutMin.toString()]
  );

  const inputs: string[] = [];
  let commands = '0x';
  if (!tokenIn.isGasToken) {
    // PERMIT2_TRANSFER_FROM: (address token, address recipient, uint160 amount)
    commands += '02';
    inputs.push(abi.encode(['address', 'address', 'uint160'], [tokenIn.address, ROUTER_AS_RECIPIENT, amountIn.toString()]));
  }
  commands += '10'; // V4_SWAP
  inputs.push(v4Input);
  commands += '04'; // SWEEP
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

const INNER_ERRORS: Record<string, string> = {
  '0x486aa307': 'No liquidity pool exists for this pair on Arc.',
  '0x7a5ed734': 'The pool rejected this swap (hook restriction).',
  '0x5212cba1': 'The swap could not be settled on-chain.',
  '0x08c379a0': 'The pool reverted the swap.',
};

export function friendlySwapError(error: unknown): string {
  const err = error as {
    code?: string | number;
    message?: string;
    shortMessage?: string;
    info?: { error?: { data?: string; message?: string } };
    data?: string;
  };

  if (err?.code === 'ACTION_REJECTED' || err?.code === 4001) return 'Transaction rejected in your wallet.';

  const message = err?.info?.error?.message ?? err?.shortMessage ?? err?.message ?? '';
  if (message.includes('NO_ROUTE')) return 'No Uniswap route for this pair on Arc. Try USDC ↔ WETH or USDC ↔ EURC.';
  if (message.includes('INSUFFICIENT_FUNDS')) return 'Not enough USDC to pay for gas.';
  if (/user rejected|denied transaction/i.test(message)) return 'Transaction rejected in your wallet.';

  const data = err?.info?.error?.data ?? err?.data;
  if (typeof data === 'string' && data.startsWith('0x6190b2b0')) {
    // UnexpectedRevertBytes(bytes) - unwrap the inner revert selector
    try {
      const [inner] = abi.decode(['bytes'], '0x' + data.slice(10));
      const selector = inner.slice(0, 10).toLowerCase();
      if (INNER_ERRORS[selector]) return INNER_ERRORS[selector];
    } catch {
      /* ignore */
    }
  }
  if (typeof data === 'string' && INNER_ERRORS[data.slice(0, 10).toLowerCase()]) {
    return INNER_ERRORS[data.slice(0, 10).toLowerCase()];
  }

  return message || 'Swap failed. Please try again.';
}
