# Token logo sources

All logos are downloaded once and served locally from `/public/tokens`. Nothing
is hotlinked, redrawn, recolored, traced, or generated.

| Token | File | Source | Retrieved |
| --- | --- | --- | --- |
| USDC | `usdc.png` (181×181) | https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png | 2026-11-01 |
| EURC | `eurc.png` (256×256) | https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c/logo.png | 2026-11-01 |
| cirBTC | `cirbtc.svg` (24×24 viewBox, vector) | https://faucet.circle.com/_next/static/chunks/3239-8cc7e459ed0474bc.js | 2026-11-01 |
| WETH | `weth.png` (192×192) | https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png | 2026-11-01 |

USDC and EURC are the issuer-published Circle token assets mirrored by the
Trust Wallet assets repository (the `info.json` for each entry lists circle.com /
centre.io as the project website). The WETH file is the canonical wrapped-ether
asset logo from the same repository.

## cirBTC

Circle's testnet faucet ships the official cirBTC token mark in its CIRBTC icon
component. The three path `d` values, the `#fff` fills, and the `#A87DFF` →
`#199DEA` gradient in `cirbtc.svg` are copied verbatim from that bundle; nothing
was redrawn or recolored. The file is served as a local SVG.

## Unavailable official logos

None. All four tokens ship an official logo; the letter fallback (`U`, `E`, `C`,
`W`) is still implemented for load failures.
