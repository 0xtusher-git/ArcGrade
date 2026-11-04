# Self-hosted fonts

The RepDex route group (`app/(dex)`) loads Inter from a local file instead of `next/font/google`, so builds do not depend on a network request to Google Fonts.

| Field | Value |
| --- | --- |
| File | `InterVariable.woff2` |
| Source | https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip |
| Path inside archive | `web/InterVariable.woff2` |
| Release | Inter v4.1, published 2024-11-16 |
| Downloaded | 2026-11-04 |
| SHA-256 | `693B77D4F32EE9B8BFC995589B5FAD5E99ADF2832738661F5402F9978429A8E3` |
| License | SIL Open Font License 1.1 |

The root layout (`app/layout.tsx`) still uses `next/font/google` for Plus Jakarta Sans and is intentionally unchanged.
