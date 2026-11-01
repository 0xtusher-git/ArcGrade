'use client';

import { useEffect, useRef, useState } from 'react';
import { Copy, Globe, SignOut } from '@phosphor-icons/react';
import { shortAddress } from '../lib/format';

export function AccountMenu({
  address,
  explorerUrl,
  onDisconnect,
}: {
  address: `0x${string}`;
  explorerUrl: string;
  onDisconnect: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="app-btn-compact gap-2 rounded-full px-3 py-1.5"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="h-2 w-2 rounded-full bg-[var(--app-accent)]" aria-hidden="true" />
        <span>{shortAddress(address)}</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Wallet menu"
          className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-white/10 bg-neutral-900/95 p-1 shadow-2xl backdrop-blur app-glass-popover"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => void copy()}
            className="app-btn-compact w-full justify-start px-2 py-1.5"
          >
            <Copy size={16} aria-hidden="true" /> {copied ? 'Copied' : 'Copy address'}
          </button>
          <a
            role="menuitem"
            href={`${explorerUrl}/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="app-btn-compact w-full justify-start px-2 py-1.5"
          >
            <Globe size={16} aria-hidden="true" /> View on explorer
          </a>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onDisconnect();
            }}
            className="app-btn-compact w-full justify-start px-2 py-1.5 text-neutral-300"
          >
            <SignOut size={16} aria-hidden="true" /> Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
