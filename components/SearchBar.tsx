'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import { MagnifyingGlass, X } from '@phosphor-icons/react';

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
        className={`flex gap-2 rounded-2xl border p-1.5 transition-colors duration-200 ${
          error ? 'border-red-400/60' : 'border-white/[0.08] focus-within:border-teal/50'
        } ${shake ? 'animate-bounce' : ''}`}
        style={{ background: '#0a1220' }}
      >
        <input
          ref={inputRef}
          id="wallet-search-input"
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(''); }}
          onKeyDown={handleKeyDown}
          placeholder="0x… paste any Arc wallet address"
          className={`flex-1 bg-transparent font-mono text-slate-100 outline-none placeholder:text-slate-600 ${
            isLg ? 'px-4 py-2.5 text-sm' : 'px-3 py-2 text-[13px]'
          }`}
          aria-label="Wallet address search"
        />
        {value && (
          <button
            onClick={() => { setValue(''); setError(''); inputRef.current?.focus(); }}
            className="px-2 text-slate-500 transition-colors hover:text-slate-200"
            aria-label="Clear input"
          >
            <X size={16} weight="bold" />
          </button>
        )}
        <button
          id="search-submit-btn"
          onClick={handleSearch}
          className={`btn-primary whitespace-nowrap ${isLg ? 'px-5 py-2.5' : 'px-4 py-2 text-[13px]'}`}
        >
          <MagnifyingGlass size={16} weight="bold" />
          {isLg ? 'Check Score' : 'Search'}
        </button>
      </div>
      {error && <p className="mt-2 pl-4 text-sm text-red-400 animate-fade-in">{error}</p>}
    </div>
  );
}
