// Type declarations for window.ethereum and EIP-6963 wallet discovery
interface EthereumProvider {
  providers?: EthereumProvider[];
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
  isCoinbaseBrowser?: boolean;
  isCoinbaseWallet?: boolean;
  isRabby?: boolean;
  isOKXWallet?: boolean;
  isTrust?: boolean;
  isBraveWallet?: boolean;
  isTokenPocket?: boolean;
  isBitKeep?: boolean;
  isBitgetWallet?: boolean;
  isTalisman?: boolean;
  isSafe?: boolean;
  isLedgerConnect?: boolean;
  isFrame?: boolean;
  isExodus?: boolean;
  isPhantom?: boolean;
  isOpera?: boolean;
}

interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EthereumProvider;
}

interface EIP6963AnnounceProviderEvent extends Event {
  detail: EIP6963ProviderDetail;
}

interface Window {
  ethereum?: EthereumProvider;
}