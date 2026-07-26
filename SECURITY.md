# Security Posture

This document details the security mechanisms implemented in the Agency Ecommerce Core.

## 1. Content Security Policy (CSP)
A strict CSP is enforced via `next.config.ts`.
- Prevents Cross-Site Scripting (XSS) by restricting `script-src` and `style-src`.
- Restricts external image loading to configured CDN domains (Cloudinary).
- Explicitly blocks iframing via `frame-ancestors 'none'` to prevent Clickjacking.

## 2. Rate Limiting
Endpoint rate limiting is handled via Upstash Redis (`@upstash/ratelimit`) with an in-memory fallback for local development.
- **Authentication Routes**: Strict limit (5 requests per 15 seconds) applied to `/api/auth/register`, `/api/auth/forgot-password`, etc.
- **Storefront SDK / Checkout**: Standard limit (100 requests per 10 seconds) to prevent brute-force order creation and inventory hoarding.

## 3. Session & Authentication
- Managed by `NextAuth.js` (Auth.js v5).
- All cookies are `HttpOnly` and `Secure` (in production), guarding against XSS token theft.
- Role-based Access Control (RBAC) is enforced at the Edge via `middleware.ts`. Unauthorized access to `/dashboard` redirects immediately.

## 4. Database Integrity
- All cart merging, inventory adjustments, and order placements use **Prisma `$transaction`** blocks to guarantee ACID compliance.
- No race conditions can result in overselling inventory.

## 5. Security Headers
- `Strict-Transport-Security` (HSTS): Enforces HTTPS.
- `X-Content-Type-Options: nosniff`: Prevents MIME-type sniffing.
- `X-Frame-Options: DENY`: Fallback protection against Clickjacking for older browsers.
- `Permissions-Policy`: Restricts camera, microphone, and geolocation access.
