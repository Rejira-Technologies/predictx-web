# Issue Fix Batches

Summary of the batched issue fixes implemented for `Rejira-Technologies/predictx-web`,
the verification run for each batch, and the PRs created.

## Batch 1 — #471, #472, #474, #475

Commit `44b69c7` · PR [#655](https://github.com/Rejira-Technologies/predictx-web/pull/655)

- Raised TypeScript `target` from ES6 to ES2022 for BigInt/Soroban support.
- Repaired poll fixtures with `createdAt` and `lockTargetISO`.
- Removed duplicate completed-stake fixture keys and recalculated payout values.
- Strengthened contract-write tests with Soroban/Freighter mocks, decoded
  arguments, method assertions, and failed-simulation error mapping.

## Batch 2 — #476, #477, #478, #479

Commit `321acb5` · PR [#657](https://github.com/Rejira-Technologies/predictx-web/pull/657)

- `pollToScVal`/`stakeToScVal` tests assert ScVal discriminants and decode via
  `scValToNative` with exact field/amount assertions.
- Corrected profit-calculation expectations for a loss scenario (exact
  gross/net/profit/ROI values).
- Extracted shared `isValidPollQuestionLength` predicate, wired it into the
  create-poll modal, and added render-level Next-button enable/disable tests.
- Strengthened `claimStake` payout and ledger assertions (gross/net,
  `updateBalance`, ledger amounts).

## Batch 3 — #480, #481, #482, #483

Commit `18ffe19` · PR [#660](https://github.com/Rejira-Technologies/predictx-web/pull/660)

- Replaced mocked staking-store tests with real Zustand store accounting tests
  (`placeStake` → pool totals, `stakeCount`, distinct-staker `participants`).
- Reworked CSS cascade tests to assert `getComputedStyle` under an emulated
  stylesheet (jsdom can't parse `@layer`/evaluate `@media`), catching real
  overrides; also fixed a `globals.css` merge splice that applied the
  reduced-motion backstop unconditionally.
- Removed explicit `any` and an unused React import from tests.
- Issue-creation workflow now aborts on `gh issue list` failure instead of
  treating it as zero duplicates.

## Batch 4 — #440, #484, #485, #486

Commit `9333097` · PR [#662](https://github.com/Rejira-Technologies/predictx-web/pull/662)

- Removed duplicate `return (` in `ProcessingOverlay` so the staking barrel
  compiles.
- Added Node/pnpm `engines` and `.nvmrc`, updated README/CONTRIBUTING
  prerequisites to Node >= 20.9, aligned `@types/node` with CI's Node 20.
- Replaced fake README contract IDs with `.env.example` setup instructions and
  documented all environment variables the code reads.

## Batch 5 — #466, #467, #469, #470

Commit `2e49b74` · PR [#664](https://github.com/Rejira-Technologies/predictx-web/pull/664)

- Fixed broken ESLint flat config to use `eslint-config-next` native flat
  exports (`core-web-vitals` + `typescript`); this revived a dead lint gate and
  surfaced 72 pre-existing violations, all fixed (unused vars/imports, `any`
  casts, JSX entities, `require()` cycles, React Compiler-era hook rules).
- Canvas particle shadow properties now set before `fill()` so the glow renders.
- Wallet connect keeps buttons focusable (`aria-disabled`), adds a
  `role="status"` live region and `aria-busy` on the wallet list.
- `GamingTabs` re-measures the active-tab indicator on resize via
  `ResizeObserver` + window `resize` listener.

## Batch 6 — #438, #439, #443, #487

Commit `a9a64e7` · PR [#665](https://github.com/Rejira-Technologies/predictx-web/pull/665)

- `gaming-button.tsx`: single `handleClick` (`React.MouseEvent<HTMLElement>`)
  with merged `disabled || loading || success` guard; disabled links cannot
  navigate.
- `NEXT_PUBLIC_USE_MOCK_DATA` parsed strictly: only `"true"` enables mocks,
  unset defaults to mock only outside production, invalid values resolve to
  live, and production mock mode logs a warning.
- Net Profit `AnimatedCounter` receives `Math.abs(winnings.profit)` so losing
  estimates render `-$12.00` instead of `-$-12.00`.
- `BadgeComponent` uses `useReducedMotion()` so unlocked badges no longer throw.

## Verification

Each batch was verified with the repository's checks before commit:

- `pnpm test` — 109–112 tests passing depending on batch
- `pnpm typecheck` — clean (`tsc --noEmit` + `tsconfig.test.json`)
- `pnpm lint` — 0 errors for the lint batch (1 pre-existing `<img>` warning)

## Notes

- PR heads were pushed to the `gelluisaac` fork; this repo (`efuncode`) is the
  working remote.
- Several batches re-apply shared merge-splice repairs (duplicate returns,
  spliced imports, fixture keys, tsconfig target), so sibling PRs touching the
  same files may need small conflict resolutions on merge.
