import { ethers } from 'ethers';

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? 'https://rpc.mainnet.arc.io';
const FETCH_TIMEOUT_MS = 8000;
const EXPLORER_TIMEOUT_MS = 5000;
const USER_AGENT = 'ArcGrade/1.0 (https://arc-grade.vercel.app)';

// Arcscan serves the same API from a dedicated API host and from the site's own
// /_api path. Try each in turn before giving up and falling back to RPC.
const EXPLORER_BASES = [
  'https://api.arc-scan.org',
  'https://arc-scan.org/_api',
  'https://arc-scan.io/_api',
];

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  isError: string;
  gas: string;
  gasUsed: string;
}

export interface WalletData {
  address: string;
  transactions: Transaction[];
  txCount: number;
  failedTxCount: number;
  firstTxTimestamp: number | null;
  lastTxTimestamp: number | null;
  totalValueTransferred: string;
  avgTxValue: number;
  walletAgeInDays: number;
  isReal: boolean;
}

function emptyWalletData(address: string): WalletData {
  return {
    address, transactions: [], txCount: 0, failedTxCount: 0,
    firstTxTimestamp: null, lastTxTimestamp: null,
    totalValueTransferred: '0', avgTxValue: 0, walletAgeInDays: 0, isReal: true,
  };
}

async function fetchJson(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<any> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Non-JSON response');
  }
}

function toNumber(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'bigint') return Number(v);
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
    try {
      return Number(ethers.formatEther(v));
    } catch {
      return 0;
    }
  }
  return 0;
}

function pick(raw: any, keys: string[]): unknown {
  for (const k of keys) {
    const v = raw?.[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

// Timestamps may be seconds or milliseconds, and may live under several names.
function parseTimestamp(raw: any): number {
  const v = pick(raw, ['timeStamp', 'timestamp', 'time_stamp', 'blockTimestamp', 'blockTime']);
  if (v === undefined) return 0;
  let n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return 0;
  if (n > 1e12) n = n / 1000; // milliseconds → seconds
  return n > 0 ? Math.floor(n) : 0;
}

// Failure can be encoded as isError, isFailed, failed, status, or success.
function parseFailed(raw: any): boolean {
  const err = pick(raw, ['isError', 'is_error', 'isFailed', 'failed']);
  if (err !== undefined) {
    if (typeof err === 'boolean') return err;
    const s = String(err).toLowerCase();
    if (s === '1' || s === 'true' || s === 'error' || s === 'failed') return true;
    if (s === '0' || s === 'false') return false;
    const n = Number(err);
    if (Number.isFinite(n)) return n !== 0;
  }
  const status = pick(raw, ['status', 'txreceipt_status', 'receipt_status']);
  if (status !== undefined) {
    const s = String(status).toLowerCase();
    if (s === '0' || s === 'false' || s === 'failed') return true;
    if (s === '1' || s === 'true' || s === 'success') return false;
  }
  const success = pick(raw, ['success', 'isSuccess']);
  if (success !== undefined) {
    const s = String(success).toLowerCase();
    if (s === 'false' || s === '0') return true;
  }
  return false;
}

function decimalToWei(s: string): string {
  const neg = s.startsWith('-');
  const body = neg ? s.slice(1) : s;
  const [intPart, fracRaw = ''] = body.split('.');
  const frac = (fracRaw + '0'.repeat(18)).slice(0, 18);
  const wei = BigInt((intPart || '0') + frac);
  return (neg ? -wei : wei).toString();
}

// Normalizes a raw amount into { human: whole USDC, wei: 18-decimal string }.
// Values may already be USDC (e.g. "5.5"), or 18-decimal wei / hex wei.
function parseValue(raw: any): { human: number; wei: string } {
  const v = pick(raw, ['value', 'amount', 'txValue', 'valueWei']);
  if (v === undefined) return { human: 0, wei: '0' };
  if (typeof v === 'bigint') return { human: Number(ethers.formatEther(v)), wei: v.toString() };

  const s = String(v).trim();
  if (s === '') return { human: 0, wei: '0' };

  if (/^0x[0-9a-fA-F]+$/.test(s)) {
    try {
      const b = BigInt(s);
      return { human: Number(ethers.formatEther(b)), wei: b.toString() };
    } catch { return { human: 0, wei: '0' }; }
  }

  if (s.includes('.')) {
    const n = Number(s);
    if (!Number.isFinite(n)) return { human: 0, wei: '0' };
    return { human: n, wei: decimalToWei(s) };
  }

  const n = Number(s);
  if (!Number.isFinite(n)) return { human: 0, wei: '0' };
  if (n >= 1e12) {
    // Large integer → treat as 18-decimal wei.
    try {
      const b = BigInt(s);
      return { human: Number(ethers.formatEther(b)), wei: b.toString() };
    } catch { return { human: n, wei: String(BigInt(Math.round(n))) }; }
  }
  // Already whole USDC.
  return { human: n, wei: (BigInt(s) * BigInt('1000000000000000000')).toString() };
}

function weiToHuman(wei: string): number {
  if (!wei || wei === '0') return 0;
  try { return Number(ethers.formatEther(BigInt(wei))); } catch { return 0; }
}

function formatUsdc(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0';
  return n.toFixed(8).replace(/0+$/, '').replace(/\.$/, '');
}

function normalizeTx(raw: any): Transaction {
  const value = parseValue(raw);
  return {
    hash: String(raw.hash ?? raw.txHash ?? raw.transactionHash ?? ''),
    from: String(raw.from ?? raw.fromAddress ?? ''),
    to: String(raw.to ?? raw.toAddress ?? ''),
    value: value.wei,
    timeStamp: String(parseTimestamp(raw)),
    isError: parseFailed(raw) ? '1' : '0',
    gas: String(raw.gas ?? raw.gasLimit ?? '0'),
    gasUsed: String(raw.gasUsed ?? '0'),
  };
}

function fromTxList(address: string, txs: any[]): WalletData {
  if (txs.length > 0) {
    console.log('[arcApi] raw first tx sample:', JSON.stringify(txs[0]));
  }
  const normalized = txs
    .filter((t) => t && (t.hash || t.txHash || t.transactionHash))
    .map(normalizeTx);
  const timestamps = normalized
    .map((t) => Number(t.timeStamp))
    .filter((n) => Number.isFinite(n) && n > 0);
  const failed = normalized.filter((t) => t.isError === '1').length;
  const values = normalized.map((t) => weiToHuman(t.value));
  const totalValue = values.reduce((a, b) => a + b, 0);
  const now = Math.floor(Date.now() / 1000);
  const first = timestamps.length ? Math.min(...timestamps) : null;
  const last = timestamps.length ? Math.max(...timestamps) : null;
  return {
    address,
    transactions: normalized.slice(0, 50),
    txCount: normalized.length,
    failedTxCount: failed,
    firstTxTimestamp: first,
    lastTxTimestamp: last,
    totalValueTransferred: formatUsdc(totalValue),
    avgTxValue: values.length ? totalValue / values.length : 0,
    walletAgeInDays: first ? Math.max(0, Math.floor((now - first) / 86400)) : 0,
    isReal: true,
  };
}

function fromSummaryPayload(address: string, data: any): WalletData | null {
  const txCount = toNumber(data.txCount ?? data.transactionCount ?? data.tx_count);
  if (!Number.isFinite(txCount)) return null;
  const now = Math.floor(Date.now() / 1000);
  const first = toNumber(data.firstTxTimestamp ?? data.firstTransactionAt ?? data.firstSeen) || null;
  const last = toNumber(data.lastTxTimestamp ?? data.lastTransactionAt ?? data.lastSeen) || null;
  return {
    address,
    transactions: [],
    txCount,
    failedTxCount: toNumber(data.failedTxCount ?? data.failedCount ?? data.failed),
    firstTxTimestamp: first,
    lastTxTimestamp: last,
    totalValueTransferred: String(data.totalValueTransferred ?? data.totalValue ?? '0'),
    avgTxValue: toNumber(data.avgTxValue ?? data.averageValue),
    walletAgeInDays: toNumber(data.walletAgeInDays ?? data.ageDays) ||
      (first ? Math.max(0, Math.floor((now - first) / 86400)) : 0),
    isReal: true,
  };
}

function extractTxArray(payload: any): any[] | null {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    for (const key of ['transactions', 'txs', 'items', 'result', 'data']) {
      const v = payload[key];
      if (Array.isArray(v)) return v;
      if (v && typeof v === 'object' && Array.isArray(v.transactions)) return v.transactions;
      if (v && typeof v === 'object' && Array.isArray(v.txs)) return v.txs;
    }
  }
  return null;
}

// Tries one host: typed REST /v1 first, then the explorer-compatible /api surface.
// Returns null if the host answers but has no transaction data for this address.
async function tryExplorerBase(base: string, address: string): Promise<WalletData | null> {
  let v1Reachable = false;
  try {
    const data = await fetchJson(`${base}/v1/address/${address}/txs?limit=100`, EXPLORER_TIMEOUT_MS);
    v1Reachable = true;
    const txs = extractTxArray(data);
    if (txs && txs.length > 0) return fromTxList(address, txs);
    const inner = data && typeof data === 'object' && data.address && typeof data.address === 'object'
      ? data.address : data;
    const summary = fromSummaryPayload(address, inner);
    if (summary && summary.txCount > 0) return summary;
  } catch (e: any) {
    // Host unreachable / blocked — move on to the next one.
    console.warn(`[arcApi] explorer ${base} /v1 failed: ${e?.message ?? e}`);
  }

  // Only bother with the compatible surface if the host answered the typed one.
  if (v1Reachable) {
    try {
      const data = await fetchJson(
        `${base}/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&page=1&offset=100`,
        EXPLORER_TIMEOUT_MS
      );
      const txs = extractTxArray(data);
      if (txs && txs.length > 0) return fromTxList(address, txs);
    } catch {
      // ignore
    }
  }

  return null;
}

async function fetchFromExplorer(address: string): Promise<WalletData> {
  const errors: string[] = [];
  for (const base of EXPLORER_BASES) {
    try {
      const result = await tryExplorerBase(base, address);
      if (result) return result;
      errors.push(`${base}: no data`);
    } catch (e: any) {
      errors.push(`${base}: ${e?.message ?? e}`);
    }
  }
  throw new Error(errors.join('; ') || 'All explorer hosts failed');
}

// Finds the earliest block in which the account had sent a transaction, using a
// binary search over historical eth_getTransactionCount (works on archive nodes).
async function findFirstActiveBlock(
  provider: ethers.JsonRpcProvider,
  address: string,
  latestBlock: number
): Promise<number | null> {
  let lo = 0;
  let hi = latestBlock;
  let failed = false;

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    let count: number;
    try {
      count = await provider.getTransactionCount(address, mid);
    } catch {
      failed = true;
      break;
    }
    if (count > 0) hi = mid;
    else lo = mid + 1;
  }

  if (failed) return null;
  return lo <= latestBlock ? lo : null;
}

async function fetchFromRpc(address: string): Promise<WalletData> {
  const provider = new ethers.JsonRpcProvider(RPC_URL, 5042, { staticNetwork: true });
  const [nonce, balance, latestBlock] = await Promise.all([
    provider.getTransactionCount(address, 'latest'),
    provider.getBalance(address, 'latest'),
    provider.getBlockNumber(),
  ]);
  const base = emptyWalletData(address);
  if (nonce === 0 && balance === BigInt(0)) return base;

  const now = Math.floor(Date.now() / 1000);
  let firstTxTimestamp: number | null = null;

  // RPC has no per-tx history. If the account has sent transactions (nonce > 0),
  // locate the first one and use its block timestamp for the wallet's age.
  if (nonce > 0) {
    const firstBlock = await findFirstActiveBlock(provider, address, latestBlock);
    if (firstBlock !== null) {
      try {
        const block = await provider.getBlock(firstBlock);
        if (block?.timestamp) firstTxTimestamp = block.timestamp;
      } catch {
        // ignore — fall back to unknown age
      }
    }
  }

  return {
    ...base,
    txCount: nonce,
    firstTxTimestamp,
    lastTxTimestamp: now,
    walletAgeInDays: firstTxTimestamp
      ? Math.max(0, Math.floor((now - firstTxTimestamp) / 86400))
      : 0,
    totalValueTransferred: ethers.formatEther(balance),
    isReal: true,
  };
}

export async function fetchWalletData(address: string): Promise<WalletData> {
  try {
    return await fetchFromExplorer(address);
  } catch {
    try {
      return await fetchFromRpc(address);
    } catch {
      return emptyWalletData(address);
    }
  }
}

export async function fetchTopWallets(): Promise<string[]> {
  return [
    '0x1234567890123456789012345678901234567890',
    '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
    '0xcafebabecafebabecafebabecafebabecafebabe',
  ];
}
