# Contributing to PredictX Web

Thank you for your interest in contributing! PredictX Web is part of the Stellar Wave programme. This guide covers everything you need to get a change from idea to merged PR.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Issue and PR Guidelines](#issue-and-pr-guidelines)

---

## Code of Conduct

Be respectful, collaborative, and constructive. We follow the [Contributor Covenant](https://www.contributor-covenant.org/) — harassment, discrimination, or hostile behaviour of any kind will not be tolerated.

---

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 10.11.0
- A Freighter wallet extension (for manual testing)

### Setup

```bash
# Clone and install
git clone https://github.com/rejira-technologies/predictx-web.git
cd predictx-web
pnpm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local as needed (mock data is on by default)

# Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Development Workflow

1. **Fork** the repository and create a feature branch from `main`:
   ```bash
   git checkout -b fix/short-description
   # or
   git checkout -b feat/short-description
   ```

2. **Write code.** Follow the conventions already in the codebase:
   - TypeScript strict mode — no `any` without justification
   - Tailwind CSS v4 utility classes — no inline styles unless unavoidable
   - Zustand for global state; React state for local UI state
   - Financial logic lives in `lib/calculations.ts` — keep it pure and unit-tested

3. **Lint and type-check** before committing:
   ```bash
   pnpm lint
   pnpm typecheck
   ```

4. **Run tests:**
   ```bash
   pnpm test
   ```
   All new features and bug fixes should include tests. Financial logic changes *must* include unit tests (see [Testing](#testing)).

5. **Commit** using [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   feat: add analytics opt-out toggle to settings page
   fix: claimStake double-charges platform fee on edge case
   test: add unit tests for calculateCompletedPayout
   docs: update CONTRIBUTING with testing guide
   ```

---

## Testing

PredictX Web uses [Vitest](https://vitest.dev/) with jsdom.

### Running Tests

| Command | Description |
|---------|-------------|
| `pnpm test` | Run all tests once |
| `pnpm test:watch` | Watch mode — re-run on file change |

Tests live in `__tests__/`. Each file maps to a module under `lib/` or `hooks/`.

### What Must Be Tested

Any change touching **financial logic** requires unit tests:

- `lib/calculations.ts` — `calculateCompletedPayout`, `calculatePotentialWinnings`
- `hooks/use-staking.ts` — `placeStake`, `claimStake` (pool mutations, payout derivation)
- `hooks/use-voting.ts` — `settleRewards` (reward crediting logic)

Pure functions like `calculateCompletedPayout` are straightforward to test in isolation. Store functions should mock their Zustand dependencies.

### Writing Tests

```typescript
// __tests__/calculations.test.ts
import { describe, it, expect } from "vitest";
import { calculateCompletedPayout } from "@/lib/calculations";

describe("calculateCompletedPayout", () => {
  it("deducts 5% platform fee from gross payout", () => {
    const result = calculateCompletedPayout(100, 200);
    expect(result.fee).toBeCloseTo(10); // 5% of 200
    expect(result.net).toBeCloseTo(190);
  });
});
```

---

## Submitting Changes

1. Push your branch and open a Pull Request against `main`.
2. Fill in the PR template — describe *what* changed and *why*.
3. Ensure CI passes (lint, typecheck, tests).
4. Request a review from a maintainer.
5. Address review feedback; maintainers merge when approved.

### PR Size

Keep PRs focused. A PR that fixes one bug or adds one feature is much easier to review than a PR that does everything at once. If your change is large, split it into sequential PRs.

---

## Issue and PR Guidelines

- Search existing issues before opening a new one.
- Use the provided issue templates (bug report / feature request).
- Reference related issues in your PR: `Closes #123`.
- Do not include generated files (`.next/`, `node_modules/`) in commits.

---

## Questions?

Open a [GitHub Discussion](../../discussions) or reach out in the project's Discord channel.
