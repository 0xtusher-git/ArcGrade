'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { appConfig } from '@/lib/appWagmi';
import { ConnectButtonStateProvider } from './hooks/useConnectButtonState';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <WagmiProvider config={appConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#22d3ee',
            accentColorForeground: '#ffffff',
            borderRadius: 'large',
            overlayBlur: 'small',
          })}
          modalSize="wide"
        >
          <ConnectButtonStateProvider>{children}</ConnectButtonStateProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
