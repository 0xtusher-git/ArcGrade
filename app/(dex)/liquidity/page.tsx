import type { Metadata } from 'next';
import { DexView } from '../DexView';

export const metadata: Metadata = {
  title: 'Liquidity | RepDex',
};

export default function LiquidityPage() {
  return <DexView tab="liquidity" />;
}
