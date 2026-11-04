'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useIsMutating } from '@tanstack/react-query';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';

/** How long wagmi may spend on an automatic mount-time reconnect. */
const AUTO_RECONNECT_TIMEOUT_MS = 4000;

/** How long a user-initiated connect may stay pending before we reset it. */
const USER_CONNECT_TIMEOUT_MS = 30000;

/** How long to wait for a wallet to finish connecting after the modal closes. */
const MODAL_CLOSE_GRACE_MS = 300;

type ConnectButtonState = {
  isConnectPending: boolean;
  openConnect: () => void;
};

const ConnectButtonContext = createContext<ConnectButtonState | undefined>(undefined);

/**
 * Connect-button state for the swap app.
 *
 * wagmi calls `reconnect()` on mount. When its store has no current connection
 * yet (the normal case on a fresh page load) that action sets the account
 * status to "connecting" - the same status a user-initiated connect produces.
 * Deriving the label from `isConnecting` alone therefore shows "Connecting..."
 * before the user has done anything, and `FlowHoverButton` disables itself
 * while loading, so the button can look stuck. A hung mount-time reconnect can
 * also race with a real connect and reset the shared status.
 *
 * Instead we watch wagmi's `connect` mutation, which only runs after the user
 * picks a wallet, and combine it with a click flag. That keeps the button
 * normal during auto-reconnect, shows "Connecting..." only for a real attempt,
 * and shares one state between the header and the in-card buttons.
 */
export function ConnectButtonStateProvider({ children }: { children: React.ReactNode }) {
  const { isConnected, status } = useAccount();
  const { openConnectModal, connectModalOpen } = useConnectModal();
  const { disconnect } = useDisconnect();

  // wagmi tags every connect mutation with this key, so it counts attempts
  // started by RainbowKit as well as by any other useConnect caller.
  const pendingConnects = useIsMutating({ mutationKey: ['connect'] });
  const isUserConnecting = pendingConnects > 0;

  const [userInitiated, setUserInitiated] = useState(false);

  const statusRef = useRef(status);
  const userInitiatedRef = useRef(userInitiated);
  const modalWasOpen = useRef(false);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    userInitiatedRef.current = userInitiated;
  }, [userInitiated]);

  // Success: the account dropdown takes over, so drop the pending flag.
  useEffect(() => {
    if (isConnected) setUserInitiated(false);
  }, [isConnected]);

  // A failed attempt needs no explicit reset: the pending state is gated by
  // the connect mutation, so it disappears as soon as that attempt settles.

  // Closing the modal without a connection is not a pending connection.
  // RainbowKit keeps the modal open while a picked wallet is connecting, so a
  // close means the user backed out. The short grace period covers a wallet
  // that connects and closes the modal in the same tick.
  useEffect(() => {
    const justClosed = modalWasOpen.current && !connectModalOpen;
    modalWasOpen.current = connectModalOpen;
    if (!justClosed || !userInitiated || isUserConnecting) return;

    const timer = setTimeout(() => {
      if (!isConnected) setUserInitiated(false);
    }, MODAL_CLOSE_GRACE_MS);
    return () => clearTimeout(timer);
  }, [connectModalOpen, isConnected, isUserConnecting, userInitiated]);

  // Safety net for wagmi's automatic reconnect: it can sit in "connecting"
  // forever when an injected provider never answers. Ignore it for UI state
  // (we already do) and cancel it so a fresh connect can start cleanly.
  // A real user-initiated attempt sets the ref and is left to its own timeout.
  // Re-arming on `userInitiated` also covers the case where the user opened
  // the modal during a hung auto-reconnect and then backed out.
  useEffect(() => {
    if (status !== 'connecting') return;

    const timer = setTimeout(() => {
      if (statusRef.current !== 'connecting' || userInitiatedRef.current) return;
      disconnect();
    }, AUTO_RECONNECT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [status, userInitiated, disconnect]);

  // Safety net for a user-initiated connect that never resolves.
  useEffect(() => {
    if (!userInitiated || !isUserConnecting) return;

    const timer = setTimeout(() => {
      if (!userInitiatedRef.current) return;
      setUserInitiated(false);
      disconnect();
    }, USER_CONNECT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [userInitiated, isUserConnecting, disconnect]);

  const openConnect = useCallback(() => {
    setUserInitiated(true);
    openConnectModal?.();
  }, [openConnectModal]);

  return (
    <ConnectButtonContext.Provider
      value={{ isConnectPending: userInitiated && isUserConnecting, openConnect }}
    >
      {children}
    </ConnectButtonContext.Provider>
  );
}

export function useConnectButtonState() {
  const context = useContext(ConnectButtonContext);
  if (!context) {
    throw new Error('useConnectButtonState must be used within ConnectButtonStateProvider');
  }
  return context;
}
