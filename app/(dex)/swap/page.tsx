import type { Metadata } from 'next';
import { DexView } from '../DexView';

export const metadata: Metadata = {
  title: 'Swap | RepDex',
};

export default function SwapPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const buy = Array.isArray(searchParams.buy) ? searchParams.buy[0] : searchParams.buy;
  return <DexView tab="swap" initialBuy={buy} />;
}
