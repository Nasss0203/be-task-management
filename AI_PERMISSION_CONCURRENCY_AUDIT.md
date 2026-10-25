# Phase 1 ? AI Confirm permission concurrency

Date: 2026-10-21. Branch: feat/admin-access-foundation.

## Scope and evidence

Read the four AI workflow/plan/intent files under ../docs/quy tr?nh AI and
ai-taskmanly/SECURITY_AUDIT.md. This phase changes only the NestJS backend;
M0, token configuration and frontend integration remain deferred.

The backend initially had only an existing package.json edit (Stripe CLI flag);
it has been preserved. Baseline AI tests: 336 passed, 7 PostgreSQL cases skipped.

Inspected Confirm's handler/UoW, context locker, permission policies/readers,
Page Share/settings handlers and repositories, hierarchy entity and checked-in
PostgreSQL baseline constraints. Permission readers use independent DataSource
queries; the nearest accepted share/setting wins within that source. Membership,
Page Share and general access remain additive, exactly as before.

The baseline has no Page FK on page_shares.page_id. The settings table has a Page
FK. An isolated PostgreSQL 18 fixture reproduces the original observation: raw
Share INSERT succeeds under a Page FOR UPDATE lock; raw Setting INSERT times out
with 55P03. This proves the serialization gap, not an unauthorized mutation of a
real business Page. The new regression suites initially had 7 failures and 10
passes before implementation. They show direct/inherited restrictive INSERTs
bypassing the old locks and Confirm failing to wait for an in-flight INSERT.

## Implementation

- Share save/delete and settings save take Page FOR UPDATE before writing.
  Shared infrastructure helper withPagePermissionWriteLock reuses the supplied
  active PersistenceContext. Standalone repository calls use a short manager
  transaction so an autocommit statement cannot release the lock prematurely.
- Confirm discovers ancestry, takes SHARE on ancestors root-first and UPDATE
  directly on the target, then verifies ancestry again. It aborts with 409 if
  discovery raced with a hierarchy change. No SHARE-to-UPDATE target upgrade.
- Existing context/FK descendant, Share Link and membership locks remain.
  Fingerprinting, authorization rules, DI tokens and UnitOfWork are unchanged.
- Two siblings can Confirm concurrently; unrelated Page permission writes in the
  same workspace are not blocked. There is no workspace-wide lock.
- No schema migration is needed or applied. This is a repository write protocol,
  not a new DB constraint: privileged raw SQL bypassing repositories must adopt
  the same Page-lock protocol. No such runtime write path was found in source.

## PostgreSQL fixture safety

Both opt-in suites now require RUN_AI_PAGE_LOCK_PG_E2E=1 and an explicit
AI_PAGE_LOCK_TEST_DATABASE_URL. They reject remote hosts and every database name
except taskmanly_ai_lock_test. They never import the application's DataSource or
fall back to .env. Each suite creates a random owned ai_lock_<uuid> schema and
synthetic UUIDs; only that schema is truncated/dropped. The minimal fixture has
production-equivalent relevant FK shapes and uses production TypeORM entities,
repositories, permission readers, AuthorizationService, UnitOfWork and Confirm
handler. Context/generation/plan execution are test doubles; no business Page
mutation or live generation transition is performed.

Killing Jest can leave only an isolated test schema, never committed permission
rows on the Phase 5 disposable Page. That existing fixture and its applied blocks
were not touched. A dedicated temporary local PostgreSQL cluster was used for
verification, not the application's database.

## Verification

- Targeted lock/concurrency/helper/fixture suites: 32 passed (21 real PostgreSQL
  cases plus 11 unit/safety cases).
- All AI Backend tests plus the shared helper, with PostgreSQL enabled:
  40 suites, 365 passed, 0 failed, 0 skipped.
- npm run build: PASS. Scoped ESLint across the 10 touched TypeScript files:
  PASS, 0 errors/warnings. git diff --check: PASS.
- Full npm test run: 1100 passed, 8 failed, 22 skipped. Two failures were
  migration-workflow initdb sandbox restrictions; rerunning that isolated suite
  outside the sandbox passed all 7 tests.
- The remaining six failures were reproduced on an unchanged HEAD archive in a
  temporary directory: four permission.guard mock failures, one template listing
  mock missing findByIdForUpdate, one internal-template-render missing-config
  fixture failure. Those 3 suites produced 6 failed / 10 passed on HEAD too.
  They are outside this remediation and were not changed. The whole backend
  suite is therefore not claimed green.
- No commits, pushes, real database migrations or .env edits were performed.

## Phase 2 gate

P1 remediation and relevant verification are complete. Before any M0 code, obtain
user decisions on chat vs Page summary, whole-Page translation/rewriting, new
update/delete operations, and multi-command behavior. The intent dataset still
contains TBD cases; do not invent accuracy scores or silently relabel them.
