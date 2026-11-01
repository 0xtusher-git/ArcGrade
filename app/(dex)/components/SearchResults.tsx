'use client';

import { ArrowSquareOut, CircleNotch, Warning } from '@phosphor-icons/react';
import { isTokenDeployed, type DexToken } from '@/lib/dexConfig.testnet';
import type { ImportCandidate, TokenSearchState } from '../hooks/useTokenSearch';
import { shortAddress } from '../lib/format';
import { TokenIcon } from './TokenIcon';

export function SearchResults({
  state,
  onSelect,
  onImport,
}: {
  state: TokenSearchState;
  onSelect: (token: DexToken) => void;
  onImport: (candidate: ImportCandidate) => void;
}) {
  if (state.loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-4 text-sm text-neutral-400">
        <CircleNotch size={16} weight="bold" className="animate-spin" aria-hidden="true" />
        Searching…
      </div>
    );
  }

  const empty = state.results.length === 0 && !state.candidate && !state.explorer;
  if (empty) {
    return <div className="px-3 py-4 text-sm text-neutral-500">No results</div>;
  }

  return (
    <div className="max-h-80 overflow-y-auto py-1">
      {state.results.map((token) => {
        const deployed = isTokenDeployed(token);
        return (
          <button
            key={`${token.chainId ?? 'arc'}-${token.address}`}
            type="button"
            disabled={!deployed}
            onClick={() => onSelect(token)}
            className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <TokenIcon symbol={token.symbol} glyph={token.icon} chain="arc" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-white">{token.symbol}</span>
              <span className="block truncate text-xs text-neutral-500">
                {token.name} · {deployed ? shortAddress(token.address) : 'Not deployed yet'}
              </span>
            </span>
          </button>
        );
      })}

      {state.candidate && (
        <div className="mx-2 my-1 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
          <div className="flex items-start gap-2 text-xs leading-relaxed text-amber-200">
            <Warning size={16} weight="bold" className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              <strong className="font-semibold">Unverified token.</strong> {state.candidate.symbol} (
              {shortAddress(state.candidate.address)}) is not in the RepDex list. Verify the contract
              address before trading.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onImport(state.candidate as ImportCandidate)}
            className="app-btn-compact mt-2 px-3 py-1 text-xs"
          >
            Import &amp; select
          </button>
        </div>
      )}

      {state.explorer && (
        <a
          href={state.explorer.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-3 text-sm text-neutral-200 transition-colors hover:bg-white/5"
        >
          <ArrowSquareOut size={18} weight="bold" aria-hidden="true" />
          <span>{state.explorer.label}</span>
        </a>
      )}
    </div>
  );
}
