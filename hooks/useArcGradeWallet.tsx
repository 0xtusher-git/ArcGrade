'use client';

import { useCallback } from 'react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect, useSwitchChain } from 'wagmi';
import { arcMainnet } from '@/lib/arcgradeWagmi';

/**
 * ArcGrade's wallet facade, backed by the ArcGrade wagmi/RainbowKit stack.
 *
 * It mirrors the shape the ArcGrade pages used from the legacy `useWallet`
 * context (address / isConnected / connect / switchNetwork / ...), so the
 * pages keep their existing score and wallet-state behavior while the connect
 * action now opens RainbowKit's modal.
 */
export function useArcGradeWallet() {
  const { address, isConnected, isConnecting, chainId } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();

  const connect = useCallback(async () => {
    openConnectModal?.();
  }, [openConnectModal]);

  const switchNetwork = useCallback(async () => {
    switchChain({ chainId: arcMainnet.id });
  }, [switchChain]);

  return {
    address: address ?? null,
    isConnected,
    isConnecting: isConnecting || isSwitchingChain,
    chainId: chainId ?? null,
    isCorrectNetwork: chainId === arcMainnet.id,
    error: null,
    connect,
    disconnect,
    switchNetwork,
  };
}
