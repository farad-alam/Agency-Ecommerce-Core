# Changelog — Agency Ecommerce Core

All Core changes are tagged by severity:
- 🔴 `CRITICAL` — security/payment/data-integrity bug. Backport to ALL active client repos same week.
- 🟡 `IMPROVEMENT` — worth backporting to active clients if low-risk. Judgment call per client.
- 🟢 `NEW-FEATURE` — only applies to future clones. Never backport unless client requests and pays.

---

## [1.0.0] — 2026-07-27

🟢 `NEW-FEATURE` — Initial release of Agency Ecommerce Core v1.0.0

### Included
- Complete Prisma schema (User, Product, Variant, Category, Brand, Collection, Cart, Order, Coupon, Shipping, Review, Media, SEO)
- Auth.js v5 — credentials + optional Google OAuth, JWT sessions, role-based access
- Full dashboard (products, orders, customers, inventory, coupons, shipping, reviews, media, analytics, settings)
- Cart system with server-side session, guest support, cart merge on login
- Checkout flow — creates Order in PENDING state (SSLCommerz payment to be added per-client)
- Email system via Resend + React Email (8 templates)
- Storefront SDK — typed React hooks + server fetch utilities
- Cloudinary media management
- Rate limiting via Upstash Redis
- Structured error handling with error code registry
- Security headers + CSP
- CI/CD via GitHub Actions + Vercel
- Seed data (bootstrap + demo dataset)

### Payment
- SSLCommerz adapter — to be implemented at end of project
- PaymentProvider interface stub included for future implementation
