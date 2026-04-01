# CandleVision | Project Status and Roadmap

Last updated: 2026-04-01
Branch: main

## Current Status

This project is in a strong functional state for core workflows and now includes quality gates and production-hardening foundations.

High-level summary:
- Core dashboard and AI signal generation are functional.
- Firebase auth and Firestore signal persistence are functional.
- Performance verification is deterministic and backend-driven.
- Analytics now uses live verified signal data (metrics and charts).
- CI gates exist for typecheck, lint, tests, and build.

## What Is Working

### Core Product Flows

- User auth (email/password + Google) with profile bootstrap.
- AI signal generation (Buy/Sell/Hold) and explanation flows.
- Signal write/read against Firestore.
- Market replay simulation UI.
- Trade history loaded from Firestore signals.
- Settings save/load with profile + preferences persistence.
- Learning personalization UI calling backend AI route.
- Competitions submission + leaderboard backend routes.

### Verification and Analytics

- Performance verification route:
   - [src/app/api/performance/verify/route.ts](src/app/api/performance/verify/route.ts)
   - Deterministic result computation based on post-entry market movement.
   - Metadata persisted (window, logic, source, etc).
- Performance page consumes verification route and persists verification outcomes:
   - [src/app/performance/page.tsx](src/app/performance/page.tsx)
- Analytics page now computes real metrics from verified Firestore signals and renders data-driven charts:
   - [src/app/analytics/page.tsx](src/app/analytics/page.tsx)

### Engineering Baseline

- Build uses cross-platform command:
   - [package.json](package.json)
- ESLint CLI and flat config are in place.
- Vitest is configured and running.
- Integration coverage exists for auth + signal + Firestore write/read.
- Next.js build bypass flags were removed:
   - [next.config.ts](next.config.ts)

### Production Hardening Foundation

- Startup environment checks and validation:
   - [src/lib/env.ts](src/lib/env.ts)
   - [src/lib/startup-checks.ts](src/lib/startup-checks.ts)
   - [src/instrumentation.ts](src/instrumentation.ts)
- Telemetry utilities and ingestion endpoint:
   - [src/lib/telemetry.ts](src/lib/telemetry.ts)
   - [src/app/api/telemetry/route.ts](src/app/api/telemetry/route.ts)
   - [src/components/monitoring/TelemetryBridge.tsx](src/components/monitoring/TelemetryBridge.tsx)
- CI workflow gates:
   - [.github/workflows/ci.yml](.github/workflows/ci.yml)

## Quality Snapshot

Current command outcomes:
- typecheck: pass
- lint: pass with warnings
- test: pass
- build: pass

## Remaining Gaps (To Reach Fully Functional / Production-Ready)

### 1. Navigation Completeness

- Analytics page is now linked in sidebar navigation:
   - [src/components/dashboard/SidebarNav.tsx](src/components/dashboard/SidebarNav.tsx)

### 2. Durability of Competition Backend (Environment-Dependent)

- Competitions use Firestore Admin when admin env vars are configured.
- Without admin env vars, persistence falls back to in-memory storage.
- Ensure production env includes:
   - FIREBASE_PROJECT_ID
   - FIREBASE_CLIENT_EMAIL
   - FIREBASE_PRIVATE_KEY

### 3. Verification Architecture Maturity

- Verification now supports server-side scheduled execution independent of app page visits.
- Batch verification endpoint:
   - [src/app/api/performance/verify/pending/route.ts](src/app/api/performance/verify/pending/route.ts)
- Shared verification engine:
   - [src/lib/performance-verification.ts](src/lib/performance-verification.ts)
- Optional GitHub Actions scheduler trigger:
   - [.github/workflows/verification-cron.yml](.github/workflows/verification-cron.yml)

### 4. Learning Progress Persistence

- AI personalization generation is integrated and persisted.
- Per-user learning progress persistence is now wired for:
   - lesson completion state
   - quiz score + attempts per lesson
   - module coverage snapshot
   - personalization input context
- Core files:
   - [src/lib/learning-progress.ts](src/lib/learning-progress.ts)
   - [src/app/learning/page.tsx](src/app/learning/page.tsx)

### 5. Lint Warning Cleanup

- Lint currently passes with warnings (unused vars, minor React/Next guidance).
- Recommended for cleaner CI and maintainability:
   - remove unused imports/vars
   - address no-img-element warnings where appropriate

### 6. Observability and Alerting Depth

- Telemetry foundation exists.
- Add external sink and alerting (e.g., log pipeline + thresholds) for production incident response.

## Static-to-Dynamic Data Audit Report

The sections below identify user-facing UI areas still using static values that can be mistaken for real account or system data.

### Highest Priority: Misleading User Metrics

1. Competitions dashboard is still mostly mock-data driven in [src/app/competitions/page.tsx](src/app/competitions/page.tsx).
2. Hardcoded boards and season cards exist in:
   - [src/app/competitions/page.tsx](src/app/competitions/page.tsx#L30)
   - [src/app/competitions/page.tsx](src/app/competitions/page.tsx#L39)
   - [src/app/competitions/page.tsx](src/app/competitions/page.tsx#L57)
   - [src/app/competitions/page.tsx](src/app/competitions/page.tsx#L63)
   - [src/app/competitions/page.tsx](src/app/competitions/page.tsx#L70)
   - [src/app/competitions/page.tsx](src/app/competitions/page.tsx#L76)
3. Static season/rank/score/progress values are rendered in:
   - [src/app/competitions/page.tsx](src/app/competitions/page.tsx#L184)
   - [src/app/competitions/page.tsx](src/app/competitions/page.tsx#L302)
   - [src/app/competitions/page.tsx](src/app/competitions/page.tsx#L306)
   - [src/app/competitions/page.tsx](src/app/competitions/page.tsx#L308)
   - [src/app/competitions/page.tsx](src/app/competitions/page.tsx#L534)
   - [src/app/competitions/page.tsx](src/app/competitions/page.tsx#L541)
   - [src/app/competitions/page.tsx](src/app/competitions/page.tsx#L557)
4. Competitions API still silently falls back to volatile memory in:
   - [src/app/api/competitions/leaderboard/route.ts](src/app/api/competitions/leaderboard/route.ts#L30)
   - [src/app/api/competitions/leaderboard/route.ts](src/app/api/competitions/leaderboard/route.ts#L48)
   - [src/app/api/competitions/submit/route.ts](src/app/api/competitions/submit/route.ts#L51)
   - [src/app/api/competitions/submit/route.ts](src/app/api/competitions/submit/route.ts#L62)
   - [src/lib/competition-store.ts](src/lib/competition-store.ts#L25)

Recommended action:
1. Create real season/user competition documents and derive side-panel values from persisted data.
2. Remove visible fallback leaderboard rows in production UI and show loading/empty states instead.
3. In production, disable memory fallback and return a clear service unavailable response when Admin Firestore is missing.

### High Priority: Incorrect Baselines in PnL/Equity

1. Home page baseline is hardcoded to 10000 in:
   - [src/app/page.tsx](src/app/page.tsx#L78)
   - [src/app/page.tsx](src/app/page.tsx#L115)
2. Trading stats starting capital label is hardcoded in [src/components/dashboard/TradingStats.tsx](src/components/dashboard/TradingStats.tsx#L28).
3. Performance and analytics equity/drawdown baselines are hardcoded in:
   - [src/app/performance/page.tsx](src/app/performance/page.tsx#L131)
   - [src/app/performance/page.tsx](src/app/performance/page.tsx#L151)
   - [src/app/analytics/page.tsx](src/app/analytics/page.tsx#L67)
   - [src/app/analytics/page.tsx](src/app/analytics/page.tsx#L95)

Recommended action:
1. Add startingCapital to user profile and use it everywhere as the equity baseline.
2. Pass startingCapital into dashboard, performance, and analytics computations.
3. Backfill existing users once (for example, startingCapital = current virtualBalance at migration time).

### Medium Priority: Hardcoded Chart Data

1. Performance confidence chart uses fixed buckets and accuracies in [src/app/performance/page.tsx](src/app/performance/page.tsx#L240).

Recommended action:
1. Reuse the dynamic confidence bucket logic already implemented in analytics.
2. If verified sample count is low, show a not-enough-data state instead of synthetic values.

### Medium Priority: Static Challenge Catalog

1. Challenge definitions are static in [src/lib/competition-data.ts](src/lib/competition-data.ts#L19) and consumed by:
   - [src/app/competitions/page.tsx](src/app/competitions/page.tsx#L15)
   - [src/app/competitions/[challengeId]/page.tsx](src/app/competitions/[challengeId]/page.tsx#L14)

Recommended action:
1. Move challenges to Firestore with status, schedule, participantsCount, and reward model.
2. Keep local challenge data only as development seed data.

### Lower Priority: Expected Simulation with Clear Boundaries

1. Market data can fall back to simulated values in [src/lib/market-data.ts](src/lib/market-data.ts#L50).
2. Replay uses fixed simulation bankroll defaults in [src/app/replay/page.tsx](src/app/replay/page.tsx#L25).

Recommended action:
1. Keep simulation in replay/training mode, but clearly label it as training-only.
2. Prevent simulation-derived values from mixing into account-level performance metrics.

### Static Content That Is Acceptable

1. Learning curriculum text in [src/app/learning/page.tsx](src/app/learning/page.tsx) is instructional content and can remain static.
2. Login showcase content in [src/app/login/page.tsx](src/app/login/page.tsx#L120) is marketing/demo content and can remain static when clearly presented as preview content.

### Recommended Implementation Order

1. Competitions real-data migration.
2. Shared startingCapital baseline across dashboard/performance/analytics.
3. Performance confidence chart migration to dynamic buckets.
4. Production no-memory-fallback policy for competitions APIs.
5. Firestore-backed challenge catalog.

## Useful Commands

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run test
npm run test:integration
npm run build
```

## Required Environment Variables

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
GOOGLE_API_KEY=...
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
```

Note: `FIREBASE_PRIVATE_KEY` must preserve newline formatting. If your platform requires escaped newlines, store it with `\\n` and the app will normalize it.

Optional for scheduled verification endpoint protection:
- `VERIFICATION_CRON_SECRET`

For scheduled verification with GitHub Actions, set repository secrets:
- `VERIFICATION_CRON_URL` (example: `https://your-app-domain/api/performance/verify/pending`)
- `VERIFICATION_CRON_SECRET` (optional but recommended)
