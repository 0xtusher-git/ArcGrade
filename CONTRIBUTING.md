# Contributing

## Branches

Create branches from `main` and never commit directly to `main`. Use a short prefix that describes the change:

- `feat/<topic>` for new functionality
- `fix/<topic>` for bug fixes
- `docs/<topic>` for documentation and repository hygiene
- `chore/<topic>` for tooling and maintenance

## Commit messages

Use the conventional prefix followed by a short imperative summary:

```text
feat: add permit2 approval step to swap
fix: handle empty walletconnect project id
docs: rewrite readme for repdex
```

Keep each commit focused. Avoid mixing unrelated formatting changes with functional changes.

## Before opening a pull request

Run both commands from the repository root and fix any errors:

```bash
npm run lint
npm run build
```

`npm run lint` currently reports warnings from existing code and exits successfully. Do not add new warnings.

## Rules

- Never commit secrets, private keys, API keys or `.env.local`. Use `.env.local.example` for documentation only.
- Never commit build output such as `.next/`, `artifacts/`, `cache/`, `typechain-types/` or logs. They are ignored by `.gitignore`.
- RepDex changes should not modify Terminal or ArcGrade code unless the change requires it. Call out any cross-area change in the pull request description.
- Do not change the wallet stack, chains or contract addresses without documenting the reason.
- Do not upgrade dependencies as part of an unrelated change.

## Pull request checklist

- The branch is based on `main` and has a descriptive name.
- `npm run build` passes.
- `npm run lint` passes with no new warnings.
- No secrets or environment files are included.
- Terminal and ArcGrade routes are unaffected, or the change is explained.
- The pull request template is filled in.
