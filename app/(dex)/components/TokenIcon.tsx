'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export type ChainBadge = {
  name: string;
  logo?: string;
  glyph?: string;
};

export function TokenIcon({
  symbol,
  glyph,
  logo,
  chain,
  size = 32,
}: {
  symbol: string;
  glyph?: string;
  /** Public path to a locally hosted official logo. */
  logo?: string;
  /** Chain badge shown on the bottom-right corner of the token logo. */
  chain?: ChainBadge | null;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const letter = (glyph || symbol || '?').slice(0, 1).toUpperCase();

  // Reset the fallback when the same icon slot switches to another token.
  useEffect(() => setFailed(false), [logo]);

  const showImage = Boolean(logo) && !failed;

  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      {showImage ? (
        <Image
          src={logo as string}
          alt={`${symbol} logo`}
          width={size}
          height={size}
          loading="lazy"
          unoptimized
          onError={() => setFailed(true)}
          className="app-token-logo"
          style={{ width: size, height: size }}
        />
      ) : (
        <span
          role="img"
          aria-label={`${symbol} logo`}
          className="app-token-fallback"
          style={{ fontSize: Math.round(size * 0.42) }}
        >
          {letter}
        </span>
      )}
      {chain && (
        <span className="absolute -bottom-0.5 -right-0.5">
          <ChainIcon name={chain.name} logo={chain.logo} glyph={chain.glyph} size={14} />
        </span>
      )}
    </span>
  );
}

export function ChainIcon({
  name,
  logo,
  glyph,
  size = 22,
}: {
  name: string;
  /** Public path to a locally hosted official chain logo. */
  logo?: string;
  glyph?: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const letter = (glyph || name || '?').slice(0, 1).toUpperCase();

  useEffect(() => setFailed(false), [logo]);

  const showImage = Boolean(logo) && !failed;

  return (
    <span className="app-chain-icon" style={{ width: size, height: size }}>
      {showImage ? (
        <Image
          src={logo as string}
          alt={`${name} logo`}
          width={size}
          height={size}
          loading="lazy"
          unoptimized
          onError={() => setFailed(true)}
          className="app-chain-logo"
          style={{ width: size, height: size }}
        />
      ) : (
        <span
          role="img"
          aria-label={`${name} logo`}
          className="app-chain-fallback"
          style={{ fontSize: Math.round(size * 0.42) }}
        >
          {letter}
        </span>
      )}
    </span>
  );
}
