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

  const links = [
    { href: '/', label: 'Home' },
    { href: '/leaderboard', label: 'Leaderboard' },
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
          <div className="pt-2 border-t border-white/10">
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
    </nav>
  );
}
