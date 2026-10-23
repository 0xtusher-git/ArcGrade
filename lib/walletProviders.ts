export interface DetectedWallet {
  id: string;
  name: string;
  icon: string | null;
  provider: EthereumProvider;
}

const NAME_FLAGS: [string, string][] = [
  ['isCoinbaseBrowser', 'Coinbase Wallet'],
  ['isCoinbaseWallet', 'Coinbase Wallet'],
  ['isMetaMask', 'MetaMask'],
  ['isRabby', 'Rabby'],
  ['isOKXWallet', 'OKX Wallet'],
  ['isTrust', 'Trust Wallet'],
  ['isBraveWallet', 'Brave Wallet'],
  ['isTokenPocket', 'TokenPocket'],
  ['isBitgetWallet', 'Bitget Wallet'],
  ['isBitKeep', 'Bitget Wallet'],
  ['isTalisman', 'Talisman'],
  ['isLedgerConnect', 'Ledger'],
  ['isFrame', 'Frame'],
  ['isSafe', 'Safe'],
  ['isExodus', 'Exodus'],
  ['isPhantom', 'Phantom'],
  ['isOpera', 'Opera Wallet'],
];

function providerName(p: EthereumProvider): string {
  if (!p || typeof p !== 'object') return 'Wallet';
  for (const [flag, name] of NAME_FLAGS) {
    if ((p as unknown as Record<string, boolean | undefined>)[flag]) return name;
  }
  return 'Wallet';
}

export function legacyEthereumProviders(): EthereumProvider[] {
  if (typeof window === 'undefined' || !window.ethereum) return [];
  const eth = window.ethereum;
  if (Array.isArray(eth.providers) && eth.providers.length > 0) return eth.providers;
  return [eth];
}

export function scanEIP6963(onWallet: (wallet: DetectedWallet) => void): () => void {
  const handler = (event: EIP6963AnnounceProviderEvent) => {
    const detail = event.detail;
    if (!detail || !detail.provider) return;
    const info = detail.info;
    onWallet({
      id: info?.rdns ?? info?.uuid ?? `eip-${info?.name ?? 'wallet'}-${Math.random()}`,
      name: info?.name ?? 'Wallet',
      icon: info?.icon ?? null,
      provider: detail.provider,
    });
  };

  window.addEventListener('eip6963:announceProvider', handler as EventListener);
  window.dispatchEvent(new CustomEvent('eip6963:requestProvider'));

  return () => {
    window.removeEventListener('eip6963:announceProvider', handler as EventListener);
  };
}

export function detectLegacyWallet(provider: EthereumProvider): DetectedWallet {
  return {
    id: `legacy-${providerName(provider).toLowerCase().replace(/\s+/g, '-')}`,
    name: providerName(provider),
    icon: null,
    provider,
  };
}