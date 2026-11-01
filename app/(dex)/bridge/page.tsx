import type { Metadata } from 'next';
import { DexView } from '../DexView';

export const metadata: Metadata = {
  title: 'Bridge | RepDex',
};

export default function BridgePage() {
  return <DexView tab="bridge" />;
}
