# BharatX Trading Dashboard

A college-level automated trading dashboard for the BharatX multi-engine strategy targeting NSE/BSE stocks. Built with React frontend deployed as a static site on Netlify with serverless API functions.

## Live Demo

Deployed on Netlify: [your-app.netlify.app](https://your-app.netlify.app)

## Features

- **Dashboard** — P&L summary, cumulative chart, latest signal panel, engine matrix
- **Signals** — Full signal history table with engine scores
- **Paper Trades** — Trade log, place trade form, close trade action
- **Analytics** — Engine accuracy, win-rate stats
- **NSE Market** — Live quotes for 200+ NSE stocks via NSE India API

## Strategy Engines (from Pine Script BharatXGann)

1. **EMA Crossover** — Fast/Slow EMA cross
2. **Supertrend** — ATR-based trend direction
3. **MACD Multi-Timeframe** — MACD with higher-TF confirmation
4. **UT Bot** — Trailing stop trailing signal
5. **VWAP Bias** — Price vs VWAP
6. **Gann 50%** — Midpoint of high/low lookback range

Each engine votes +1 (BULL) or -1 (BEAR). Total score >= 3 = LONG signal, <= -3 = SHORT signal.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + TailwindCSS v4 + shadcn/ui |
| API | Netlify Functions (serverless) |
| Database | Neon PostgreSQL (serverless) |
| Market Data | NSE India API + Yahoo Finance fallback |
| ORM | Drizzle ORM |
| Validation | Zod |

## Project Structure

```
One-Step/
├── artifacts/
│   └── trading-dashboard/   # React frontend (Vite)
├── netlify/
│   └── functions/            # Serverless API functions
│       ├── api-dashboard.ts  # Dashboard summary, P&L chart
│       ├── api-signals.ts    # Trading signals CRUD
│       ├── api-trades.ts     # Paper trades CRUD
│       ├── api-health.ts     # Health check
│       ├── nse-quotes.ts     # Live NSE stock quotes
│       ├── nse-search.ts     # Stock search
│       ├── nse-sectors.ts    # Sector & stock list
│       └── lib/
│           ├── nse-client.ts # NSE India API client
│           └── nse-stocks.ts # 200+ stock master list
├── lib/
│   ├── db/                   # Drizzle ORM + Neon PostgreSQL
│   ├── api-zod/              # Zod validation schemas
│   └── api-client-react/     # Generated React Query hooks
├── netlify.toml              # Netlify build & redirect config
└── package.json              # Workspace root
```

## Local Development

### Prerequisites

- Node.js 20+
- pnpm 9+
- A Neon PostgreSQL database ([neon.tech](https://neon.tech) — free tier)

### Setup

```bash
# Install dependencies
pnpm install

# Set environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL from Neon

# Push database schema
pnpm --filter @workspace/db run push

# Seed sample data (optional)
# pnpm --filter @workspace/api-server run seed

# Start development server
cd artifacts/trading-dashboard && pnpm dev
```

### With Netlify CLI (recommended)

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Start local dev with functions
netlify dev
```

## Deployment to Netlify

### Option 1: Git-based deploy (recommended)

1. Push this repo to GitHub
2. Go to [app.netlify.com](https://app.netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect your GitHub repo
5. Netlify will auto-detect `netlify.toml` settings
6. Add environment variable in Netlify dashboard:
   - `DATABASE_URL` = your Neon PostgreSQL connection string

### Option 2: CLI deploy

```bash
netlify deploy --prod
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Neon PostgreSQL connection string | Yes |

## Database Schema

- **signals** — Trading signals with engine scores and price levels
- **trades** — Paper trades (open/closed) with P&L tracking
