# Clone Checklist — Agency Ecommerce Core

Use this checklist every time you start a new client project.

**Forked from Core:** Record the version here when you clone.
> "Forked from Core v_____ on _____"

---

## Step 1 — Clone & Rename

```bash
git clone https://github.com/farad-alam/Agency-Ecommerce-Core.git client-{name}
cd client-{name}
git remote set-url origin git@github.com:agency/{client-name}.git
git push -u origin main
```

## Step 2 — Database

1. Create a new Neon project at https://neon.tech
2. Copy the connection string (pooled)
3. Add to `.env`:
   ```
   DATABASE_URL="postgresql://..."
   ```
4. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

## Step 3 — Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` — Neon connection string
- `NEXTAUTH_SECRET` — run `openssl rand -base64 32`
- `NEXTAUTH_URL` — your domain (e.g. https://client-domain.com)
- `NEXT_PUBLIC_SITE_URL` — same as NEXTAUTH_URL
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `RESEND_API_KEY` — create a new API key in Resend
- `EMAIL_FROM` — "Store Name <noreply@clientdomain.com>"
- `SEED_ADMIN_EMAIL` — the admin's email
- `SEED_ADMIN_PASSWORD` — a strong password (change this!)
- `CRON_SECRET` — a secret string for the Vercel cron job (e.g. `openssl rand -base64 16`)
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` — create free Upstash project

## Step 4 — Store Config

Edit `src/config/store.config.ts`:
- Set `name` to the client's store name
- Set `currency` (e.g. "BDT" for Bangladesh, "SAR" for Saudi)
- Set `locale` and `timezone`
- Set `email.adminAlertEmails`

## Step 5 — Seed Database

```bash
SEED_ADMIN_EMAIL=admin@client.com SEED_ADMIN_PASSWORD=SecurePass123! npx prisma db seed
```

Verify: visit `/dashboard` and log in with the admin credentials.

## Step 6 — Delete Storefront & Build Client Design

```bash
# Delete the reference storefront
rm -rf src/app/(storefront)
rm -rf src/components/storefront

# Build the client-specific storefront
# Keep src/storefront-sdk/ — it's Core-owned
```

## Step 7 — Configure via Dashboard

1. Go to `/dashboard/settings/store` — set name, currency, tax
2. Go to `/dashboard/shipping` — create shipping zones + rates
3. Go to `/dashboard/settings/team` — invite staff members
4. Import products via `/dashboard/products`

## Step 8 — Payment (SSLCommerz)

Follow the SSLCommerz integration guide (separate doc — added at end of project).

## Step 9 — Deploy to Vercel

1. Create new Vercel project (do NOT use an existing client's project)
2. Connect to this client's GitHub repo
3. Add all environment variables in Vercel dashboard
4. Set build command: `npx prisma migrate deploy && npm run build`
5. Deploy

## Step 10 — Smoke Test

- [ ] Homepage loads
- [ ] Product page loads with correct data
- [ ] Add to cart works
- [ ] Guest checkout creates an order in PENDING state
- [ ] Order appears in dashboard
- [ ] Order confirmation email arrives
- [ ] Dashboard login works with admin credentials
- [ ] Low-stock dashboard widget shows correct data

## Done ✓

Record Core version and handoff date in the project README.
