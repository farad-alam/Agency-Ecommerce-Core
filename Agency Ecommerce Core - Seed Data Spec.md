# Agency Ecommerce Core — Seed Data Spec

**Version:** v1.0
**File:** `prisma/seed.ts`
**Purpose:** Make the Core demo-able and usable out of the box after cloning

---

## 0. Philosophy

The seed has two jobs:

1. **Bootstrap job** — creates the minimum data needed to operate: an admin user, store settings, one shipping zone. Every client deployment runs this.
2. **Demo job** — creates realistic sample data so a new developer can see a working store immediately after cloning. Run with a flag in dev only.

```bash
# Bootstrap only (production-safe — used in CLONE_CHECKLIST)
npx prisma db seed

# Full demo data (development only)
SEED_DEMO=true npx prisma db seed
```

---

## 1. Bootstrap Seed (Always Runs)

### Store Record

```ts
await db.store.upsert({
  where:  { id: "store_main" },
  update: {},
  create: {
    id:       "store_main",
    name:     "My Store",          // developer replaces in dashboard settings
    currency: "BDT",
    locale:   "en",
    timezone: "Asia/Dhaka",
    taxMode:  "NONE",
  },
});
```

### Admin User

```ts
const adminEmail    = process.env.SEED_ADMIN_EMAIL    ?? "admin@store.com";
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin1234!";

await db.user.upsert({
  where:  { email: adminEmail },
  update: {},
  create: {
    email:         adminEmail,
    passwordHash:  await bcrypt.hash(adminPassword, 12),
    name:          "Store Admin",
    role:          "ADMIN",
    emailVerified: true,
  },
});
```

**SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD** are required env vars for production deployments. The CLONE_CHECKLIST must instruct the developer to set these in `.env` before running seed.

### Default Shipping Zone

```ts
const zone = await db.shippingZone.upsert({
  where:  { id: "zone_default" },
  update: {},
  create: {
    id:      "zone_default",
    name:    "Domestic",
    regions: ["BD"],   // developer updates in dashboard for their client's country
  },
});

await db.shippingRate.createMany({
  data: [
    { zoneId: zone.id, name: "Standard Delivery", price: 60,  minSubtotalForFree: 2000 },
    { zoneId: zone.id, name: "Express Delivery",  price: 120, minSubtotalForFree: null },
  ],
  skipDuplicates: true,
});
```

---

## 2. Demo Seed (SEED_DEMO=true)

### 2.1 Brands (5)

```ts
const brands = [
  { name: "Artisan Co",   slug: "artisan-co" },
  { name: "NovaTech",     slug: "novatech" },
  { name: "EcoWear",      slug: "ecowear" },
  { name: "LuxCraft",     slug: "luxcraft" },
  { name: "PureForm",     slug: "pureform" },
];

await db.brand.createMany({ data: brands, skipDuplicates: true });
```

### 2.2 Categories (Hierarchical — 3 parents, 9 children)

```ts
const parentCategories = [
  { name: "Clothing",     slug: "clothing" },
  { name: "Electronics",  slug: "electronics" },
  { name: "Home & Living", slug: "home-living" },
];

// Create parents first
for (const cat of parentCategories) {
  await db.category.upsert({ where: { slug: cat.slug }, update: {}, create: cat });
}

const childCategories = [
  { name: "T-Shirts",          slug: "t-shirts",         parentSlug: "clothing" },
  { name: "Outerwear",         slug: "outerwear",         parentSlug: "clothing" },
  { name: "Accessories",       slug: "accessories",       parentSlug: "clothing" },
  { name: "Smartphones",       slug: "smartphones",       parentSlug: "electronics" },
  { name: "Audio",             slug: "audio",             parentSlug: "electronics" },
  { name: "Wearables",         slug: "wearables",         parentSlug: "electronics" },
  { name: "Furniture",         slug: "furniture",         parentSlug: "home-living" },
  { name: "Kitchen",           slug: "kitchen",           parentSlug: "home-living" },
  { name: "Lighting",          slug: "lighting",          parentSlug: "home-living" },
];

// Create children with parent references
for (const child of childCategories) {
  const parent = await db.category.findUnique({ where: { slug: child.parentSlug } });
  await db.category.upsert({
    where: { slug: child.slug },
    update: {},
    create: { name: child.name, slug: child.slug, parentId: parent?.id },
  });
}
```

### 2.3 Collections (4)

```ts
const collections = [
  { title: "New Arrivals",   slug: "new-arrivals",   description: "Fresh styles, just in.",             sortOrder: 0 },
  { title: "Summer Picks",   slug: "summer-picks",   description: "Curated for the warm season.",       sortOrder: 1 },
  { title: "Staff Picks",    slug: "staff-picks",    description: "Handpicked by our team.",           sortOrder: 2 },
  { title: "Under ৳1,000",   slug: "under-1000",     description: "Great finds at unbeatable prices.", sortOrder: 3 },
];

await db.collection.createMany({
  data: collections.map((c) => ({ ...c, status: "ACTIVE" })),
  skipDuplicates: true,
});
```

### 2.4 Products (10 Products — 2–4 Variants Each)

```ts
// Product template structure
interface DemoProduct {
  title:       string;
  slug:        string;
  description: string;
  categorySlug: string;
  brandSlug:   string;
  variants: Array<{
    sku:            string;
    price:          number;
    compareAtPrice?: number;
    options:        Record<string, string>;
    inventoryQty:   number;
  }>;
  cloudinaryImages: string[];   // placeholder Cloudinary URLs
  collections: string[];        // collection slugs
  status: "ACTIVE" | "DRAFT";
}

const demoProducts: DemoProduct[] = [
  {
    title:        "Classic Cotton Tee",
    slug:         "classic-cotton-tee",
    description:  "A wardrobe staple. 100% organic cotton, pre-shrunk, ethically made.",
    categorySlug: "t-shirts",
    brandSlug:    "ecowear",
    variants: [
      { sku: "CCT-WHT-S",  price: 650,  compareAtPrice: 850,  options: { Color: "White", Size: "S" },  inventoryQty: 20 },
      { sku: "CCT-WHT-M",  price: 650,  compareAtPrice: 850,  options: { Color: "White", Size: "M" },  inventoryQty: 35 },
      { sku: "CCT-WHT-L",  price: 650,  compareAtPrice: 850,  options: { Color: "White", Size: "L" },  inventoryQty: 15 },
      { sku: "CCT-BLK-S",  price: 650,  options: { Color: "Black", Size: "S" },  inventoryQty: 12 },
      { sku: "CCT-BLK-M",  price: 650,  options: { Color: "Black", Size: "M" },  inventoryQty: 3  },  // low stock
      { sku: "CCT-BLK-L",  price: 650,  options: { Color: "Black", Size: "L" },  inventoryQty: 0  },  // out of stock
    ],
    cloudinaryImages: ["https://res.cloudinary.com/demo/image/upload/sample.jpg"],
    collections: ["new-arrivals", "summer-picks", "under-1000"],
    status: "ACTIVE",
  },
  {
    title:        "Merino Wool Bomber Jacket",
    slug:         "merino-wool-bomber",
    description:  "Premium merino wool outer with a slim silhouette. Wind-resistant.",
    categorySlug: "outerwear",
    brandSlug:    "luxcraft",
    variants: [
      { sku: "MWB-NVY-S", price: 5500, compareAtPrice: 7200, options: { Color: "Navy",  Size: "S" }, inventoryQty: 8 },
      { sku: "MWB-NVY-M", price: 5500, compareAtPrice: 7200, options: { Color: "Navy",  Size: "M" }, inventoryQty: 6 },
      { sku: "MWB-OLV-M", price: 5500, options: { Color: "Olive", Size: "M" }, inventoryQty: 4 },
      { sku: "MWB-OLV-L", price: 5500, options: { Color: "Olive", Size: "L" }, inventoryQty: 2 },
    ],
    cloudinaryImages: ["https://res.cloudinary.com/demo/image/upload/sample.jpg"],
    collections: ["staff-picks"],
    status: "ACTIVE",
  },
  {
    title:        "Leather Card Wallet",
    slug:         "leather-card-wallet",
    description:  "Full-grain leather, RFID-blocking, holds up to 8 cards. Made to age beautifully.",
    categorySlug: "accessories",
    brandSlug:    "artisan-co",
    variants: [
      { sku: "LCW-TAN",   price: 1200, options: { Color: "Tan"   }, inventoryQty: 25 },
      { sku: "LCW-BRN",   price: 1200, options: { Color: "Brown" }, inventoryQty: 30 },
      { sku: "LCW-BLK",   price: 1200, options: { Color: "Black" }, inventoryQty: 18 },
    ],
    cloudinaryImages: ["https://res.cloudinary.com/demo/image/upload/sample.jpg"],
    collections: ["new-arrivals", "under-1000"],
    status: "ACTIVE",
  },
  {
    title:        "Noise-Cancelling Headphones",
    slug:         "nc-headphones-pro",
    description:  "40hr battery, adaptive noise cancellation, foldable design. USB-C charging.",
    categorySlug: "audio",
    brandSlug:    "novatech",
    variants: [
      { sku: "NCH-BLK", price: 7500, compareAtPrice: 9000, options: { Color: "Matte Black" }, inventoryQty: 12 },
      { sku: "NCH-WHT", price: 7500, compareAtPrice: 9000, options: { Color: "Pearl White"  }, inventoryQty: 8  },
    ],
    cloudinaryImages: ["https://res.cloudinary.com/demo/image/upload/sample.jpg"],
    collections: ["staff-picks"],
    status: "ACTIVE",
  },
  {
    title:        "Fitness Tracker Band",
    slug:         "fitness-tracker-band",
    description:  "Heart rate, SpO2, sleep tracking, 7-day battery. Water-resistant IP67.",
    categorySlug: "wearables",
    brandSlug:    "pureform",
    variants: [
      { sku: "FTB-BLK-S", price: 2800, options: { Color: "Black", Size: "S/M" }, inventoryQty: 40 },
      { sku: "FTB-BLK-L", price: 2800, options: { Color: "Black", Size: "L/XL" }, inventoryQty: 35 },
      { sku: "FTB-RED-S", price: 2800, options: { Color: "Red",   Size: "S/M"  }, inventoryQty: 20 },
    ],
    cloudinaryImages: ["https://res.cloudinary.com/demo/image/upload/sample.jpg"],
    collections: ["new-arrivals"],
    status: "ACTIVE",
  },
  {
    title:        "Oak Bedside Table",
    slug:         "oak-bedside-table",
    description:  "Solid oak, soft-close drawer, hairpin legs. Pairs with any bedroom aesthetic.",
    categorySlug: "furniture",
    brandSlug:    "artisan-co",
    variants: [
      { sku: "OBT-NAT", price: 12500, options: { Finish: "Natural Oak" }, inventoryQty: 5 },
      { sku: "OBT-WLN", price: 13500, options: { Finish: "Walnut"      }, inventoryQty: 3 },
    ],
    cloudinaryImages: ["https://res.cloudinary.com/demo/image/upload/sample.jpg"],
    collections: ["staff-picks"],
    status: "ACTIVE",
  },
  {
    title:        "Pour-Over Coffee Set",
    slug:         "pour-over-coffee-set",
    description:  "Borosilicate glass dripper, gooseneck kettle, precision scale. The complete pour-over kit.",
    categorySlug: "kitchen",
    brandSlug:    "pureform",
    variants: [
      { sku: "POC-1CUP", price: 1800, compareAtPrice: 2200, options: { Size: "1-Cup" }, inventoryQty: 15 },
      { sku: "POC-2CUP", price: 2400, compareAtPrice: 2900, options: { Size: "2-Cup" }, inventoryQty: 10 },
    ],
    cloudinaryImages: ["https://res.cloudinary.com/demo/image/upload/sample.jpg"],
    collections: ["under-1000"],
    status: "ACTIVE",
  },
  {
    title:        "Matte Table Lamp",
    slug:         "matte-table-lamp",
    description:  "Ceramic base, linen shade, 3-step dimmer. Works with standard E27 bulbs.",
    categorySlug: "lighting",
    brandSlug:    "luxcraft",
    variants: [
      { sku: "MTL-WHT", price: 2200, options: { Color: "White"    }, inventoryQty: 20 },
      { sku: "MTL-GRN", price: 2200, options: { Color: "Sage Green" }, inventoryQty: 12 },
      { sku: "MTL-BLK", price: 2200, options: { Color: "Charcoal" }, inventoryQty: 8  },
    ],
    cloudinaryImages: ["https://res.cloudinary.com/demo/image/upload/sample.jpg"],
    collections: ["summer-picks", "under-1000"],
    status: "ACTIVE",
  },
  // Draft product — shows workflow
  {
    title:        "Linen Shorts (Coming Soon)",
    slug:         "linen-shorts",
    description:  "Relaxed fit, elastic waistband, two deep pockets.",
    categorySlug: "clothing",
    brandSlug:    "ecowear",
    variants: [
      { sku: "LSH-BEI-S", price: 1200, options: { Color: "Beige", Size: "S" }, inventoryQty: 0 },
      { sku: "LSH-BEI-M", price: 1200, options: { Color: "Beige", Size: "M" }, inventoryQty: 0 },
    ],
    cloudinaryImages: [],
    collections: [],
    status: "DRAFT",
  },
  // Archived product — shows full status range
  {
    title:        "Winter Scarf (Discontinued)",
    slug:         "winter-scarf-2025",
    description:  "Was part of last season's collection.",
    categorySlug: "accessories",
    brandSlug:    "artisan-co",
    variants: [
      { sku: "WS25-GRY", price: 900, options: { Color: "Grey" }, inventoryQty: 0 },
    ],
    cloudinaryImages: [],
    collections: [],
    status: "ARCHIVED",
  },
];
```

### 2.5 Coupons (3)

```ts
const coupons = [
  {
    code:        "WELCOME10",
    type:        "PERCENTAGE",
    value:       10,
    maxUses:     null,
    active:      true,
    expiresAt:   null,
    description: "10% off — no minimum",
  },
  {
    code:        "FLAT200",
    type:        "FIXED",
    value:       200,
    minSubtotal: 1500,
    maxUses:     500,
    active:      true,
    expiresAt:   null,
    description: "৳200 off orders over ৳1500",
  },
  {
    code:        "FREESHIP",
    type:        "FREE_SHIPPING",
    value:       0,
    maxUses:     null,
    active:      true,
    expiresAt:   new Date("2027-12-31"),
    description: "Free shipping — always",
  },
];

await db.coupon.createMany({ data: coupons, skipDuplicates: true });
```

### 2.6 Demo Customers (3)

```ts
const customers = [
  { email: "alice@example.com", name: "Alice Rahman",   phone: "+8801711111111" },
  { email: "bob@example.com",   name: "Bob Chowdhury",  phone: "+8801722222222" },
  { email: "carol@example.com", name: "Carol Ahmed",    phone: "+8801733333333" },
];

for (const customer of customers) {
  await db.user.upsert({
    where: { email: customer.email },
    update: {},
    create: {
      ...customer,
      passwordHash:  await bcrypt.hash("Customer123!", 12),
      role:          "CUSTOMER",
      emailVerified: true,
    },
  });
}
```

### 2.7 Demo Orders (5 — Across All Statuses)

```ts
// Create sample orders covering all status states
// Orders are created directly in the DB (bypassing checkout flow — seed only)
// Status: PAID, FULFILLED, PENDING, CANCELLED, PARTIALLY_REFUNDED

const orderScenarios = [
  { orderNumber: "ORD-1000", status: "PAID",                paymentStatus: "PAID",      customerEmail: "alice@example.com" },
  { orderNumber: "ORD-1001", status: "FULFILLED",           paymentStatus: "PAID",      customerEmail: "alice@example.com" },
  { orderNumber: "ORD-1002", status: "PENDING",             paymentStatus: "UNPAID",    customerEmail: "bob@example.com"   },
  { orderNumber: "ORD-1003", status: "CANCELLED",           paymentStatus: "FAILED",    customerEmail: "bob@example.com"   },
  { orderNumber: "ORD-1004", status: "PARTIALLY_REFUNDED",  paymentStatus: "REFUNDED",  customerEmail: "carol@example.com" },
];

// Full order creation code omitted for brevity — uses same structure as create-order.ts
// Include 2-3 items per order, snapshot product titles and prices from demo products
```

### 2.8 Demo Reviews (2 Approved, 1 Pending)

```ts
const reviews = [
  { productSlug: "classic-cotton-tee", name: "Alice R.", rating: 5, body: "Perfect fit, love the material!", status: "APPROVED" },
  { productSlug: "nc-headphones-pro",  name: "Bob C.",   rating: 4, body: "Great noise cancellation. Battery life is impressive.", status: "APPROVED" },
  { productSlug: "leather-card-wallet", name: "New Customer", rating: 5, body: "Quality is amazing.", status: "PENDING" },
];
```

---

## 3. Complete `seed.ts`

```ts
// prisma/seed.ts

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // ── Bootstrap ──
  await seedStore();
  await seedAdminUser();
  await seedDefaultShipping();

  // ── Demo data ──
  if (process.env.SEED_DEMO === "true") {
    console.log("🎭 Seeding demo data...");
    await seedBrands();
    await seedCategories();
    await seedCollections();
    await seedProducts();
    await seedCoupons();
    await seedCustomers();
    await seedOrders();
    await seedReviews();
  }

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
```

---

## 4. `package.json` Seed Script

```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

---

## 5. Environment Variables for Seed

Add to `.env.example`:

```env
# Seed
SEED_ADMIN_EMAIL=admin@store.com
SEED_ADMIN_PASSWORD=ChangeMe123!
SEED_DEMO=false        # Set to true for demo data (development only)
```

**CLONE_CHECKLIST note:** Always change `SEED_ADMIN_PASSWORD` before running seed in production. The default value is intentionally obvious so it's never accidentally deployed.

---

## 6. What the Demo Dataset Demonstrates

| Feature | Demo Coverage |
|---|---|
| All product statuses | ACTIVE (8), DRAFT (1), ARCHIVED (1) |
| Variant structures | Color only, Size only, Color + Size, Finish |
| Inventory states | Plentiful, low stock (≤5), zero stock |
| Category hierarchy | 3 parents, 9 children, nested tree |
| Collections | 4 collections, products spread across multiple |
| Coupon types | PERCENTAGE, FIXED, FREE_SHIPPING |
| All order statuses | PAID, FULFILLED, PENDING, CANCELLED, PARTIALLY_REFUNDED |
| Review moderation | APPROVED (2), PENDING (1) |
| Customer accounts | 3 demo customers with hashed passwords |
