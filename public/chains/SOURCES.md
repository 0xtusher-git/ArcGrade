# Chain logo sources

All logos are downloaded once and served locally from `/public/chains`. Nothing
is hotlinked. Testnets use their parent network's official logo, as requested.

| Chain | File | Source | Retrieved |
| --- | --- | --- | --- |
| Arc Testnet | `arc.png` (192×192) | https://docs.arc.io/mintlify-assets/_mintlify/favicons/arcio-docs/ugo0LlJBZEAW3ukk/_generated/favicon-dark/android-chrome-192x192.png | 2026-11-01 |
| Arbitrum Sepolia | `arbitrum.png` (256×256) | https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png | 2026-11-01 |
| Avalanche Fuji | `avalanche.png` (256×256) | https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png | 2026-11-01 |
| Base Sepolia | `base.png` (256×256) | https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png | 2026-11-01 |
| Codex Testnet | `codex.png` (180×180) | https://codex.xyz/apple-touch-icon.png | 2026-11-01 |
| Ethereum Sepolia | `ethereum.png` (192×192) | https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png | 2026-11-01 |
| HyperEVM Testnet | `hyperevm.png` (192×192) | https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/hyperevm/info/logo.png | 2026-11-01 |
| Ink Testnet | `ink.svg` (vector) | https://raw.githubusercontent.com/inkonchain/ink-kit/main/src/icons/Logo/Ink.svg | 2026-11-01 |
| Linea Sepolia | `linea.png` (256×256) | https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/linea/info/logo.png | 2026-11-01 |
| OP Sepolia | `optimism.png` (256×256) | https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png | 2026-11-01 |
| Plume Testnet | `plume.png` (180×180) | https://www.plume.org/apple-icon-180x180.png | 2026-11-01 |
| Polygon PoS Amoy | `polygon.png` (406×406) | https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png | 2026-11-01 |
| Sei Testnet | `sei.png` (256×256) | https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/sei/info/logo.png | 2026-11-01 |
| Sonic Testnet | `sonic.png` (256×256) | https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/sonic/info/logo.png | 2026-11-01 |
| Unichain Sepolia | `unichain.png` (360×360) | https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/unichain/info/logo.png | 2026-11-01 |
| World Chain Sepolia | `worldchain.png` (180×180) | https://world.org/favicon/apple-touch-icon.png | 2026-11-01 |
| XDC Apothem | `xdc.png` (180×180) | https://xdc.org/apple-touch-icon.png | 2026-11-01 |

Notes:

- The Trust Wallet `arc` entry is a USDC asset, not the Arc chain mark, so the
  Arc logo comes from the official `docs.arc.io` favicon set instead.
- Codex, Plume, World Chain, and XDC logos are the 180×180 official site icons.
- Ink is the official SVG from the `inkonchain/ink-kit` repository.
- Unichain is the official logo from the `Uniswap/assets` repository.
- The `ChainIcon` component falls back to a letter if any file fails to load.
