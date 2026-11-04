'use client';

import { ArrowSquareOut, CheckCircle, CircleNotch } from '@phosphor-icons/react';
import { isTokenDeployed, type DexToken } from '@/lib/dexConfig.testnet';
import type { TokenSearchState } from '../hooks/useTokenSearch';
import { getBridgeChain } from '../lib/bridgeChains';
import { shortAddress } from '../lib/format';
import { TokenIcon } from './TokenIcon';

export function SearchResults({
  state,
  onSelect,
}: {
  state: TokenSearchState;
  onSelect: (token: DexToken) => void;
}) {
  if (state.loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-4 text-sm text-neutral-400">
        <CircleNotch size={16} weight="bold" className="animate-spin" aria-hidden="true" />
        Searching…
      </div>
    );
  }

  if (state.unsupported) {
    return (
      <div className="px-3 py-4 text-sm text-neutral-400">
        This token isn&apos;t supported on Arc Testnet
      </div>
    );
  }

  const empty = state.results.length === 0 && !state.explorer;
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
            <TokenIcon
              symbol={token.symbol}
              glyph={token.icon}
              logo={token.logo}
              chain={getBridgeChain(token.chainId)}
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
              <span className="block truncate text-xs text-neutral-500">
                {token.name}
                {deployed ? ` · ${shortAddress(token.address)}` : ''}
              </span>
            </span>
          </button>
        );
      })}

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
