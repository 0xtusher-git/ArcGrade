'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, CheckCircle, CircleNotch, MagnifyingGlass, Star, X } from '@phosphor-icons/react';
import type { PublicClient } from 'viem';
import { formatAmount, isTokenDeployed, type DexToken } from '@/lib/dexConfig.testnet';
import { ERC20_ABI } from '../lib/abis';
import type { BridgeChain } from '../lib/bridgeChains';
import { shortAddress } from '../lib/format';
import { useTokenSearch } from '../hooks/useTokenSearch';
import { ChainIcon, TokenIcon } from './TokenIcon';

export type TokenPickerMode = 'swap' | 'bridge' | 'liquidity';

type Balances = Record<string, bigint>;

const STARRED_KEY = 'repdex-app:starred-chains';

export function SelectTokenModal({
  open,
  mode,
  tokens,
  selectedToken,
  explorerUrl,
  publicClient,
  address,
  bridgeChains = [],
  selectedChainId = null,
  chainSide = null,
  inUseToken = null,
  onClose,
  onSelect,
  onChainSelect,
}: {
  open: boolean;
  mode: TokenPickerMode;
  tokens: DexToken[];
  selectedToken: DexToken | null;
  explorerUrl: string;
  publicClient?: PublicClient;
  address?: `0x${string}`;
  /** Chain list for bridge mode only. Empty in swap/liquidity mode. */
  bridgeChains?: BridgeChain[];
  /** Active chain for bridge mode only. */
  selectedChainId?: number | null;
  /** Which bridge field opened the picker, used for the title. */
  chainSide?: 'from' | 'to' | null;
  /** Token already selected on the opposite side of the pair (swap/liquidity). */
  inUseToken?: DexToken | null;
  onClose: () => void;
  onSelect: (token: DexToken) => void;
  onChainSelect?: (chainId: number) => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const [mounted, setMounted] = useState(false);
  const [chainQuery, setChainQuery] = useState('');
  const [tokenQuery, setTokenQuery] = useState('');
  const [starred, setStarred] = useState<number[]>([]);
  const [balances, setBalances] = useState<Balances>({});

  const isBridge = mode === 'bridge';

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setChainQuery('');
    setTokenQuery('');
    if (!isBridge) return;
    try {
      const raw = window.localStorage.getItem(STARRED_KEY);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      if (Array.isArray(parsed)) {
        setStarred(parsed.filter((id): id is number => typeof id === 'number'));
      }
    } catch {
      setStarred([]);
    }
  }, [open, isBridge]);

  // Body scroll lock + focus trap + focus restore.
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusables = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter((element) => element.offsetParent !== null);

    const frame = window.requestAnimationFrame(() => closeRef.current?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = bodyOverflow;
      previous?.focus?.();
    };
  }, [open]);

  // Wallet balances for the listed tokens.
  useEffect(() => {
    if (!open || !address || !publicClient) {
      setBalances({});
      return;
    }
    let cancelled = false;
    const deployed = tokens.filter(isTokenDeployed);
    void (async () => {
      const entries = await Promise.all(
        deployed.map(async (token) => {
          try {
            const value = await publicClient.readContract({
              address: token.address as `0x${string}`,
              abi: ERC20_ABI,
              functionName: 'balanceOf',
              args: [address],
            });
            return [token.address.toLowerCase(), value] as const;
          } catch {
            return null;
          }
        })
      );
      if (cancelled) return;
      setBalances(
        Object.fromEntries(entries.filter((entry): entry is readonly [string, bigint] => entry !== null))
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [open, address, publicClient, tokens]);

  const toggleStar = (id: number) => {
    setStarred((previous) => {
      const next = previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id];
      try {
        window.localStorage.setItem(STARRED_KEY, JSON.stringify(next));
      } catch {
        // storage can be unavailable; starring is a nicety
      }
      return next;
    });
  };

  const visibleTokens = useMemo(() => {
    if (!isBridge || selectedChainId === null) return tokens;
    return tokens.filter((token) => token.chainId === undefined || token.chainId === selectedChainId);
  }, [isBridge, tokens, selectedChainId]);

  const search = useTokenSearch({
    query: tokenQuery,
    tokens: visibleTokens,
    explorerUrl,
    enabled: open,
  });

  const chains = isBridge ? bridgeChains : [];
  const chainFilter = chainQuery.trim().toLowerCase();
  const sortedChains = useMemo(
    () => chains.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [chains]
  );
  const matchingChains = sortedChains.filter((chain) => chain.name.toLowerCase().includes(chainFilter));
  const starredChains = matchingChains.filter((chain) => starred.includes(chain.id));

  if (!mounted || !open) return null;

  const title = isBridge
    ? chainSide === 'to'
      ? 'Select destination chain'
      : 'Select source chain'
    : 'Select token';

  const chainRow = (chain: BridgeChain) => {
    const active = selectedChainId === chain.id;
    const isStarred = starred.includes(chain.id);
    return (
      <div
        key={chain.id}
        className={`flex items-center gap-1 rounded-lg pr-1 transition-colors ${
          active ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
        }`}
      >
        <button
          type="button"
          onClick={() => onChainSelect?.(chain.id)}
          aria-pressed={active}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-neutral-300"
        >
          <ChainIcon name={chain.name} logo={chain.logo} glyph={chain.glyph} />
          <span className="truncate">{chain.name}</span>
        </button>
        <button
          type="button"
          onClick={() => toggleStar(chain.id)}
          aria-pressed={isStarred}
          aria-label={isStarred ? `Unstar ${chain.name}` : `Star ${chain.name}`}
          className="rounded-md p-1.5 text-neutral-500 transition-colors hover:text-white"
        >
          <Star
            size={14}
            weight={isStarred ? 'fill' : 'regular'}
            className={isStarred ? 'text-[var(--app-accent)]' : undefined}
            aria-hidden="true"
          />
        </button>
      </div>
    );
  };

  return createPortal(
    <div
      className={`app-modal-backdrop fixed inset-0 z-[100] flex justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-6 ${
        isBridge ? 'items-stretch' : 'items-end'
      }`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="select-token-title"
        tabIndex={-1}
        className={`app-modal-panel flex w-full flex-col overflow-hidden bg-neutral-950 outline-none sm:h-auto sm:max-h-[640px] sm:rounded-2xl sm:border sm:border-white/10 sm:shadow-2xl ${
          isBridge ? 'h-full sm:max-w-3xl' : 'app-modal-panel-narrow max-h-[85vh] rounded-t-2xl'
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5">
          <h2 id="select-token-title" className="text-base font-semibold text-white">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close token selector"
            className="app-btn-icon"
          >
            <X size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>

        <div className={`flex min-h-0 flex-1 flex-col ${isBridge ? 'sm:flex-row' : ''}`}>
          {isBridge && (
            <aside className="border-b border-white/10 p-3 sm:flex sm:w-56 sm:flex-col sm:overflow-hidden sm:border-b-0 sm:border-r">
              <div className="hidden sm:block">
                <label className="relative block">
                  <span className="sr-only">Search chains</span>
                  <MagnifyingGlass
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                    aria-hidden="true"
                  />
                  <input
                    value={chainQuery}
                    onChange={(event) => setChainQuery(event.target.value)}
                    placeholder="Search chains"
                    className="w-full rounded-lg border border-white/10 bg-neutral-900 py-1.5 pl-8 pr-2 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-white/25"
                  />
                </label>
              </div>

              {/* Desktop: one scrollable list (starred chains sit at the top). */}
              <div className="hidden min-h-0 sm:mt-3 sm:block sm:flex-1 sm:overflow-y-auto">
                {starredChains.length > 0 && (
                  <>
                    <h3 className="px-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                      Starred chains
                    </h3>
                    <div className="mt-1 space-y-0.5">{starredChains.map(chainRow)}</div>
                  </>
                )}

                <h3 className="mt-3 px-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                  Chains A-Z
                </h3>
                <div className="mt-1 space-y-0.5">
                  {matchingChains.length === 0 ? (
                    <p className="px-2 py-2 text-xs text-neutral-500">No chains found</p>
                  ) : (
                    matchingChains.map(chainRow)
                  )}
                </div>
              </div>

              {/* Mobile: horizontally scrollable chain chips above the token list. */}
              <div className="app-chain-chips sm:hidden">
                {matchingChains.length === 0 ? (
                  <p className="px-1 py-1.5 text-xs text-neutral-500">No chains found</p>
                ) : (
                  matchingChains.map((chain) => (
                    <button
                      key={chain.id}
                      type="button"
                      onClick={() => onChainSelect?.(chain.id)}
                      aria-pressed={selectedChainId === chain.id}
                      className={`app-btn-compact shrink-0 gap-2 px-3 py-1.5 text-xs ${
                        selectedChainId === chain.id ? 'border-white/30 bg-white/10' : ''
                      }`}
                    >
                      <ChainIcon
                        name={chain.name}
                        logo={chain.logo}
                        glyph={chain.glyph}
                        size={16}
                      />
                      {chain.name}
                    </button>
                  ))
                )}
              </div>
            </aside>
          )}

          <section className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
            <label className="relative block">
              <span className="sr-only">Search for a token or paste address</span>
              <MagnifyingGlass
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                aria-hidden="true"
              />
              <input
                value={tokenQuery}
                onChange={(event) => setTokenQuery(event.target.value)}
                placeholder="Search for a token or paste address"
                className="w-full rounded-lg border border-white/10 bg-neutral-900 py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-white/25"
              />
            </label>

            <h3 className="mt-4 px-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
              {search.hasQuery ? 'Results' : 'Popular tokens'}
            </h3>

            <div className="mt-1 min-h-0 flex-1 overflow-y-auto">
              {search.loading && (
                <div className="flex items-center gap-2 px-2 py-4 text-sm text-neutral-400">
                  <CircleNotch size={16} weight="bold" className="animate-spin" aria-hidden="true" />
                  Reading token data…
                </div>
              )}

              {!search.loading && search.results.length === 0 && !search.unsupported && !search.explorer && (
                <p className="px-2 py-6 text-sm text-neutral-500">No results</p>
              )}

              {!search.loading && search.unsupported && (
                <p className="px-2 py-6 text-sm text-neutral-400">
                  This token isn&apos;t supported on Arc Testnet
                </p>
              )}

              {!search.loading &&
                search.results.map((token) => {
                  const deployed = isTokenDeployed(token);
                  const selected =
                    selectedToken !== null &&
                    selectedToken.address.toLowerCase() === token.address.toLowerCase() &&
                    (selectedToken.chainId ?? null) === (token.chainId ?? null);
                  const inUse =
                    !isBridge &&
                    inUseToken !== null &&
                    inUseToken.address.toLowerCase() === token.address.toLowerCase() &&
                    (inUseToken.chainId ?? null) === (token.chainId ?? null);
                  const balance = balances[token.address.toLowerCase()];
                  const chain = isBridge
                    ? bridgeChains.find((item) => item.id === token.chainId)
                    : undefined;
                  // Swap/liquidity rows never invent an address: an undeployed
                  // token stays visible but disabled with this exact label.
                  const subtitle = isBridge
                    ? `${token.chainName ?? chain?.name ?? ''}${
                        deployed ? ` · ${shortAddress(token.address)}` : ''
                      }`
                    : deployed
                      ? shortAddress(token.address)
                      : 'Address not set';

                  return (
                    <button
                      key={`${token.chainId ?? 'arc'}-${token.address}-${token.symbol}`}
                      type="button"
                      disabled={!isBridge && !deployed}
                      onClick={() => onSelect(token)}
                      className={`flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-45 ${
                        selected ? 'bg-white/[0.06]' : ''
                      }`}
                    >
                      <TokenIcon
                        symbol={token.symbol}
                        glyph={token.icon}
                        logo={token.logo}
                        chain={isBridge ? (chain ?? null) : null}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1">
                          <span className="block text-sm font-semibold text-white">{token.symbol}</span>
                          {token.verified && (
                            <CheckCircle
                              size={14}
                              weight="fill"
                              className="shrink-0 text-[var(--app-accent)]"
                              aria-label="Verified"
                            />
                          )}
                        </span>
                        <span className="block truncate text-xs text-neutral-500">{subtitle}</span>
                      </span>
                      {inUse ? (
                        <span className="shrink-0 text-xs text-neutral-400">In use</span>
                      ) : (
                        address &&
                        deployed &&
                        balance !== undefined && (
                          <span className="shrink-0 text-xs text-neutral-400">
                            {formatAmount(balance, token.decimals, 4)}
                          </span>
                        )
                      )}
                      {selected && !inUse && (
                        <Check size={16} weight="bold" className="shrink-0 text-[var(--app-accent)]" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}

              {!search.loading && search.explorer && (
                <a
                  href={search.explorer.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-2 rounded-lg px-2 py-3 text-sm text-neutral-200 transition-colors hover:bg-white/5"
                >
                  {search.explorer.label}
                </a>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
}
