# CandleVision - Project Audit & Technical Reference

**Generated:** March 24, 2026  
**Current Branch:** vanshika  
**Status:** Development / Prototype

---

## Executive Summary

CandleVision is an AI-powered trading education and analytics platform with a working core dashboard, real-time market data integration, and Genkit-powered signal generation. The foundation is solid, but many secondary features remain UI-only prototypes or require backend wiring. The project is production-ready for the dashboard and signal generation flows; the learning hub, competitions, and analytics modules need full implementation.

---

## What The App Currently Serves

### 1. **AI-Assisted Trading Dashboard**
- Real-time market data fetching from Binance API with fallback simulation
- Interactive 3D candlestick visualization using Three.js
- Live/simulated market status indicators
- Virtual balance tracking ($10,000 starting capital)

### 2. **Firebase Authentication & User Management**
- Email/password registration and login
- Google OAuth sign-in integration
- User profile storage in Firestore (uid, email, displayName, virtualBalance, tradesCount, winRate)
- Profile creation on first sign-up or Google login

### 3. **Genkit AI Flows**
- **generateTradingSignals**: Analyzes market data and generates Buy/Sell/Hold signals with confidence scores
- **explainTradingSignals**: Provides step-wise, student-friendly explanations of signals
- **personalizeLearningPaths**: (Implemented but not wired to UI) Creates personalized learning sequences

### 4. **Signal Logging & Tracking**
- Signals saved to Firestore under `/users/{userId}/signals/{signalId}`
- Tracks entry price, confidence score, reasoning, timestamp
- Performance page reads and displays signal records

### 5. **Market Replay Engine**
- Historical candle playback with slider control
- Useful for studying past patterns without real-time pressure

### 6. **UI Framework & Design System**
- Fully responsive holographic dashboard with Tailwind CSS + ShadCN UI
- Dark theme with electric blue, neon green, and electric orange accents
- All 40+ ShadCN UI components integrated and styled
- Mobile-friendly sidebar navigation

---

## What Is Functional Today

### Code Evidence & Entry Points

| Feature | Status | Location |
|---------|--------|----------|
| **Dashboard & 3D Charts** | ✅ Fully Functional | [src/app/page.tsx](src/app/page.tsx#L1-L45) |
| **Market Data Fetch** | ✅ Fully Functional | [src/lib/market-data.ts](src/lib/market-data.ts#L15) |
| **3D Candlestick Renderer** | ✅ Fully Functional | [src/components/trading/MarketChart3D.tsx](src/components/trading/MarketChart3D.tsx#L12) |
| **Firebase Auth** | ✅ Fully Functional | [src/app/login/page.tsx](src/app/login/page.tsx#L26) |
| **AI Signal Generation** | ✅ Fully Functional | [src/ai/flows/generate-trading-signals.ts](src/ai/flows/generate-trading-signals.ts#L150) |
| **AI Signal Explanation** | ✅ Fully Functional | [src/ai/flows/explain-trading-signals.ts](src/ai/flows/explain-trading-signals.ts#L68) |
| **Signal Saving to Firestore** | ✅ Fully Functional | [src/components/trading/AISignalPanel.tsx](src/components/trading/AISignalPanel.tsx#L66) |
| **Signal Reading (Performance Page)** | ✅ Fully Functional | [src/app/performance/page.tsx](src/app/performance/page.tsx#L18-L21) |
| **Market Replay UI** | ✅ Fully Functional | [src/app/replay/page.tsx](src/app/replay/page.tsx#L21) |
| **Sidebar Navigation** | ✅ Fully Functional | [src/components/dashboard/SidebarNav.tsx](src/components/dashboard/SidebarNav.tsx#L20) |
| **Toast Notifications** | ✅ Fully Functional | [src/hooks/use-toast.ts](src/hooks/use-toast.ts#L1) |

### Key Workflows That Complete End-to-End

1. **User Registration → Login → Dashboard**: Firebase auth → auto-redirect to home → profile loads from Firestore
2. **Search Symbol → Fetch Data → Render Chart**: Input validation → Binance/simulation API call → candle array → Three.js scene render
3. **Generate Signal → Store → Display**: Button click → Genkit flow → confidence + reasoning + steps → save to Firestore → persist across refresh
4. **Signal History → Performance Metrics**: Firestore query with orderBy → mock win/loss calc → equity curve chart

---

## What Is Non-Functional or Prototype-Only

### 1. **Performance Verification (MOCKED)**
**Status**: 🟡 UI-only; logic not connected to real verification  
**Location**: [src/app/performance/page.tsx](src/app/performance/page.tsx#L31)

```typescript
// Current Implementation (Line 31):
const isCorrect = Math.random() > 0.4; // 60% win rate mock
```

**Issue**: Win/loss decisions are randomized, not based on actual price movement or strategy execution.

**What Needs to Happen**:
- Implement a backtesting or verification service that compares signal entry price vs. actual exit price
- Update Firestore signal documents with real `profitLoss` and `predictionResult` values
- Consider a Cloud Function to async verify signals after a time window (e.g., 4 hours after signal generation)

---

### 2. **Analytics Page (STATIC)**
**Status**: 🟡 UI exists but no data wiring  
**Location**: [src/app/analytics/page.tsx](src/app/analytics/page.tsx#L13)

**Current State**: Hardcoded metrics (Sharpe Ratio: 2.41, Profit Factor: 1.85)

**Missing**:
- No calculation of real Sharpe ratio, profit factor, or expectancy from Firestore signals
- No chart data feed; placeholder text reads "Visual analytics engine loading..."

---

### 3. **Trade History Page (STATIC)**
**Status**: 🟡 UI-only; not connected to Firestore  
**Location**: [src/app/history/page.tsx](src/app/history/page.tsx#L9)

**Current State**: Hardcoded trade table with sample data

**Missing**:
- No query to Firestore signals or trades collection
- No real PnL, execution prices, or timestamps

---

### 4. **Competitions Page (STATIC)**
**Status**: 🟡 UI-only; no backend leaderboard  
**Location**: [src/app/competitions/page.tsx](src/app/competitions/page.tsx#L9)

**Current State**: Hardcoded leaderboard and challenge data

**Missing**:
- No Firestore collection for `competitions` or `leaderboard`
- No real-time ranking calculation
- No join/submit flow

---

### 5. **Settings Page (NON-INTERACTIVE)**
**Status**: 🟡 UI exists but save/load not connected  
**Location**: [src/app/settings/page.tsx](src/app/settings/page.tsx#L26)

**Current State**: Inputs and toggles are decorative

**Missing**:
- No onSave handler to update Firestore user profile
- No load handler to populate current settings
- Multi-factor authentication references but no implementation

---

### 6. **Learning Hub (UI-ONLY)**
**Status**: 🟡 Module cards and progress bars but no backend  
**Location**: [src/app/learning/page.tsx](src/app/learning/page.tsx#L46)

**Current State**: Static module list with mock progress percentages

**Missing**:
- No Firestore `learningModule` or `userProgress` collection
- No calls to `personalizeLearningPaths()` Genkit flow
- No quiz or interactive lesson content
- Progress not persisted

---

### 7. **Personalized Learning Flow (DEAD CODE)**
**Status**: 🔴 Defined in AI layer but never called  
**Location**: [src/ai/flows/personalize-learning-paths.ts](src/ai/flows/personalize-learning-paths.ts#L78)

**Issue**: Function is exported and typed correctly but has no UI trigger or integration point.

---

### 8. **Analytics Page Not Reachable from Sidebar**
**Status**: 🔴 Page exists but not in nav  
**Location**: [src/components/dashboard/SidebarNav.tsx](src/components/dashboard/SidebarNav.tsx#L20)

**Current Nav Items**: Dashboard, AI Performance, Market Replay, Learning Hub, Competitions, Trade History, Settings

**Missing**: No link to `/analytics`, so page is orphaned

---

## Build & Quality Issues

### 1. **Typecheck Failure**
**Error**: Invalid triple-quote syntax in test file  
**Location**: [src/ai/flows/generate-trading-signals.test.ts](src/ai/flows/generate-trading-signals.test.ts#L1)

```typescript
// Line 1 (BROKEN):
'''
import { generateTradingSignals, ... }
```

**Fix**: Replace `'''` with `;` or remove the line

---

### 2. **Build Command Incompatible on Windows**
**Location**: [package.json](package.json#L10)

```json
"build": "NODE_ENV=production next build"
```

**Issue**: `NODE_ENV=` syntax is Unix/bash only. Windows PowerShell requires `$env:NODE_ENV="production"` or cross-platform tool.

**Fix**: Use `cross-env` package or platform-specific scripts

---

### 3. **ESLint Config Mismatch**
**Error**: Circular reference in next lint configuration  
**Location**: [.eslintrc.json](.eslintrc.json#L1)

**Context**: `next lint` is deprecated in Next.js 15+; should migrate to `eslint` CLI

---

### 4. **Lint/Type Checks Suppressed in Build**
**Location**: [next.config.ts](next.config.ts#L6)

```typescript
typescript: {
  ignoreBuildErrors: true,
},
eslint: {
  ignoreDuringBuilds: true,
},
```

**Impact**: Hides defects; errors won't be caught in CI/CD

---

## Data Model Status

### Firestore Collections

| Collection | Status | Notes |
|------------|--------|-------|
| `/users/{userId}` | ✅ Used | Stores profile, balance, stats |
| `/users/{userId}/signals/{signalId}` | ✅ Used | Stores AI signal records |
| `/users/{userId}/backtests/{backtestId}` | 🔴 Unused | Not implemented in code |
| Competitions | 🔴 Missing | Not defined; needed for leaderboard |
| Trade History | 🔴 Missing | Could be merged with signals or separate |

---

## Top Enhancements To Make It Production-Ready

### Priority 1: Fix Engineering Baseline (Immediate)
- [ ] Repair test file syntax (triple-quote fix)
- [ ] Make build script cross-platform (add `cross-env`)
- [ ] Fix ESLint config or migrate to ESLint CLI
- [ ] Remove `ignoreBuildErrors` and `ignoreDuringBuilds` flags to enforce quality

**Effort**: 30 minutes  
**Blocker for**: Production deployment

---

### Priority 2: Implement Real Signal Verification (High Impact)
- [ ] Create a Cloud Function (or scheduled job) to verify pending signals
- [ ] Compare signal entry price vs. market exit price (after 4-hour window or user-defined exit)
- [ ] Update Firestore signal documents with `profitLoss`, `exitPrice`, `predictionResult`
- [ ] Persist win/loss for accuracy tracking

**Effort**: 2–3 hours  
**Unlocks**: Accurate performance metrics, leaderboard rankings, meaningful analytics

---

### Priority 3: Wire Static Pages to Real Data (Medium Priority)
- [ ] **Trade History**: Query Firestore signals → map to trade format → render table
- [ ] **Settings**: Load user profile from Firestore → allow edits → save back to DB
- [ ] **Analytics**: Calculate real Sharpe ratio, profit factor, max drawdown from signal data
- [ ] **Add Analytics route** to sidebar navigation

**Effort**: 2–4 hours  
**Unlocks**: Data persistence, user configuration, advanced metrics

---

### Priority 4: Connect Learning Hub to Personalization Flow (Medium Priority)
- [ ] Create Firestore `userProgress` and `learningModule` collections
- [ ] Trigger `personalizeLearningPaths()` on first login or after quiz completion
- [ ] Display personalized module sequence in UI
- [ ] Persist quiz scores and module completion status

**Effort**: 3–4 hours  
**Unlocks**: Personalized learning, gamification, user engagement

---

### Priority 5: Implement Competitions & Leaderboard (Lower Priority)
- [ ] Define Firestore schema for `competitions`, `participants`, `leaderboard`
- [ ] Aggregate user signals by competition period (e.g., weekly season)
- [ ] Rank by win rate, total profit, or custom scoring algorithm
- [ ] Real-time leaderboard updates via Firestore listeners

**Effort**: 4–5 hours  
**Unlocks**: Social engagement, competitive features, user retention

---

### Priority 6: Add Observability & Error Handling (Ongoing)
- [ ] Structured logging for AI flow errors, market API failures
- [ ] Retry and timeout handling for external API calls
- [ ] Distinguish "live" vs. "simulated" mode clearly across all pages
- [ ] Error boundaries and graceful degradation

**Effort**: 2–3 hours  
**Unlocks**: Production reliability, debugging, support

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js 15 Frontend (App Router)             │
├─────────────────────────────────────────────┬───────────────────┤
│  Pages & Components (React 19)              │  ShadCN UI        │
│  - Dashboard (3D Charts + AI Panel)         │  - 40+ Components │
│  - Performance, Replay, Learning, etc.      │  - Tailwind CSS   │
└─────────────────────────────────────────────┴───────────────────┘
           │                    │                      │
           ▼                    ▼                      ▼
  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
  │  Genkit AI Flows │  │ Firestore DB     │  │  Binance API     │
  │ (Google Genkit)  │  │ (Firebase)       │  │  (OpenData)      │
  │ - Signals        │  │ - User Profiles  │  │ - Market Data    │
  │ - Explanation    │  │ - Signals        │  │ - OHLC Candles   │
  │ - Learning Paths │  │ - User Progress  │  └──────────────────┘
  └──────────────────┘  └──────────────────┘
           │                    │
           └────────┬───────────┘
                    ▼
    ┌─────────────────────────────────┐
    │  Google Gemini 2.0 Flash        │
    │  (AI Model Backend)             │
    └─────────────────────────────────┘
```

---

## Quick Start for Contributors

### Setup
```bash
npm install
npm run dev  # Runs on http://localhost:9002
```

### Running AI Flows Locally (Optional)
```bash
npm run genkit:dev  # Starts Genkit DevUI at http://localhost:4000
```

### Testing
```bash
# Note: Test file needs syntax fix first
npm test  # Currently fails due to triple-quote issue
```

### Environment Variables Required
```env
NEXT_PUBLIC_FIREBASE_API_KEY=<your-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-domain>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your-project>
GOOGLE_API_KEY=<your-gemini-key>
```

---

## Common Issues & Solutions

### Q: "Listen EADDRINUSE: address already in use :::9002"
**A**: Another process is running on port 9002. Kill it with: `npx kill-port 9002`

### Q: Firebase signals not saving
**A**: Check Firestore security rules allow writes to `/users/{userId}/signals/{signalId}`. Ensure `isConfigValid` is `true` in config.ts.

### Q: 3D chart not rendering
**A**: Check Three.js installation (`npm list three`). Ensure WebGL is enabled in browser. Check console for shader errors.

### Q: AI signals return "Hold" always
**A**: Verify `GOOGLE_API_KEY` is set and valid. Check Genkit flow logs at `http://localhost:4000`.

---

## File Structure Reference

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Dashboard (main entry)
│   ├── login/page.tsx     # Auth page
│   ├── performance/       # Signal verification & metrics
│   ├── replay/            # Market replay engine
│   ├── learning/          # Learning hub
│   ├── analytics/         # Analytics (orphaned, incomplete)
│   ├── competitions/      # Leaderboard (static)
│   ├── history/           # Trade history (static)
│   ├── settings/          # User settings (UI only)
│   ├── layout.tsx         # Root layout + Firebase provider
│   └── globals.css        # Global styles
│
├── ai/                     # Genkit AI flows
│   ├── genkit.ts          # Genkit client setup
│   ├── dev.ts             # DevUI loader
│   └── flows/
│       ├── generate-trading-signals.ts
│       ├── explain-trading-signals.ts
│       ├── personalize-learning-paths.ts
│       └── generate-trading-signals.test.ts (BROKEN syntax)
│
├── firebase/              # Firebase setup & hooks
│   ├── config.ts          # Firebase config validation
│   ├── index.ts           # Initialization
│   ├── provider.tsx       # React Context
│   ├── client-provider.tsx # Client-side wrapper
│   ├── auth/use-user.tsx  # Auth state hook
│   ├── firestore/
│   │   ├── use-doc.tsx    # Single doc listener
│   │   └── use-collection.tsx  # Collection listener
│   └── errors.ts          # Permission error class
│
├── components/            # React components
│   ├── trading/
│   │   ├── AISignalPanel.tsx
│   │   └── MarketChart3D.tsx
│   ├── dashboard/
│   │   ├── SidebarNav.tsx
│   │   └── TradingStats.tsx
│   └── ui/               # 40+ ShadCN UI components
│
├── lib/
│   ├── market-data.ts    # Binance API & simulation
│   ├── utils.ts          # Helper functions
│   └── placeholder-images.ts
│
└── hooks/
    └── use-toast.ts      # Toast notification hook
```

---

## Next Steps (Recommended Workflow)

1. **Today**: Fix typecheck + build issues (Priority 1)
2. **Tomorrow**: Implement signal verification Cloud Function (Priority 2)
3. **This Week**: Wire Trade History and Settings pages (Priority 3)
4. **Next Week**: Connect Learning Hub to personalization (Priority 4)

Each phase should have a corresponding PR to the `vanshika` branch with test/lint passing.

---

## Contact & Support

For questions on specific features, refer to:
- **AI Flows**: Check [src/ai/flows/](src/ai/flows/) docstrings
- **Firebase Setup**: See [src/firebase/README](src/firebase/README) (if exists)
- **UI Components**: Inspect [src/components/ui/](src/components/ui/)
- **Architecture**: See [docs/blueprint.md](docs/blueprint.md)

---

**Last Updated**: March 24, 2026  
**Branch**: vanshika  
**Maintained By**: CandleVision Dev Team
