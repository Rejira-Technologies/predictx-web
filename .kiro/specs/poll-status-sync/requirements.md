# Requirements Document

## Introduction

PredictX polls follow a lifecycle — `active` → `locked` → `voting` → `resolved` — but the UI
currently has no mechanism to detect transitions that occur while a user is on the page.
Countdown timers (`use-countdown.ts`) tick locally, but nothing re-reads status from the chain or
backend indexer, so the voting window can silently open or close without the UI reacting.

This feature introduces **Poll Status Sync**: a chain-sync service that polls the on-chain
`get_poll_status` endpoint (or oracle status) on a configurable interval, detects status
transitions, updates the global poll store, and surfaces contextual toasts ("Voting is open",
"Poll resolved") exactly once per transition. The UI components — stake controls, vote controls,
and result banners — react to the live status without a page reload.

---

## Glossary

- **PollStatusSync**: The background service responsible for periodically fetching and
  reconciling poll status from the chain.
- **StatusTransition**: A change in a poll's `PollStatus` from one value to another (e.g.
  `locked` → `voting`).
- **usePollStatus**: The React hook that encapsulates PollStatusSync for a single poll and
  exposes the current status, loading state, and error state to components.
- **TransitionToast**: A transient notification shown exactly once per `StatusTransition` per
  poll per browser session.
- **SyncInterval**: The configurable period (in milliseconds) between consecutive status-fetch
  requests for a given poll.
- **PollStore**: The Zustand store (`useMockData`) that holds all poll state accessible to UI
  components.
- **StakeUI**: The staking controls (stake button, stake modal) rendered on a poll card.
- **VoteUI**: The voting controls (YES / NO / UNCLEAR buttons) rendered on the voting card.
- **ResultBanner**: The resolved-state UI that displays the final outcome and "claim winnings"
  call to action.
- **NotificationSystem**: The existing `sonner`-based toast infrastructure
  (`components/ui/sonner.tsx`, `AchievementToast`).
- **Horizon**: The Stellar REST API used to query on-chain ledger data.
- **SorobanRPC**: The Soroban JSON-RPC endpoint used to invoke read-only contract functions such
  as `get_poll_status`.

---

## Requirements

### Requirement 1: Periodic Status Polling

**User Story:** As a user viewing a poll, I want the poll status to refresh automatically so
that I see the current lifecycle state without reloading the page.

#### Acceptance Criteria

1. WHEN `usePollStatus(pollId)` is mounted, THE PollStatusSync SHALL begin fetching poll status
   from the data source at a `SyncInterval` of no more than 30 seconds.
2. WHEN `usePollStatus(pollId)` is unmounted, THE PollStatusSync SHALL stop all in-flight
   requests and cancel the polling interval for that poll.
3. THE PollStatusSync SHALL expose an `isLoading` boolean that is `true` only during the initial
   fetch, not on subsequent background refreshes.
4. THE PollStatusSync SHALL expose a `lastSyncedAt` timestamp reflecting the ISO datetime of the
   most recent successful fetch.
5. WHERE the Soroban RPC endpoint is unavailable, THE PollStatusSync SHALL fall back to the mock
   data layer and continue polling at the same `SyncInterval`.

---

### Requirement 2: Status Transition Detection

**User Story:** As a platform operator, I want the system to detect poll lifecycle transitions
so that all downstream reactions (UI updates, toasts) are triggered deterministically.

#### Acceptance Criteria

1. WHEN a fetch returns a `PollStatus` value that differs from the value currently held in the
   PollStore, THE PollStatusSync SHALL classify the change as a `StatusTransition` and dispatch
   it to the PollStore.
2. THE PollStatusSync SHALL detect all four forward transitions:
   `active` → `locked`, `locked` → `voting`, `voting` → `resolved`, and
   `active` → `locked` → `voting` (multi-step if multiple intervals were missed).
3. IF a fetched status is identical to the stored status, THEN THE PollStatusSync SHALL discard
   the response without dispatching any updates.
4. IF a fetched status represents a backward transition (e.g. `resolved` → `active`), THEN
   THE PollStatusSync SHALL log a warning and discard the response without updating the store.

---

### Requirement 3: PollStore Live Updates

**User Story:** As a developer, I want status transitions to be written to the PollStore so that
all components reading from the store automatically reflect the latest lifecycle state.

#### Acceptance Criteria

1. WHEN a `StatusTransition` is dispatched, THE PollStore SHALL update the `status` field of the
   affected poll to the new `PollStatus` value.
2. WHEN the PollStore updates a poll's status to `voting`, THE PollStore SHALL also update the
   poll's `recentActivity` field to indicate that community voting is open.
3. WHEN the PollStore updates a poll's status to `resolved`, THE PollStore SHALL also set the
   poll's `outcome` field to the resolved value returned by the data source, if available.
4. THE PollStore update SHALL be atomic: `status`, `recentActivity`, and `outcome` SHALL be
   written in a single `set()` call so no component observes a partially-updated poll.

---

### Requirement 4: StakeUI Lifecycle Reactions

**User Story:** As a staker, I want the stake controls to automatically lock when the staking
window closes so that I cannot accidentally attempt a transaction that will be rejected on-chain.

#### Acceptance Criteria

1. WHILE a poll's `status` is `active`, THE StakeUI SHALL render the "Stake Now" button in an
   enabled, interactive state.
2. WHEN a poll's `status` transitions to `locked` (or any later status), THE StakeUI SHALL
   render the "Stake Now" button in a disabled state and display a "Staking closed" label.
3. IF a user attempts to submit a stake while the poll's `status` is `locked`, THEN THE StakeUI
   SHALL display an inline error message indicating that staking is no longer available for this
   poll.
4. THE StakeUI SHALL derive its enabled/disabled state exclusively from the PollStore `status`
   field, not from local countdown expiry, so that the two sources of truth cannot diverge.

---

### Requirement 5: VoteUI Lifecycle Reactions

**User Story:** As a community voter, I want the voting controls to become available exactly
when the voting window opens so that I can cast my resolution vote at the correct time.

#### Acceptance Criteria

1. WHILE a poll's `status` is `active` or `locked`, THE VoteUI SHALL render the voting buttons
   (YES / NO / UNCLEAR) in a disabled state.
2. WHEN a poll's `status` transitions to `voting`, THE VoteUI SHALL enable the voting buttons
   without requiring a page reload.
3. WHILE a poll's `status` is `voting`, THE VoteUI SHALL display the remaining voting deadline
   countdown using `useCountdown`.
4. WHEN a poll's `status` transitions to `resolved`, THE VoteUI SHALL hide the voting buttons
   and render the ResultBanner in their place.

---

### Requirement 6: ResultBanner Display

**User Story:** As a staker, I want to see the final outcome and a "claim winnings" prompt
appear automatically when a poll resolves so that I know when my winnings are available.

#### Acceptance Criteria

1. WHEN a poll's `status` transitions to `resolved`, THE ResultBanner SHALL become visible in
   the poll card and voting card without a page reload.
2. WHEN the ResultBanner is visible, THE ResultBanner SHALL display the resolved `outcome`
   (`yes` or `no`) and the total pool size.
3. WHERE the user has an active stake on the winning side, THE ResultBanner SHALL render a
   "Claim Winnings" button in an enabled state.
4. WHERE the user has an active stake on the losing side, THE ResultBanner SHALL display a
   "Better luck next time" message without a "Claim Winnings" button.

---

### Requirement 7: Transition Toast Notifications

**User Story:** As a user on the page when a poll changes state, I want a brief contextual
notification so that I am immediately aware of the transition without having to scan the UI.

#### Acceptance Criteria

1. WHEN a poll transitions to `voting`, THE NotificationSystem SHALL display a TransitionToast
   with the message "Voting is open" and the poll question as a subtitle.
2. WHEN a poll transitions to `resolved`, THE NotificationSystem SHALL display a TransitionToast
   with the message "Poll resolved" and the outcome as a subtitle.
3. THE NotificationSystem SHALL display at most one TransitionToast per poll per `StatusTransition`
   event; reconnect or re-mount cycles SHALL NOT produce duplicate toasts for a transition that
   has already been shown in the current browser session.
4. THE NotificationSystem SHALL use the existing `AchievementToast` component and `sonner`
   infrastructure for all TransitionToast renders.
5. IF the user is not on a page that displays the affected poll, THEN THE NotificationSystem
   SHALL NOT show a TransitionToast for that poll.

---

### Requirement 8: Error Handling and Resilience

**User Story:** As a user on a flaky network connection, I want the sync service to recover
gracefully so that a temporary disconnect does not permanently break live updates.

#### Acceptance Criteria

1. IF a status fetch request fails (network error or non-2xx response), THEN THE PollStatusSync
   SHALL retry the request using exponential back-off, with a maximum of 3 retries before
   entering a degraded state.
2. WHILE THE PollStatusSync is in a degraded state, THE usePollStatus hook SHALL expose an
   `error` field with a human-readable description of the last failure.
3. WHEN network connectivity is restored, THE PollStatusSync SHALL automatically resume normal
   polling without requiring a page reload or user action.
4. IF all 3 retries are exhausted, THEN THE PollStatusSync SHALL fall back to displaying the
   last known status from the PollStore without clearing or corrupting existing data.
5. THE PollStatusSync SHALL not throw unhandled promise rejections; all fetch errors SHALL be
   caught and forwarded to the `error` state exposed by `usePollStatus`.

---

### Requirement 9: Deduplication Across Sessions

**User Story:** As a user who navigates away and returns to a poll page, I want transition
toasts to fire only for new transitions — not replay ones I already saw — so that I am not
confused by stale notifications.

#### Acceptance Criteria

1. THE NotificationSystem SHALL persist the set of `(pollId, fromStatus, toStatus)` tuples for
   which a TransitionToast has been shown in `sessionStorage` under a namespaced key.
2. WHEN `usePollStatus` mounts for a poll, THE PollStatusSync SHALL compare the current status
   against the sessionStorage record and SHALL NOT fire a toast for a transition that is already
   recorded.
3. WHEN the user opens a new browser tab or starts a new browser session, THE sessionStorage
   record SHALL be empty, allowing transition toasts to fire again for subsequent transitions.
4. THE sessionStorage record SHALL NOT be stored in `localStorage`; it MUST be scoped to the
   current browser session to avoid persisting across independent user sessions.

---

### Requirement 10: Configuration and Testability

**User Story:** As a developer, I want the SyncInterval and retry policy to be configurable at
the hook call site so that tests can use short intervals without changing production defaults.

#### Acceptance Criteria

1. THE `usePollStatus` hook SHALL accept an optional `options` parameter with fields
   `syncIntervalMs` (default: 15 000 ms) and `maxRetries` (default: 3).
2. WHERE `syncIntervalMs` is provided and less than 1 000 ms, THE PollStatusSync SHALL clamp the
   value to 1 000 ms and log a console warning.
3. THE `usePollStatus` hook SHALL expose a `refetch()` function that immediately triggers a
   status fetch outside the normal interval cycle, enabling manual refresh and test control.
4. THE PollStatusSync fetch logic SHALL be injectable via a `fetchStatus` option so that unit
   tests can supply a mock implementation without patching global `fetch`.
