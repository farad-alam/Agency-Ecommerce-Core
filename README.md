# Agency Ecommerce Core

**Core Version:** 1.0.0
**Stack:** Next.js · PostgreSQL · Prisma · Neon · Cloudinary · Tailwind CSS · shadcn/ui · Vercel

A reusable e-commerce platform built for agency use. Clone it for every new client — customize the storefront, keep the backend.

## Quick Start

```bash
npm install
cp .env.example .env
# Fill in .env values
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Visit `http://localhost:3000/dashboard` — login with seeded admin credentials.

## Documentation

See the `docs/` folder (spec files) for full architecture and implementation details.

## Golden Rule

> **Backend is the product. Storefront is the client project.**

Never modify `src/core/`, `src/app/(dashboard)/`, or `src/app/api/` in a client project.
Only touch: `src/app/(storefront)/`, `src/components/storefront/`, `src/config/store.config.ts`, `.env`.

## Starting a New Client Project

Follow `CLONE_CHECKLIST.md`.
