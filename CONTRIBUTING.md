# Contributing

Thanks for taking the time to contribute to HandoffKit.

## Workflow

1. Branch from `main`, one concern per branch.
2. Small, signed commits with conventional prefixes: `feat`, `fix`, `chore`, `docs`, `test`, `ci`, `refactor`, `style`, `perf`, `assets`.
3. Open a pull request to `main`. Keep the diff reviewable.
4. CI must be green before merge.

## Checks

```bash
npm ci
npm run typecheck
npm test
npm run build:web
npm run test:e2e
```

## Structure

- `packages/core`: deterministic n8n parser, audit, Markdown, PDF, entitlements and billing helpers. No runtime dependency beyond `pdf-lib`.
- `apps/web`: Next.js 16 app. Routes under `src/app`.

## Rules

- Never commit `.env.local` or any real credential.
- No LLM in the analysis path. Analysis must stay deterministic.
- Public text: no em dashes, no audience framing.
- This repository is public. Never commit credentials, prospect lists or audience framing.
