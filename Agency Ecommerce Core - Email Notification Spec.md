# Agency Ecommerce Core — Email & Notification Spec

**Version:** v1.0
**Provider:** Resend
**Template Engine:** React Email
**Parent Documents:** Auth Design Spec v1.0 · Cart & Checkout Spec v1.0

---

## 0. Why Resend

| Criteria | Resend | SendGrid | Nodemailer |
|---|---|---|---|
| Next.js / React Email native | ✅ | ❌ | ❌ |
| Simple API (no XML, no legacy) | ✅ | Partial | N/A |
| Free tier (3,000/mo) | ✅ | ✅ | N/A |
| React components for templates | ✅ | ❌ | ❌ |
| Reliable deliverability | ✅ | ✅ | ⚠️ |
| Per-client sender domain | ✅ (DNS setup) | ✅ | N/A |

**Decision:** Use **Resend** with **React Email** for templates. Each client project configures their own sender domain in Resend's dashboard. The Core ships with template implementations — clients can override the visual styling (colors, logo) through `store.config.ts` branding config, but the template structure and trigger logic is Core-owned.

---

## 1. Email Triggers — Complete List

| Trigger | Template | Recipient | Sent From |
|---|---|---|---|
| Customer places an order | `order-confirmation` | Customer (user email or guestEmail) | Store |
| Order status → FULFILLED | `order-shipped` | Customer | Store |
| Order status → CANCELLED | `order-cancelled` | Customer | Store |
| Refund created | `refund-initiated` | Customer | Store |
| Customer requests password reset | `password-reset` | Customer | Store |
| Customer registers (if email verification enabled) | `email-verification` | Customer | Store |
| Admin sends staff invite | `staff-invite` | New staff member | Store |
| Inventory below threshold | `low-stock-alert` | Admin email(s) | Store |

**What is NOT an email trigger in V1:**
- Review approved/rejected (customers don't get notified — V1 scope)
- Coupon expiry reminders (marketing automation — out of scope)
- Abandoned cart recovery (V2)
- Newsletter / marketing (out of scope — use a dedicated tool like Mailchimp)

---

## 2. Core Email Interface

```ts
// src/core/email/send.ts

import { Resend } from "resend";
import type { ReactElement } from "react";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendEmailOptions {
  to:       string | string[];
  subject:  string;
  react:    ReactElement;        // React Email component
  from?:    string;              // defaults to EMAIL_FROM env var
  replyTo?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const { to, subject, react, from, replyTo } = options;

  await resend.emails.send({
    from:     from ?? process.env.EMAIL_FROM!,
    to:       Array.isArray(to) ? to : [to],
    subject,
    react,
    replyTo,
  });
}
```

```ts
// src/core/email/templates/index.ts
// Convenience wrappers — callers don't need to know the template internals

import { sendEmail } from "../send";
import { OrderConfirmationEmail } from "./order-confirmation";
import { OrderShippedEmail } from "./order-shipped";
import { OrderCancelledEmail } from "./order-cancelled";
import { RefundInitiatedEmail } from "./refund-initiated";
import { PasswordResetEmail } from "./password-reset";
import { EmailVerificationEmail } from "./email-verification";
import { StaffInviteEmail } from "./staff-invite";
import { LowStockAlertEmail } from "./low-stock-alert";
import { storeConfig } from "@/config/store.config";
import type { OrderWithItems } from "@/core/orders/types";

export async function sendOrderConfirmation(order: OrderWithItems, recipientEmail: string) {
  await sendEmail({
    to:      recipientEmail,
    subject: `Order confirmed — ${order.orderNumber}`,
    react:   OrderConfirmationEmail({ order, storeName: storeConfig.name }),
  });
}

export async function sendOrderShipped(order: OrderWithItems, recipientEmail: string, trackingNumber?: string) {
  await sendEmail({
    to:      recipientEmail,
    subject: `Your order has shipped — ${order.orderNumber}`,
    react:   OrderShippedEmail({ order, storeName: storeConfig.name, trackingNumber }),
  });
}

export async function sendOrderCancelled(order: OrderWithItems, recipientEmail: string) {
  await sendEmail({
    to:      recipientEmail,
    subject: `Order cancelled — ${order.orderNumber}`,
    react:   OrderCancelledEmail({ order, storeName: storeConfig.name }),
  });
}

export async function sendRefundInitiated(order: OrderWithItems, amount: number, recipientEmail: string) {
  await sendEmail({
    to:      recipientEmail,
    subject: `Refund initiated — ${order.orderNumber}`,
    react:   RefundInitiatedEmail({ order, amount, storeName: storeConfig.name }),
  });
}

export async function sendPasswordReset(email: string, resetUrl: string) {
  await sendEmail({
    to:      email,
    subject: `Reset your password`,
    react:   PasswordResetEmail({ resetUrl, storeName: storeConfig.name }),
  });
}

export async function sendEmailVerification(email: string, verifyUrl: string) {
  await sendEmail({
    to:      email,
    subject: `Verify your email address`,
    react:   EmailVerificationEmail({ verifyUrl, storeName: storeConfig.name }),
  });
}

export async function sendStaffInvite(email: string, inviteUrl: string, inviterName: string) {
  await sendEmail({
    to:      email,
    subject: `You've been invited to join the dashboard`,
    react:   StaffInviteEmail({ inviteUrl, inviterName, storeName: storeConfig.name }),
  });
}

export async function sendLowStockAlert(items: Array<{ sku: string; title: string; qty: number }>) {
  await sendEmail({
    to:      storeConfig.email.adminAlertEmails,
    subject: `Low stock alert — ${items.length} variant(s) need attention`,
    react:   LowStockAlertEmail({ items, storeName: storeConfig.name }),
  });
}
```

---

## 3. Template Structure — React Email Pattern

All templates live in `src/core/email/templates/`. Each is a React component using `@react-email/components`.

### Base Layout (shared across all templates)

```tsx
// src/core/email/templates/layout.tsx

import {
  Html, Head, Body, Container, Section,
  Text, Hr, Link, Img,
} from "@react-email/components";

interface EmailLayoutProps {
  storeName: string;
  children: React.ReactNode;
  previewText?: string;
}

export function EmailLayout({ storeName, children, previewText }: EmailLayoutProps) {
  return (
    <Html lang="en">
      <Head />
      <Body style={{ backgroundColor: "#f4f4f5", fontFamily: "Inter, -apple-system, sans-serif" }}>
        {previewText && (
          <span style={{ display: "none", maxHeight: 0, overflow: "hidden" }}>
            {previewText}
          </span>
        )}
        <Container style={{ maxWidth: 600, margin: "40px auto", backgroundColor: "#ffffff", borderRadius: 8, overflow: "hidden" }}>
          {/* Header */}
          <Section style={{ backgroundColor: "#18181b", padding: "24px 32px" }}>
            <Text style={{ color: "#ffffff", fontSize: 20, fontWeight: 700, margin: 0 }}>
              {storeName}
            </Text>
          </Section>

          {/* Content */}
          <Section style={{ padding: "32px" }}>
            {children}
          </Section>

          {/* Footer */}
          <Hr />
          <Section style={{ padding: "16px 32px", backgroundColor: "#f9fafb" }}>
            <Text style={{ color: "#9ca3af", fontSize: 12, textAlign: "center" }}>
              © {new Date().getFullYear()} {storeName}. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
```

### Order Confirmation Template

```tsx
// src/core/email/templates/order-confirmation.tsx

import { Text, Section, Row, Column, Hr, Link } from "@react-email/components";
import { EmailLayout } from "./layout";
import type { OrderWithItems } from "@/core/orders/types";

interface Props {
  order: OrderWithItems;
  storeName: string;
}

export function OrderConfirmationEmail({ order, storeName }: Props) {
  return (
    <EmailLayout storeName={storeName} previewText={`Order ${order.orderNumber} confirmed`}>
      <Text style={{ fontSize: 24, fontWeight: 700, color: "#18181b" }}>
        Order confirmed ✓
      </Text>
      <Text style={{ color: "#52525b" }}>
        Hi {order.shippingAddress.name}, thanks for your order! We'll let you know when it ships.
      </Text>
      <Text style={{ fontWeight: 600 }}>Order #{order.orderNumber}</Text>

      <Hr />

      {/* Order Items */}
      {order.items.map((item) => (
        <Row key={item.id} style={{ marginBottom: 12 }}>
          <Column>
            <Text style={{ margin: 0, fontWeight: 500 }}>{item.productTitle}</Text>
            <Text style={{ margin: 0, color: "#71717a", fontSize: 13 }}>
              {Object.entries(item.variantOptions as Record<string, string>)
                .map(([k, v]) => `${k}: ${v}`)
                .join(" · ")} · Qty: {item.quantity}
            </Text>
          </Column>
          <Column align="right">
            <Text style={{ margin: 0 }}>
              {order.currency} {(Number(item.price) * item.quantity).toFixed(2)}
            </Text>
          </Column>
        </Row>
      ))}

      <Hr />

      {/* Totals */}
      <Row>
        <Column><Text style={{ color: "#52525b" }}>Subtotal</Text></Column>
        <Column align="right"><Text>{order.currency} {Number(order.subtotal).toFixed(2)}</Text></Column>
      </Row>
      {Number(order.discountTotal) > 0 && (
        <Row>
          <Column><Text style={{ color: "#16a34a" }}>Discount</Text></Column>
          <Column align="right"><Text style={{ color: "#16a34a" }}>−{order.currency} {Number(order.discountTotal).toFixed(2)}</Text></Column>
        </Row>
      )}
      <Row>
        <Column><Text style={{ color: "#52525b" }}>Shipping</Text></Column>
        <Column align="right"><Text>{order.currency} {Number(order.shippingTotal).toFixed(2)}</Text></Column>
      </Row>
      <Row>
        <Column><Text style={{ fontWeight: 700, fontSize: 16 }}>Total</Text></Column>
        <Column align="right"><Text style={{ fontWeight: 700, fontSize: 16 }}>{order.currency} {Number(order.total).toFixed(2)}</Text></Column>
      </Row>

      <Hr />

      <Text style={{ color: "#52525b", fontSize: 13 }}>
        Questions? Reply to this email or contact support.
      </Text>
    </EmailLayout>
  );
}
```

### Password Reset Template

```tsx
// src/core/email/templates/password-reset.tsx

import { Text, Button, Section } from "@react-email/components";
import { EmailLayout } from "./layout";

interface Props {
  resetUrl: string;
  storeName: string;
}

export function PasswordResetEmail({ resetUrl, storeName }: Props) {
  return (
    <EmailLayout storeName={storeName} previewText="Reset your password">
      <Text style={{ fontSize: 22, fontWeight: 700 }}>Reset your password</Text>
      <Text style={{ color: "#52525b" }}>
        Click the button below to reset your password. This link expires in 1 hour.
      </Text>
      <Section style={{ textAlign: "center", margin: "32px 0" }}>
        <Button
          href={resetUrl}
          style={{ backgroundColor: "#18181b", color: "#fff", padding: "12px 24px", borderRadius: 6, fontWeight: 600 }}
        >
          Reset Password
        </Button>
      </Section>
      <Text style={{ color: "#9ca3af", fontSize: 12 }}>
        If you didn't request this, you can safely ignore this email.
      </Text>
    </EmailLayout>
  );
}
```

### Staff Invite Template

```tsx
// src/core/email/templates/staff-invite.tsx

import { Text, Button, Section } from "@react-email/components";
import { EmailLayout } from "./layout";

interface Props {
  inviteUrl:   string;
  inviterName: string;
  storeName:   string;
}

export function StaffInviteEmail({ inviteUrl, inviterName, storeName }: Props) {
  return (
    <EmailLayout storeName={storeName} previewText={`${inviterName} invited you to ${storeName}`}>
      <Text style={{ fontSize: 22, fontWeight: 700 }}>You've been invited</Text>
      <Text style={{ color: "#52525b" }}>
        <strong>{inviterName}</strong> has invited you to manage <strong>{storeName}</strong>.
        Click below to accept and set your password. This invite expires in 7 days.
      </Text>
      <Section style={{ textAlign: "center", margin: "32px 0" }}>
        <Button
          href={inviteUrl}
          style={{ backgroundColor: "#18181b", color: "#fff", padding: "12px 24px", borderRadius: 6, fontWeight: 600 }}
        >
          Accept Invite
        </Button>
      </Section>
    </EmailLayout>
  );
}
```

> **Templates for the remaining triggers** (`order-shipped`, `order-cancelled`, `refund-initiated`, `email-verification`, `low-stock-alert`) follow the same pattern. Implement each as a `src/core/email/templates/*.tsx` file using the `EmailLayout` wrapper.

---

## 4. Low-Stock Alert — Trigger Logic

Low stock is detected and emailed by a Vercel cron (same cron file as cart cleanup, or a separate job):

```ts
// src/app/api/cron/low-stock-check/route.ts

export async function GET(req: Request) {
  // Verify cron caller
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const threshold = storeConfig.inventory.lowStockThreshold ?? 5;

  const lowStockVariants = await db.productVariant.findMany({
    where: {
      inventoryQty: { lte: threshold, gt: 0 },
      product: { status: "ACTIVE" },
    },
    include: { product: { select: { title: true } } },
    take: 50,
  });

  if (lowStockVariants.length === 0) {
    return NextResponse.json({ alerted: 0 });
  }

  await sendLowStockAlert(
    lowStockVariants.map((v) => ({
      sku:   v.sku,
      title: v.product.title,
      qty:   v.inventoryQty,
    }))
  );

  return NextResponse.json({ alerted: lowStockVariants.length });
}
```

Schedule in `vercel.json`:
```json
{ "path": "/api/cron/low-stock-check", "schedule": "0 8 * * *" }
```

---

## 5. Order Status → Email Trigger Map

These fire from `src/core/orders/update-status.ts`, which is called by `PATCH /api/orders/[id]`:

```ts
// src/core/orders/update-status.ts (excerpt)

import { sendOrderShipped, sendOrderCancelled } from "@/core/email/templates";

export async function updateOrderStatus(orderId: string, newStatus: OrderStatus, note?: string) {
  const order = await db.order.update({
    where: { id: orderId },
    data: { status: newStatus },
    include: { items: true, user: true },
  });

  await db.orderStatusEvent.create({
    data: { orderId, status: newStatus, note: note ?? null },
  });

  const recipientEmail = order.user?.email ?? order.guestEmail;
  if (!recipientEmail) return order;

  // Fire-and-forget — email failure must not affect order status update
  if (newStatus === "FULFILLED") {
    sendOrderShipped(order, recipientEmail).catch(console.error);
  } else if (newStatus === "CANCELLED") {
    sendOrderCancelled(order, recipientEmail).catch(console.error);
  }

  return order;
}
```

---

## 6. Store Config — Email Section

```ts
// src/config/store.config.ts (email section)

export const storeConfig = {
  // ... existing config

  email: {
    // Admin email(s) that receive low-stock alerts and other operational notifications
    adminAlertEmails: ["admin@clientdomain.com"],

    // Low stock threshold — email fires when inventoryQty <= this value
    lowStockThreshold: 5,
  },
} satisfies StoreConfig;
```

---

## 7. Environment Variables

Add to `.env.example`:

```env
# Email — Resend
RESEND_API_KEY=re_...
EMAIL_FROM="Store Name <noreply@clientdomain.com>"
```

**Per-client setup:** Each client configures their own sender domain in Resend (DNS TXT/MX records). The `EMAIL_FROM` value uses that verified domain. This prevents emails landing in spam.

---

## 8. Development — Local Email Preview

In development, use React Email's preview server to inspect templates without sending real emails:

```bash
npx react-email dev --dir src/core/email/templates --port 3001
```

Add a check in `sendEmail()` for test mode:

```ts
// In src/core/email/send.ts
if (process.env.NODE_ENV === "development" && process.env.EMAIL_PREVIEW_ONLY === "true") {
  console.log("[EMAIL PREVIEW] To:", options.to, "| Subject:", options.subject);
  return;   // Skip actual sending in dev
}
```

---

## 9. File Map

```
src/
└── core/
    └── email/
        ├── send.ts                          # Core sendEmail() function
        ├── templates/
        │   ├── index.ts                     # Typed wrappers (sendOrderConfirmation, etc.)
        │   ├── layout.tsx                   # Shared EmailLayout component
        │   ├── order-confirmation.tsx
        │   ├── order-shipped.tsx
        │   ├── order-cancelled.tsx
        │   ├── refund-initiated.tsx
        │   ├── password-reset.tsx
        │   ├── email-verification.tsx
        │   ├── staff-invite.tsx
        │   └── low-stock-alert.tsx
└── app/
    └── api/
        └── cron/
            ├── cleanup-carts/route.ts       # (from Cart Spec)
            └── low-stock-check/route.ts     # (this spec)
```

---

## 10. Testing

- [ ] `sendEmail()` called with `EMAIL_PREVIEW_ONLY=true` logs but does not throw
- [ ] `sendOrderConfirmation` builds correct subject line with order number
- [ ] `sendPasswordReset` includes the reset URL in the rendered output
- [ ] `sendLowStockAlert` sends to all `adminAlertEmails` (not just the first)
- [ ] Order status FULFILLED triggers shipped email; CANCELLED triggers cancelled email
- [ ] Webhook payment.succeeded triggers order confirmation email
- [ ] Email failure (Resend API down) does not roll back order status changes
