'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MagnifyingGlass, X } from '@phosphor-icons/react';
import { RefreshCw, Wallet } from 'lucide-react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect, usePublicClient, useSwitchChain } from 'wagmi';
import { arcTestnet } from '@/lib/appChain';
import { ARC_EXPLORER_URL, type DexToken } from '@/lib/dexConfig.testnet';
import { useTokenSearch } from './hooks/useTokenSearch';
import { useDexTokens } from './hooks/useDexTokens';
import { FlowHoverButton } from '@/components/ui/flow-hover-button';
import { AccountMenu } from './components/AccountMenu';
import { SearchResults } from './components/SearchResults';

const NAV_ITEMS = [
  { label: 'Swap', href: '/swap' },
  { label: 'Bridge', href: '/bridge' },
  { label: 'Liquidity', href: '/liquidity' },
] as const;

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { address, isConnected, isConnecting, chainId } = useAccount();
  const isCorrectNetwork = chainId === arcTestnet.id;
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain();
  const publicClient = usePublicClient();

  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const desktopSearchRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  const allTokens = useDexTokens(publicClient);
  const searchActive = searchOpen || mobileSearchOpen;
  const search = useTokenSearch({
    query,
    tokens: allTokens,
    explorerUrl: ARC_EXPLORER_URL,
    enabled: searchActive,
  });

  const closeGlobalSearch = useCallback(() => {
    setSearchOpen(false);
    setMobileSearchOpen(false);
    setQuery('');
    desktopSearchRef.current?.blur();
    mobileSearchRef.current?.blur();
  }, []);

  const openSwapWith = useCallback(
    (token: DexToken) => {
      closeGlobalSearch();
      router.push(`/swap?buy=${token.address}`);
    },
    [closeGlobalSearch, router]
  );

  const handleSelect = useCallback(
    (token: DexToken) => {
      openSwapWith(token);
    },
    [openSwapWith]
  );

  // "/" focuses the search box unless the user is already typing somewhere.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/') return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      setQuery('');
      if (window.matchMedia('(min-width: 640px)').matches) {
        setSearchOpen(true);
        desktopSearchRef.current?.focus();
      } else {
        setMobileSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Close the desktop results when clicking elsewhere.
  useEffect(() => {
    if (!searchOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [searchOpen]);

  // Focus and scroll-lock the mobile search overlay.
  useEffect(() => {
    if (!mobileSearchOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = window.requestAnimationFrame(() => mobileSearchRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileSearchOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileSearchOpen]);

  const walletButton = !isConnected ? (
    <FlowHoverButton
      type="button"
      onClick={() => openConnectModal?.()}
      icon={<Wallet size={16} aria-hidden="true" />}
      hideLabelOnMobile
      loading={isConnecting}
      aria-label={isConnecting ? 'Connecting wallet' : 'Connect wallet'}
      className="min-h-10 min-w-10 rounded-[10px] px-2.5 py-2 sm:px-3"
    >
      {isConnecting ? 'Connecting...' : 'Connect wallet'}
    </FlowHoverButton>
  ) : !isCorrectNetwork ? (
    <FlowHoverButton
      type="button"
      onClick={() => void switchChainAsync({ chainId: arcTestnet.id })}
      icon={<RefreshCw size={16} aria-hidden="true" />}
      hideLabelOnMobile
      loading={isSwitchingChain}
      aria-label={isSwitchingChain ? 'Switching network' : 'Switch to Arc Testnet'}
      className="min-h-10 min-w-10 rounded-[10px] px-2.5 py-2 sm:px-3"
    >
      {isSwitchingChain ? 'Switching...' : 'Switch to Arc Testnet'}
    </FlowHoverButton>
  ) : address ? (
    <AccountMenu address={address} explorerUrl={ARC_EXPLORER_URL} onDisconnect={() => disconnect()} />
  ) : null;

  return (
    <header className="app-header border-b border-white/[0.06] bg-neutral-950">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-3 sm:px-6">
        {/*
          Plain anchor (not next/link) on purpose: a full document load keeps the
          wagmi/RainbowKit providers and scoped app CSS from leaking into the
          Terminal intro page at "/".
        */}
        <a href="/" className="app-logo-link flex shrink-0 items-center" aria-label="RepDex home">
          <Image
            src="/logo.png"
            alt="RepDex"
            width={484}
            height={378}
            priority
            className="h-10 w-auto"
          />
        </a>

        <nav className="app-nav-desktop hidden items-center md:flex" aria-label="App navigation">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? 'page' : undefined}
              className="app-nav-text-link"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden min-w-0 flex-1 justify-center sm:flex">
          <div ref={searchWrapRef} className="relative w-full max-w-lg">
            <label className="relative block">
              <span className="sr-only">Search tokens or paste an address</span>
              <MagnifyingGlass
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500"
                aria-hidden="true"
              />
              <input
                ref={desktopSearchRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    setSearchOpen(false);
                    setQuery('');
                    desktopSearchRef.current?.blur();
                  }
                }}
                placeholder="Search tokens or paste an address"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={searchOpen}
                aria-controls="app-search-results"
                className="w-full rounded-full border border-white/10 bg-white/[0.03] py-2 pl-10 pr-11 text-sm text-white outline-none transition-colors placeholder:text-neutral-500 focus:border-white/25 focus:bg-white/[0.05]"
              />
              <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-neutral-400">
                /
              </kbd>
            </label>

            {searchOpen && (
              <div
                id="app-search-results"
                className="app-glass-popover absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-white/10 shadow-2xl"
              >
                <div className="border-b border-white/5 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                  Tokens on Arc Testnet
                </div>
                <SearchResults state={search} onSelect={handleSelect} />
              </div>
            )}
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileSearchOpen(true)}
            className="app-btn-icon rounded-full sm:hidden"
            aria-label="Search tokens"
          >
            <MagnifyingGlass size={17} weight="bold" aria-hidden="true" />
          </button>
          <span className="hidden items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-xs text-neutral-300 md:flex">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isConnected && !isCorrectNetwork ? 'bg-amber-400' : 'bg-[var(--app-accent)]'
              }`}
              aria-hidden="true"
            />
            Arc Testnet
          </span>
          {walletButton}
        </div>
      </div>

      <div className="border-t border-white/[0.06] md:hidden">
        <nav
          className="app-nav-mobile app-no-scrollbar mx-auto flex max-w-[1400px] items-center overflow-x-auto px-4 py-1.5"
          aria-label="App navigation"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? 'page' : undefined}
              className="app-nav-text-link shrink-0"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {mobileSearchOpen && (
        <div className="app-glass-scrim fixed inset-0 z-[90] flex flex-col p-4 sm:hidden">
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <span className="sr-only">Search tokens or paste an address</span>
              <MagnifyingGlass
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500"
                aria-hidden="true"
              />
              <input
                ref={mobileSearchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    setMobileSearchOpen(false);
                    setQuery('');
                  }
                }}
                placeholder="Search tokens or paste an address"
                aria-label="Search tokens or paste an address"
                className="w-full rounded-full border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-white/25"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setMobileSearchOpen(false);
                setQuery('');
              }}
              className="app-btn-icon rounded-full"
              aria-label="Close search"
            >
              <X size={18} weight="bold" aria-hidden="true" />
            </button>
          </div>

          <div className="app-glass-popover mt-3 min-h-0 flex-1 overflow-hidden rounded-xl border border-white/10">
            <div className="border-b border-white/5 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
              Tokens on Arc Testnet
            </div>
            <div className="max-h-full overflow-y-auto">
              <SearchResults state={search} onSelect={handleSelect} />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
