type ChainKey = 'arc' | 'sepolia';

const CHAIN_BADGE: Record<ChainKey, string> = {
  arc: 'A',
  sepolia: 'S',
};

export function TokenIcon({
  symbol,
  glyph,
  chain,
  size = 32,
}: {
  symbol: string;
  glyph?: string;
  chain?: ChainKey;
  size?: number;
}) {
  const letter = (glyph || symbol || '?').slice(0, 1).toUpperCase();
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }} aria-hidden="true">
      <span
        className="flex h-full w-full items-center justify-center rounded-full border border-white/15 bg-white/[0.07] font-semibold text-white"
        style={{ fontSize: Math.round(size * 0.42) }}
      >
        {letter}
      </span>
      {chain && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-neutral-950 bg-neutral-800 text-[8px] font-bold leading-none text-white">
          {CHAIN_BADGE[chain]}
        </span>
      )}
    </span>
  );
}

export function ChainIcon({
  name,
  glyph,
  size = 22,
}: {
  name: string;
  glyph?: string;
  size?: number;
}) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.07] text-[10px] font-bold text-white"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {(glyph || name.slice(0, 1)).slice(0, 1).toUpperCase()}
    </span>
  );
}
