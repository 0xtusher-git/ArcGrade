import type { Metadata } from 'next';
import HomePage from './TerminalPage';

// Title and description continue to come from the root layout metadata.
export const metadata: Metadata = {
  icons: {
    icon: [
      { url: '/repdex-favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/repdex-favicon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/repdex-apple-touch-icon.png', sizes: '180x180' }],
  },
};

export default function Page() {
  return <HomePage />;
}
