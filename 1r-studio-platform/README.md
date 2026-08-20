# 1R. Studio — Photography Business Management Platform

A complete, bilingual (Arabic/English) platform for **1R. Studio**, a newborn / maternity / family
photography studio: a premium customer-facing website with online booking, and a business
dashboard with sales, expenses, profitability and KRI (Key Risk Indicator) monitoring.

The **9 photography packages** and **5 services** are real — transcribed from the studio's own
package sheets — not placeholder data. The **logo** is the studio's actual mark, extracted from
those same materials. Customers, orders, and expenses are clearly-labelled **demo data** generated
by `prisma/seed.ts`, deliberately shaped to show a healthy business trending into a cost crisis
(see "Demo data story" below) so the KRI/alerts/insights engine has something real to report on.

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS v4 · PostgreSQL + Prisma ·
NextAuth v5 (credentials) · next-intl (ar/en, RTL/LTR) · Recharts · xlsx / jsPDF for exports.

## Getting started

```bash
npm install

# Point DATABASE_URL at a Postgres instance (see .env.example)
cp .env.example .env
# then edit .env with a real DATABASE_URL + secrets

npx prisma migrate dev   # creates schema
npx prisma db seed       # loads real catalog + demo customers/orders/expenses

npm run dev              # http://localhost:3000
```

**Owner dashboard login:** `owner@1rstudio.sa` / `Studio@2026` (shown on the login screen too).

## What's implemented

- **Customer website** — Home, Services, Packages (real pricing/inclusions/add-ons), Portfolio,
  About, Contact, all bilingual with full RTL/LTR layout switching.
- **Booking flow** — Service → Package → Date (color-coded availability calendar) → Time slot →
  Details/add-ons → Review → Confirmation, plus a "Track My Booking" lookup page.
- **Availability & double-booking prevention** — working days, time slots, and blocked/vacation
  dates drive a single `lib/availability.ts` engine used by both the calendar UI and the booking
  API. Booking creation happens inside a DB transaction guarded by a **real unique constraint**
  (`BookingSlotLock`), so two concurrent requests for the same date+time can never both succeed —
  verified live under concurrent load, not just in the UI (see `POST /api/bookings`).
- **Owner dashboard** — Overview (KPI cards + Business Health Score + generated insights),
  Calendar, Orders, Customers, Services, Packages (editable pricing/cost), Sales & Growth,
  Expenses (with add-expense form), Profitability (waterfall, break-even, per-package
  contribution/margin), **KRI Monitoring** (13 financial + operational risk indicators with
  thresholds, trend sparklines, and an auto-generated alerts panel), Reports (Excel/PDF export),
  Settings (business info, working days, fixed costs, blocked dates).
- **Everything is computed from the database** — no hardcoded metrics. `src/lib/finance.ts` and
  `src/lib/kri.ts` are the calculation engines; every dashboard page just queries them for the
  selected period and its date-comparison engine (`src/lib/periods.ts`) resolves "previous
  equivalent period" automatically for every named range plus custom ranges.

## Demo data story

`prisma/seed.ts` generates 6 months of orders/expenses (64 orders, 76 expense records, 32
customers) shaped so the Expense-to-Revenue Ratio KRI moves **44% → 45% → 42% → 59% → 81%**
across the period — i.e. a healthy studio that hits a real cost crisis in the most recent month
(a marketing push + an equipment repair pile up while order volume dips), which is exactly the
scenario the KRI/alerts/insights engine is built to catch. Net profit margin, cancellation rate
and a few operational KRIs move accordingly. This is intentional, not random — it's there so the
platform has something meaningful to say the first time you open the dashboard.

## Not fully built out (by design, given scope)

- Portfolio images are a styled placeholder grid, not real client photos — the studio's actual
  session photos from the source PDFs include identifiable babies/families, which weren't
  reused here out of privacy caution; the dashboard's package-editing UI is where the owner would
  eventually manage real portfolio assets.
- No customer-facing account/login — booking lookup is by booking number + phone, as specced.
- `KriResult`/`Alert` tables exist in the schema for historical snapshotting but the dashboard
  currently evaluates KRIs live from orders/expenses each request rather than reading cached
  snapshots — fine at this data scale, worth revisiting for a much larger dataset.
