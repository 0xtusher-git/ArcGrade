# Security Policy

## Reporting a vulnerability

Do not open a public issue for security problems. Report them privately through GitHub's private vulnerability reporting:

1. Open the repository on GitHub.
2. Go to the **Security** tab.
3. Select **Report a vulnerability**.
4. Describe the issue, the affected route or contract, and the steps to reproduce it.

Include the impact you believe the issue has and any suggested fix. Reports are reviewed before any public disclosure.

## Scope

This policy covers the Next.js application, the API routes, the ArcTrust (ArcGrade) smart contract in `contracts/ArcGrade.sol`, and the Chrome extension in `chrome-extension/`.

## Secrets

Never commit private keys, API keys or `.env.local`. If you believe a secret was committed, report it privately and rotate the affected credential immediately.
