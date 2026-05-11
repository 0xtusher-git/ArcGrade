import type { Metadata } from 'next';
import './globals.css';
import { WalletProvider } from '@/hooks/useWallet';

export const metadata: Metadata = {
  title: 'ArcGrade — AI-Powered On-Chain Reputation',
  description: 'Every wallet on Arc Testnet gets a trust score based on on-chain activity. AI-powered, on-chain, forever.',
  keywords: 'Arc Testnet, reputation, trust score, blockchain, AI, wallet',
  openGraph: {
    title: 'ArcGrade — AI-Powered On-Chain Reputation',
    description: 'AI scores every Arc wallet. No middleman. No bias.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <WalletProvider>
          {/* Background orbs */}
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
          <div className="relative z-10">
            {children}
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
