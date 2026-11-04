'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowsDownUp,
  CaretDown,
  CheckCircle,
  CircleNotch,
  GearSix,
  Warning,
} from '@phosphor-icons/react';
import { RefreshCw, Wallet } from 'lucide-react';
import {
  useAccount,
  usePublicClient,
  useSendTransaction,
  useSwitchChain,
  useWalletClient,
} from 'wagmi';
import { arcTestnet } from '@/lib/appChain';
import {
  ARC_EXPLORER_URL,
  CONTRACTS_READY,
  EURC,
  PERMIT2,
  SLIPPAGE_OPTIONS_BPS,
  UNIVERSAL_ROUTER,
  USDC,
  buildSwapCall,
  formatAmount,
  friendlySwapError,
  getPool,
  isTokenDeployed,
  parseAmount,
  quoteExactInput,
  type DexToken,
} from '@/lib/dexConfig.testnet';
import { FlowHoverButton } from '@/components/ui/flow-hover-button';
import { ERC20_ABI, PERMIT2_ABI } from './lib/abis';
import {
  BRIDGE_CHAINS,
  DEFAULT_NON_ARC_CHAIN_ID,
  bridgeUsdc,
  getBridgeChain,
  nextBridgePair,
} from './lib/bridgeChains';
import { fiatValue } from './lib/format';
import { SelectTokenModal, type TokenPickerMode } from './components/SelectTokenModal';
import { TokenIcon } from './components/TokenIcon';
import { useDexTokens } from './hooks/useDexTokens';
import { useConnectButtonState } from './hooks/useConnectButtonState';

type Quote = { amountOut: bigint; tokenIn: DexToken; tokenOut: DexToken; amountIn: bigint };
type TxStatus = 'idle' | 'approving-token' | 'approving-permit2' | 'swapping' | 'success' | 'error';
export type DexTab = 'swap' | 'bridge' | 'liquidity';
type PickerTarget = 'sell' | 'buy' | 'bridge-from' | 'bridge-to' | 'lp-token1' | 'lp-token2';

const PERMIT2_EXPIRY_SECONDS = 60 * 60 * 24 * 30;
const FAUCET_URL = 'https://faucet.circle.com';

function TokenPill({
  token,
  emptyLabel,
  ariaLabel,
  onClick,
  disabled,
}: {
  token: DexToken | null;
  emptyLabel: string;
  ariaLabel: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  const chain = token ? getBridgeChain(token.chainId) : null;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-haspopup="dialog"
      className={`app-token-pill ${token ? '' : 'app-token-pill-accent'}`}
    >
      {token ? (
        <>
          <TokenIcon
            symbol={token.symbol}
            glyph={token.icon}
            logo={token.logo}
            chain={chain}
            size={28}
          />
          <span className="min-w-0 text-left">
            <span className="flex items-center gap-1 text-base font-semibold leading-tight text-white">
              <span className="truncate">{token.symbol}</span>
              {token.verified && (
                <CheckCircle
                  size={12}
                  weight="fill"
                  className="shrink-0 text-[var(--app-accent)]"
                  aria-label="Verified"
                />
              )}
            </span>
            <span className="block truncate text-xs leading-tight text-neutral-500">
              {token.chainName ?? 'Arc Testnet'}
            </span>
          </span>
        </>
      ) : (
        <span className="whitespace-nowrap text-sm font-semibold">{emptyLabel}</span>
      )}
      <CaretDown
        size={14}
        weight="bold"
        className={token ? 'shrink-0 text-neutral-500' : 'shrink-0 text-black/60'}
        aria-hidden="true"
      />
    </button>
  );
}

function AssetBox({
  label,
  topRight,
  token,
  emptyLabel,
  ariaLabel,
  onPickToken,
  pickerDisabled,
  fiat,
  children,
}: {
  label: string;
  topRight?: React.ReactNode;
  token: DexToken | null;
  emptyLabel: string;
  ariaLabel: string;
  onPickToken: () => void;
  pickerDisabled?: boolean;
  fiat: string;
  children: React.ReactNode;
}) {
  return (
    <div className="app-swap-box">
      <div className="flex min-h-5 items-center justify-between gap-3 text-[13px] text-neutral-500">
        <span className="shrink-0">{label}</span>
        {topRight}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          {children}
          <p className="mt-1 text-[13px] text-neutral-500">{fiat}</p>
        </div>
        <TokenPill
          token={token}
          emptyLabel={emptyLabel}
          ariaLabel={ariaLabel}
          onClick={onPickToken}
          disabled={pickerDisabled}
        />
      </div>
    </div>
  );
}

function SettingsPopover({
  slippageBps,
  onChange,
}: {
  slippageBps: number;
  onChange: (bps: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="app-btn-icon rounded-full"
        aria-label="Swap settings"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <GearSix size={17} weight="bold" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Swap settings"
          className="absolute right-0 top-full z-40 mt-2 w-64 rounded-xl border border-white/10 bg-neutral-900/95 p-4 shadow-2xl backdrop-blur app-glass-popover"
        >
          <div className="text-sm font-semibold text-white">Slippage tolerance</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {SLIPPAGE_OPTIONS_BPS.map((bps) => {
              const active = slippageBps === bps && custom === '';
              return (
                <button
                  key={bps}
                  type="button"
                  onClick={() => {
                    onChange(bps);
                    setCustom('');
                  }}
                  aria-pressed={active}
                  className={`app-btn-compact px-2.5 py-1 text-xs ${
                    active ? 'border-white/30 bg-white/10' : ''
                  }`}
                >
                  {(bps / 100).toFixed(bps % 100 === 0 ? 0 : 1)}%
                </button>
              );
            })}
            <label className="relative">
              <span className="sr-only">Custom slippage tolerance</span>
              <input
                value={custom}
                onChange={(event) => {
                  const value = event.target.value.replace(/[^0-9.]/g, '');
                  setCustom(value);
                  const parsed = parseFloat(value);
                  if (!Number.isNaN(parsed) && parsed >= 0) onChange(Math.round(parsed * 100));
                }}
                inputMode="decimal"
                placeholder="Custom"
                className="w-20 rounded-lg border border-white/10 bg-neutral-950 px-2 py-1 pr-5 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-white/25"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-neutral-500">
                %
              </span>
            </label>
          </div>
          <p className="mt-2 text-[11px] text-neutral-500">
            {(slippageBps / 100).toFixed(2)}% applied to minimum received
          </p>
        </div>
      )}
    </div>
  );
}

export function DexView({ tab, initialBuy }: { tab: DexTab; initialBuy?: string }) {
  const { address, isConnected, chainId } = useAccount();
  const isCorrectNetwork = chainId === arcTestnet.id;
  const { isConnectPending, openConnect } = useConnectButtonState();
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { sendTransactionAsync } = useSendTransaction();
  const allTokens = useDexTokens(publicClient);

  const [tokenIn, setTokenIn] = useState<DexToken | null>(USDC);
  const [tokenOut, setTokenOut] = useState<DexToken | null>(EURC);
  const [amount, setAmount] = useState('');
  const [slippageBps, setSlippageBps] = useState<number>(50);

  const [bridgeFromChainId, setBridgeFromChainId] = useState<number>(DEFAULT_NON_ARC_CHAIN_ID);
  const [bridgeToChainId, setBridgeToChainId] = useState<number>(arcTestnet.id);
  const bridgeFrom = useMemo(() => bridgeUsdc(getBridgeChain(bridgeFromChainId)), [bridgeFromChainId]);
  const bridgeTo = useMemo(() => bridgeUsdc(getBridgeChain(bridgeToChainId)), [bridgeToChainId]);
  const [lpToken1, setLpToken1] = useState<DexToken | null>(USDC);
  const [lpToken2, setLpToken2] = useState<DexToken | null>(EURC);

  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);

  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [balance, setBalance] = useState<bigint | null>(null);
  const [balanceError, setBalanceError] = useState(false);
  const [approvalNeeded, setApprovalNeeded] = useState(false);
  const [approvalCheck, setApprovalCheck] = useState(0);

  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const amountIn = useMemo(
    () => (tokenIn ? parseAmount(amount, tokenIn.decimals) : null),
    [amount, tokenIn]
  );
  const pool = useMemo(
    () => (tokenIn && tokenOut ? getPool(tokenIn, tokenOut) : undefined),
    [tokenIn, tokenOut]
  );
  const noLiquidity = Boolean(tokenIn && tokenOut && !pool);
  const busy =
    txStatus === 'approving-token' || txStatus === 'approving-permit2' || txStatus === 'swapping';

  const resetTx = useCallback(() => {
    setQuote(null);
    setQuoteError(null);
    setTxStatus('idle');
    setTxHash(null);
    setTxError(null);
    setStatusNote(null);
  }, []);

  // Quote for the active pair.
  useEffect(() => {
    setQuote(null);
    setQuoteError(null);
    if (!CONTRACTS_READY || !amountIn || !pool || !tokenIn || !tokenOut) {
      setQuoteLoading(false);
      return;
    }
    let cancelled = false;
    setQuoteLoading(true);
    const timer = window.setTimeout(() => {
      quoteExactInput(tokenIn, tokenOut, amountIn)
        .then((amountOut) => {
          if (!cancelled) setQuote({ amountOut, tokenIn, tokenOut, amountIn });
        })
        .catch((err) => {
          if (!cancelled) setQuoteError(friendlySwapError(err));
        })
        .finally(() => {
          if (!cancelled) setQuoteLoading(false);
        });
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [amountIn, tokenIn, tokenOut, pool]);

  const refreshBalance = useCallback(async () => {
    if (!address || !publicClient || !tokenIn || !isTokenDeployed(tokenIn)) {
      setBalance(null);
      setBalanceError(false);
      return;
    }
    try {
      const value = await publicClient.readContract({
        address: tokenIn.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address],
      });
      setBalance(value);
      setBalanceError(false);
    } catch {
      setBalance(null);
      setBalanceError(true);
    }
  }, [address, publicClient, tokenIn]);

  useEffect(() => {
    setBalance(null);
    setBalanceError(false);
    void refreshBalance();
  }, [refreshBalance]);

  // Detect whether the sell token still needs ERC-20 / Permit2 approvals.
  useEffect(() => {
    let cancelled = false;
    if (
      !tokenIn ||
      !amountIn ||
      tokenIn.isGasToken ||
      !CONTRACTS_READY ||
      !address ||
      !publicClient ||
      !isCorrectNetwork ||
      !isTokenDeployed(tokenIn)
    ) {
      setApprovalNeeded(false);
      return;
    }
    void (async () => {
      try {
        const tokenAllowance = await publicClient.readContract({
          address: tokenIn.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [address, PERMIT2 as `0x${string}`],
        });
        if (cancelled) return;
        if (tokenAllowance < amountIn) {
          setApprovalNeeded(true);
          return;
        }
        const [permitAllowance, expiration] = await publicClient.readContract({
          address: PERMIT2 as `0x${string}`,
          abi: PERMIT2_ABI,
          functionName: 'allowance',
          args: [address, tokenIn.address as `0x${string}`, UNIVERSAL_ROUTER as `0x${string}`],
        });
        if (cancelled) return;
        const now = Math.floor(Date.now() / 1000);
        setApprovalNeeded(BigInt(permitAllowance) < amountIn || Number(expiration) < now + 60);
      } catch {
        if (!cancelled) setApprovalNeeded(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tokenIn, amountIn, address, publicClient, isCorrectNetwork, approvalCheck]);

  const setBuyToken = useCallback(
    (token: DexToken) => {
      setTokenOut(token);
      setTokenIn((previous) =>
        previous && previous.address.toLowerCase() === token.address.toLowerCase() ? null : previous
      );
      setAmount('');
      resetTx();
    },
    [resetTx]
  );

  // Deep link from the header token search: /swap?buy=0x...
  const appliedBuyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!initialBuy) return;
    const wanted = initialBuy.toLowerCase();
    if (!/^0x[0-9a-f]{40}$/.test(wanted)) return;
    if (appliedBuyRef.current === wanted) return;
    const token = allTokens.find((item) => item.address.toLowerCase() === wanted);
    if (!token) return;
    appliedBuyRef.current = wanted;
    setBuyToken(token);
  }, [initialBuy, allTokens, setBuyToken]);

  const setSellToken = useCallback(
    (token: DexToken) => {
      setTokenIn(token);
      setTokenOut((previous) =>
        previous && previous.address.toLowerCase() === token.address.toLowerCase() ? null : previous
      );
      setAmount('');
      resetTx();
    },
    [resetTx]
  );

  const selectBridgeChain = useCallback(
    (side: 'from' | 'to', chainId: number) => {
      const [nextFrom, nextTo] = nextBridgePair(side, chainId, bridgeFromChainId, bridgeToChainId);
      setBridgeFromChainId(nextFrom);
      setBridgeToChainId(nextTo);
    },
    [bridgeFromChainId, bridgeToChainId]
  );

  const routeToken = useCallback(
    (token: DexToken, target: PickerTarget) => {
      if (target === 'sell') {
        setSellToken(token);
        return;
      }
      if (target === 'buy') {
        setBuyToken(token);
        return;
      }
      if (target === 'bridge-from') {
        selectBridgeChain('from', token.chainId ?? arcTestnet.id);
        return;
      }
      if (target === 'bridge-to') {
        selectBridgeChain('to', token.chainId ?? arcTestnet.id);
        return;
      }
      if (target === 'lp-token1') {
        setLpToken1(token);
        setLpToken2((previous) =>
          previous && previous.address.toLowerCase() === token.address.toLowerCase() ? null : previous
        );
        return;
      }
      setLpToken2(token);
      setLpToken1((previous) =>
        previous && previous.address.toLowerCase() === token.address.toLowerCase() ? null : previous
      );
    },
    [setBuyToken, setSellToken, selectBridgeChain]
  );

  const handleSelect = (token: DexToken) => {
    if (!pickerTarget) return;
    const target = pickerTarget;
    setPickerTarget(null);
    routeToken(token, target);
  };

  const flipTokens = () => {
    const nextIn = tokenOut;
    const nextOut = tokenIn;
    setTokenIn(nextIn);
    setTokenOut(nextOut);
    setAmount('');
    resetTx();
  };

  const flipBridgeChains = () => {
    setBridgeFromChainId(bridgeToChainId);
    setBridgeToChainId(bridgeFromChainId);
  };

  const ensureAllowances = async (needed: bigint) => {
    if (!tokenIn) throw new Error('NO_TOKEN');
    if (tokenIn.isGasToken) return;
    if (!walletClient || !publicClient || !address) throw new Error('Wallet not ready');

    const tokenAllowance = await publicClient.readContract({
      address: tokenIn.address as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [address, PERMIT2 as `0x${string}`],
    });

    if (tokenAllowance < needed) {
      setTxStatus('approving-token');
      setStatusNote(`Approving ${tokenIn.symbol} for Permit2...`);
      const hash = await walletClient.writeContract({
        address: tokenIn.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [PERMIT2 as `0x${string}`, needed],
      });
      await publicClient.waitForTransactionReceipt({ hash });
    }

    const [permitAllowance, expiration] = await publicClient.readContract({
      address: PERMIT2 as `0x${string}`,
      abi: PERMIT2_ABI,
      functionName: 'allowance',
      args: [address, tokenIn.address as `0x${string}`, UNIVERSAL_ROUTER as `0x${string}`],
    });

    const now = Math.floor(Date.now() / 1000);
    if (BigInt(permitAllowance) < needed || Number(expiration) < now + 60) {
      setTxStatus('approving-permit2');
      setStatusNote('Approving Permit2 for the Uniswap router...');
      const hash = await walletClient.writeContract({
        address: PERMIT2 as `0x${string}`,
        abi: PERMIT2_ABI,
        functionName: 'approve',
        args: [
          tokenIn.address as `0x${string}`,
          UNIVERSAL_ROUTER as `0x${string}`,
          needed,
          now + PERMIT2_EXPIRY_SECONDS,
        ],
      });
      await publicClient.waitForTransactionReceipt({ hash });
    }
  };

  const handleApprove = async () => {
    if (!amountIn) return;
    setTxStatus('idle');
    setTxError(null);
    setTxHash(null);
    setStatusNote(null);
    try {
      await ensureAllowances(amountIn);
      setApprovalNeeded(false);
      setApprovalCheck((value) => value + 1);
      setTxStatus('idle');
      setStatusNote('Approval complete. You can swap now.');
    } catch (err) {
      setTxStatus('error');
      setStatusNote(null);
      setTxError(friendlySwapError(err));
    }
  };

  const handleSwap = async () => {
    if (!CONTRACTS_READY) return;
    if (!quote || !address || !walletClient || !publicClient) return;
    setTxStatus('swapping');
    setTxError(null);
    setTxHash(null);
    setStatusNote(null);
    try {
      await ensureAllowances(quote.amountIn);
      const deadline = Math.floor(Date.now() / 1000) + 20 * 60;
      const activePool = getPool(quote.tokenIn, quote.tokenOut);
      if (!activePool) throw new Error('NO_ROUTE');
      const call = buildSwapCall({
        tokenIn: quote.tokenIn,
        tokenOut: quote.tokenOut,
        pool: activePool,
        amountIn: quote.amountIn,
        amountOut: quote.amountOut,
        slippageBps,
        recipient: address,
        deadline,
      });
      setTxStatus('swapping');
      setStatusNote('Confirm the swap in your wallet...');
      const hash = await sendTransactionAsync({
        to: call.to as `0x${string}`,
        data: call.data as `0x${string}`,
        value: call.value,
      });
      setTxHash(hash);
      setStatusNote('Waiting for confirmation...');
      await publicClient.waitForTransactionReceipt({ hash });
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
      ? formatAmount(
          (quote.amountOut * 10n ** BigInt(quote.tokenIn.decimals)) / quote.amountIn,
          quote.tokenOut.decimals,
          8
        )
      : null;
  const insufficientBalance = balance !== null && amountIn !== null && balance < amountIn;

  const walletFlowState = !isConnected ? 'connect' : !isCorrectNetwork ? 'switch' : null;
  const walletFlowLoading =
    walletFlowState === 'connect' ? isConnectPending : walletFlowState === 'switch' ? isSwitchingChain : false;
  const walletFlowLabel =
    walletFlowState === 'connect'
      ? isConnectPending
        ? 'Connecting...'
        : 'Connect wallet'
      : walletFlowState === 'switch'
        ? isSwitchingChain
          ? 'Switching...'
          : 'Switch to Arc Testnet'
        : null;
  const walletFlowIcon =
    walletFlowState === 'connect' ? (
      <Wallet size={16} aria-hidden="true" />
    ) : walletFlowState === 'switch' ? (
      <RefreshCw size={16} aria-hidden="true" />
    ) : null;

  let actionLabel = 'Swap';
  let actionDisabled = false;
  let actionBusy = false;
  let actionHandler: (() => void) | null = null;

  if (!isConnected) {
    actionLabel = 'Connect wallet';
    actionHandler = openConnect;
  } else if (!isCorrectNetwork) {
    actionLabel = 'Switch to Arc Testnet';
    actionHandler = () => {
      void switchChainAsync({ chainId: arcTestnet.id });
    };
  } else if (!tokenIn || !tokenOut) {
    actionLabel = 'Select a token';
    actionDisabled = true;
  } else if (noLiquidity) {
    actionLabel = 'No liquidity for this pair yet';
    actionDisabled = true;
  } else if (!CONTRACTS_READY) {
    actionLabel = 'Swap unavailable';
    actionDisabled = true;
  } else if (!amountIn) {
    actionLabel = 'Enter an amount';
    actionDisabled = true;
  } else if (busy) {
    actionBusy = true;
    actionDisabled = true;
    actionLabel =
      txStatus === 'approving-token'
        ? `Approving ${tokenIn.symbol}...`
        : txStatus === 'approving-permit2'
          ? 'Approving Permit2...'
          : 'Confirm in wallet...';
  } else if (quoteLoading) {
    actionBusy = true;
    actionDisabled = true;
    actionLabel = 'Getting quote...';
  } else if (insufficientBalance) {
    actionLabel = 'Insufficient balance';
    actionDisabled = true;
  } else if (quoteError) {
    actionLabel = 'Swap unavailable';
    actionDisabled = true;
  } else if (approvalNeeded) {
    actionLabel = `Approve ${tokenIn.symbol}`;
    actionHandler = () => {
      void handleApprove();
    };
  } else if (!quote) {
    actionBusy = true;
    actionDisabled = true;
    actionLabel = 'Getting quote...';
  } else {
    actionLabel = 'Swap';
    actionHandler = () => {
      void handleSwap();
    };
  }

  const pickerMode: TokenPickerMode =
    pickerTarget === 'bridge-from' || pickerTarget === 'bridge-to'
      ? 'bridge'
      : pickerTarget === 'lp-token1' || pickerTarget === 'lp-token2'
        ? 'liquidity'
        : 'swap';
  const bridgeSide: 'from' | 'to' | null =
    pickerTarget === 'bridge-from' ? 'from' : pickerTarget === 'bridge-to' ? 'to' : null;
  const bridgePickerChainId =
    bridgeSide === 'from' ? bridgeFromChainId : bridgeSide === 'to' ? bridgeToChainId : null;
  const pickerTokens =
    pickerMode === 'bridge' && bridgePickerChainId !== null
      ? [bridgeUsdc(getBridgeChain(bridgePickerChainId))]
      : allTokens;
  const pickerSelected =
    pickerTarget === 'sell'
      ? tokenIn
      : pickerTarget === 'buy'
        ? tokenOut
        : pickerTarget === 'bridge-from'
          ? bridgeFrom
          : pickerTarget === 'bridge-to'
            ? bridgeTo
            : pickerTarget === 'lp-token1'
              ? lpToken1
              : pickerTarget === 'lp-token2'
                ? lpToken2
                : null;
  const pickerInUse =
    pickerTarget === 'sell'
      ? tokenOut
      : pickerTarget === 'buy'
        ? tokenIn
        : pickerTarget === 'lp-token1'
          ? lpToken2
          : pickerTarget === 'lp-token2'
            ? lpToken1
            : null;

  return (
    <>
      <main className="px-2 pb-4 pt-3 sm:px-4">
        <div className="app-main-panel mx-auto min-h-[calc(100vh-6.75rem)] px-3 py-8 sm:px-6 sm:py-10">
          {tab === 'swap' && (
            <div className="app-card-column mx-auto w-full">
              <div className="mb-2 flex justify-end">
                <SettingsPopover slippageBps={slippageBps} onChange={setSlippageBps} />
              </div>

              <section className="app-swap-card" aria-label="Swap">
                <div className="relative">
                  <AssetBox
                    label="Sell"
                    token={tokenIn}
                    emptyLabel="Select token"
                    ariaLabel={tokenIn ? 'Change sell token' : 'Select sell token'}
                    onPickToken={() => setPickerTarget('sell')}
                    pickerDisabled={busy}
                    fiat={fiatValue(tokenIn, amountIn)}
                    topRight={
                      isConnected && address && tokenIn && isTokenDeployed(tokenIn) ? (
                        <span className="flex min-w-0 items-center justify-end gap-2 whitespace-nowrap">
                          <span className="truncate">
                            {balanceError
                              ? 'Balance unavailable'
                              : balance === null
                                ? 'Balance —'
                                : `Balance ${formatAmount(balance, tokenIn.decimals, 4)}`}
                          </span>
                          {balance !== null && balance > 0n && (
                            <button
                              type="button"
                              onClick={() =>
                                setAmount(formatAmount(balance, tokenIn.decimals, Math.min(tokenIn.decimals, 8)))
                              }
                              className="shrink-0 text-xs font-semibold text-[var(--app-accent)] hover:opacity-80"
                            >
                              MAX
                            </button>
                          )}
                        </span>
                      ) : null
                    }
                  >
                    <input
                      value={amount}
                      onChange={(event) => {
                        setAmount(event.target.value);
                        setTxStatus('idle');
                        setTxError(null);
                        setStatusNote(null);
                      }}
                      disabled={!tokenIn || busy}
                      inputMode="decimal"
                      placeholder="0.0"
                      aria-label="Amount to sell"
                      className="app-amount-input"
                    />
                  </AssetBox>

                  <div className="app-flip-row relative z-10 flex justify-center">
                    <button
                      type="button"
                      onClick={flipTokens}
                      aria-label="Flip tokens"
                      disabled={busy}
                      className="app-flip-btn"
                    >
                      <ArrowsDownUp size={16} weight="bold" aria-hidden="true" />
                    </button>
                  </div>

                  <AssetBox
                    label="Buy"
                    token={tokenOut}
                    emptyLabel="Select token"
                    ariaLabel={tokenOut ? 'Change buy token' : 'Select buy token'}
                    onPickToken={() => setPickerTarget('buy')}
                    pickerDisabled={busy}
                    fiat={fiatValue(tokenOut, quote?.amountOut ?? null)}
                  >
                    <div className="app-amount-display" aria-live="polite">
                      {noLiquidity ? (
                        <span className="text-sm text-neutral-400">
                          No liquidity for this pair yet
                        </span>
                      ) : !tokenOut ? (
                        <span className="text-neutral-700">0.0</span>
                      ) : quoteLoading ? (
                        <span className="inline-flex items-center gap-2 text-base text-neutral-500">
                          <CircleNotch size={16} weight="bold" className="animate-spin" aria-hidden="true" />
                          Quoting...
                        </span>
                      ) : quote ? (
                        formatAmount(quote.amountOut, quote.tokenOut.decimals, 8)
                      ) : (
                        <span className="text-neutral-700">0.0</span>
                      )}
                    </div>
                  </AssetBox>
                </div>

                <div className="mt-5">
                  {walletFlowState ? (
                    <FlowHoverButton
                      type="button"
                      onClick={actionHandler ?? undefined}
                      fullWidth
                      icon={walletFlowIcon}
                      loading={walletFlowLoading}
                      aria-label={walletFlowLabel ?? undefined}
                    >
                      {walletFlowLabel}
                    </FlowHoverButton>
                  ) : (
                    <button
                      type="button"
                      onClick={actionHandler ?? undefined}
                      disabled={actionDisabled}
                      className="app-btn w-full"
                    >
                      {actionBusy && (
                        <CircleNotch size={16} weight="bold" className="animate-spin" aria-hidden="true" />
                      )}
                      {actionLabel}
                    </button>
                  )}

                  {!CONTRACTS_READY && (
                    <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-amber-200/90">
                      <Warning size={14} weight="bold" className="mt-0.5 shrink-0" aria-hidden="true" />
                      Uniswap v4 contracts are not configured for Arc Testnet yet.
                    </p>
                  )}

                  {quoteError && !quoteLoading && !noLiquidity && CONTRACTS_READY && (
                    <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-red-300">
                      <Warning size={14} weight="bold" className="mt-0.5 shrink-0" aria-hidden="true" />
                      {quoteError}
                    </p>
                  )}

                  {statusNote && <p className="mt-2 text-center text-xs text-neutral-400">{statusNote}</p>}

                  {txError && (
                    <p className="mt-2 flex items-start justify-center gap-1.5 text-center text-xs leading-relaxed text-red-300">
                      <Warning size={13} weight="bold" className="mt-0.5 shrink-0" aria-hidden="true" />
                      {txError}
                    </p>
                  )}

                  {txStatus === 'success' && txHash && (
                    <p className="mt-2 text-center text-xs text-[var(--app-accent)]">
                      Swap confirmed ·{' '}
                      <a
                        href={`${ARC_EXPLORER_URL}/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 hover:opacity-80"
                      >
                        view transaction
                      </a>
                    </p>
                  )}
                </div>

                {quote && CONTRACTS_READY && (
                  <div className="mt-4 border-t border-white/5 pt-3">
                    <button
                      type="button"
                      onClick={() => setDetailsOpen((value) => !value)}
                      aria-expanded={detailsOpen}
                      className="flex w-full items-center justify-between gap-2 rounded-md px-1 py-1 text-xs text-neutral-400 transition-colors hover:text-neutral-200"
                    >
                      <span>Rate, price impact, minimum received, network fee</span>
                      <CaretDown
                        size={14}
                        weight="bold"
                        className={`shrink-0 transition-transform ${detailsOpen ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                      />
                    </button>
                    {detailsOpen && (
                      <dl className="mt-2 space-y-1.5 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-3 text-xs text-neutral-400">
                        <div className="flex items-center justify-between gap-3">
                          <dt>Rate</dt>
                          <dd className="text-right font-mono text-neutral-200">
                            1 {quote.tokenIn.symbol} = {rate} {quote.tokenOut.symbol}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <dt>Price impact</dt>
                          <dd className="text-neutral-300">-</dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <dt>Minimum received</dt>
                          <dd className="text-right font-mono text-neutral-200">
                            {minReceived !== null
                              ? formatAmount(minReceived, quote.tokenOut.decimals, 8)
                              : '—'}{' '}
                            {quote.tokenOut.symbol}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <dt>Network fee</dt>
                          <dd className="text-neutral-300">-</dd>
                        </div>
                      </dl>
                    )}
                  </div>
                )}
              </section>

              <div className="app-testnet-strip">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--app-accent)]" aria-hidden="true" />
                  Arc Testnet · test funds only
                </span>
                <a
                  href={FAUCET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-neutral-300 underline underline-offset-2 transition-colors hover:text-white"
                >
                  Get testnet USDC
                </a>
              </div>
            </div>
          )}

          {tab === 'bridge' && (
            <div className="app-card-column mx-auto w-full">
              <section className="app-swap-card" aria-label="Bridge">
                <div>
                  <AssetBox
                    label="From"
                    token={bridgeFrom}
                    emptyLabel="Select token"
                    ariaLabel="Select source token"
                    onPickToken={() => setPickerTarget('bridge-from')}
                    fiat="-"
                  >
                    <div className="app-amount-display">
                      <span className="text-neutral-700">0.0</span>
                    </div>
                  </AssetBox>

                  <div className="app-flip-row relative z-10 flex justify-center">
                    <button
                      type="button"
                      onClick={flipBridgeChains}
                      aria-label="Flip bridge chains"
                      className="app-flip-btn"
                    >
                      <ArrowsDownUp size={16} weight="bold" aria-hidden="true" />
                    </button>
                  </div>

                  <AssetBox
                    label="To"
                    token={bridgeTo}
                    emptyLabel="Select token"
                    ariaLabel="Select destination token"
                    onPickToken={() => setPickerTarget('bridge-to')}
                    fiat="-"
                  >
                    <div className="app-amount-display">
                      <span className="text-neutral-700">0.0</span>
                    </div>
                  </AssetBox>
                </div>

                <div className="mt-5">
                  {walletFlowState ? (
                    <FlowHoverButton
                      type="button"
                      onClick={
                        walletFlowState === 'connect'
                          ? openConnect
                          : () => void switchChainAsync({ chainId: arcTestnet.id })
                      }
                      fullWidth
                      icon={walletFlowIcon}
                      loading={walletFlowLoading}
                      aria-label={walletFlowLabel ?? undefined}
                    >
                      {walletFlowLabel}
                    </FlowHoverButton>
                  ) : (
                    <button type="button" disabled className="app-btn w-full">
                      Bridging isn&apos;t live yet
                    </button>
                  )}
                  <p className="mt-2 text-center text-xs text-neutral-500">
                    Bridging is a scaffold on Arc Testnet and is not live yet.
                  </p>
                </div>
              </section>

              <div className="app-testnet-strip">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--app-accent)]" aria-hidden="true" />
                  Arc Testnet · test funds only
                </span>
                <a
                  href={FAUCET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-neutral-300 underline underline-offset-2 transition-colors hover:text-white"
                >
                  Get testnet USDC
                </a>
              </div>
            </div>
          )}

          {tab === 'liquidity' && (
            <div className="app-card-column mx-auto w-full">
              <section className="app-swap-card" aria-label="Liquidity">
                <div>
                  <AssetBox
                    label="Token 1"
                    token={lpToken1}
                    emptyLabel="Select token"
                    ariaLabel="Select first liquidity token"
                    onPickToken={() => setPickerTarget('lp-token1')}
                    fiat="-"
                  >
                    <div className="app-amount-display">
                      <span className="text-neutral-700">0.0</span>
                    </div>
                  </AssetBox>

                  <div className="app-flip-row relative z-10 flex justify-center">
                    <button type="button" disabled aria-label="Flip liquidity tokens" className="app-flip-btn">
                      <ArrowsDownUp size={16} weight="bold" aria-hidden="true" />
                    </button>
                  </div>

                  <AssetBox
                    label="Token 2"
                    token={lpToken2}
                    emptyLabel="Select token"
                    ariaLabel="Select second liquidity token"
                    onPickToken={() => setPickerTarget('lp-token2')}
                    fiat="-"
                  >
                    <div className="app-amount-display">
                      <span className="text-neutral-700">0.0</span>
                    </div>
                  </AssetBox>
                </div>

                <div className="mt-4">
                  <div className="text-xs text-neutral-500">Fee tier</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {['0.01%', '0.05%', '0.3%', '1%'].map((fee) => (
                      <button key={fee} type="button" disabled className="app-btn-compact px-3 py-1 text-xs">
                        {fee}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5">
                  {walletFlowState ? (
                    <FlowHoverButton
                      type="button"
                      onClick={
                        walletFlowState === 'connect'
                          ? openConnect
                          : () => void switchChainAsync({ chainId: arcTestnet.id })
                      }
                      fullWidth
                      icon={walletFlowIcon}
                      loading={walletFlowLoading}
                      aria-label={walletFlowLabel ?? undefined}
                    >
                      {walletFlowLabel}
                    </FlowHoverButton>
                  ) : (
                    <button type="button" disabled className="app-btn w-full">
                      Add liquidity (not live yet)
                    </button>
                  )}
                  <p className="mt-2 text-center text-xs text-neutral-500">
                    Liquidity is a scaffold on Arc Testnet and is not live yet.
                  </p>
                </div>
              </section>

              <div className="app-testnet-strip">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--app-accent)]" aria-hidden="true" />
                  Arc Testnet · test funds only
                </span>
                <a
                  href={FAUCET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-neutral-300 underline underline-offset-2 transition-colors hover:text-white"
                >
                  Get testnet USDC
                </a>
              </div>
            </div>
          )}
        </div>
      </main>

      <SelectTokenModal
        open={pickerTarget !== null}
        mode={pickerMode}
        tokens={pickerTokens}
        selectedToken={pickerSelected}
        explorerUrl={ARC_EXPLORER_URL}
        publicClient={publicClient}
        address={address}
        bridgeChains={pickerMode === 'bridge' ? BRIDGE_CHAINS : []}
        selectedChainId={bridgePickerChainId}
        chainSide={bridgeSide}
        inUseToken={pickerMode === 'bridge' ? null : pickerInUse}
        onChainSelect={
          bridgeSide ? (chainId) => selectBridgeChain(bridgeSide, chainId) : undefined
        }
        onClose={() => setPickerTarget(null)}
        onSelect={handleSelect}
      />

    </>
  );
}
