'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { shortenAddress } from '@/lib/scoring';

export default function Navbar() {
  const pathname = usePathname();
  const { address, isConnected, isConnecting, connect, disconnect } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const links = [
    { href: '/', label: 'Home' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/challenge', label: 'Challenge' },
    { href: '/deploy', label: 'Deploy' },
    { href: '/my-score', label: 'My Score' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-3">
      <div className="max-w-6xl mx-auto glass-card px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 relative">
            <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <defs>
                <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f5e6c8"/>
                  <stop offset="100%" stopColor="#4a9aba"/>
                </linearGradient>
              </defs>
              {/* Arc shape */}
              <path d="M6 28 Q6 8 18 8 Q30 8 30 28" stroke="url(#arcGrad)" strokeWidth="3" fill="none" strokeLinecap="round"/>
              <circle cx="18" cy="28" r="3" fill="url(#arcGrad)"/>
              <circle cx="6" cy="28" r="2" fill="#4a9aba" opacity="0.6"/>
              <circle cx="30" cy="28" r="2" fill="#4a9aba" opacity="0.6"/>
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight group-hover:text-teal-light transition-colors">
            Arc<span className="text-teal-light">Grade</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`nav-link ${pathname === l.href ? 'active' : ''}`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Wallet button */}
        <div className="hidden md:flex items-center gap-3">
          {/* Extension Download Button */}
          <a
            href="/arcgrade-extension.zip"
            download="arcgrade-extension.zip"
            onClick={() => setIsModalOpen(true)}
            className="btn-secondary text-sm py-2 px-4 flex items-center gap-2 group cursor-pointer border border-white/15 hover:border-teal-light/40 hover:bg-white/10"
          >
            <span className="group-hover:scale-120 transition-transform duration-300">🧩</span>
            <span className="text-white/95 group-hover:text-white transition-colors">ArcGrade Extension</span>
          </a>

          {isConnected ? (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-white/70 font-mono">{shortenAddress(address!)}</span>
              </span>
              <button onClick={disconnect} className="btn-secondary text-sm py-2 px-4">
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="btn-primary text-sm py-2 px-5"
              id="navbar-connect-btn"
            >
              {isConnecting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Connecting…
                </span>
              ) : 'Connect Wallet'}
            </button>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-white/70 hover:text-white"
          onClick={() => setMenuOpen(!menuOpen)}
          id="mobile-menu-btn"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden mx-4 mt-2 glass-card px-6 py-4 flex flex-col gap-4 animate-fade-in">
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
          <div className="pt-2 border-t border-white/10 flex flex-col gap-3">
            {/* Mobile Extension Download Button */}
            <a
              href="/arcgrade-extension.zip"
              download="arcgrade-extension.zip"
              onClick={() => {
                setIsModalOpen(true);
                setMenuOpen(false);
              }}
              className="btn-secondary w-full text-sm py-2 px-4 flex items-center justify-center gap-2 group cursor-pointer border border-white/15 hover:border-teal-light/40"
            >
              <span>🧩</span>
              <span>ArcGrade Extension</span>
            </a>

            {isConnected ? (
              <button onClick={() => { disconnect(); setMenuOpen(false); }} className="btn-secondary w-full text-sm">
                Disconnect ({shortenAddress(address!)})
              </button>
            ) : (
              <button onClick={() => { connect(); setMenuOpen(false); }} className="btn-primary w-full text-sm">
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      )}

      {/* Instructions Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-lg glass-card p-6 md:p-8 animate-scale-in z-10 border border-white/20">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🧩</span>
                <div className="text-left">
                  <h3 className="text-xl font-bold text-white">Extension Downloaded!</h3>
                  <p className="text-xs text-white/50 mt-0.5">Follow these 5 simple steps to install</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/40 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Steps list */}
            <div className="space-y-4 text-left">
              {[
                {
                  step: 'Step 1',
                  desc: 'Extract the downloaded zip file',
                  detail: 'Find the downloaded file and unzip it to a folder on your computer.',
                },
                {
                  step: 'Step 2',
                  desc: 'Open Chrome and go to extensions page',
                  detail: (
                    <>
                      Type <code className="bg-white/10 px-1.5 py-0.5 rounded text-teal-light font-mono text-xs select-all">chrome://extensions</code> into your browser URL bar and press enter.
                    </>
                  ),
                },
                {
                  step: 'Step 3',
                  desc: 'Turn on Developer Mode',
                  detail: 'Toggle the switch in the top-right corner of the Extensions page.',
                },
                {
                  step: 'Step 4',
                  desc: "Click 'Load unpacked'",
                  detail: 'Click the button in the top-left and select the extracted folder.',
                },
                {
                  step: 'Step 5',
                  desc: 'Test it on ArcScan!',
                  detail: (
                    <>
                      Visit any wallet on{' '}
                      <a
                        href="https://testnet.arcscan.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-light hover:underline font-semibold"
                      >
                        testnet.arcscan.app
                      </a>{' '}
                      to see real-time ArcGrade score popups in action!
                    </>
                  ),
                },
              ].map((s, index) => (
                <div key={s.step} className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    {/* Circle badge */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-light/20 to-teal/30 border border-teal-light/30 flex items-center justify-center font-bold text-sm text-teal-light group-hover:scale-105 transition-transform shrink-0">
                      {index + 1}
                    </div>
                    {/* Connective line */}
                    {index < 4 && <div className="w-[2px] flex-1 bg-white/10 my-1 group-hover:bg-teal-light/20 transition-colors" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <h4 className="font-semibold text-white text-sm md:text-base leading-none mb-1 group-hover:text-teal-light transition-colors">
                      {s.desc}
                    </h4>
                    <p className="text-white/60 text-xs md:text-sm leading-relaxed mt-1">
                      {s.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer action */}
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="btn-primary py-2 px-6 text-sm cursor-pointer"
              >
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
