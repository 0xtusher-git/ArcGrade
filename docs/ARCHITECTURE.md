# Architecture

This document describes the repository as it is today, including the route groups that separate the Terminal, ArcGrade, and RepDex areas.

## Application shape

The repository is a single Next.js 14 App Router application. `app/layout.tsx` is the only root layout: it imports `app/globals.css`, sets the site metadata, and mounts the legacy wallet context from `hooks/useWallet.tsx` around every route. No current page reads that context; the two application areas use their own wallet stacks.

### Terminal

- Entry: `app/page.tsx`, which renders `app/TerminalPage.tsx`.
- Landing page that links to `/swap` and `/arcgrade`.
- No wallet stack of its own.

### ArcGrade route group

- Layout: `app/(arcgrade)/layout.tsx` imports RainbowKit's stylesheet and mounts `ArcGradeProviders` from `components/ArcGradeProviders.tsx`.
- Provider stack: `WagmiProvider` with `arcGradeConfig`, `QueryClientProvider`, and `RainbowKitProvider`.
- Wallet config: `lib/arcgradeWagmi.ts` defines `arcMainnet` (chain 5042, using `ARC_CHAIN_ID`, `ARC_RPC_URL`, and `ARC_EXPLORER_URL` from `lib/dexConfig.ts`) and `arcGradeConfig`. Connectors are injected, MetaMask, Coinbase, Bitget, and OKX, plus WalletConnect when `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set.
- Wallet hook: `hooks/useArcGradeWallet.tsx` wraps `useAccount`, `useConnectModal`, `useDisconnect`, and `useSwitchChain` behind the same shape the pages used before (`address`, `isConnected`, `connect`, `switchNetwork`, `isCorrectNetwork`).
- Pages: `app/(arcgrade)/api-docs`, `arcgrade`, `challenge`, `deploy`, `leaderboard`, `my-score`, and `score/[address]`.
- `components/Navbar.tsx` also uses `useArcGradeWallet`. The legacy `hooks/useWallet.tsx` context and `components/WalletPicker.tsx` remain in the repository but are not used by the current pages.
- Server routes are outside the route group: `app/api/analyze`, `app/api/leaderboard`, and `app/api/v1/*`.
- Shared logic: `lib/arcApi.ts` fetches wallet data, `lib/scoring.ts` computes the score, `lib/contract.ts` reads and writes the ArcTrust (ArcGrade) contract, and `lib/api-middleware.ts` provides CORS and rate limiting.
- UI: `components/Navbar.tsx`, `components/ScoreRing.tsx`, `components/SearchBar.tsx`, `components/StatCard.tsx`, and `components/ui/`.
- The browser extension source lives in `chrome-extension/`; the downloadable archive is `public/arcgrade-extension.zip`.

### RepDex route group

- Layout: `app/(dex)/layout.tsx` imports `app/(dex)/app.css`, mounts `AppProviders` from `app/(dex)/providers.tsx` and `ImportedTokensProvider` from `app/(dex)/imported-tokens.tsx`, renders `AppHeader`, and redirects the old `/swap#bridge` and `/swap#liquidity` links to the real routes.
- Provider stack: `WagmiProvider` with `appConfig`, `QueryClientProvider`, and `RainbowKitProvider` (wide modal, cyan accent).
- Wallet config: `lib/appWagmi.ts` targets `arcTestnet` from `lib/appChain.ts` (chain 5042002). Connectors are injected, MetaMask, and Bitget, plus WalletConnect when a project ID is set; other installed wallets are discovered through EIP-6963.
- Pages: `app/(dex)/swap`, `bridge`, and `liquidity`.
- Swap logic: `app/(dex)/DexView.tsx`, `app/(dex)/lib/abis.ts`, `app/(dex)/lib/format.ts`, `app/(dex)/hooks/useTokenSearch.ts`, `app/(dex)/hooks/useDexTokens.ts`, and the token selector components under `app/(dex)/components/`.
- Token and pool configuration: `lib/dexConfig.testnet.ts`. `DEX_TOKENS` is USDC, EURC, cirBTC, and WETH with official Arc Testnet addresses; `NEXT_PUBLIC_TOKEN_CIRBTC` and `NEXT_PUBLIC_TOKEN_WETH` overrides are validated before use. `POOLS` is empty, so no pair has a configured pool and the swap action stays disabled.
- Bridge chains: `app/(dex)/lib/bridgeChains.ts` lists Arc Testnet plus 16 EVM testnets, built on viem chain definitions and locally hosted logos from `public/chains/`.
- The bridge and liquidity pages are UI scaffolds; their action buttons are disabled.

### Static assets

- `public/tokens/` and `public/chains/` hold locally hosted token and chain logos, with attribution in the matching `SOURCES.md` files.
- `public/repdex-favicon-32.png`, `public/repdex-favicon-192.png`, and `public/repdex-apple-touch-icon.png` are the RepDex favicons referenced by the metadata in `app/(dex)/layout.tsx`.

### Contracts and scripts

- `contracts/ArcGrade.sol` is the ArcTrust (ArcGrade) reputation contract.
- `lib/abi/ArcGrade.json` holds the ABI and bytecode used by `scripts/deploy-standalone.js`.
- `scripts/deploy.cjs` is the Hardhat deploy script; `scripts/deploy-standalone.js` deploys with ethers and `DEPLOYER_PRIVATE_KEY`.
- `hardhat.config.cjs` reads the RPC URL and deployer key from the environment only.

### Cross-cutting concerns

- `lib/scoring.ts` is shared by the API routes and the ArcGrade pages.
- `lib/arcApi.ts` is server-side and talks to Arc mainnet RPC and explorer APIs.
- `app/api/v1/*` is the public, CORS-enabled API documented in `app/(arcgrade)/api-docs/page.tsx`.

## Wallet isolation

There are two wagmi configs, one per area:

| Config | Chain | Mounted by |
| --- | --- | --- |
| `lib/appWagmi.ts` (`appConfig`) | Arc Testnet 5042002 | `app/(dex)/providers.tsx` |
| `lib/arcgradeWagmi.ts` (`arcGradeConfig`) | Arc mainnet 5042 | `components/ArcGradeProviders.tsx` |

The two configs are intentionally not shared. The legacy `WalletProvider` in the root layout does not provide either of them.
