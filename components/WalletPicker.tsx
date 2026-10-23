'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Wallet, X, CircleNotch, ArrowSquareOut, CaretRight } from '@phosphor-icons/react';
import { DetectedWallet, detectLegacyWallet, legacyEthereumProviders, scanEIP6963 } from '@/lib/walletProviders';

interface WalletPickerProps {
  open: boolean;
  connecting: boolean;
  onClose: () => void;
  onPick: (wallet: DetectedWallet) => void;
}

export default function WalletPicker({ open, connecting, onClose, onPick }: WalletPickerProps) {
  const [mounted, setMounted] = useState(false);
  const [wallets, setWallets] = useState<DetectedWallet[]>([]);
  const [scanning, setScanning] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setScanning(true);
    setSelectedId(null);

    const list: DetectedWallet[] = [];
    const seen = new Set<EthereumProvider>();

    const push = (wallet: DetectedWallet) => {
      if (!wallet.provider || seen.has(wallet.provider)) return;
      seen.add(wallet.provider);
      list.push(wallet);
      setWallets([...list]);
    };

    for (const provider of legacyEthereumProviders()) {
      push(detectLegacyWallet(provider));
    }

    const stop = scanEIP6963(push);
    const timer = window.setTimeout(() => {
      setScanning(false);
      stop();
    }, 2500);

    return () => {
      stop();
      window.clearTimeout(timer);
    };
  }, [open]);

  if (!open || !mounted) return null;

  const handlePick = (wallet: DetectedWallet) => {
    if (connecting) return;
    setSelectedId(wallet.id);
    onPick(wallet);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div className="glass-card relative z-10 w-full max-w-sm animate-scale-in p-6">
        <div className="mb-6 flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-teal">
              <Wallet size={20} weight="duotone" />
            </span>
            <div className="text-left">
              <h3 className="text-lg font-bold text-white">Connect wallet</h3>
              <p className="mt-0.5 text-xs text-slate-500">Choose an EVM wallet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Close wallet picker"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {connecting ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <CircleNotch size={22} weight="bold" className="animate-spin text-teal" />
            <p className="text-sm text-slate-400">Waiting for approval in your wallet…</p>
          </div>
        ) : scanning && wallets.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <CircleNotch size={22} weight="bold" className="animate-spin text-teal" />
            <p className="text-sm text-slate-400">Scanning for installed EVM wallets…</p>
          </div>
        ) : wallets.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <Wallet size={28} weight="duotone" className="text-slate-600" />
            <div>
              <p className="text-sm font-medium text-white">No EVM wallet found</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Install MetaMask, Rabby, Coinbase Wallet, or another EVM wallet to connect.
              </p>
            </div>
            <a
              href="https://metamask.io/download"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-teal transition-colors hover:text-teal-light"
            >
              Install MetaMask <ArrowSquareOut size={13} weight="bold" />
            </a>
          </div>
        ) : (
          <div className="space-y-2">
            {wallets.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => handlePick(wallet)}
                className="flex w-full items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-left transition-colors hover:border-white/20 hover:bg-white/[0.06]"
              >
                {wallet.icon ? (
                  <img src={wallet.icon} alt={wallet.name} className="h-8 w-8 shrink-0 rounded-lg object-contain" />
                ) : (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-teal">
                    <Wallet size={16} weight="bold" />
                  </span>
                )}
                <span className="flex-1 text-sm font-medium text-white">{wallet.name}</span>
                {selectedId === wallet.id ? (
                  <CircleNotch size={16} weight="bold" className="animate-spin text-teal" />
                ) : (
                  <CaretRight size={15} className="text-slate-600" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}