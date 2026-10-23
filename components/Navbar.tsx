'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { shortenAddress } from '@/lib/scoring';
import { PuzzlePiece, X, List, SignOut, Wallet, CircleNotch } from '@phosphor-icons/react';
import WalletPicker from '@/components/WalletPicker';
import type { DetectedWallet } from '@/lib/walletProviders';

export default function Navbar() {
  const pathname = usePathname();
  const { address, isConnected, isConnecting, connectWith, disconnect } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showWalletPicker, setShowWalletPicker] = useState(false);

  const handlePick = (wallet: DetectedWallet) => {
    connectWith(wallet.provider).then((ok) => {
      if (ok) setShowWalletPicker(false);
    });
  };

  const links = [
    { href: '/arcgrade', label: 'Home' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/challenge', label: 'Challenge' },
    { href: '/deploy', label: 'Deploy' },
    { href: '/api-docs', label: 'API' },
    { href: '/my-score', label: 'My Score' },
  ];

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#060b16]/95 backdrop-blur-[2px]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/arcgrade" className="group flex items-center gap-2.5">
          <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8">
            <path d="M6 28 Q6 8 18 8 Q30 8 30 28" stroke="#eef4fb" strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle cx="18" cy="28" r="3" fill="#2dd4bf" />
            <circle cx="6" cy="28" r="2" fill="#eef4fb" opacity="0.35" />
            <circle cx="30" cy="28" r="2" fill="#eef4fb" opacity="0.35" />
          </svg>
          <span className="text-[17px] font-bold tracking-tight text-white">
            Arc<span className="text-slate-500">Grade</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={`nav-link ${pathname === l.href ? 'active' : ''}`}>
              {l.label}
            </Link>
          ))}
          <a
            href="/arcgrade-extension.zip"
            download="arcgrade-extension.zip"
            onClick={() => setIsModalOpen(true)}
            className="nav-link"
            aria-label="Install the ArcGrade browser extension"
          >
            Extension
          </a>
        </div>

        {/* Wallet — one filled action */}
        <div className="hidden items-center gap-5 md:flex">
          {isConnected ? (
            <>
              <span className="flex items-center gap-2 font-mono text-sm text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-teal" />
                {shortenAddress(address!)}
              </span>
              <button
                onClick={disconnect}
                className="flex items-center gap-1.5 text-[13px] font-medium text-slate-400 transition-colors hover:text-white"
              >
                <SignOut size={15} /> Disconnect
              </button>
            </>
          ) : (
            <button onClick={() => setShowWalletPicker(true)} className="btn-primary" id="navbar-connect-btn">
              {isConnecting ? (
                <>
                  <CircleNotch size={16} weight="bold" className="animate-spin" /> Connecting…
                </>
              ) : (
                <>
                  <Wallet size={16} weight="bold" /> Connect
                </>
              )}
            </button>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="text-slate-300 hover:text-white md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          id="mobile-menu-btn"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={24} weight="bold" /> : <List size={24} weight="bold" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="animate-fade-in border-t border-white/[0.06] bg-[#060b16] px-4 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`nav-link text-base ${pathname === l.href ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <a
              href="/arcgrade-extension.zip"
              download="arcgrade-extension.zip"
              onClick={() => {
                setIsModalOpen(true);
                setMenuOpen(false);
              }}
              className="nav-link w-fit text-base"
            >
              Extension
            </a>
          </div>
          <div className="mt-4 border-t border-white/[0.06] pt-4">
            {isConnected ? (
              <button onClick={() => { disconnect(); setMenuOpen(false); }} className="btn-secondary w-full">
                <SignOut size={16} /> Disconnect ({shortenAddress(address!)})
              </button>
            ) : (
              <button onClick={() => { setMenuOpen(false); setShowWalletPicker(true); }} className="btn-primary w-full">
                <Wallet size={16} weight="bold" /> Connect
              </button>
            )}
          </div>
        </div>
      )}

      {/* Extension instructions modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setIsModalOpen(false)} />

          <div className="glass-card relative z-10 w-full max-w-lg animate-scale-in p-6 md:p-8">
            <div className="mb-6 flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-teal">
                  <PuzzlePiece size={20} weight="duotone" />
                </span>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-white">Install the Extension</h3>
                  <p className="mt-0.5 text-xs text-slate-500">Five quick steps in Chrome</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/5 hover:text-white"
                aria-label="Close modal"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <div className="space-y-4 text-left">
              {[
                { step: 'Step 1', desc: 'Download and unzip', detail: 'Grab the extension zip and extract it to a folder.' },
                {
                  step: 'Step 2',
                  desc: 'Open the extensions page',
                  detail: (
                    <>
                      Visit{' '}
                      <code className="select-all rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs text-teal-light">
                        chrome://extensions
                      </code>{' '}
                      in your browser.
                    </>
                  ),
                },
                { step: 'Step 3', desc: 'Enable Developer Mode', detail: 'Toggle the switch in the top-right corner.' },
                { step: 'Step 4', desc: 'Load unpacked', detail: 'Click the button and select the extracted folder.' },
                {
                  step: 'Step 5',
                  desc: 'See it in action',
                  detail: (
                    <>
                      Open any wallet on{' '}
                      <a href="https://abscan.org" target="_blank" rel="noopener noreferrer" className="text-teal hover:underline">
                        abscan.org
                      </a>{' '}
                      to see live score popups.
                    </>
                  ),
                },
              ].map((s, index) => (
                <div key={s.step} className="group flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-sm font-semibold text-slate-300">
                      {index + 1}
                    </div>
                    {index < 4 && <div className="my-1 w-px flex-1 bg-white/[0.08]" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <h4 className="mb-1 text-sm font-semibold leading-none text-white md:text-base">{s.desc}</h4>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500 md:text-sm">{s.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end border-t border-white/[0.08] pt-4">
              <button onClick={() => setIsModalOpen(false)} className="btn-primary">
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      <WalletPicker
        open={showWalletPicker}
        connecting={isConnecting}
        onClose={() => setShowWalletPicker(false)}
        onPick={handlePick}
      />
    </nav>
  );
}
