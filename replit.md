# BharatX Trading Dashboard

## Overview

A college-level automated trading dashboard for the BharatX multi-engine strategy targeting NSE/BSE stocks. Built as a pnpm monorepo with a React frontend and Express API backend.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS v4 + shadcn/ui
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

- `trading-dashboard` — React web app (preview path: `/`)
- `api-server` — Express REST API (preview path: `/api`)

## Strategy Engines (from Pine Script BharatXGann)

1. **EMA Crossover** — Fast/Slow EMA cross
2. **Supertrend** — ATR-based trend direction
3. **MACD Multi-Timeframe** — MACD with higher-TF confirmation
4. **UT Bot** — Trailing stop trailing signal
5. **VWAP Bias** — Price vs VWAP
6. **Gann 50%** — Midpoint of high/low lookback range

Each engine votes +1 (BULL) or -1 (BEAR). Total score >= 3 = LONG signal, <= -3 = SHORT signal.

## Database Schema

- `signals` — Trading signals with engine scores and price levels
- `trades` — Paper trades (open/closed) with P&L tracking

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Build Steps Completed (Step 1)

- [x] React dashboard with dark terminal theme
- [x] Dashboard page: P&L summary, cumulative chart, latest signal panel, engine matrix
- [x] Signals page: full signal history table
- [x] Trades page: paper trade log, place trade form, close trade action
- [x] Analytics page: engine accuracy, win-rate stats
- [x] REST API: signals, trades, dashboard summary, P&L chart, engine accuracy
- [x] PostgreSQL schema: signals + trades tables
- [x] Sample seed data (12 signals, 10 trades)

## Next Steps

- [ ] Step 2: Python strategy engine (convert Pine Script → Python)
- [ ] Step 3: Node.js WebSocket server for live price updates
- [ ] Step 4: Connect real market data (Zerodha Kite / simulated feed)
- [ ] Step 5: Redis caching for live prices

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
