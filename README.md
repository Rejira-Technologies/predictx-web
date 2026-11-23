# PredictX Web

PredictX Web is a Next.js frontend for a Stellar-based football prediction market. Users connect a Freighter wallet, vote on match outcomes, and earn rewards when the community consensus resolves correctly.

## Prerequisites

- Node.js >= 20.9 (see `.nvmrc`)
- pnpm >= 10.11.0
- A Freighter wallet extension installed in your browser
- Stellar testnet credentials (Freighter defaults to testnet)

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start the development server |
| `pnpm build` | Build the production bundle |
| `pnpm start` | Run the production server |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript type checking without emitting |
| `pnpm test` | Run the unit-test suite once (Vitest) |
| `pnpm test:watch` | Run Vitest in watch mode (re-runs on file save) |

## Testing

Tests are written with [Vitest](https://vitest.dev/) and live in the `__tests__/` directory at the project root.

```bash
# Run all tests once (used in CI)
pnpm test

# Run in interactive watch mode during development
pnpm test:watch
```

The test environment is `jsdom` (configured in `vitest.config.ts`), so DOM APIs are available in every suite. Path alias `@/` resolves to the project root, matching the Next.js config.

**Adding new tests:** create a `__tests__/<feature>.test.ts` file. Import from `vitest` (`describe`, `it`, `expect`, `vi`) — no additional setup is needed. Follow the pattern in the existing suites:

- `__tests__/poll-question-constants.test.ts` — constant / boundary value tests
- `__tests__/upcoming-matches.test.ts` — Zustand store selector tests
- `__tests__/analytics.test.ts` — module mocking with `vi.mock` / `vi.hoisted`

Test files live in `__tests__/`. Any change that touches financial logic (`lib/calculations.ts`, `hooks/use-staking.ts`, `hooks/use-voting.ts`) must include or update unit tests.

## Development Workflow

1. Create a branch: `git checkout -b fix/your-topic`
2. Make changes, then verify: `pnpm lint && pnpm typecheck && pnpm test`
3. Open a PR against `main` and fill in the PR template

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full contributor guide, commit message conventions, and code-review process.

## Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

`.env.example` contains working testnet defaults — only change what you need. The full set of variables the app reads:

| Variable | Description | Change per network? |
|----------|-------------|---------------------|
| `NEXT_PUBLIC_STELLAR_NETWORK` | Stellar network to target (`testnet` or `mainnet`) | Yes |
| `NEXT_PUBLIC_STELLAR_HORIZON_URL` | Horizon REST endpoint | Yes |
| `NEXT_PUBLIC_STELLAR_RPC_URL` | Soroban RPC endpoint | Yes |
| `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE` | Network passphrase for signing | Yes |
| `NEXT_PUBLIC_STELLAR_EXPLORER_URL` | Block explorer base URL | Yes |
| `NEXT_PUBLIC_CONTRACT_ID` | Soroban prediction market contract ID | Yes — must be a valid 56-char StrKey |
| `NEXT_PUBLIC_CONTRACT_PREDICTION_MARKET` | Soroban prediction market contract ID (alias) | Yes |
| `NEXT_PUBLIC_CONTRACT_POLL` | Soroban poll contract ID | Yes |
| `NEXT_PUBLIC_USE_MOCK_DATA` | When `true`, use local mock data instead of on-chain state | No |
| `NEXT_PUBLIC_SITE_URL` | Public origin used as `metadataBase` for OG/Twitter URLs | Per deployment |

## Freighter Wallet Setup

1. Install the [Freighter](https://freighter.app) browser extension.
2. Create or import a wallet.
3. Switch Freighter to **Testnet** (Settings > Network > Testnet).
4. Fund your testnet account from the [Stellar Friendbot](https://laboratory.stellar.org/#friendbot?testnet=true).
5. Refresh the app and click **Connect Wallet**.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS v4
- Zustand
- @stellar/freighter-api
- Sonner (toasts)
- Framer Motion

## Product Requirements

See [`predictx-web-prd-web.md`](./predictx-web-prd-web.md) for the full product requirements document.

## License

Private — Rejira Technologies
