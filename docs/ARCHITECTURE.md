# Architecture

This document describes the repository as it is today. It is documentation only; no files are moved by this change.

## Current structure

The repository is a single Next.js 14 App Router application that contains three areas with different responsibilities and different wallet stacks.

### Terminal

- Entry: `app/page.tsx`, which renders `app/TerminalPage.tsx`.
- The root layout `app/layout.tsx` mounts `WalletProvider` from `hooks/useWallet.tsx` and imports `app/globals.css`.
- The Terminal is a landing page. It links to `/swap` and `/arcgrade`.
- The legacy wallet context targets Arc mainnet and uses `NEXT_PUBLIC_CHAIN_ID`, defaulting to 5042.

### ArcGrade

- Routes: `app/(arcgrade)/arcgrade`, `leaderboard`, `my-score`, `score/[address]`, `challenge`, `deploy` and `api-docs`.
- Layout: `app/(arcgrade)/layout.tsx` imports RainbowKit's stylesheet and mounts `components/ArcGradeProviders.tsx`.
- Wallet stack: `lib/arcgradeWagmi.ts` defines a mainnet-only wagmi config using `lib/dexConfig.ts` and `lib/contract.ts` values.
- Server routes: `app/api/analyze`, `app/api/leaderboard` and `app/api/v1/*`.
- Shared logic: `lib/arcApi.ts` fetches wallet data, `lib/scoring.ts` computes the score, `lib/contract.ts` reads and writes the ArcTrust (ArcGrade) contract, and `lib/api-middleware.ts` provides CORS and rate limiting.
- UI: `components/Navbar.tsx`, `components/WalletPicker.tsx`, `components/ScoreRing.tsx` and other shared components.
- The browser extension source lives in `chrome-extension/`; the downloadable archive is `public/arcgrade-extension.zip`.

### RepDex app

- Routes: `app/(dex)/swap`, `bridge` and `liquidity`.
- Layout: `app/(dex)/layout.tsx` imports `app/(dex)/app.css` and mounts `app/(dex)/providers.tsx`.
- Wallet stack: `lib/appWagmi.ts` defines a testnet-only wagmi config for Arc Testnet (5042002).
- Swap logic: `app/(dex)/DexView.tsx` plus `app/(dex)/lib/abis.ts`, `app/(dex)/lib/bridgeChains.ts`, `app/(dex)/lib/format.ts`, `app/(dex)/hooks/useDexTokens.ts` and `app/(dex)/hooks/useTokenSearch.ts`.
- Chain and token configuration: `lib/appChain.ts` and `lib/dexConfig.testnet.ts`.
- The bridge and liquidity tabs are UI scaffolds. Their action buttons are disabled.

### Contracts and scripts

- `contracts/ArcGrade.sol` is the ArcTrust (ArcGrade) reputation contract.
- `lib/abi/ArcGrade.json` holds the ABI and bytecode used by `scripts/deploy-standalone.js`.
- `scripts/deploy.cjs` is the Hardhat deploy script; `scripts/deploy-standalone.js` deploys with ethers and `DEPLOYER_PRIVATE_KEY`.
- `hardhat.config.cjs` reads the RPC URL and deployer key from the environment only.

### Cross-cutting concerns

- `lib/scoring.ts` is shared by the API routes and the ArcGrade pages.
- `lib/arcApi.ts` is server-side and talks to Arc mainnet RPC and explorer APIs.
- `app/api/v1/*` is the public, CORS-enabled API documented in `app/(arcgrade)/api-docs/page.tsx`.

## Proposed future structure

The following layout is a direction, not a current state. It would make the three areas easier to reason about without changing behavior.

```text
app/
├── (terminal)/          Terminal landing page
├── (arcgrade)/          ArcGrade pages and API routes
└── (dex)/               RepDex swap, bridge and liquidity
lib/
├── shared/              chain constants, formatting, HTTP helpers
├── arcgrade/            scoring, arc API client, contract helpers
└── dex/                 swap config, token lists, ABIs
components/
├── shared/              Navbar, buttons, icons
├── arcgrade/
└── dex/
```

Suggested steps:

1. Move shared chain constants and formatting helpers into `lib/shared`.
2. Group ArcGrade-specific logic under `lib/arcgrade` and RepDex-specific logic under `lib/dex`.
3. Move area-specific components under matching `components/` subfolders.
4. Add a `(terminal)` route group if the Terminal gains its own layout.
5. Keep one wagmi config per area. Do not share a config between Arc mainnet and Arc Testnet.

Any move should be a separate pull request with no behavior changes, and the route table in `README.md` should be updated in the same change.
