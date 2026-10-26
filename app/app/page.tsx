'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ethers } from 'ethers';
import { ArrowLeft, ArrowsDownUp, CaretDown, CircleNotch, Warning, Wallet } from '@phosphor-icons/react';
import WalletPicker from '@/components/WalletPicker';
import { useWallet } from '@/hooks/useWallet';
import { DetectedWallet } from '@/lib/walletProviders';
import {
  ARC_CHAIN_ID,
  ARC_EXPLORER_URL,
  DEX_TOKENS,
  DexToken,
  ERC20_ABI,
  PERMIT2,
  PERMIT2_ABI,
  SLIPPAGE_OPTIONS_BPS,
  USDC,
  UNIVERSAL_ROUTER,
  buildSwapCall,
  formatAmount,
  friendlySwapError,
  getPool,
  getReadProvider,
  getToken,
  parseAmount,
  quoteExactInput,
} from '@/lib/dexConfig';

type Quote = { amountOut: bigint; tokenIn: DexToken; tokenOut: DexToken; amountIn: bigint };
type TxStatus = 'idle' | 'approving-token' | 'approving-permit2' | 'swapping' | 'success' | 'error';

const PERMIT2_EXPIRY_SECONDS = 60 * 60 * 24 * 30;

function TokenSelect({
  value,
  onChange,
  exclude,
  disabled,
}: {
  value: DexToken;
  onChange: (symbol: string) => void;
  exclude: string;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value.symbol}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label="Select token"
        className="appearance-none rounded-xl border border-white/10 bg-neutral-950 py-2.5 pl-3 pr-9 text-sm font-semibold text-white outline-none transition-colors hover:border-white/25 focus:border-white/40 disabled:opacity-60"
      >
        {DEX_TOKENS.filter((t) => t.symbol === value.symbol || t.symbol !== exclude).map((token) => (
          <option key={token.symbol} value={token.symbol}>
            {token.symbol}
          </option>
        ))}
      </select>
      <CaretDown size={14} weight="bold" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500" />
    </div>
  );
}

export default function DexPage() {
  const { address, isConnected, isConnecting, isCorrectNetwork, connectWith, switchNetwork, provider } = useWallet();

  const [tokenIn, setTokenIn] = useState<DexToken>(USDC);
  const [tokenOut, setTokenOut] = useState<DexToken>(getToken('EURC') ?? DEX_TOKENS[2]);
  const [amount, setAmount] = useState('');
  const [slippageBps, setSlippageBps] = useState<number>(50);

  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [balance, setBalance] = useState<bigint | null>(null);
  const [balanceError, setBalanceError] = useState(false);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  const amountIn = useMemo(() => parseAmount(amount, tokenIn.decimals), [amount, tokenIn.decimals]);
  const pool = useMemo(() => getPool(tokenIn, tokenOut), [tokenIn, tokenOut]);
  const busy = txStatus === 'approving-token' || txStatus === 'approving-permit2' || txStatus === 'swapping';

  // Live quote (debounced)
  useEffect(() => {
    setQuote(null);
    setQuoteError(null);
    if (!amountIn || !pool) {
      setQuoteLoading(false);
      return;
    }
    let cancelled = false;
    setQuoteLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const amountOut = await quoteExactInput(tokenIn, tokenOut, amountIn);
        if (!cancelled) setQuote({ amountOut, tokenIn, tokenOut, amountIn });
      } catch (err) {
        if (!cancelled) setQuoteError(friendlySwapError(err));
      } finally {
        if (!cancelled) setQuoteLoading(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [amountIn, tokenIn, tokenOut, pool]);

  // Input-token balance
  const refreshBalance = useCallback(async () => {
    if (!address) {
      setBalance(null);
      return;
    }
    try {
      const contract = new ethers.Contract(tokenIn.address, ERC20_ABI, getReadProvider());
      const value: bigint = await contract.balanceOf(address);
      setBalance(value);
      setBalanceError(false);
    } catch {
      setBalance(null);
      setBalanceError(true);
    }
  }, [address, tokenIn.address]);

  useEffect(() => {
    setBalance(null);
    setBalanceError(false);
    void refreshBalance();
  }, [refreshBalance]);

  const handlePick = async (wallet: DetectedWallet) => {
    const ok = await connectWith(wallet.provider);
    if (ok) setPickerOpen(false);
  };

  const flipTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmount('');
    setQuote(null);
    setQuoteError(null);
    setTxStatus('idle');
    setTxHash(null);
    setTxError(null);
    setStatusNote(null);
  };

  const changeTokenIn = (symbol: string) => {
    const next = getToken(symbol);
    if (!next) return;
    setTokenIn(next);
    if (next.symbol === tokenOut.symbol) {
      const fallback = DEX_TOKENS.find((t) => t.symbol !== next.symbol);
      if (fallback) setTokenOut(fallback);
    }
    setQuote(null);
    setTxError(null);
    setTxStatus('idle');
  };

  const changeTokenOut = (symbol: string) => {
    const next = getToken(symbol);
    if (!next) return;
    setTokenOut(next);
    setQuote(null);
    setTxError(null);
    setTxStatus('idle');
  };

  const ensureAllowances = async (signer: ethers.Signer, needed: bigint) => {
    if (tokenIn.isGasToken) return;
    const owner = await signer.getAddress();

    const token = new ethers.Contract(tokenIn.address, ERC20_ABI, signer);
    const tokenAllowance: bigint = await token.allowance(owner, PERMIT2);
    if (tokenAllowance < needed) {
      setTxStatus('approving-token');
      setStatusNote(`Approving ${tokenIn.symbol} for Permit2…`);
      const approval = await token.approve(PERMIT2, needed);
      await approval.wait();
    }

    const permit2 = new ethers.Contract(PERMIT2, PERMIT2_ABI, signer);
    const [permitAllowance, expiration] = await permit2.allowance(owner, tokenIn.address, UNIVERSAL_ROUTER);
    const now = Math.floor(Date.now() / 1000);
    if (BigInt(permitAllowance.toString()) < needed || Number(expiration) < now + 60) {
      setTxStatus('approving-permit2');
      setStatusNote('Approving Permit2 for the Uniswap router…');
      const approval = await permit2.approve(
        tokenIn.address,
        UNIVERSAL_ROUTER,
        needed,
        now + PERMIT2_EXPIRY_SECONDS
      );
      await approval.wait();
    }
  };

  const handleSwap = async () => {
    if (!quote || !address || !provider) return;
    setTxStatus('swapping');
    setTxError(null);
    setTxHash(null);
    setStatusNote(null);

    try {
      const browserProvider = new ethers.BrowserProvider(provider);
      const signer = await browserProvider.getSigner();

      await ensureAllowances(signer, quote.amountIn);

      const deadline = Math.floor(Date.now() / 1000) + 20 * 60;
      const call = buildSwapCall({
        tokenIn: quote.tokenIn,
        tokenOut: quote.tokenOut,
        pool: getPool(quote.tokenIn, quote.tokenOut)!,
        amountIn: quote.amountIn,
        amountOut: quote.amountOut,
        slippageBps,
        recipient: address,
        deadline,
      });

      setStatusNote('Confirm the swap in your wallet…');
      const tx = await signer.sendTransaction({ to: call.to, data: call.data, value: call.value });
      setTxHash(tx.hash);
      setStatusNote('Waiting for confirmation…');
      await tx.wait();

      setTxStatus('success');
      setStatusNote(null);
      setAmount('');
      setQuote(null);
      void refreshBalance();
    } catch (err) {
      setTxStatus('error');
      setStatusNote(null);
      setTxError(friendlySwapError(err));
    }
  };

  const minReceived = quote ? (quote.amountOut * BigInt(10_000 - slippageBps)) / 10_000n : null;
  const rate =
    quote && quote.amountIn > 0n
      ? formatAmount((quote.amountOut * 10n ** BigInt(quote.tokenIn.decimals)) / quote.amountIn, quote.tokenOut.decimals, 8)
      : null;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-400 transition-colors hover:text-white">
            <ArrowLeft size={16} weight="bold" />
            Terminal
          </Link>
          <span className="text-[17px] font-bold tracking-tight text-white">RepDex Swap</span>
          <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-400">
            <span className={`h-1.5 w-1.5 rounded-full ${isCorrectNetwork ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            Arc mainnet
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-4 py-10 sm:px-6">
        <div className="rounded-3xl border border-white/10 bg-neutral-900/70 p-5 shadow-2xl shadow-black/40 backdrop-blur sm:p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold tracking-tight">Swap on Uniswap v4</h1>
            <select
              value={slippageBps}
              onChange={(e) => setSlippageBps(Number(e.target.value))}
              aria-label="Slippage tolerance"
              className="rounded-lg border border-white/10 bg-neutral-950 px-2 py-1 text-xs text-neutral-300 outline-none hover:border-white/25"
            >
              {SLIPPAGE_OPTIONS_BPS.map((bps) => (
                <option key={bps} value={bps}>
                  {(bps / 100).toFixed(bps % 100 === 0 ? 0 : 1)}% slippage
                </option>
              ))}
            </select>
          </div>

          {/* Token in */}
          <div className="mt-5 rounded-2xl border border-white/10 bg-neutral-950/80 p-4">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>You pay</span>
              {address && (
                <button onClick={() => void refreshBalance()} className="hover:text-neutral-300" type="button">
                  {balanceError
                    ? 'Balance unavailable'
                    : balance === null
                      ? 'Balance —'
                      : `Balance ${formatAmount(balance, tokenIn.decimals, 4)}`}
                </button>
              )}
            </div>
            <div className="mt-2 flex items-center gap-3">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                placeholder="0.0"
                aria-label="Amount to swap"
                className="min-w-0 flex-1 bg-transparent font-mono text-2xl text-white outline-none placeholder:text-neutral-700"
              />
              <TokenSelect value={tokenIn} onChange={changeTokenIn} exclude={tokenOut.symbol} disabled={busy} />
            </div>
          </div>

          <div className="relative z-10 -my-2 flex justify-center">
            <button
              onClick={flipTokens}
              type="button"
              aria-label="Flip tokens"
              disabled={busy}
              className="rounded-xl border border-white/10 bg-neutral-900 p-2 text-neutral-400 transition-colors hover:border-white/25 hover:text-white disabled:opacity-50"
            >
              <ArrowsDownUp size={16} weight="bold" />
            </button>
          </div>

          {/* Token out */}
          <div className="rounded-2xl border border-white/10 bg-neutral-950/80 p-4">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>You receive</span>
              <span>Uniswap v4 quote</span>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div className="min-w-0 flex-1 truncate font-mono text-2xl text-neutral-200">
                {quoteLoading ? (
                  <span className="inline-flex items-center gap-2 text-base text-neutral-500">
                    <CircleNotch size={16} weight="bold" className="animate-spin" /> Quoting…
                  </span>
                ) : quote ? (
                  formatAmount(quote.amountOut, quote.tokenOut.decimals, 8)
                ) : (
                  <span className="text-neutral-700">0.0</span>
                )}
              </div>
              <TokenSelect value={tokenOut} onChange={changeTokenOut} exclude={tokenIn.symbol} disabled={busy} />
            </div>
          </div>

          {!pool && (
            <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-xs leading-relaxed text-amber-200/90">
              <Warning size={14} weight="bold" className="mt-0.5 shrink-0" />
              No direct Uniswap v4 pool for {tokenIn.symbol}/{tokenOut.symbol} on Arc. Try USDC ↔ WETH or USDC ↔ EURC.
            </p>
          )}

          {quoteError && !quoteLoading && (
            <p className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-xs leading-relaxed text-red-300">
              <Warning size={14} weight="bold" className="mt-0.5 shrink-0" />
              {quoteError}
            </p>
          )}

          {quote && (
            <dl className="mt-4 space-y-1.5 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-3 text-xs text-neutral-400">
              <div className="flex items-center justify-between">
                <dt>Rate</dt>
                <dd className="font-mono text-neutral-200">
                  1 {tokenIn.symbol} = {rate} {tokenOut.symbol}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Minimum received</dt>
                <dd className="font-mono text-neutral-200">
                  {minReceived !== null ? formatAmount(minReceived, tokenOut.decimals, 8) : '—'} {tokenOut.symbol}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Route</dt>
                <dd className="text-neutral-300">
                  {tokenIn.symbol} → {tokenOut.symbol} · v4 {(pool!.fee / 10_000).toFixed(2)}% fee
                </dd>
              </div>
            </dl>
          )}

          {/* Primary action */}
          <div className="mt-5">
            {!isConnected ? (
              <button
                onClick={() => setPickerOpen(true)}
                disabled={isConnecting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-neutral-950 transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {isConnecting ? (
                  <>
                    <CircleNotch size={16} weight="bold" className="animate-spin" /> Connecting…
                  </>
                ) : (
                  <>
                    <Wallet size={16} weight="bold" /> Connect wallet
                  </>
                )}
              </button>
            ) : !isCorrectNetwork ? (
              <button
                onClick={() => void switchNetwork()}
                className="w-full rounded-xl bg-amber-400 px-4 py-3 text-sm font-semibold text-neutral-950 transition-opacity hover:opacity-90"
              >
                Switch to Arc mainnet ({ARC_CHAIN_ID})
              </button>
            ) : (
              <button
                onClick={() => void handleSwap()}
                disabled={!quote || busy || Boolean(quoteError) || !amountIn}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-neutral-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? (
                  <>
                    <CircleNotch size={16} weight="bold" className="animate-spin" />
                    {txStatus === 'approving-token'
                      ? `Approving ${tokenIn.symbol}…`
                      : txStatus === 'approving-permit2'
                        ? 'Approving Permit2…'
                        : 'Swapping…'}
                  </>
                ) : quoteLoading ? (
                  'Getting quote…'
                ) : !amountIn ? (
                  'Enter an amount'
                ) : !pool ? (
                  'No route'
                ) : (
                  `Swap ${tokenIn.symbol} for ${tokenOut.symbol}`
                )}
              </button>
            )}

            {statusNote && <p className="mt-2 text-center text-xs text-neutral-400">{statusNote}</p>}
            {txError && (
              <p className="mt-2 flex items-start justify-center gap-1.5 text-center text-xs leading-relaxed text-red-300">
                <Warning size={13} weight="bold" className="mt-0.5 shrink-0" />
                {txError}
              </p>
            )}
            {txStatus === 'success' && txHash && (
              <p className="mt-2 text-center text-xs text-emerald-300">
                Swap confirmed ·{' '}
                <a
                  href={`${ARC_EXPLORER_URL}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-emerald-200"
                >
                  view transaction
                </a>
              </p>
            )}
          </div>

          {isConnected && address && (
            <p className="mt-4 border-t border-white/5 pt-3 text-center font-mono text-[11px] text-neutral-500">
              {address.slice(0, 6)}…{address.slice(-4)} · chain {ARC_CHAIN_ID}
            </p>
          )}
        </div>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-neutral-500">
          Swaps route through the Uniswap Universal Router and v4 pools already deployed on Arc mainnet. No new
          contracts. Quotes come from the on-chain V4Quoter.
        </p>
      </main>

      <WalletPicker
        open={pickerOpen}
        connecting={isConnecting}
        onClose={() => setPickerOpen(false)}
        onPick={handlePick}
      />
    </div>
  );
}
