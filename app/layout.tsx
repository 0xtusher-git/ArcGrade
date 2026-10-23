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
  title: 'ArcGrade — On-Chain Reputation for Arc',
  description:
    'Every wallet on Arc gets an AI-verified trust score based on on-chain activity. On-chain, forever.',
  keywords: 'Arc, reputation, trust score, blockchain, AI, wallet, on-chain',
  openGraph: {
    title: 'ArcGrade — On-Chain Reputation for Arc',
    description: 'AI scores every Arc wallet. No middleman. No bias.',
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
