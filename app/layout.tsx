import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { WalletProvider } from '@/hooks/useWallet';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'RepDex — Reputation & Swaps on Arc',
  description:
    'Check any Arc wallet’s reputation, then swap tokens through Uniswap v4 — on-chain, on Arc mainnet.',
  keywords: 'Arc, reputation, trust score, blockchain, Uniswap, swap, DEX, wallet, on-chain',
  openGraph: {
    title: 'RepDex — Reputation & Swaps on Arc',
    description: 'Wallet reputation and Uniswap v4 swaps on Arc mainnet.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${GeistMono.variable}`}>
      <body>
        <WalletProvider>
          <div className="relative z-10">{children}</div>
        </WalletProvider>
      </body>
    </html>
  );
}
