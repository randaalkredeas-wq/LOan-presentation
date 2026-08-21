# InvestGuard — Personal Investment Command Center

A premium investment aggregation and risk-intelligence dashboard that
consolidates every brokerage, fund and platform into one unified view, and
answers: **how much do I have, where is it, how is it performing, what
risks am I taking, and where is my real exposure?**

This build runs entirely on **realistic mock data** so the product can be
demoed today. The architecture is deliberately layered so the mock data can
be swapped for a live brokerage API, an uploaded Excel/CSV file, or a real
database **without touching a single page or component.**

> This platform is for portfolio analytics and risk monitoring purposes
> only and does not constitute investment advice.

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000> — it redirects to `/overview`.

## Architecture

```
src/
├── types/            Canonical domain types (Platform, Account, Holding,
│                      Transaction, KPI, KRI, RiskAlert, ...) — the contract
│                      every data source must satisfy.
├── data/              Mock reference + generated data (platforms, accounts,
│                      assets, holdings, transactions, price history, FX).
├── services/          IPortfolioService interface + MockPortfolioService.
│                      Pages only ever import `portfolioService` from here.
├── calculations/      Pure functions: portfolio aggregation, risk scoring,
│                      exposure/overlap analysis, KPIs, stress testing,
│                      rebalancing drift, the alert engine.
├── hooks/              usePortfolioRawData (fetches via the service) and
│                      usePortfolioAnalytics (derives everything above).
├── contexts/           Theme, Settings (risk limits, base currency,
│                      benchmark, target allocations), global date range.
├── i18n/               EN/AR dictionaries + language/RTL context.
├── components/         KPICard, KRICard, RiskGauge, PortfolioChart,
│                      AllocationChart, ExposureChart, HoldingsTable,
│                      AccountsTable, RiskAlertCard, StressTestPanel,
│                      RiskReturnMatrix, DateRangeSelector, ...
└── app/                One route per nav item (Overview, My Accounts,
                        Portfolio, Performance, Risk Center, Exposure,
                        Stress Testing, Alerts, Holdings, Transactions,
                        Settings).
```

Data flows one direction only:

```
Platform → Account → Holding → Asset → Transaction
                                   ↓
                     Portfolio Analytics (calculations/)
                                   ↓
                          Risk Engine (KRIs, Risk Score, Alerts)
                                   ↓
                              Dashboard UI
```

## Connecting real data later

Every page reads through `portfolioService` (`src/services/index.ts`),
which is typed against `IPortfolioService`. To go live:

1. Implement a new class (e.g. `PortfolioApiService`, `PortfolioDatabaseService`,
   or a CSV/Excel importer) that satisfies `IPortfolioService`.
2. Swap the single line in `src/services/index.ts`:
   ```ts
   export const portfolioService: IPortfolioService = new PortfolioApiService();
   ```
3. Add any credentials to `.env.local` (see `.env.example`) — never in
   frontend code. Prefer read-only brokerage scopes.

No component, hook, or calculation needs to change — they all depend on the
`IPortfolioService` contract and the `types/` domain model, not on where the
data actually comes from.

## Key features

- **Multi-account aggregation** — add/edit/delete/compare accounts across
  platforms, auto-consolidated into one portfolio.
- **Hidden Exposure / Overlap Analysis** — looks through ETF and fund
  holdings to reveal true consolidated exposure to a single company,
  sector, country or currency.
- **Risk Center** — a transparent, weighted 0–100 Risk Score across seven
  categories, plus 11 Key Risk Indicators (volatility, VaR/CVaR, beta,
  drawdown, concentration, liquidity, diversification...) each tracked
  against a configurable limit.
- **Stress Testing** — market-wide, sector, or fully custom shock
  scenarios computed live against current holdings (including ETF
  look-through).
- **Dynamic Risk Alerts** — generated from the same limits configured in
  Settings, not hardcoded.
- **Rebalancing Analysis** — target vs. actual consolidated sector
  allocation with drift, no auto-trading.
- **Full English / Arabic i18n with proper RTL** — every label, table,
  chart and alert is translated; layout mirrors correctly.

## Tech stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Recharts · Lucide
Icons.

## Quality checks

```bash
npm run lint
npm run build
```

Both are clean on this codebase.
