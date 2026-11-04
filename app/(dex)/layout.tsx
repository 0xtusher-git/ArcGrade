import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './app.css';
import { AppHeader } from './AppHeader';
import { ImportedTokensProvider } from './imported-tokens';
import { AppProviders } from './providers';

// Self-hosted so the build never fetches a font from Google. The file comes
// from the official Inter v4.1 release; source URL, date, and checksum are in
// ./fonts/FONTS.md.
const inter = localFont({
  src: './fonts/InterVariable.woff2',
  weight: '100 900',
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: '/repdex-favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/repdex-favicon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/repdex-apple-touch-icon.png', sizes: '180x180' }],
  },
};

// Old hash links (/swap#bridge, /swap#liquidity) must land on the real route
// before the app paints, so the old tab never flashes first.
const HASH_REDIRECT = `(function(){try{var h=window.location.hash;if(window.location.pathname==='/swap'&&(h==='#bridge'||h==='#liquidity')){window.location.replace('/'+h.slice(1)+window.location.search);}}catch(e){}})();`;

export default function DexLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <ImportedTokensProvider>
        <div className={`app-route relative min-h-screen bg-neutral-950 text-white ${inter.variable}`}>
          <script dangerouslySetInnerHTML={{ __html: HASH_REDIRECT }} />
          <div className="app-ambient" aria-hidden="true">
            <span className="app-ambient-blob app-ambient-blob-a" />
            <span className="app-ambient-blob app-ambient-blob-b" />
            <span className="app-ambient-blob app-ambient-blob-c" />
          </div>
          <div className="relative z-10">
            <AppHeader />
            {children}
          </div>
        </div>
      </ImportedTokensProvider>
    </AppProviders>
  );
}
