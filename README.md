# The Expense Auditor

A personal expense and net-worth tracker with multi-account support, expense splitting, account-to-account transfers, and an interactive dashboard — built with React, Tailwind CSS, and Supabase.

**Live demo:** [expense-tracker-beige-zeta.vercel.app](https://expense-tracker-beige-zeta.vercel.app/)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3ECF8E?logo=supabase&logoColor=white)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [Available Scripts](#available-scripts)
- [Deployment](#deployment)
- [Notes & Known Limitations](#notes--known-limitations)
- [License](#license)

---

## Features

- **Multi-account tracking** — savings, salary, current, credit card, cash, UPI wallet, and fixed deposit accounts, each with a live calculated balance based on linked transactions.
- **Income & expense logging** with automatic category suggestions based on keywords in the description (e.g. "Uber" → Transportation, "Netflix" → Entertainment).
- **Dashboard** with combined net worth, monthly profit/loss, a 7-day spending trend chart, and a category breakdown pie chart (powered by Recharts).
- **Expense splitting** — divide a shared expense across multiple people, track who's paid, and view all pending/settled splits in a dedicated Splits dashboard.
- **Account-to-account transfers** that move money without affecting your overall net worth, with full transfer history.
- **Search & filter** transactions by description text or date range.
- **Edit and delete** any transaction or account, with safeguards when deleting an account that still has linked transactions.
- **Authentication** via Supabase email/password, with per-user data isolation.
- **Responsive UI** — sidebar navigation on desktop, bottom tab bar with a floating action button on mobile.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Icons | Lucide React |
| Dates | date-fns |
| Backend / Database | Supabase (PostgreSQL, Auth, Row Level Security) |
| Hosting | Vercel |

The frontend talks to Supabase directly via `@supabase/supabase-js` — there is no custom backend in the active request path. See [Notes & Known Limitations](#notes--known-limitations) for details on the `api/` folder.

## Project Structure

```
.
├── api/
│   └── index.py              # Legacy Flask API — see Notes section
├── src/
│   ├── components/
│   │   ├── Auth.jsx
│   │   ├── Dashboard.jsx
│   │   ├── AccountSwitcher.jsx
│   │   ├── AccountSettings.jsx
│   │   ├── AccountsBreakdown.jsx
│   │   ├── ExpenseForm.jsx
│   │   ├── ExpenseList.jsx
│   │   ├── EditTransactionModal.jsx
│   │   ├── SearchBar.jsx
│   │   ├── SplitSettlement.jsx
│   │   ├── SplitsDashboard.jsx
│   │   ├── TransferForm.jsx
│   │   └── TransferList.jsx
│   ├── services/
│   │   ├── api.js            # Expenses, splits, meta — direct Supabase calls
│   │   ├── accounts.js        # Account CRUD
│   │   └── transfers.js       # Transfer CRUD
│   ├── utils/
│   │   └── cn.js              # Tailwind class-merging helper
│   ├── App.jsx
│   ├── index.jsx
│   ├── index.css
│   └── supabaseClient.js
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
└── vercel.json
```

## Getting Started

### Prerequisites

- Node.js ≥ 18
- A free [Supabase](https://supabase.com) project

### Installation

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
npm install
```

### Set up Supabase

1. Create a new Supabase project.
2. Create the tables described in [Database Schema](#database-schema) below, with Row Level Security enabled so each user only sees their own rows (`user_id = auth.uid()`).
3. Enable email/password auth under **Authentication → Providers**.

### Configure environment variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Run locally

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## Environment Variables

| Variable | Used by | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Frontend | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Supabase anonymous/public API key |
| `SUPABASE_SERVICE_ROLE_KEY` | `api/index.py` (legacy) | Service-role key — server-side only, never expose in frontend code |

## Database Schema

The tables below reflect what the active frontend (`src/services/*.js`) reads and writes.

**`accounts`**
| Column | Type | Notes |
|---|---|---|
| `id` | uuid / serial | Primary key |
| `user_id` | uuid | FK to `auth.users` |
| `name` | text | |
| `type` | text | Savings, Salary, Current, Credit Card, Cash, UPI Wallet, Fixed Deposit |
| `starting_balance` | numeric | |
| `color` | text | Hex color used in the UI |
| `icon` | text | |
| `created_at` | timestamp | |

**`expenses`**
| Column | Type | Notes |
|---|---|---|
| `id` | uuid / serial | Primary key |
| `user_id` | uuid | FK to `auth.users` |
| `account_id` | uuid | FK to `accounts.id`, nullable |
| `description` | text | |
| `amount` | numeric | |
| `category` | text | |
| `type` | text | `Expense` or `Income` |
| `date` | date | |
| `created_at` | timestamp | |

**`transfers`**
| Column | Type | Notes |
|---|---|---|
| `id` | uuid / serial | Primary key |
| `user_id` | uuid | FK to `auth.users` |
| `from_account_id` | uuid | FK to `accounts.id` |
| `to_account_id` | uuid | FK to `accounts.id` |
| `amount` | numeric | |
| `note` | text | Nullable |
| `date` | date | |

**`split_details`**
| Column | Type | Notes |
|---|---|---|
| `id` | uuid / serial | Primary key |
| `user_id` | uuid | FK to `auth.users` |
| `expense_id` | uuid | FK to `expenses.id` |
| `friend_name` | text | |
| `amount_owed` | numeric | |
| `is_paid` | boolean | |
| `created_at` | timestamp | |

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run vercel-build` | Build hook used by Vercel (runs `build`) |

## Deployment

This project is configured for [Vercel](https://vercel.com):

- `vercel.json` builds the static frontend from `package.json`/`dist` and rewrites all non-`/api` routes to `index.html` (single-page app routing).
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables in your Vercel project settings.
- Push to your connected Git branch, or run `vercel --prod`, to deploy.

## Notes & Known Limitations

- **The `api/` Flask backend is currently unused.** The frontend calls Supabase directly from the browser (`src/services/*.js`); nothing in the React app calls `/api/...`. The Flask code is kept in the repo from an earlier architecture — feel free to remove it, or wire the frontend back up to it if you'd rather keep business logic server-side.
- **Category suggestions are rule-based, not ML.** The "AI Selected" category hints in the expense form come from simple keyword matching on the description, not a trained model.
- **A legacy `user_meta` table/API exists** for a single global starting balance, from before per-account starting balances were introduced. It's no longer read by the current UI.

## License

This project is licensed under the [MIT License](LICENSE).
