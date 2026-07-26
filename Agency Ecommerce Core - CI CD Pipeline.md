# Agency Ecommerce Core — CI/CD Pipeline

**Version:** v1.0
**CI:** GitHub Actions
**CD:** Vercel (automatic via GitHub integration)
**Database:** Neon (preview branches + production)

---

## 0. Pipeline Overview

```
Developer pushes branch
         │
         ▼
GitHub Actions CI
   ├── Lint (ESLint)
   ├── Type Check (tsc --noEmit)
   ├── Unit Tests (Vitest)
   └── Schema Validation (prisma validate)
         │
         │ (all pass)
         ▼
Vercel Preview Deployment
   ├── Build
   ├── Neon branch database (isolated preview DB)
   └── Preview URL: https://agency-ecommerce-core-{branch}.vercel.app
         │
         │ (PR merged to main)
         ▼
Vercel Production Deployment
   ├── Build
   ├── Database migration (prisma migrate deploy)
   └── Production URL
```

---

## 1. GitHub Actions — CI Workflow

```yaml
# .github/workflows/ci.yml

name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  ci:
    name: Lint, Type Check, Test
    runs-on: ubuntu-latest

    services:
      # Local Postgres for integration tests (not Neon — avoids API call costs in CI)
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER:     testuser
          POSTGRES_PASSWORD: testpassword
          POSTGRES_DB:       ecommerce_test
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    env:
      DATABASE_URL:       postgresql://testuser:testpassword@localhost:5432/ecommerce_test
      NEXTAUTH_SECRET:    ci-test-secret-do-not-use-in-production
      NEXTAUTH_URL:       http://localhost:3000
      NEXT_PUBLIC_SITE_URL: http://localhost:3000
      # Email, payment providers — mocked in tests, no real keys needed

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Validate Prisma schema
        run: npx prisma validate

      - name: Generate Prisma client
        run: npx prisma generate

      - name: Run database migrations (test DB)
        run: npx prisma migrate deploy

      - name: Run unit tests
        run: npm run test

      - name: Run integration tests
        run: npm run test:integration
        env:
          # Integration tests use the local Postgres DB provisioned above
          DATABASE_URL: postgresql://testuser:testpassword@localhost:5432/ecommerce_test
```

---

## 2. `package.json` Scripts

```json
{
  "scripts": {
    "dev":              "next dev",
    "build":            "next build",
    "start":            "next start",
    "lint":             "next lint",
    "type-check":       "tsc --noEmit",
    "test":             "vitest run",
    "test:watch":       "vitest",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:coverage":    "vitest run --coverage",
    "db:generate":      "prisma generate",
    "db:migrate":       "prisma migrate dev",
    "db:push":          "prisma db push",
    "db:seed":          "prisma db seed",
    "db:studio":        "prisma studio"
  }
}
```

---

## 3. Vercel Configuration

```json
// vercel.json

{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm ci",
  "crons": [
    {
      "path": "/api/cron/cleanup-carts",
      "schedule": "0 3 * * *"
    },
    {
      "path": "/api/cron/low-stock-check",
      "schedule": "0 8 * * *"
    }
  ]
}
```

### Vercel Project Settings (per deployment)

| Setting | Value |
|---|---|
| Root Directory | `./` |
| Build Command | `npm run build` |
| Output Directory | `.next` |
| Node.js Version | 20.x |
| Auto-deploy branches | `main` only |
| Preview deployments | All branches |

---

## 4. Database Migration Strategy

### Development

```bash
# Create and apply a new migration locally
npx prisma migrate dev --name "add-collections-model"

# This:
# 1. Generates SQL migration file in prisma/migrations/
# 2. Applies it to the local dev DB
# 3. Regenerates the Prisma client
```

### Preview Environments

Neon supports **database branching** — each Vercel preview deployment gets its own Neon branch (isolated copy of the main DB schema). Configure in Vercel's Neon integration settings.

```
Vercel Preview → Neon Branch DB (auto-created per PR)
                      │
                      └─ Runs: npx prisma migrate deploy (in build step)
```

Add to the Vercel build command for preview environments:

```bash
# vercel.json or Vercel dashboard → Build Command
npx prisma migrate deploy && npm run build
```

**Do NOT run `prisma migrate dev` in CI/CD.** `migrate dev` is for local development only — it can prompt, create shadow databases, and detect drift. `migrate deploy` is the production-safe command — it only applies pending migrations.

### Production Deployment Migration

Production migrations run as part of the Vercel build step:

```bash
# Vercel Production Build Command
npx prisma migrate deploy && npm run build
```

**Risk mitigation:**
- Never deploy a migration that drops a column or table without first deploying a code change that stops reading that column
- For large tables, prefer `ALTER TABLE ... ADD COLUMN` with a default value over `NOT NULL` without a default
- Test migrations against a Neon branch (clone of production) before merging to main

---

## 5. Environment Variables — Per Environment

| Variable | Dev | Preview | Production |
|---|---|---|---|
| `DATABASE_URL` | Local Postgres | Neon branch | Neon production |
| `NEXTAUTH_URL` | `http://localhost:3000` | Preview URL (auto by Vercel) | Production URL |
| `NEXTAUTH_SECRET` | Any string | Vercel secret | Vercel secret (strong random) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Preview URL | Production URL |
| `STRIPE_SECRET_KEY` | Test key | Test key | Live key |
| `STRIPE_WEBHOOK_SECRET` | CLI local secret | Preview webhook | Production webhook |
| `RESEND_API_KEY` | Real or `EMAIL_PREVIEW_ONLY=true` | Real | Real |
| `SEED_ADMIN_EMAIL` | `admin@store.com` | Not needed | Set in deploy |
| `SEED_ADMIN_PASSWORD` | Any | Not needed | Set in deploy |

### Setting Vercel Environment Variables

```bash
# Add a production-only secret
vercel env add NEXTAUTH_SECRET production

# Add a secret for all environments
vercel env add STRIPE_SECRET_KEY

# Pull env vars to local .env.local (for dev)
vercel env pull .env.local
```

---

## 6. Branch Strategy

```
main          → Production. Protected. Requires PR + CI pass + 1 approval.
develop       → Integration branch. Preview deployment.
feature/*     → Feature branches. Preview deployment.
fix/*         → Bug fix branches. Preview deployment.
```

### Branch Protection Rules (GitHub)

For `main`:
- Require status checks: `ci` (the GitHub Actions job name)
- Require branches to be up to date before merging
- Require at least 1 review
- Do not allow bypassing above settings

---

## 7. Pre-commit Hooks

```json
// package.json — lint-staged + husky

{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "prisma/schema.prisma": ["prisma format"]
  }
}
```

```bash
# Setup
npx husky init
echo "npx lint-staged" > .husky/pre-commit
```

This ensures:
- No linting errors are committed
- Code is auto-formatted before commit
- Prisma schema is always formatted

---

## 8. Vitest Configuration

```ts
// vitest.config.ts — unit tests

import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals:     true,
    setupFiles:  ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      include:  ["src/core/**"],   // only Core is required to have coverage
      exclude:  ["src/storefront-sdk/**", "src/app/**"],
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

```ts
// vitest.integration.config.ts — integration tests (slower, use real DB)

import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment:  "node",
    globals:      true,
    setupFiles:   ["./src/test/integration-setup.ts"],
    testTimeout:  30000,          // longer timeout for DB operations
    include:      ["src/**/*.integration.test.ts"],
    singleThread: true,           // run integration tests serially — avoid DB race conditions
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

```ts
// src/test/setup.ts — unit test setup

import { vi } from "vitest";

// Mock Prisma in unit tests — tests use mocked db, not a real connection
vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    order: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    // ... add mocks as needed per test file
  },
}));
```

---

## 9. Stripe Webhook — Local Development

Stripe webhooks can't reach localhost. Use the Stripe CLI:

```bash
# Install Stripe CLI and listen for events
stripe listen --forward-to localhost:3000/api/webhooks/payments/stripe

# Trigger a test payment event
stripe trigger payment_intent.succeeded
```

The CLI outputs a webhook signing secret — add it to `.env.local` as `STRIPE_WEBHOOK_SECRET`.

For bKash/Nagad (no official CLI tool), use **ngrok**:

```bash
ngrok http 3000
# Use the ngrok URL as the callback URL in the bKash/Nagad sandbox dashboard
```

---

## 10. First-time Setup for a New Developer

```bash
# 1. Clone
git clone https://github.com/agency/agency-ecommerce-core client-projectname
cd client-projectname

# 2. Install
npm install

# 3. Environment
cp .env.example .env.local
# Fill in DATABASE_URL (local Postgres or Neon dev branch), NEXTAUTH_SECRET, etc.

# 4. Database
npx prisma migrate dev
SEED_DEMO=true npx prisma db seed

# 5. Start
npm run dev

# 6. Verify
# → http://localhost:3000/dashboard
# → Login: admin@store.com / Admin1234! (from seed)
```
