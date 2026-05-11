'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';

interface SearchBarProps {
  defaultValue?: string;
  size?: 'lg' | 'md';
}

export default function SearchBar({ defaultValue = '', size = 'lg' }: SearchBarProps) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = () => {
    const addr = value.trim();
    setError('');
    if (!addr) {
      triggerShake('Please paste a wallet address.');
      return;
    }
    if (!ethers.isAddress(addr)) {
      triggerShake('Invalid address. Should start with 0x and be 42 characters.');
      return;
    }
    router.push(`/score/${addr.toLowerCase()}`);
  };

  const triggerShake = (msg: string) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const isLg = size === 'lg';

  return (
    <div className="w-full max-w-2xl">
      <div
        className={`flex gap-2 rounded-2xl p-2 transition-all duration-300 ${shake ? 'animate-bounce' : ''}`}
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: `1px solid ${error ? 'rgba(255,107,107,0.5)' : 'rgba(74,154,186,0.3)'}`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
      >
        <input
          ref={inputRef}
          id="wallet-search-input"
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(''); }}
          onKeyDown={handleKeyDown}
          placeholder="0x... paste any Arc Testnet wallet address"
          className={`flex-1 bg-transparent outline-none text-white placeholder-white/30 font-mono ${isLg ? 'text-base px-4 py-3' : 'text-sm px-3 py-2'}`}
          aria-label="Wallet address search"
        />
        {value && (
          <button
            onClick={() => { setValue(''); setError(''); inputRef.current?.focus(); }}
            className="text-white/30 hover:text-white/70 transition-colors px-2"
            aria-label="Clear input"
          >
            ✕
          </button>
        )}
        <button
          id="search-submit-btn"
          onClick={handleSearch}
          className={`btn-primary rounded-xl whitespace-nowrap ${isLg ? 'px-6 py-3' : 'px-4 py-2 text-sm'}`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            {isLg ? 'Check Score' : 'Search'}
          </span>
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-400 pl-4 animate-fade-in">{error}</p>
      )}
    </div>
  );
}
